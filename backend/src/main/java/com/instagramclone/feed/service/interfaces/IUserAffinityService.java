package com.instagramclone.feed.service.interfaces;

import com.instagramclone.feed.dto.response.UserAffinityProfile;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

/**
 * Service for tracking user content interactions, seen impressions, and computing affinity vectors.
 */
public interface IUserAffinityService {

    /**
     * Retrieves the viewer's current affinity profile (from Redis or fallback).
     */
    UserAffinityProfile getAffinityProfile(UUID viewerId);

    /**
     * Records a positive interaction (like, comment, save, share, view).
     */
    void recordInteraction(UUID viewerId, UUID authorId, UUID itemId, Collection<String> hashtags, String interactionType);

    /**
     * Records a negative feedback signal (e.g. not interested, hide, report).
     */
    void recordNegativeFeedback(UUID viewerId, UUID authorId, UUID itemId);

    /**
     * Records seen item IDs to track impressions and avoid feed fatigue.
     */
    void recordSeenItems(UUID viewerId, Collection<UUID> itemIds);

    /**
     * Retrieves recently seen item IDs within the impression retention window (12h).
     */
    Set<UUID> getSeenItemIds(UUID viewerId);

    /**
     * Evicts cached profile from Redis.
     */
    void evictAffinityProfile(UUID viewerId);
}

