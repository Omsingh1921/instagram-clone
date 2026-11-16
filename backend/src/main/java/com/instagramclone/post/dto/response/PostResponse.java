package com.instagramclone.post.dto.response;

import com.instagramclone.post.enums.PostVisibility;
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
public class PostResponse {

    private UUID id;
    private PostAuthorResponse author;
    private PostAuthorResponse collaborator;
    private String collabStatus;
    private String caption;
    private String location;
    private Boolean commentsDisabled;
    private Boolean hideLikeCount;
    private Boolean isPinned;
    private LocalDateTime pinnedAt;
    private Boolean isArchived;
    private LocalDateTime archivedAt;
    private Long daysRemainingUntilPermanentDelete;
    private PostVisibility visibility;

    @Builder.Default
    private List<PostMediaResponse> media = new ArrayList<>();

    @Builder.Default
    private List<PostUserTagDto> taggedUsers = new ArrayList<>();

    private long likeCount;
    private long commentCount;
    private long shareCount;
    private Boolean likedByCurrentUser;
    private Boolean savedByCurrentUser;
    @com.fasterxml.jackson.annotation.JsonProperty("isReel")
    @Builder.Default
    private Boolean isReel = false;

    @com.fasterxml.jackson.annotation.JsonProperty("contentType")
    @Builder.Default
    private String contentType = "POST";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
