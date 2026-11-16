package com.instagramclone.admin.service.support;

import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.auth.repository.RefreshTokenRepository;
import com.instagramclone.notification.enums.NotificationType;
import com.instagramclone.notification.service.interfaces.INotificationService;
import com.instagramclone.security.config.JwtProperties;
import com.instagramclone.security.service.interfaces.ITokenBlacklistService;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Shared domain helper for enforcing admin account protection, token revocation,
 * and moderation/suspension notification dispatch without duplicating enforcement code.
 */
@Component
@RequiredArgsConstructor
public class UserModerationSupport {

    private static final Logger log = LoggerFactory.getLogger(UserModerationSupport.class);

    private final UserRepository userRepository;
    private final IAuditLogService auditLogService;
    private final INotificationService notificationService;
    private final ITokenBlacklistService tokenBlacklistService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    public boolean isProtectedAdmin(User user) {
        return user != null && (user.getRole() == Role.ROLE_ADMIN || "admin".equalsIgnoreCase(user.getUsername()));
    }

    public void suspendUserByModeration(UUID targetUserId, User reviewer, String auditAction, String auditDetails) {
        userRepository.findById(targetUserId).ifPresent(user -> {
            if (isProtectedAdmin(user)) {
                log.warn("Cannot suspend admin user {}", user.getUsername());
                return;
            }
            user.setStatus(UserStatus.SUSPENDED);
            user.setIsActive(false);
            userRepository.save(user);
            revokeUserAccess(user.getId());
            dispatchSuspensionNotice(user.getId(), reviewer.getId());
            auditLogService.record(reviewer.getId(), auditAction, "USER", user.getId(), null, auditDetails);
            log.info("User {} (ID: {}) suspended by admin {}", user.getUsername(), user.getId(), reviewer.getUsername());
        });
    }

    public void warnUser(UUID targetUserId, ReportTargetType targetType, UUID targetId, User reviewer) {
        try {
            notificationService.createNotification(
                    targetUserId,
                    reviewer.getId(),
                    NotificationType.SYSTEM,
                    targetType == ReportTargetType.POST ? targetId : null,
                    targetType == ReportTargetType.COMMENT ? targetId : null,
                    targetType == ReportTargetType.REEL ? targetId : null,
                    null
            );
            auditLogService.record(reviewer.getId(), "ADMIN_WARN_USER", "USER", targetUserId, null, "Warning notification sent to user");
            log.info("Warning notification issued to user {} by admin {}", targetUserId, reviewer.getUsername());
        } catch (Exception e) {
            log.warn("Failed to dispatch warning notification to user {}: {}", targetUserId, e.getMessage());
        }
    }

    public void revokeUserAccess(UUID userId) {
        try {
            tokenBlacklistService.blacklistUser(userId, jwtProperties.getAccessExpirationMs());
        } catch (Exception e) {
            log.warn("Failed to revoke tokens for suspended user {}: {}", userId, e.getMessage());
        }
        try {
            refreshTokenRepository.revokeAllUserTokens(userId, LocalDateTime.now());
        } catch (Exception e) {
            log.warn("Failed to revoke refresh tokens for suspended user {}: {}", userId, e.getMessage());
        }
    }

    public void clearUserTokenBlacklist(UUID userId) {
        tokenBlacklistService.clearUserBlacklist(userId);
    }

    public void dispatchSuspensionNotice(UUID userId, UUID adminId) {
        try {
            notificationService.createNotification(
                    userId,
                    adminId,
                    NotificationType.ACCOUNT_SUSPENDED,
                    null,
                    null,
                    null,
                    null
            );
        } catch (Exception e) {
            log.warn("Failed to dispatch ACCOUNT_SUSPENDED notification for user {}: {}", userId, e.getMessage());
        }
    }

    public void dispatchUnsuspensionNotice(UUID userId, UUID adminId) {
        try {
            notificationService.createNotification(
                    userId,
                    adminId,
                    NotificationType.ACCOUNT_UNSUSPENDED,
                    null,
                    null,
                    null,
                    null
            );
        } catch (Exception e) {
            log.warn("Failed to dispatch ACCOUNT_UNSUSPENDED notification for user {}: {}", userId, e.getMessage());
        }
    }

    public void dispatchContentRemovedNotice(UUID recipientId, UUID adminId, UUID postId, UUID reelId, String thumbnailUrl) {
        try {
            notificationService.createNotification(
                    recipientId,
                    adminId,
                    NotificationType.CONTENT_REMOVED,
                    postId,
                    null,
                    reelId,
                    thumbnailUrl
            );
        } catch (Exception e) {
            log.warn("Failed to dispatch CONTENT_REMOVED notification for recipient {}: {}", recipientId, e.getMessage());
        }
    }
}

