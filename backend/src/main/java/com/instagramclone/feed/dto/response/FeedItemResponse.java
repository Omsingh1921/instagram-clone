package com.instagramclone.feed.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.instagramclone.feed.enums.FeedItemType;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.post.dto.response.PostMediaResponse;
import com.instagramclone.post.dto.response.PostUserTagDto;
import com.instagramclone.post.enums.PostVisibility;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Industry-standard polymorphic timeline DTO.
 * Supports heterogeneous items (Posts, Reels, Suggested Creators, All Caught Up Notice) while maintaining
 * 100% field parity with frontend PostCard and ExploreGrid components.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedItemResponse {

    // Identity & Item Type
    private UUID id;
    private FeedItemType itemType;

    // Author
    private PostAuthorResponse author;
    private PostAuthorResponse collaborator;
    private String collabStatus;

    // Content
    private String caption;
    private String location;
    private PostVisibility visibility;

    @Builder.Default
    private List<PostMediaResponse> media = new ArrayList<>();

    @Builder.Default
    private List<PostUserTagDto> taggedUsers = new ArrayList<>();

    // Reel Specific Metadata (if itemType == REEL)
    private String videoUrl;
    private String thumbnailUrl;
    private String audioTrack;
    private Integer duration;

    // Engagement Metrics
    private long likeCount;
    private long commentCount;
    private long shareCount;
    private long viewCount;
    private Boolean likedByCurrentUser;
    private Boolean savedByCurrentUser;

    // Post Controls & Status
    private Boolean isPinned;
    private LocalDateTime pinnedAt;
    private Boolean commentsDisabled;
    private Boolean hideLikeCount;
    private Boolean isArchived;

    // Seen & Impression Tracking
    @Builder.Default
    private Boolean isSeen = false;

    // Suggested Accounts Carousel (if itemType == SUGGESTED_CREATOR)
    @Builder.Default
    private List<PostAuthorResponse> suggestedAccounts = new ArrayList<>();

    // Legacy Frontend Compatibility Helpers
    @JsonProperty("isReel")
    @Builder.Default
    private Boolean isReel = false;

    @JsonProperty("contentType")
    @Builder.Default
    private String contentType = "POST";

    // Algorithmic Recommendation Transparency
    private Double rankingScore;
    private String recommendationReason; // e.g. "Followed creator", "Suggested: #travel"

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public List<PostMediaResponse> getMediaList() {
        return media;
    }

    public void setMediaList(List<PostMediaResponse> mediaList) {
        this.media = mediaList;
    }
}
