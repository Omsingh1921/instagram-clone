package com.instagramclone.user.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.auth.constants.AuthConstants;
import com.instagramclone.auth.repository.RefreshTokenRepository;
import com.instagramclone.common.constants.CacheConstants;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ConflictException;
import com.instagramclone.common.exception.ForbiddenException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.follow.enums.FollowRequestStatus;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.follow.repository.FollowRequestRepository;
import com.instagramclone.media.repository.MediaRepository;
import com.instagramclone.media.service.interfaces.IMediaService;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.security.config.JwtProperties;
import com.instagramclone.security.principal.UserPrincipal;
import com.instagramclone.security.service.interfaces.IPrivacyService;
import com.instagramclone.security.service.interfaces.ITokenBlacklistService;
import com.instagramclone.story.dto.response.StoryResponse;
import com.instagramclone.story.dto.response.UserStoriesResponse;
import com.instagramclone.story.service.interfaces.IStoryService;
import com.instagramclone.user.constants.UserConstants;
import com.instagramclone.user.dto.request.UpdateAvatarRequest;
import com.instagramclone.user.dto.request.UpdateProfileRequest;
import com.instagramclone.user.dto.response.UserProfileResponse;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import com.instagramclone.user.entity.Profile;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.AccountType;
import com.instagramclone.user.enums.Gender;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.mapper.UserMapper;
import com.instagramclone.user.repository.ProfileRepository;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.user.repository.UserSettingsRepository;
import com.instagramclone.user.service.interfaces.IUserService;
import com.instagramclone.utility.RedisUtility;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final IMediaService mediaService;
    private final MediaRepository mediaRepository;
    private final ProfileRepository profileRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;
    private final UserMapper userMapper;
    private final RedisUtility redisUtility;
    private final ObjectMapper objectMapper;
    private final IPrivacyService privacyService;
    private final UserSettingsRepository userSettingsRepository;
    private final FollowRequestRepository followRequestRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ITokenBlacklistService tokenBlacklistService;
    private final JwtProperties jwtProperties;
    private final IAuditLogService auditLogService;
    private final IStoryService storyService;
    private final com.instagramclone.media.service.interfaces.IMediaUrlService mediaUrlService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return getUserProfileById(currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfileById(UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);
        boolean isAdmin = SecurityUtils.isCurrentUserAdmin();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId));

        // When account is deleted or deactivated, only ADMIN can fetch data!
        if (!isAdmin && user.isDeletedOrDeactivated()) {
            throw new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId);
        }

        if (!isAdmin) {
            privacyService.validateBlockStatus(currentUserId, userId);
        }

        Boolean isSelf = (currentUserId != null && currentUserId.equals(userId));
        boolean isPrivate = privacyService.isAccountPrivate(userId);

        Boolean isFollowed = (currentUserId != null && !isSelf)
                ? followRepository.existsByFollowerIdAndFollowingId(currentUserId, userId)
                : false;
        Boolean followsCurrentUser = (currentUserId != null && !isSelf)
                ? followRepository.existsByFollowerIdAndFollowingId(userId, currentUserId)
                : false;
        Boolean followRequested = (currentUserId != null && !isSelf && !Boolean.TRUE.equals(isFollowed) && isPrivate)
                ? followRequestRepository.existsByRequesterIdAndTargetIdAndStatus(currentUserId, userId, FollowRequestStatus.PENDING)
                : false;

        long followerCount = followRepository.countByFollowingId(userId);
        long followingCount = followRepository.countByFollowerId(userId);
        long postCount = postRepository.countByUserIdAndIsDeletedFalse(userId);

        String cacheKey = CacheConstants.CACHE_USER_PROFILE_PREFIX + userId;
        if (redisUtility.isAvailable() && !isAdmin) {
            Optional<String> cached = redisUtility.get(cacheKey);
            if (cached.isPresent()) {
                try {
                    UserProfileResponse cachedProfile = objectMapper.readValue(cached.get(), UserProfileResponse.class);
                    cachedProfile.setFollowedByCurrentUser(isFollowed);
                    cachedProfile.setIsPrivate(isPrivate);
                    cachedProfile.setFollowRequestedByCurrentUser(followRequested);
                    cachedProfile.setFollowsCurrentUser(followsCurrentUser);
                    cachedProfile.setPostCount(postCount);
                    cachedProfile.setFollowerCount(followerCount);
                    cachedProfile.setFollowingCount(followingCount);
                    // Explicitly wipe stories from cached object before checking view permissions
                    cachedProfile.setStories(new ArrayList<>());
                    cachedProfile.setHasStory(false);
                    if (Boolean.TRUE.equals(isSelf)) {
                        cachedProfile.setEmail(user.getEmail());
                    } else {
                        cachedProfile.setEmail(null);
                    }
                    populateStories(cachedProfile, userId, currentUserId, isPrivate, isFollowed, isSelf, isAdmin);
                    return cachedProfile;
                } catch (Exception ex) {
                    log.debug("Cache deserialization failed for user profile {}: {}", userId, ex.getMessage());
                }
            }
        }

        UserProfileResponse response = userMapper.toUserProfileResponse(
                user, postCount, followerCount, followingCount, isFollowed, isPrivate, followRequested, followsCurrentUser);

        if (redisUtility.isAvailable() && !isAdmin) {
            try {
                redisUtility.set(cacheKey, objectMapper.writeValueAsString(response), java.time.Duration.ofMinutes(15));
            } catch (Exception ex) {
                log.debug("Failed to cache user profile for userId {}: {}", userId, ex.getMessage());
            }
        }

        populateStories(response, userId, currentUserId, isPrivate, isFollowed, isSelf, isAdmin);
        if (Boolean.TRUE.equals(isSelf)) {
            response.setEmail(user.getEmail());
        }
        return response;
    }

    private void populateStories(UserProfileResponse profile, UUID userId, UUID currentUserId,
                                 boolean isPrivate, boolean isFollowed, boolean isSelf, boolean isAdmin) {
        if (!isAdmin && !isSelf && isPrivate && !isFollowed) {
            profile.setStories(new ArrayList<>());
            profile.setHasStory(false);
            return;
        }

        try {
            UserStoriesResponse storiesResp = storyService.getUserStories(userId);
            if (storiesResp != null && storiesResp.getStories() != null) {
                boolean isOwner = Boolean.TRUE.equals(isSelf);
                List<StoryResponse> cleanStories = storiesResp.getStories().stream()
                        .map(s -> sanitizeProfileStory(s, isOwner))
                        .toList();
                profile.setStories(cleanStories);
                profile.setHasStory(!cleanStories.isEmpty());
                return;
            }
        } catch (Exception ex) {
            log.debug("Could not fetch active stories for profile {}: {}", userId, ex.getMessage());
        }

        profile.setStories(new ArrayList<>());
        profile.setHasStory(false);
    }

    private StoryResponse sanitizeProfileStory(StoryResponse original, boolean isOwner) {
        return StoryResponse.builder()
                .id(original.getId())
                .author(null) // Redundant in profile response since parent already contains user details
                .mediaUrl(original.getMediaUrl())
                .mediaType(original.getMediaType())
                .caption(original.getCaption())
                .expiresAt(original.getExpiresAt())
                .viewed(original.isViewed())
                .liked(original.isLiked())
                .closeFriendsOnly(original.isCloseFriendsOnly())
                .poll(original.getPoll())
                .viewCount(isOwner ? original.getViewCount() : null)
                .likeCount(isOwner ? original.getLikeCount() : null)
                .mentions(null)
                .createdAt(null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfileByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND);
        }
        String normalized = username.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByUsername(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return getUserProfileById(user.getId());
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        // Handle username change with dynamic reservation & cooldown rules
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            String newUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);
            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                LocalDateTime lastChanged = user.getUsernameLastChangedAt();
                String prevUsername = user.getPreviousUsername();
                boolean isReverting = (prevUsername != null && prevUsername.equalsIgnoreCase(newUsername));
                int cooldownDays = (dynamicSystemConfigReader != null)
                        ? dynamicSystemConfigReader.getInt(DynamicSystemConfigKeys.USER_USERNAME_COOLDOWN_DAYS, UserConstants.USERNAME_CHANGE_COOLDOWN_DAYS, 0, 365)
                        : UserConstants.USERNAME_CHANGE_COOLDOWN_DAYS;

                // Cooldown check: can only revert to previousUsername within cooldown window
                if (cooldownDays > 0 && lastChanged != null && lastChanged.plusDays(cooldownDays).isAfter(LocalDateTime.now())) {
                    if (!isReverting) {
                        String msg = (cooldownDays == UserConstants.USERNAME_CHANGE_COOLDOWN_DAYS)
                                ? String.format(UserConstants.ERR_USERNAME_CHANGE_COOLDOWN, prevUsername != null ? prevUsername : "")
                                : String.format("You can only change your username once every %d days or revert back to '%s'", cooldownDays, prevUsername != null ? prevUsername : "");
                        throw new BadRequestException(msg);
                    }
                }

                // Check if active username taken
                if (userRepository.existsByUsername(newUsername)) {
                    throw new ConflictException(
                            String.format(AuthConstants.ERR_USERNAME_TAKEN_FORMAT, newUsername));
                }

                // Check anti-sniping: is newUsername reserved by another user within cooldown window?
                if (cooldownDays > 0) {
                    LocalDateTime cutoff = LocalDateTime.now().minusDays(cooldownDays);
                    userRepository.findByPreviousUsernameReservedAfter(newUsername, cutoff).ifPresent(otherUser -> {
                        if (!otherUser.getId().equals(currentUserId)) {
                            throw new ConflictException(UserConstants.ERR_USERNAME_RESERVED);
                        }
                    });
                }

                String oldUsername = user.getUsername();
                user.setPreviousUsername(oldUsername);
                user.setUsernameLastChangedAt(LocalDateTime.now());
                user.setUsername(newUsername);
                userRepository.save(user);
                auditLogService.record(currentUserId, "USERNAME_CHANGED", "USER", currentUserId, null,
                        "Username changed from " + oldUsername + " to " + newUsername);
                log.info("User ID {} changed username from {} to {}", currentUserId, oldUsername, newUsername);
            }
        }

        Profile profile = user.getProfile();
        if (profile == null) {
            profile = Profile.builder().user(user).build();
            user.setProfile(profile);
        }

        if (request.getDisplayName() != null) {
            String trimmed = request.getDisplayName().trim();
            profile.setDisplayName(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getBio() != null) {
            String trimmed = request.getBio().trim();
            profile.setBio(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getWebsiteUrl() != null) {
            String trimmed = request.getWebsiteUrl().trim();
            profile.setWebsiteUrl(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getPronouns() != null) {
            String trimmed = request.getPronouns().trim();
            profile.setPronouns(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                profile.setGender(Gender.valueOf(request.getGender().trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid gender. Valid values are MALE, FEMALE, CUSTOM, PREFER_NOT_TO_SAY");
            }
        }
        if (request.getAccountType() != null && !request.getAccountType().isBlank()) {
            try {
                profile.setAccountType(AccountType.valueOf(request.getAccountType().trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid account type. Valid values are PERSONAL, CREATOR, BUSINESS");
            }
        }
        if (request.getCategory() != null) {
            String trimmed = request.getCategory().trim();
            profile.setCategory(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getShowCategoryBadge() != null) {
            profile.setShowCategoryBadge(request.getShowCategoryBadge());
        }
        if (request.getContactEmail() != null) {
            String trimmed = request.getContactEmail().trim();
            profile.setContactEmail(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getContactPhone() != null) {
            String trimmed = request.getContactPhone().trim();
            profile.setContactPhone(trimmed.isEmpty() ? null : trimmed);
        }
        if (request.getShowContactInfo() != null) {
            profile.setShowContactInfo(request.getShowContactInfo());
        }

        profileRepository.save(profile);
        redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + currentUserId);
        log.info("Profile updated successfully for user ID: {}", currentUserId);

        return userMapper.toUserProfileResponse(user, null);
    }

    @Override
    @Transactional
    public UserProfileResponse updateAvatar(UpdateAvatarRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        String rawAvatarUrl = request.getAvatarUrl().trim();
        String unmaskedUrl = mediaUrlService.unmaskUrl(rawAvatarUrl);

        // Enforce media ownership: if media asset exists in our repository, user must own it
        mediaRepository.findBySecureUrl(unmaskedUrl).ifPresent(media -> {
            if (media.getOwner() != null && !media.getOwner().getId().equals(currentUserId)) {
                throw new ForbiddenException("Cannot use media asset owned by another user as avatar");
            }
        });

        Profile profile = user.getProfile();
        if (profile == null) {
            profile = Profile.builder().user(user).build();
            user.setProfile(profile);
        }

        String oldAvatarUrl = profile.getAvatarUrl();

        profile.setAvatarUrl(unmaskedUrl);
        profileRepository.save(profile);
        redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + currentUserId);
        log.info("Avatar updated successfully for user ID: {}", currentUserId);

        if (oldAvatarUrl != null && !oldAvatarUrl.isBlank() && !oldAvatarUrl.equalsIgnoreCase(unmaskedUrl)) {
            try {
                mediaService.deleteByUrl(oldAvatarUrl);
                log.info("Successfully cleaned up previous avatar asset for user: {}", currentUserId);
            } catch (Exception ex) {
                log.warn("Failed to delete previous avatar asset from Cloudinary: {}", ex.getMessage());
            }
        }

        return userMapper.toUserProfileResponse(user, null);
    }

    @Override
    @Transactional
    public UserProfileResponse deleteAvatar() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + currentUserId));

        Profile profile = user.getProfile();
        if (profile != null && profile.getAvatarUrl() != null) {
            String oldAvatarUrl = profile.getAvatarUrl();
            profile.setAvatarUrl(null);
            profileRepository.save(profile);

            try {
                mediaService.deleteByUrl(oldAvatarUrl);
                log.info("Successfully cleaned up avatar asset for user: {}", currentUserId);
            } catch (Exception ex) {
                log.warn("Failed to delete avatar asset from Cloudinary: {}", ex.getMessage());
            }
        }

        redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + currentUserId);
        auditLogService.record(currentUserId, "AVATAR_REMOVED", "USER", currentUserId, null, "Profile avatar removed");
        log.info("Avatar removed successfully for user ID: {}", currentUserId);

        return userMapper.toUserProfileResponse(user, null);
    }

    @Override
    @Transactional
    public UserProfileResponse verifyUser(UUID userId, boolean verified) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId));

        user.setIsVerified(verified);
        userRepository.save(user);

        redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + userId);
        auditLogService.record(userId, "USER_VERIFICATION_STATUS_CHANGED", "USER", userId, null,
                "User verification status set to " + verified);
        log.info("User {} verification status set to {} by admin", userId, verified);

        return userMapper.toUserProfileResponse(user, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserSummaryResponse> searchUsers(String query, Pageable pageable) {
        String searchQuery = (query != null) ? query.trim() : "";
        Page<User> usersPage;
        if (SecurityUtils.isCurrentUserAdmin()) {
            usersPage = userRepository.searchAllUsersForAdmin(searchQuery, pageable);
        } else {
            UUID currentUserId = SecurityUtils.getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);
            usersPage = userRepository.searchUsers(searchQuery, currentUserId, pageable);
        }
        Page<UserSummaryResponse> summaryPage = usersPage.map(userMapper::toUserSummaryResponse);
        return PageResponse.from(summaryPage);
    }

    private static final String SEEN_SUGGESTIONS_KEY_PREFIX = "users:seen_suggestions:";
    private static final Duration SEEN_SUGGESTIONS_TTL = Duration.ofHours(6);

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getSuggestedUsers(int limit) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        int poolSize = Math.max(limit * 10, 50);
        List<User> candidates = userRepository.findSuggestedUserCandidates(currentUserId, PageRequest.of(0, poolSize));
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }

        // Retrieve previously seen suggested user IDs from Redis
        String cacheKey = SEEN_SUGGESTIONS_KEY_PREFIX + currentUserId;
        Set<UUID> seenIds = new HashSet<>();
        try {
            Optional<String> cached = redisUtility.get(cacheKey);
            if (cached.isPresent()) {
                seenIds = objectMapper.readValue(cached.get(), new TypeReference<Set<UUID>>() {});
            }
        } catch (Exception ex) {
            log.debug("[SUGGESTIONS] Failed to read seen suggestions: {}", ex.getMessage());
        }

        // Filter out previously suggested users so each refresh shows fresh creators
        final Set<UUID> finalSeenIds = (seenIds != null) ? seenIds : new HashSet<>();
        List<User> unseen = candidates.stream()
                .filter(u -> !finalSeenIds.contains(u.getId()))
                .collect(Collectors.toList());

        // If user has seen all candidates in the pool, reset the seen set so suggestions cycle
        if (unseen.isEmpty()) {
            seenIds = new HashSet<>();
            unseen = new ArrayList<>(candidates);
        }

        // Pick up to 'limit' users
        List<User> selected = unseen.stream().limit(Math.max(1, limit)).toList();

        // Update seen suggestions cache
        Set<UUID> updatedSeen = (seenIds != null) ? seenIds : new HashSet<>();
        selected.forEach(u -> updatedSeen.add(u.getId()));
        try {
            String json = objectMapper.writeValueAsString(updatedSeen);
            redisUtility.set(cacheKey, json, SEEN_SUGGESTIONS_TTL);
        } catch (Exception ex) {
            log.debug("[SUGGESTIONS] Failed to save seen suggestions: {}", ex.getMessage());
        }

        return selected.stream()
                .map(userMapper::toUserSummaryResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteCurrentUser() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        deleteUser(currentUserId);
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId));

        if (user.getRole() == Role.ROLE_ADMIN || "admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("Admin accounts cannot be deleted");
        }

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new BadRequestException("User account is already deleted");
        }

        user.softDelete();
        userRepository.save(user);

        // Immediate session revocation and token blacklisting
        refreshTokenRepository.revokeAllUserTokens(userId, LocalDateTime.now());
        tokenBlacklistService.blacklistUser(userId, jwtProperties.getAccessExpirationMs());

        auditLogService.record(userId, "ACCOUNT_SOFT_DELETED", "USER", userId, null,
                "User account soft deleted with 15-day recovery window");

        // Evict profile cache
        redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + userId);
        log.info("User {} successfully soft deleted and active sessions revoked", userId);
    }

    @Override
    @Transactional
    public void deactivateCurrentUser() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        deactivateUser(currentUserId);
    }

    @Override
    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(UserConstants.ERR_USER_NOT_FOUND_ID + userId));

        if (user.getRole() == Role.ROLE_ADMIN || "admin".equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("Admin accounts cannot be deactivated");
        }

        if (user.isDeletedOrDeactivated()) {
            throw new BadRequestException("User account is already deleted or deactivated");
        }

        user.deactivate();
        userRepository.save(user);

        // Immediate session revocation and token blacklisting
        refreshTokenRepository.revokeAllUserTokens(userId, LocalDateTime.now());
        tokenBlacklistService.blacklistUser(userId, jwtProperties.getAccessExpirationMs());

        auditLogService.record(userId, "ACCOUNT_DEACTIVATED", "USER", userId, null,
                "User account deactivated");

        // Evict profile cache
        redisUtility.deleteAfterCommit(CacheConstants.CACHE_USER_PROFILE_PREFIX + userId);
        log.info("User {} successfully deactivated and active sessions revoked", userId);
    }
}
