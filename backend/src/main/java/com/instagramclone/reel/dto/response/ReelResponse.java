package com.instagramclone.reel.dto.response;

import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.reel.enums.ReelStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReelResponse {

    private UUID id;
    private PostAuthorResponse author;
    private String videoUrl;
    private String thumbnailUrl;
    private String caption;
    private ReelStatus status;
    private Long durationMs;
    private String audioTitle;
    private String audioArtist;
    private long likeCount;
    private long commentCount;
    private long viewCount;
    private long shareCount;
    private boolean likedByCurrentUser;
    private boolean savedByCurrentUser;
    private String location;
    @com.fasterxml.jackson.annotation.JsonProperty("isPinned")
    private boolean isPinned;
    private boolean hideLikeCount;
    private boolean commentsDisabled;
    @com.fasterxml.jackson.annotation.JsonProperty("isArchived")
    private boolean isArchived;
    private LocalDateTime archivedAt;
    private Long daysRemainingUntilPermanentDelete;
    private UUID remixReelId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
