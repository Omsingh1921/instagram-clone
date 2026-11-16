package com.instagramclone.feed.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.*;

/**
 * In-memory / Redis representation of a user's content interest vector and creator affinity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAffinityProfile implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID viewerId;

    /**
     * Map of Creator UUID -> Affinity Score (higher means stronger interaction history).
     */
    @Builder.Default
    private Map<UUID, Double> creatorAffinity = new HashMap<>();

    /**
     * Map of Lowercase Hashtag -> Interest Weight (accumulated through likes, saves, comments).
     */
    @Builder.Default
    private Map<String, Double> hashtagAffinity = new HashMap<>();

    /**
     * Recent post/reel IDs interacted with (used to avoid immediate duplicates / fatigue).
     */
    @Builder.Default
    private Set<UUID> recentInteractedItemIds = new HashSet<>();

    /**
     * Ratio of video/reel engagements compared to overall engagements (0.0 to 1.0).
     */
    @Builder.Default
    private double reelPreferenceRatio = 0.5;

    @Builder.Default
    private Long lastUpdatedAt = System.currentTimeMillis();

    @com.fasterxml.jackson.annotation.JsonIgnore
    public Instant getLastUpdatedAtInstant() {
        return lastUpdatedAt != null ? Instant.ofEpochMilli(lastUpdatedAt) : Instant.now();
    }

    public double getAffinityWithCreator(UUID creatorId) {
        if (creatorId == null || creatorAffinity == null) {
            return 0.0;
        }
        return creatorAffinity.getOrDefault(creatorId, 0.0);
    }

    public double getAffinityWithHashtag(String tag) {
        if (tag == null || hashtagAffinity == null) {
            return 0.0;
        }
        String clean = tag.replace("#", "").toLowerCase().trim();
        return hashtagAffinity.getOrDefault(clean, 0.0);
    }
}

