package com.instagramclone.notification.service.impl;

import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.notification.service.interfaces.*;

import java.util.UUID;
import com.instagramclone.common.exception.ForbiddenException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.notification.constants.NotificationConstants;
import com.instagramclone.notification.dto.response.NotificationActorResponse;
import com.instagramclone.notification.dto.response.NotificationResponse;
import com.instagramclone.notification.dto.response.UnreadCountResponse;
import com.instagramclone.notification.entity.Notification;
import com.instagramclone.notification.enums.NotificationType;
import com.instagramclone.notification.repository.NotificationRepository;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.user.repository.UserBlockRepository;
import com.instagramclone.device.service.interfaces.IFcmPushService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.instagramclone.utility.RedisUtility;
import com.instagramclone.common.constants.CacheConstants;
import com.instagramclone.mail.event.EmailEvent;
import com.instagramclone.mail.event.EmailEventPublisher;
import com.instagramclone.mail.enums.EmailType;
import com.instagramclone.utility.RedisDistributedLockService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements INotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);
    private static final String UNREAD_CACHE_PREFIX = CacheConstants.CACHE_UNREAD_NOTIFICATIONS_PREFIX;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final EmailEventPublisher emailEventPublisher;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    private IFcmPushService fcmPushService;

    @Autowired(required = false)
    private org.springframework.cache.CacheManager cacheManager;

    @Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    private final RedisUtility redisUtility;
    private final RedisDistributedLockService lockService;
    private final PlatformTransactionManager transactionManager;

    private boolean acquireLockWithRetry(String lockKey, String lockOwner, Duration lease, int maxRetries, long sleepMs) {
        for (int i = 0; i < maxRetries; i++) {
            if (lockService.tryLock(lockKey, lockOwner, lease)) {
                return true;
            }
            try {
                Thread.sleep(sleepMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(Pageable pageable) {
        return getNotifications(null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(NotificationType type, Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<Notification> page = (type == null)
                ? notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUserId, pageable)
                : notificationRepository.findByRecipientIdAndTypeOrderByCreatedAtDesc(currentUserId, type, pageable);
        return PageResponse.from(page.map(this::toNotificationResponse));
    }

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "notifications-unread", key = "T(com.instagramclone.common.util.SecurityUtils).getCurrentUserId()")
    public UnreadCountResponse getUnreadCount() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        long unread = notificationRepository.countByRecipientIdAndReadFalse(currentUserId);
        return UnreadCountResponse.builder().unreadCount(unread).build();
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(NotificationConstants.ERR_NOTIFICATION_NOT_FOUND + notificationId));

        if (!notification.getRecipient().getId().equals(currentUserId)) {
            throw new ForbiddenException(NotificationConstants.ERR_UNAUTHORIZED_MARK_READ);
        }

        notification.setRead(true);
        notificationRepository.save(notification);
        invalidateUnreadCache(currentUserId);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        notificationRepository.markAllAsReadForRecipient(currentUserId);
        invalidateUnreadCache(currentUserId);
    }

    @Override
    @Transactional
    public void deleteNotification(UUID notificationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(NotificationConstants.ERR_NOTIFICATION_NOT_FOUND + notificationId));

        if (!notification.getRecipient().getId().equals(currentUserId)) {
            throw new ForbiddenException(NotificationConstants.ERR_UNAUTHORIZED_DELETE_NOTIFICATION);
        }

        notificationRepository.delete(notification);
        invalidateUnreadCache(currentUserId);
    }

    @Override
    @Transactional
    public void clearReadNotifications() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        notificationRepository.deleteReadNotificationsForRecipient(currentUserId);
        invalidateUnreadCache(currentUserId);
    }

    @Override
    @Transactional
    public void createNotification(UUID recipientId, UUID actorId, NotificationType type, UUID postId, UUID commentId) {
        createNotification(recipientId, actorId, type, postId, commentId, null, null);
    }

    @Override
    public void createNotification(UUID recipientId, UUID actorId, NotificationType type, UUID postId, UUID commentId, UUID reelId) {
        createNotification(recipientId, actorId, type, postId, commentId, reelId, null);
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void createNotification(UUID recipientId, UUID actorId, NotificationType type, UUID postId, UUID commentId, UUID reelId, String mediaPreviewUrl) {
        if (recipientId == null || actorId == null || recipientId.equals(actorId)) {
            // Do not notify user about their own actions
            return;
        }

        if (userBlockRepository.existsBlockBetween(recipientId, actorId)) {
            log.debug("Notification suppressed due to active block between {} and {}", recipientId, actorId);
            return;
        }

        String targetKey = (reelId != null) ? reelId.toString() :
                ((postId != null) ? postId.toString() :
                        ((commentId != null) ? commentId.toString() : "none"));
        String lockKey = "lock:notif:" + recipientId + ":" + actorId + ":" + type + ":" + targetKey;
        String lockOwner = UUID.randomUUID().toString();
        boolean locked = acquireLockWithRetry(lockKey, lockOwner, Duration.ofSeconds(5), 10, 50);

        try {
            TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
            txTemplate.executeWithoutResult(status ->
                    executeCreateNotification(recipientId, actorId, type, postId, commentId, reelId, mediaPreviewUrl)
            );
        } finally {
            if (locked) {
                lockService.releaseLock(lockKey, lockOwner);
            }
        }
    }

    private void executeCreateNotification(UUID recipientId, UUID actorId, NotificationType type, UUID postId, UUID commentId, UUID reelId, String mediaPreviewUrl) {
        // Deduplication check: Do not create duplicate unread notifications for the same logical event
        if (notificationRepository.existsUnreadNotification(recipientId, actorId, type, postId, commentId, reelId)) {
            log.debug("Duplicate unread notification suppressed: recipient={}, actor={}, type={}, postId={}, commentId={}, reelId={}",
                    recipientId, actorId, type, postId, commentId, reelId);
            return;
        }

        User recipient = userRepository.findById(recipientId).orElse(null);
        User actor = userRepository.findById(actorId).orElse(null);

        if (recipient == null || actor == null) {
            log.warn("Cannot create notification: recipient or actor missing. recipient={}, actor={}", recipientId, actorId);
            return;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .postId(postId)
                .commentId(commentId)
                .reelId(reelId)
                .mediaPreviewUrl(mediaPreviewUrl)
                .read(false)
                .build();

        notificationRepository.save(notification);
        invalidateUnreadCache(recipientId);

        // Real-time delivery over WebSocket (Section 12)
        if (messagingTemplate != null) {
            try {
                NotificationResponse responseDto = toNotificationResponse(notification);
                messagingTemplate.convertAndSend("/topic/notifications/" + recipientId, responseDto);
                log.debug("Dispatched real-time notification to /topic/notifications/{}", recipientId);
            } catch (Exception ex) {
                log.error("Failed to dispatch real-time WebSocket notification: {}", ex.getMessage());
            }
        }

        // Dispatch FCM background push notification
        if (fcmPushService != null) {
            try {
                String actorName = actor.getUsername();
                String title = "Instagram";
                String body = getPushBodyForNotification(type, actorName);
                Map<String, String> data = new HashMap<>();
                data.put("type", type.name());
                data.put("notificationId", notification.getId().toString());
                if (postId != null) data.put("postId", postId.toString());
                if (reelId != null) data.put("reelId", reelId.toString());
                if (commentId != null) data.put("commentId", commentId.toString());
                if (actor.getProfile() != null && actor.getProfile().getAvatarUrl() != null) {
                    data.put("avatarUrl", actor.getProfile().getAvatarUrl());
                }
                fcmPushService.sendPushToUser(recipientId, title, body, data);
            } catch (Exception ex) {
                log.error("Failed to dispatch FCM push notification: {}", ex.getMessage());
            }
        }

        log.info("Notification {} created of type {} for user {}", notification.getId(), type, recipient.getUsername());

        // Dispatch purpose-based email event for social activities & security/moderation
        EmailType emailType = switch (type) {
            case FOLLOW -> EmailType.NEW_FOLLOWER;
            case POST_LIKED, REEL_LIKED -> EmailType.POST_LIKED;
            case POST_COMMENTED, COMMENT_REPLIED, REEL_COMMENTED -> EmailType.POST_COMMENTED;
            case CONTENT_REMOVED -> EmailType.CONTENT_TAKEDOWN;
            case ACCOUNT_SUSPENDED -> EmailType.ACCOUNT_SUSPENDED;
            case ACCOUNT_UNSUSPENDED -> EmailType.ACCOUNT_UNSUSPENDED;
            default -> null;
        };

        if (emailType != null) {
            Map<String, Object> vars = new HashMap<>();
            vars.put("recipientUsername", recipient.getUsername());
            vars.put("username", recipient.getUsername());
            vars.put("actorUsername", actor.getUsername());
            vars.put("actorId", actor.getId());
            if (postId != null) {
                vars.put("postId", postId);
                vars.put("contentType", "Post");
                vars.put("contentId", postId.toString());
                vars.put("postUrl", resolveClientUrl("/"));
            }
            if (reelId != null) {
                vars.put("reelId", reelId);
                vars.put("contentType", "Reel");
                vars.put("contentId", reelId.toString());
                vars.put("postUrl", resolveClientUrl("/reels/" + reelId));
            }
            if (commentId != null) vars.put("commentId", commentId);
            vars.put("profileUrl", resolveClientUrl("/profile/" + actor.getUsername()));
            vars.put("reason", "Violated Community Guidelines or Copyright Policy");
            vars.put("actionDate", LocalDateTime.now().toString());
            vars.put("loginUrl", resolveClientUrl("/login"));

            emailEventPublisher.publishAfterCommit(EmailEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType("EMAIL_" + emailType.name())
                    .emailType(emailType)
                    .userId(recipient.getId())
                    .email(recipient.getEmail())
                    .username(recipient.getUsername())
                    .priority(emailType.getDefaultPriority())
                    .variables(vars)
                    .timestamp(LocalDateTime.now())
                    .build());
        }
    }

    private void invalidateUnreadCache(UUID userId) {
        if (userId != null && cacheManager != null) {
            try {
                org.springframework.cache.Cache cache = cacheManager.getCache("notifications-unread");
                if (cache != null) {
                    cache.evict(userId);
                }
            } catch (Exception ex) {
                log.debug("Cache evict failed for unread notifications: {}", ex.getMessage());
            }
        }
        redisUtility.deleteAfterCommit(UNREAD_CACHE_PREFIX + userId);
    }

    private NotificationResponse toNotificationResponse(Notification n) {
        User a = n.getActor();
        return NotificationResponse.builder()
                .id(n.getId())
                .actor(NotificationActorResponse.builder()
                        .id(a.getId())
                        .username(a.getUsername())
                        .displayName(a.getProfile() != null ? a.getProfile().getDisplayName() : null)
                        .avatarUrl(a.getProfile() != null ? a.getProfile().getAvatarUrl() : null)
                        .build())
                .type(n.getType())
                .postId(n.getPostId())
                .commentId(n.getCommentId())
                .reelId(n.getReelId())
                .mediaPreviewUrl(n.getMediaPreviewUrl())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private String getPushBodyForNotification(NotificationType type, String actorName) {
        return switch (type) {
            case FOLLOW -> actorName + " started following you.";
            case FOLLOW_REQUEST -> actorName + " requested to follow you.";
            case FOLLOW_REQUEST_ACCEPTED -> actorName + " accepted your follow request.";
            case POST_LIKED -> actorName + " liked your post.";
            case REEL_LIKED -> actorName + " liked your reel.";
            case STORY_LIKED -> actorName + " liked your story.";
            case POST_COMMENTED -> actorName + " commented on your post.";
            case REEL_COMMENTED -> actorName + " commented on your reel.";
            case COMMENT_REPLIED -> actorName + " replied to your comment.";
            case USER_MENTIONED -> actorName + " mentioned you.";
            case USER_TAGGED -> actorName + " tagged you in a post.";
            case CONTENT_REMOVED -> "A post was removed for violating community standards.";
            case ACCOUNT_SUSPENDED -> "Your account has been suspended.";
            case ACCOUNT_UNSUSPENDED -> "Your account suspension was lifted.";
            default -> actorName + " sent you a notification.";
        };
    }

    private String resolveClientUrl(String relativePath) {
        if (dynamicSystemConfigReader != null) {
            return dynamicSystemConfigReader.buildClientUrl(relativePath);
        }
        String normalized = (relativePath != null && relativePath.startsWith("/")) ? relativePath : "/" + (relativePath != null ? relativePath : "");
        return DynamicSystemConfigKeys.DEFAULT_CLIENT_BASE_URL + normalized;
    }
}
