package com.instagramclone.feed.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Industry-standard Feed Response DTO.
 * <p>
 * Represents an algorithmic timeline or explore feed unit.
 * Subclasses {@link FeedItemResponse} to adhere to industry naming conventions (Meta Graph API / X / TikTok timelines)
 * where each item in the feed stream can be referenced either as {@link FeedItemResponse} or {@link FeedResponse}.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class FeedResponse extends FeedItemResponse {

    public FeedResponse(FeedItemResponse item) {
        if (item != null) {
            this.setId(item.getId());
            this.setItemType(item.getItemType());
            this.setAuthor(item.getAuthor());
            this.setCollaborator(item.getCollaborator());
            this.setCollabStatus(item.getCollabStatus());
            this.setCaption(item.getCaption());
            this.setLocation(item.getLocation());
            this.setVisibility(item.getVisibility());
            this.setMedia(item.getMedia());
            this.setTaggedUsers(item.getTaggedUsers());
            this.setVideoUrl(item.getVideoUrl());
            this.setThumbnailUrl(item.getThumbnailUrl());
            this.setAudioTrack(item.getAudioTrack());
            this.setDuration(item.getDuration());
            this.setLikeCount(item.getLikeCount());
            this.setCommentCount(item.getCommentCount());
            this.setShareCount(item.getShareCount());
            this.setViewCount(item.getViewCount());
            this.setLikedByCurrentUser(item.getLikedByCurrentUser());
            this.setSavedByCurrentUser(item.getSavedByCurrentUser());
            this.setIsPinned(item.getIsPinned());
            this.setPinnedAt(item.getPinnedAt());
            this.setCommentsDisabled(item.getCommentsDisabled());
            this.setHideLikeCount(item.getHideLikeCount());
            this.setIsArchived(item.getIsArchived());
            this.setIsSeen(item.getIsSeen());
            this.setSuggestedAccounts(item.getSuggestedAccounts());
            this.setIsReel(item.getIsReel());
            this.setContentType(item.getContentType());
            this.setRankingScore(item.getRankingScore());
            this.setRecommendationReason(item.getRecommendationReason());
            this.setCreatedAt(item.getCreatedAt());
            this.setUpdatedAt(item.getUpdatedAt());
        }
    }

    public static FeedResponse from(FeedItemResponse item) {
        return new FeedResponse(item);
    }
}
