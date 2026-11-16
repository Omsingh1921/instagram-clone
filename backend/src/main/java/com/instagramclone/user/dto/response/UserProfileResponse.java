package com.instagramclone.user.dto.response;

import com.instagramclone.story.dto.response.StoryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private UUID userId;
    private String username;
    private String email;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String websiteUrl;
    @Builder.Default
    private Long postCount = 0L;
    @Builder.Default
    private Long followerCount = 0L;
    @Builder.Default
    private Long followingCount = 0L;
    private Boolean followedByCurrentUser;
    @Builder.Default
    private Boolean isPrivate = false;
    private Boolean followRequestedByCurrentUser;
    private Boolean followsCurrentUser;
    private LocalDateTime createdAt;

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private String accountType = "PERSONAL";
    private String role;
    private String category;
    private String pronouns;
    private String gender;

    @Builder.Default
    private Boolean showCategoryBadge = true;
    private String contactEmail;
    private String contactPhone;

    @Builder.Default
    private Boolean showContactInfo = false;

    private String previousUsername;
    private LocalDateTime usernameLastChangedAt;
    private Boolean canChangeUsername;
    private LocalDateTime previousUsernameLockedUntil;

    @Builder.Default
    private List<StoryResponse> stories = new ArrayList<>();

    @Builder.Default
    private Boolean hasStory = false;

    @Builder.Default
    private Boolean hasUnseenStory = false;

    @Builder.Default
    private Boolean hasCloseFriendsStory = false;
}
