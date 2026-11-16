package com.instagramclone.feed.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.feed.dto.response.UserAffinityProfile;
import com.instagramclone.feed.service.interfaces.IUserAffinityService;
import com.instagramclone.utility.RedisUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserAffinityServiceImpl implements IUserAffinityService {

    private static final Logger log = LoggerFactory.getLogger(UserAffinityServiceImpl.class);

    private final RedisUtility redisUtility;
    private final ObjectMapper objectMapper;

    // Resilient in-memory fallback cache if Redis is temporarily offline
    private final Map<UUID, UserAffinityProfile> inMemoryFallbackCache = new ConcurrentHashMap<>();
    private final Map<UUID, Set<UUID>> inMemorySeenCache = new ConcurrentHashMap<>();

    public UserAffinityServiceImpl(RedisUtility redisUtility, ObjectMapper objectMapper) {
        this.redisUtility = redisUtility;
        this.objectMapper = objectMapper;
    }

    @Override
    public UserAffinityProfile getAffinityProfile(UUID viewerId) {
        if (viewerId == null) {
            return UserAffinityProfile.builder().build();
        }

        String key = FeedConstants.CACHE_AFFINITY_PREFIX + viewerId;
        Optional<String> cachedJson = redisUtility.get(key);
        if (cachedJson.isPresent()) {
            try {
                return objectMapper.readValue(cachedJson.get(), UserAffinityProfile.class);
            } catch (Exception ex) {
                log.warn("[AFFINITY] Deserialization error for user {}: {}", viewerId, ex.getMessage());
            }
        }

        return inMemoryFallbackCache.computeIfAbsent(viewerId, id ->
                UserAffinityProfile.builder()
                        .viewerId(id)
                        .lastUpdatedAt(System.currentTimeMillis())
                        .build()
        );
    }

    @Override
    public void recordInteraction(UUID viewerId, UUID authorId, UUID itemId, Collection<String> hashtags, String interactionType) {
        if (viewerId == null) {
            return;
        }

        UserAffinityProfile profile = getAffinityProfile(viewerId);
        profile.setViewerId(viewerId);
        profile.setLastUpdatedAt(System.currentTimeMillis());

        double creatorWeight = resolveCreatorWeight(interactionType);
        double hashtagWeight = resolveHashtagWeight(interactionType);

        // 1. Update Creator Affinity
        if (authorId != null && !authorId.equals(viewerId)) {
            double currentScore = profile.getCreatorAffinity().getOrDefault(authorId, 0.0);
            double updatedScore = Math.min(FeedConstants.MAX_CREATOR_AFFINITY, currentScore + creatorWeight);
            profile.getCreatorAffinity().put(authorId, updatedScore);
        }

        // 2. Update Hashtag / Topic Affinities
        if (hashtags != null && !hashtags.isEmpty()) {
            for (String tag : hashtags) {
                if (tag == null || tag.isBlank()) continue;
                String clean = tag.replace("#", "").toLowerCase().trim();
                double currentTagScore = profile.getHashtagAffinity().getOrDefault(clean, 0.0);
                double updatedTagScore = Math.min(FeedConstants.MAX_HASHTAG_AFFINITY, currentTagScore + hashtagWeight);
                profile.getHashtagAffinity().put(clean, updatedTagScore);
            }
        }

        // 3. Track Recent Interacted Item to avoid fatigue
        if (itemId != null) {
            profile.getRecentInteractedItemIds().add(itemId);
            if (profile.getRecentInteractedItemIds().size() > FeedConstants.MAX_RECENT_INTERACTED_ITEMS) {
                // Keep only newest items up to threshold
                Iterator<UUID> it = profile.getRecentInteractedItemIds().iterator();
                if (it.hasNext()) {
                    it.next();
                    it.remove();
                }
            }
        }

        // 4. Update Video Preference Ratio if it's a Reel event
        if (interactionType != null && interactionType.toUpperCase().contains(FeedConstants.ITEM_TYPE_REEL)) {
            profile.setReelPreferenceRatio(Math.min(FeedConstants.MAX_REEL_PREFERENCE_RATIO, profile.getReelPreferenceRatio() + FeedConstants.REEL_PREFERENCE_INCREMENT));
        } else if (interactionType != null && interactionType.toUpperCase().contains(FeedConstants.ITEM_TYPE_POST)) {
            profile.setReelPreferenceRatio(Math.max(FeedConstants.MIN_REEL_PREFERENCE_RATIO, profile.getReelPreferenceRatio() - FeedConstants.REEL_PREFERENCE_DECREMENT));
        }

        persistProfile(profile);
    }

    @Override
    public void recordNegativeFeedback(UUID viewerId, UUID authorId, UUID itemId) {
        if (viewerId == null) return;

        UserAffinityProfile profile = getAffinityProfile(viewerId);
        if (authorId != null) {
            double current = profile.getCreatorAffinity().getOrDefault(authorId, 0.0);
            profile.getCreatorAffinity().put(authorId, Math.max(FeedConstants.MIN_NEGATIVE_AFFINITY_FLOOR, current - FeedConstants.PENALTY_NOT_INTERESTED));
        }
        if (itemId != null) {
            profile.getRecentInteractedItemIds().add(itemId);
        }
        persistProfile(profile);
    }

    @Override
    public void recordSeenItems(UUID viewerId, Collection<UUID> itemIds) {
        if (viewerId == null || itemIds == null || itemIds.isEmpty()) {
            return;
        }

        Set<UUID> seenSet = inMemorySeenCache.computeIfAbsent(viewerId, k -> ConcurrentHashMap.newKeySet());
        seenSet.addAll(itemIds);

        // Limit size
        if (seenSet.size() > FeedConstants.MAX_SEEN_CACHE_SIZE) {
            Iterator<UUID> it = seenSet.iterator();
            while (it.hasNext() && seenSet.size() > FeedConstants.MAX_SEEN_CACHE_SIZE) {
                it.next();
                it.remove();
            }
        }

        // Persist to Redis
        try {
            String json = objectMapper.writeValueAsString(seenSet);
            redisUtility.set(FeedConstants.CACHE_SEEN_PREFIX + viewerId, json, Duration.ofHours(FeedConstants.SEEN_CACHE_TTL_HOURS));
        } catch (Exception ex) {
            log.warn("[SEEN] Failed to cache seen items in Redis for user {}: {}", viewerId, ex.getMessage());
        }
    }

    @Override
    public Set<UUID> getSeenItemIds(UUID viewerId) {
        if (viewerId == null) {
            return Collections.emptySet();
        }

        String key = FeedConstants.CACHE_SEEN_PREFIX + viewerId;
        Optional<String> cachedJson = redisUtility.get(key);
        if (cachedJson.isPresent()) {
            try {
                Set<UUID> fromRedis = objectMapper.readValue(cachedJson.get(), new TypeReference<Set<UUID>>() {});
                inMemorySeenCache.put(viewerId, fromRedis);
                return fromRedis;
            } catch (Exception ex) {
                log.warn("[SEEN] Failed to deserialize seen items for user {}: {}", viewerId, ex.getMessage());
            }
        }

        return inMemorySeenCache.getOrDefault(viewerId, Collections.emptySet());
    }

    @Override
    public void evictAffinityProfile(UUID viewerId) {
        if (viewerId == null) return;
        redisUtility.delete(FeedConstants.CACHE_AFFINITY_PREFIX + viewerId);
        redisUtility.delete(FeedConstants.CACHE_SEEN_PREFIX + viewerId);
        inMemoryFallbackCache.remove(viewerId);
        inMemorySeenCache.remove(viewerId);
    }

    private void persistProfile(UserAffinityProfile profile) {
        UUID viewerId = profile.getViewerId();
        inMemoryFallbackCache.put(viewerId, profile);

        try {
            String json = objectMapper.writeValueAsString(profile);
            redisUtility.set(FeedConstants.CACHE_AFFINITY_PREFIX + viewerId, json, Duration.ofHours(FeedConstants.AFFINITY_CACHE_TTL_HOURS));
        } catch (Exception ex) {
            log.warn("[AFFINITY] Failed to cache profile in Redis for user {}: {}", viewerId, ex.getMessage());
        }
    }

    private double resolveCreatorWeight(String type) {
        if (type == null) return FeedConstants.AFFINITY_CREATOR_WEIGHT_LIKE;
        return switch (type.toUpperCase()) {
            case FeedConstants.EVENT_POST_SHARED, FeedConstants.EVENT_REEL_SHARED -> FeedConstants.AFFINITY_CREATOR_WEIGHT_SHARE;
            case FeedConstants.EVENT_POST_SAVED, FeedConstants.EVENT_REEL_SAVED -> FeedConstants.AFFINITY_CREATOR_WEIGHT_SAVE;
            case FeedConstants.EVENT_POST_COMMENTED, FeedConstants.EVENT_REEL_COMMENTED -> FeedConstants.AFFINITY_CREATOR_WEIGHT_COMMENT;
            case FeedConstants.EVENT_POST_LIKED, FeedConstants.EVENT_REEL_LIKED -> FeedConstants.AFFINITY_CREATOR_WEIGHT_LIKE;
            case FeedConstants.EVENT_REEL_VIEWED -> FeedConstants.AFFINITY_CREATOR_WEIGHT_VIEW;
            default -> FeedConstants.AFFINITY_CREATOR_WEIGHT_LIKE;
        };
    }

    private double resolveHashtagWeight(String type) {
        if (type == null) return FeedConstants.AFFINITY_HASHTAG_WEIGHT_LIKE;
        return switch (type.toUpperCase()) {
            case FeedConstants.EVENT_POST_SHARED, FeedConstants.EVENT_REEL_SHARED -> FeedConstants.AFFINITY_HASHTAG_WEIGHT_SHARE;
            case FeedConstants.EVENT_POST_SAVED, FeedConstants.EVENT_REEL_SAVED -> FeedConstants.AFFINITY_HASHTAG_WEIGHT_SAVE;
            case FeedConstants.EVENT_POST_COMMENTED, FeedConstants.EVENT_REEL_COMMENTED -> FeedConstants.AFFINITY_HASHTAG_WEIGHT_COMMENT;
            case FeedConstants.EVENT_POST_LIKED, FeedConstants.EVENT_REEL_LIKED -> FeedConstants.AFFINITY_HASHTAG_WEIGHT_LIKE;
            case FeedConstants.EVENT_REEL_VIEWED -> FeedConstants.AFFINITY_HASHTAG_WEIGHT_VIEW;
            default -> FeedConstants.AFFINITY_HASHTAG_WEIGHT_LIKE;
        };
    }
}

