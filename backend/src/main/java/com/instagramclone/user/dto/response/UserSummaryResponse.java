package com.instagramclone.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserSummaryResponse {

    private UUID id;
    private String username;
    private String displayName;
    private String avatarUrl;

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Boolean hasActiveStories = false;

    @Builder.Default
    private Boolean hasUnseenStories = false;

    @Builder.Default
    private Boolean hasCloseFriendsStories = false;
}
