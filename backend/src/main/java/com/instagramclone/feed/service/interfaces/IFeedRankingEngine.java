package com.instagramclone.feed.service.interfaces;

import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.dto.response.UserAffinityProfile;
import com.instagramclone.reel.dto.response.ReelResponse;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Contract for multi-factor algorithmic feed ranking (Home Feed, Explore, Reels).
 */
public interface IFeedRankingEngine {

    /**
     * Backward-compatible home feed ranking overload without seen items.
     */
    default List<FeedItemResponse> rankHomeFeed(
            UUID viewerId,
            List<FeedItemResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> followingIds
    ) {
        return rankHomeFeed(viewerId, candidates, profile, followingIds, Collections.emptySet());
    }

    /**
     * Scores and orders home feed candidate items using viewer affinity, recency decay, velocity, and seen dampening.
     */
    List<FeedItemResponse> rankHomeFeed(
            UUID viewerId,
            List<FeedItemResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> followingIds,
            Set<UUID> seenItemIds
    );

    /**
     * Backward-compatible explore feed ranking overload without seen items.
     */
    default List<FeedItemResponse> rankExploreFeed(
            UUID viewerId,
            List<FeedItemResponse> candidates,
            UserAffinityProfile profile
    ) {
        return rankExploreFeed(viewerId, candidates, profile, Collections.emptySet());
    }

    /**
     * Scores and orders explore candidates prioritizing topic relevance and discovery velocity.
     */
    List<FeedItemResponse> rankExploreFeed(
            UUID viewerId,
            List<FeedItemResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> seenItemIds
    );

    /**
     * Backward-compatible vertical video reels ranking overload without seen items or session seed.
     */
    default List<ReelResponse> rankReelsFeed(
            UUID viewerId,
            List<ReelResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> followingIds
    ) {
        return rankReelsFeed(viewerId, candidates, profile, followingIds, Collections.emptySet(), null);
    }

    /**
     * Scores, jitters with session seed entropy, and orders vertical video reels based on viewer topic affinity,
     * following bonus, engagement velocity, seen dampening, and creator diversity interleaving.
     */
    List<ReelResponse> rankReelsFeed(
            UUID viewerId,
            List<ReelResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> followingIds,
            Set<UUID> seenReelIds,
            Long seed
    );
}

