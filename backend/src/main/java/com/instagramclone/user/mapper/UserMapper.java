package com.instagramclone.user.mapper;

import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import com.instagramclone.user.common.UserSummary;
import com.instagramclone.user.constants.UserConstants;
import com.instagramclone.user.dto.response.UserProfileResponse;
import com.instagramclone.user.dto.response.UserResponse;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import com.instagramclone.user.entity.Profile;
import com.instagramclone.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final IMediaUrlService mediaUrlService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    private String getMaskedAvatarUrl(Profile profile) {
        if (profile == null || profile.getAvatarUrl() == null) {
            return null;
        }
        return mediaUrlService.maskUrl(profile.getAvatarUrl());
    }

    public UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }

        Profile profile = user.getProfile();
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(profile != null ? profile.getDisplayName() : null)
                .bio(profile != null ? profile.getBio() : null)
                .avatarUrl(getMaskedAvatarUrl(profile))
                .websiteUrl(profile != null ? profile.getWebsiteUrl() : null)
                .pronouns(profile != null ? profile.getPronouns() : null)
                .gender(profile != null && profile.getGender() != null ? profile.getGender().name() : null)
                .status(user.getStatus())
                .role(user.getRole() != null ? user.getRole().name() : "ROLE_USER")
                .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
                .emailVerifiedAt(user.getEmailVerifiedAt())
                .isVerified(Boolean.TRUE.equals(user.getIsVerified()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserProfileResponse toUserProfileResponse(User user, Boolean followedByCurrentUser) {
        return toUserProfileResponse(user, 0L, 0L, 0L, followedByCurrentUser);
    }

    public UserProfileResponse toUserProfileResponse(User user, long postCount, long followerCount, long followingCount, Boolean followedByCurrentUser) {
        return toUserProfileResponse(user, postCount, followerCount, followingCount, followedByCurrentUser, false, null);
    }

    public UserProfileResponse toUserProfileResponse(User user, long postCount, long followerCount, long followingCount, Boolean followedByCurrentUser, boolean isPrivate, Boolean followRequested) {
        return toUserProfileResponse(user, postCount, followerCount, followingCount, followedByCurrentUser, isPrivate, followRequested, null);
    }

    public UserProfileResponse toUserProfileResponse(User user, long postCount, long followerCount, long followingCount, Boolean followedByCurrentUser, boolean isPrivate, Boolean followRequested, Boolean followsCurrentUser) {
        if (user == null) {
            return null;
        }

        Profile profile = user.getProfile();
        LocalDateTime lastChanged = user.getUsernameLastChangedAt();
        int cooldownDays = (dynamicSystemConfigReader != null)
                ? dynamicSystemConfigReader.getInt(DynamicSystemConfigKeys.USER_USERNAME_COOLDOWN_DAYS, UserConstants.USERNAME_CHANGE_COOLDOWN_DAYS, 0, 365)
                : UserConstants.USERNAME_CHANGE_COOLDOWN_DAYS;
        boolean canChange = (lastChanged == null || lastChanged.plusDays(cooldownDays).isBefore(LocalDateTime.now()));
        LocalDateTime lockedUntil = (lastChanged != null && !canChange) ? lastChanged.plusDays(cooldownDays) : null;

        return UserProfileResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(profile != null ? profile.getDisplayName() : null)
                .bio(profile != null ? profile.getBio() : null)
                .avatarUrl(getMaskedAvatarUrl(profile))
                .websiteUrl(profile != null ? profile.getWebsiteUrl() : null)
                .postCount(postCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .followedByCurrentUser(followedByCurrentUser)
                .isPrivate(isPrivate)
                .followRequestedByCurrentUser(followRequested)
                .followsCurrentUser(followsCurrentUser)
                .isVerified(Boolean.TRUE.equals(user.getIsVerified()))
                .accountType(profile != null && profile.getAccountType() != null ? profile.getAccountType().name() : "PERSONAL")
                .role(user.getRole() != null ? user.getRole().name() : "ROLE_USER")
                .category(profile != null ? profile.getCategory() : null)
                .pronouns(profile != null ? profile.getPronouns() : null)
                .gender(profile != null && profile.getGender() != null ? profile.getGender().name() : null)
                .showCategoryBadge(profile != null && profile.getShowCategoryBadge() != null ? profile.getShowCategoryBadge() : true)
                .contactEmail(profile != null ? profile.getContactEmail() : null)
                .contactPhone(profile != null ? profile.getContactPhone() : null)
                .showContactInfo(profile != null && profile.getShowContactInfo() != null ? profile.getShowContactInfo() : false)
                .previousUsername(user.getPreviousUsername())
                .usernameLastChangedAt(lastChanged)
                .canChangeUsername(canChange)
                .previousUsernameLockedUntil(lockedUntil)
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserSummaryResponse toUserSummaryResponse(User user) {
        if (user == null) {
            return null;
        }

        Profile profile = user.getProfile();
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(profile != null ? profile.getDisplayName() : null)
                .avatarUrl(getMaskedAvatarUrl(profile))
                .isVerified(Boolean.TRUE.equals(user.getIsVerified()))
                .build();
    }

    public UserSummary toUserSummary(User user) {
        if (user == null) {
            return null;
        }

        Profile profile = user.getProfile();
        return UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(profile != null ? profile.getDisplayName() : null)
                .avatarUrl(getMaskedAvatarUrl(profile))
                .isVerified(Boolean.TRUE.equals(user.getIsVerified()))
                .build();
    }
}
