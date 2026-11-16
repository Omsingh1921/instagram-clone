package com.instagramclone.user.service.impl;

import com.instagramclone.audit.constants.AuditConstants;
import com.instagramclone.audit.repository.AuditLogRepository;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.auth.dto.request.ChangePasswordRequest;
import com.instagramclone.auth.repository.RefreshTokenRepository;
import com.instagramclone.common.constants.CacheConstants;
import com.instagramclone.common.constants.KafkaConstants;
import com.instagramclone.common.event.DomainEventPublisher;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.follow.dto.response.FollowUserResponse;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.follow.repository.FollowRequestRepository;
import com.instagramclone.mail.enums.EmailType;
import com.instagramclone.mail.event.EmailEvent;
import com.instagramclone.mail.event.EmailEventPublisher;
import com.instagramclone.notification.repository.NotificationRepository;
import com.instagramclone.security.service.interfaces.ITokenBlacklistService;
import com.instagramclone.security.config.JwtProperties;
import com.instagramclone.story.dto.response.StoryResponse;
import com.instagramclone.story.dto.response.UserStoriesResponse;
import com.instagramclone.story.service.interfaces.IStoryService;
import com.instagramclone.user.constants.SettingsConstants;
import com.instagramclone.user.dto.request.BlockUserRequest;
import com.instagramclone.user.dto.request.ScreenTimeHeartbeatRequest;
import com.instagramclone.user.dto.request.UpdateSettingsRequest;
import com.instagramclone.user.dto.response.AccountCreatedResponse;
import com.instagramclone.user.dto.response.BlockStatusResponse;
import com.instagramclone.user.dto.response.BlockedUserResponse;
import com.instagramclone.user.dto.response.PasswordHistoryResponse;
import com.instagramclone.user.dto.response.ScreenTimeHeartbeatResponse;
import com.instagramclone.user.dto.response.ScreenTimeSummaryResponse;
import com.instagramclone.user.dto.response.UserSettingsResponse;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserBlock;
import com.instagramclone.user.entity.UserDailyScreenTime;
import com.instagramclone.user.entity.UserMute;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.BlockReason;
import com.instagramclone.user.repository.CloseFriendRepository;
import com.instagramclone.user.repository.UserBlockRepository;
import com.instagramclone.user.repository.UserDailyScreenTimeRepository;
import com.instagramclone.user.repository.UserMuteRepository;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.user.repository.UserSettingsRepository;
import com.instagramclone.user.service.interfaces.ISettingsService;
import com.instagramclone.utility.RedisUtility;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements ISettingsService {

    private static final Logger log = LoggerFactory.getLogger(SettingsServiceImpl.class);

    private final UserSettingsRepository userSettingsRepository;
    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final FollowRequestRepository followRequestRepository;
    private final CloseFriendRepository closeFriendRepository;
    private final NotificationRepository notificationRepository;
    private final RedisUtility redisUtility;
    private final PasswordEncoder passwordEncoder;
    private final IAuditLogService auditLogService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ITokenBlacklistService tokenBlacklistService;
    private final JwtProperties jwtProperties;
    private final EmailEventPublisher emailEventPublisher;
    private final DomainEventPublisher domainEventPublisher;
    private final IStoryService storyService;
    private final UserMuteRepository userMuteRepository;
    private final UserDailyScreenTimeRepository userDailyScreenTimeRepository;
    private final AuditLogRepository auditLogRepository;

    private static final Set<Integer> ALLOWED_BREAK_REMINDER_MINUTES = Set.of(0, 10, 20, 30);
    private static final Set<String> PASSWORD_HISTORY_ACTIONS = Set.of(
            AuditConstants.ACTION_PASSWORD_CHANGED,
            AuditConstants.ACTION_PASSWORD_RESET_COMPLETED
    );

    @Override
    @Transactional
    @org.springframework.cache.annotation.Cacheable(value = "user-settings", key = "T(com.instagramclone.common.util.SecurityUtils).getCurrentUserId()")
    public UserSettingsResponse getUserSettings() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        UserSettings settings = getOrCreateDefaultSettings(user);
        return toSettingsResponse(user, settings);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @org.springframework.cache.annotation.CacheEvict(value = "user-settings", key = "T(com.instagramclone.common.util.SecurityUtils).getCurrentUserId()"),
            @org.springframework.cache.annotation.CacheEvict(value = "user-privacy", key = "T(com.instagramclone.common.util.SecurityUtils).getCurrentUserId()")
    })
    public UserSettingsResponse updateSettings(UpdateSettingsRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        UserSettings settings = getOrCreateDefaultSettings(user);

        boolean privacyChanged = false;
        boolean oldPrivate = settings.isPrivate();
        if (request.getPrivateAccount() != null && settings.isPrivate() != request.getPrivateAccount()) {
            settings.setPrivate(request.getPrivateAccount());
            privacyChanged = true;
        }
        if (request.getNotifyLikes() != null) {
            settings.setNotifyLikes(request.getNotifyLikes());
        }
        if (request.getNotifyComments() != null) {
            settings.setNotifyComments(request.getNotifyComments());
        }
        if (request.getNotifyFollows() != null) {
            settings.setNotifyFollows(request.getNotifyFollows());
        }
        if (request.getNotifyMessages() != null) {
            settings.setNotifyMessages(request.getNotifyMessages());
        }
        if (request.getFilteredKeywords() != null) {
            String trimmed = request.getFilteredKeywords().trim();
            settings.setFilteredKeywords(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getHideOffensiveComments() != null) {
            settings.setHideOffensiveComments(request.getHideOffensiveComments());
        }
        if (request.getAllowStorySharing() != null) {
            settings.setAllowStorySharing(request.getAllowStorySharing());
        }
        if (request.getAllowStoryResharing() != null) {
            settings.setAllowStoryResharing(request.getAllowStoryResharing());
        }
        if (request.getHideLikeAndShareCounts() != null) {
            settings.setHideLikeAndShareCounts(request.getHideLikeAndShareCounts());
        }
        if (request.getAllowTagsFrom() != null) {
            settings.setAllowTagsFrom(request.getAllowTagsFrom());
        }
        if (request.getAllowMentionsFrom() != null) {
            settings.setAllowMentionsFrom(request.getAllowMentionsFrom());
        }
        if (request.getSaveStoriesToArchive() != null) {
            settings.setSaveStoriesToArchive(request.getSaveStoriesToArchive());
        }
        if (request.getBreakReminderMinutes() != null) {
            if (!ALLOWED_BREAK_REMINDER_MINUTES.contains(request.getBreakReminderMinutes())) {
                throw new BadRequestException("Break reminder interval must be 0, 10, 20, or 30 minutes");
            }
            settings.setBreakReminderMinutes(request.getBreakReminderMinutes());
        }

        userSettingsRepository.save(settings);
        log.info("Settings updated for user {}", user.getUsername());

        // Evict user profile cache so privacy change is instantly visible
        redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + user.getId());

        if (privacyChanged) {
            // When an account is switched from Private to Public: auto-accept all pending follow requests
            if (!settings.isPrivate()) {
                Page<com.instagramclone.follow.entity.FollowRequest> pendingPage = followRequestRepository
                        .findByTargetIdAndStatusOrderByCreatedAtDesc(
                                user.getId(),
                                com.instagramclone.follow.enums.FollowRequestStatus.PENDING,
                                Pageable.unpaged()
                        );
                for (com.instagramclone.follow.entity.FollowRequest req : pendingPage.getContent()) {
                    if (!followRepository.existsByFollowerIdAndFollowingId(req.getRequester().getId(), user.getId())) {
                        followRepository.save(com.instagramclone.follow.entity.Follow.builder()
                                .follower(req.getRequester())
                                .following(user)
                                .build());
                    }
                    followRequestRepository.delete(req);
                    redisUtility.deleteAfterCommit(
                            CacheConstants.CACHE_USER_PROFILE_PREFIX + req.getRequester().getId()
                    );
                }
            }

            emailEventPublisher.publishAfterCommit(EmailEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType("SECURITY_SETTINGS_CHANGED")
                    .emailType(EmailType.SECURITY_SETTINGS_CHANGED)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .variables(Map.of(
                            "username", user.getUsername(),
                            "changeDetails", "Account privacy changed from " + (oldPrivate ? "Private" : "Public") + " to " + (settings.isPrivate() ? "Private" : "Public")
                    ))
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        return toSettingsResponse(user, settings);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException(SettingsConstants.ERR_PASSWORDS_DO_NOT_MATCH);
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException(SettingsConstants.ERR_CURRENT_PASSWORD_PROVIDED_INCORRECT);
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BadRequestException(SettingsConstants.ERR_NEW_PASSWORD_SAME_AS_CURRENT);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 1. Retrieve all active refresh tokens to identify all active session IDs across all devices
        List<com.instagramclone.auth.entity.RefreshToken> activeTokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(currentUserId);
        long maxSessionTtl = jwtProperties.getRefreshExpirationMs() > 0
                ? jwtProperties.getRefreshExpirationMs()
                : 604800000L; // 7 days default fallback

        // 2. Explicitly blacklist each individual active session ID in Redis/memory
        for (com.instagramclone.auth.entity.RefreshToken token : activeTokens) {
            if (token.getSessionId() != null) {
                tokenBlacklistService.blacklistSession(token.getSessionId(), maxSessionTtl);
            }
        }

        // 3. Atomically revoke all existing refresh tokens in database
        refreshTokenRepository.revokeAllUserTokens(currentUserId, LocalDateTime.now());

        // 4. Invalidate all active session tokens in Redis / memory for full refresh token lifetime
        tokenBlacklistService.blacklistUser(currentUserId, maxSessionTtl);

        auditLogService.record(currentUserId, "PASSWORD_CHANGED", "USER", currentUserId, null, "Password successfully updated");
        log.info("Password successfully changed and {} active sessions invalidated for user {}", activeTokens.size(), user.getUsername());

        emailEventPublisher.publishAfterCommit(EmailEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(KafkaConstants.EVENT_PASSWORD_CHANGED_SECURITY_ALERT)
                .emailType(EmailType.PASSWORD_CHANGED)
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .variables(Map.of("username", user.getUsername()))
                .timestamp(LocalDateTime.now())
                .build());
    }

    @Override
    @Transactional
    public void blockUser(UUID targetUserId, BlockUserRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException(SettingsConstants.ERR_CANNOT_BLOCK_SELF);
        }

        User blocker = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_CURRENT_USER_NOT_FOUND));
        User blocked = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_TARGET_USER_NOT_FOUND_ID + targetUserId));

        if (!userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, targetUserId)) {
            BlockReason reason = (request != null && request.getReason() != null)
                    ? request.getReason()
                    : BlockReason.NOT_SPECIFIED;
            Boolean blockFuture = (request != null && request.getBlockFutureAccounts() != null)
                    ? request.getBlockFutureAccounts()
                    : true;
            String notes = (request != null) ? request.getNotes() : null;

            UserBlock block = UserBlock.builder()
                    .blocker(blocker)
                    .blocked(blocked)
                    .reason(reason)
                    .blockFutureAccounts(blockFuture)
                    .notes(notes)
                    .build();
            userBlockRepository.save(block);

            // 1. Clean up reciprocal follow relationships
            followRepository.findByFollowerIdAndFollowingId(currentUserId, targetUserId)
                    .ifPresent(followRepository::delete);
            followRepository.findByFollowerIdAndFollowingId(targetUserId, currentUserId)
                    .ifPresent(followRepository::delete);

            // 2. Clean up reciprocal pending follow requests
            followRequestRepository.deleteByRequesterIdAndTargetId(currentUserId, targetUserId);
            followRequestRepository.deleteByRequesterIdAndTargetId(targetUserId, currentUserId);

            // 3. Clean up reciprocal close friends
            closeFriendRepository.deleteByUserIdAndFriendId(currentUserId, targetUserId);
            closeFriendRepository.deleteByUserIdAndFriendId(targetUserId, currentUserId);

            // 4. Purge reciprocal notifications
            notificationRepository.deleteNotificationsBetweenUsers(currentUserId, targetUserId);

            // 5. Evict profile caches
            redisUtility.deleteAfterCommit(
                    CacheConstants.CACHE_USER_PROFILE_PREFIX + currentUserId,
                    CacheConstants.CACHE_USER_PROFILE_PREFIX + targetUserId
            );

            // 6. Publish domain event
            domainEventPublisher.publish(
                    KafkaConstants.EVENT_USER_BLOCKED,
                    currentUserId,
                    targetUserId,
                    "USER_BLOCK",
                    "reason=" + reason.name()
            );

            log.info("User {} blocked user {} (reason={}, futureAccounts={})",
                    blocker.getUsername(), blocked.getUsername(), reason, blockFuture);
        }
    }

    @Override
    @Transactional
    public void unblockUser(UUID targetUserId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        userBlockRepository.deleteByBlockerIdAndBlockedId(currentUserId, targetUserId);

        // Evict profile caches
        redisUtility.deleteAfterCommit(
                CacheConstants.CACHE_USER_PROFILE_PREFIX + currentUserId,
                CacheConstants.CACHE_USER_PROFILE_PREFIX + targetUserId
        );

        domainEventPublisher.publish(
                KafkaConstants.EVENT_USER_UNBLOCKED,
                currentUserId,
                targetUserId,
                "USER_BLOCK",
                "unblocked"
        );

        log.info("User {} unblocked user {}", currentUserId, targetUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public BlockStatusResponse getBlockStatus(UUID targetUserId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(targetUserId)) {
            return BlockStatusResponse.builder()
                    .targetUserId(targetUserId)
                    .hasBlocked(false)
                    .isBlockedBy(false)
                    .isBlocked(false)
                    .canInteract(true)
                    .build();
        }

        boolean hasBlocked = userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, targetUserId);
        boolean isBlockedBy = userBlockRepository.existsByBlockerIdAndBlockedId(targetUserId, currentUserId);
        boolean isBlocked = hasBlocked || isBlockedBy;

        return BlockStatusResponse.builder()
                .targetUserId(targetUserId)
                .hasBlocked(hasBlocked)
                .isBlockedBy(isBlockedBy)
                .isBlocked(isBlocked)
                .canInteract(!isBlocked)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BlockedUserResponse> getBlockedUsers(String query, Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<UserBlock> blocks = (query != null && !query.trim().isEmpty())
                ? userBlockRepository.searchBlockedUsers(currentUserId, query.trim(), pageable)
                : userBlockRepository.findByBlockerId(currentUserId, pageable);

        Page<BlockedUserResponse> mapped = blocks.map(block -> {
            User u = block.getBlocked();
            return BlockedUserResponse.builder()
                    .id(block.getId())
                    .userId(u.getId())
                    .username(u.getUsername())
                    .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                    .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                    .reason(block.getReason())
                    .blockFutureAccounts(block.getBlockFutureAccounts())
                    .blockedAt(block.getCreatedAt())
                    .build();
        });

        return PageResponse.from(mapped);
    }

    @Override
    @Transactional
    public void muteUser(UUID targetUserId, boolean mutePosts, boolean muteStories) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException(SettingsConstants.ERR_CANNOT_MUTE_SELF);
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_CURRENT_USER_NOT_FOUND));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_TARGET_USER_NOT_FOUND_ID + targetUserId));

        UserMute mute = userMuteRepository.findByUserIdAndMutedUserId(currentUserId, targetUserId)
                .orElse(UserMute.builder()
                        .user(user)
                        .mutedUser(target)
                        .build());

        mute.setMutePosts(mutePosts);
        mute.setMuteStories(muteStories);
        userMuteRepository.save(mute);
        log.info("User {} muted user {} (posts={}, stories={})", currentUserId, targetUserId, mutePosts, muteStories);
    }

    @Override
    @Transactional
    public void unmuteUser(UUID targetUserId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        userMuteRepository.deleteByUserIdAndMutedUserId(currentUserId, targetUserId);
        log.info("User {} unmuted user {}", currentUserId, targetUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserMuted(UUID targetUserId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return userMuteRepository.existsByUserIdAndMutedUserId(currentUserId, targetUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FollowUserResponse> getMutedUsers(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<UserMute> mutes = userMuteRepository.findByUserId(currentUserId, pageable);
        Page<FollowUserResponse> mapped = mutes.map(mute -> {
            User target = mute.getMutedUser();
            return FollowUserResponse.builder()
                    .id(target.getId())
                    .username(target.getUsername())
                    .displayName(target.getProfile() != null ? target.getProfile().getDisplayName() : target.getUsername())
                    .avatarUrl(target.getProfile() != null ? target.getProfile().getAvatarUrl() : null)
                    .followedByCurrentUser(false)
                    .build();
        });
        return PageResponse.from(mapped);
    }

    @Override
    @Transactional
    public ScreenTimeHeartbeatResponse recordScreenTimeHeartbeat(ScreenTimeHeartbeatRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        LocalDate targetDate = resolveScreenTimeDate(request.getUsageDate());
        int deltaSeconds = Math.min(120, Math.max(1, request.getActiveSeconds()));
        LocalDateTime now = LocalDateTime.now();

        int updatedRows = userDailyScreenTimeRepository.incrementActiveSeconds(
                currentUserId, targetDate, deltaSeconds, now
        );

        if (updatedRows == 0) {
            try {
                UserDailyScreenTime created = UserDailyScreenTime.builder()
                        .user(user)
                        .usageDate(targetDate)
                        .activeSeconds(deltaSeconds)
                        .build();
                userDailyScreenTimeRepository.saveAndFlush(created);
            } catch (DataIntegrityViolationException ex) {
                userDailyScreenTimeRepository.incrementActiveSeconds(
                        currentUserId, targetDate, deltaSeconds, now
                );
            }
        }

        int totalSeconds = userDailyScreenTimeRepository.findByUserIdAndUsageDate(currentUserId, targetDate)
                .map(UserDailyScreenTime::getActiveSeconds)
                .orElse(deltaSeconds);

        return ScreenTimeHeartbeatResponse.builder()
                .usageDate(targetDate)
                .todaySeconds(totalSeconds)
                .todayMinutes(totalSeconds / 60)
                .build();
    }

    @Override
    @Transactional
    public ScreenTimeSummaryResponse getScreenTimeSummary(int days, LocalDate today) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        int safeDays = Math.min(30, Math.max(1, days));
        LocalDate endDate = resolveScreenTimeDate(today);
        LocalDate startDate = endDate.minusDays(safeDays - 1L);

        List<UserDailyScreenTime> rows = userDailyScreenTimeRepository
                .findByUserIdAndUsageDateBetweenOrderByUsageDateAsc(currentUserId, startDate, endDate);

        Map<LocalDate, Integer> secondsByDate = new HashMap<>();
        for (UserDailyScreenTime row : rows) {
            secondsByDate.put(row.getUsageDate(), row.getActiveSeconds());
        }

        List<ScreenTimeSummaryResponse.DailyScreenTimeItem> breakdown = new ArrayList<>(safeDays);
        int totalSeconds = 0;
        for (int i = 0; i < safeDays; i++) {
            LocalDate date = startDate.plusDays(i);
            int sec = secondsByDate.getOrDefault(date, 0);
            totalSeconds += sec;
            breakdown.add(ScreenTimeSummaryResponse.DailyScreenTimeItem.builder()
                    .date(date)
                    .dayLabel(date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .seconds(sec)
                    .minutes(sec / 60)
                    .build());
        }

        int todaySeconds = secondsByDate.getOrDefault(endDate, 0);
        int dailyAverageMinutes = Math.round(totalSeconds / (safeDays * 60.0f));
        UserSettings settings = getOrCreateDefaultSettings(user);

        return ScreenTimeSummaryResponse.builder()
                .daysRequested(safeDays)
                .dailyAverageMinutes(dailyAverageMinutes)
                .todayMinutes(todaySeconds / 60)
                .breakReminderMinutes(settings.getBreakReminderMinutes())
                .dailyBreakdown(breakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AccountCreatedResponse getAccountCreated() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        LocalDateTime createdAt = userRepository.findCreatedAtById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(SettingsConstants.ERR_USER_NOT_FOUND_ID + currentUserId));
        return AccountCreatedResponse.builder()
                .accountCreatedAt(createdAt)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PasswordHistoryResponse getPasswordHistory() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        PasswordHistoryResponse summary = auditLogRepository.findPasswordHistorySummary(
                currentUserId, PASSWORD_HISTORY_ACTIONS);
        if (summary == null) {
            return PasswordHistoryResponse.builder()
                    .lastChangedAt(null)
                    .changeCount(0L)
                    .build();
        }
        return summary;
    }

    private LocalDate resolveScreenTimeDate(LocalDate requestedDate) {
        LocalDate serverToday = LocalDate.now(ZoneOffset.UTC);
        if (requestedDate == null) {
            return serverToday;
        }
        // Allow +/- 1 day for client timezone differences; clamp anything outside
        if (requestedDate.isAfter(serverToday.plusDays(1)) || requestedDate.isBefore(serverToday.minusDays(1))) {
            return serverToday;
        }
        return requestedDate;
    }

    private UserSettings getOrCreateDefaultSettings(User user) {
        return userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserSettings s = UserSettings.builder()
                            .user(user)
                            .isPrivate(false)
                            .notifyLikes(true)
                            .notifyComments(true)
                            .notifyFollows(true)
                            .notifyMessages(true)
                            .build();
                    return userSettingsRepository.save(s);
                });
    }

    private UserSettingsResponse toSettingsResponse(User user, UserSettings settings) {
        List<StoryResponse> stories = new ArrayList<>();
        if (!settings.isPrivate()) {
            try {
                UserStoriesResponse userStories = storyService.getUserStories(user.getId());
                if (userStories != null && userStories.getStories() != null) {
                    stories = userStories.getStories().stream()
                            .map(s -> StoryResponse.builder()
                                     .id(s.getId())
                                     .author(null)
                                     .mediaUrl(s.getMediaUrl())
                                     .mediaType(s.getMediaType())
                                     .caption(s.getCaption())
                                     .expiresAt(s.getExpiresAt())
                                     .viewed(s.isViewed())
                                     .liked(s.isLiked())
                                     .closeFriendsOnly(s.isCloseFriendsOnly())
                                     .poll(s.getPoll())
                                     .build())
                            .toList();
                }
            } catch (Exception ex) {
                log.debug("Could not retrieve active stories for user settings response: {}", ex.getMessage());
            }
        }

        return UserSettingsResponse.builder()
                .username(user.getUsername())
                .privacy(UserSettingsResponse.PrivacySettings.builder()
                        .privateAccount(settings.isPrivate())
                        .build())
                .notifications(UserSettingsResponse.NotificationPreferences.builder()
                        .likes(settings.isNotifyLikes())
                        .comments(settings.isNotifyComments())
                        .followers(settings.isNotifyFollows())
                        .messages(settings.isNotifyMessages())
                        .build())
                .accountStatus(user.getStatus().name())
                .filteredKeywords(settings.getFilteredKeywords())
                .hideOffensiveComments(settings.isHideOffensiveComments())
                .allowStorySharing(settings.isAllowStorySharing())
                .allowStoryResharing(settings.isAllowStoryResharing())
                .hideLikeAndShareCounts(settings.isHideLikeAndShareCounts())
                .allowTagsFrom(settings.getAllowTagsFrom())
                .allowMentionsFrom(settings.getAllowMentionsFrom())
                .saveStoriesToArchive(settings.isSaveStoriesToArchive())
                .breakReminderMinutes(settings.getBreakReminderMinutes())
                .stories(stories)
                .hasStory(!stories.isEmpty())
                .build();
    }
}
