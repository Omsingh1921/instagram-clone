package com.instagramclone.feed.service.interfaces;

import com.instagramclone.common.response.PageResponse;
import com.instagramclone.feed.dto.response.FeedItemResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Service defining operations for personalized Home Feed and Explore Feed.
 */
public interface IFeedService {

    /**
     * Backward-compatible getHomeFeed overload.
     */
    default PageResponse<FeedItemResponse> getHomeFeed(Pageable pageable) {
        return getHomeFeed("ALGORITHMIC", pageable);
    }

    /**
     * Retrieves personalized Home Feed with filtering mode (ALGORITHMIC, FOLLOWING, FAVORITES).
     */
    PageResponse<FeedItemResponse> getHomeFeed(String mode, Pageable pageable);

    /**
     * Retrieves personalized Explore Feed for discovery matching viewer interests.
     */
    PageResponse<FeedItemResponse> getExploreFeed(Pageable pageable);

    /**
     * Records viewed feed items to update impressions and prevent fatigue.
     */
    void recordSeen(UUID viewerId, List<UUID> itemIds);

    /**
     * Marks an item (Post or Reel) as 'Not Interested', persisting feedback and downranking author/topic.
     */
    void markNotInterested(UUID viewerId, UUID itemId, String itemType);
}
