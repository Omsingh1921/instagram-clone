package com.instagramclone.admin.dto.request;

import com.instagramclone.admin.constants.AdminConstants;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFeedConfigRequest {

    @NotNull(message = AdminConstants.VALIDATION_FEED_SHARE_WEIGHT_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_WEIGHT_MIN, message = AdminConstants.VALIDATION_FEED_SHARE_WEIGHT_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_WEIGHT_MAX, message = AdminConstants.VALIDATION_FEED_SHARE_WEIGHT_MAX_MESSAGE)
    private Double weightShare;

    @NotNull(message = AdminConstants.VALIDATION_FEED_SAVE_WEIGHT_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_WEIGHT_MIN, message = AdminConstants.VALIDATION_FEED_SAVE_WEIGHT_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_WEIGHT_MAX, message = AdminConstants.VALIDATION_FEED_SAVE_WEIGHT_MAX_MESSAGE)
    private Double weightSave;

    @NotNull(message = AdminConstants.VALIDATION_FEED_COMMENT_WEIGHT_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_WEIGHT_MIN, message = AdminConstants.VALIDATION_FEED_COMMENT_WEIGHT_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_WEIGHT_MAX, message = AdminConstants.VALIDATION_FEED_COMMENT_WEIGHT_MAX_MESSAGE)
    private Double weightComment;

    @NotNull(message = AdminConstants.VALIDATION_FEED_LIKE_WEIGHT_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_WEIGHT_MIN, message = AdminConstants.VALIDATION_FEED_LIKE_WEIGHT_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_WEIGHT_MAX, message = AdminConstants.VALIDATION_FEED_LIKE_WEIGHT_MAX_MESSAGE)
    private Double weightLike;

    @NotNull(message = AdminConstants.VALIDATION_FEED_AUTHOR_AFFINITY_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_AFFINITY_WEIGHT_MIN, message = AdminConstants.VALIDATION_FEED_AUTHOR_AFFINITY_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_AFFINITY_WEIGHT_MAX, message = AdminConstants.VALIDATION_FEED_AUTHOR_AFFINITY_MAX_MESSAGE)
    private Double authorAffinityWeight;

    @NotNull(message = AdminConstants.VALIDATION_FEED_TOPIC_AFFINITY_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_AFFINITY_WEIGHT_MIN, message = AdminConstants.VALIDATION_FEED_TOPIC_AFFINITY_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_AFFINITY_WEIGHT_MAX, message = AdminConstants.VALIDATION_FEED_TOPIC_AFFINITY_MAX_MESSAGE)
    private Double topicAffinityWeight;

    @NotNull(message = AdminConstants.VALIDATION_FEED_FOLLOWING_BONUS_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_FOLLOWING_BONUS_MIN, message = AdminConstants.VALIDATION_FEED_FOLLOWING_BONUS_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_FOLLOWING_BONUS_MAX, message = AdminConstants.VALIDATION_FEED_FOLLOWING_BONUS_MAX_MESSAGE)
    private Double followingBonus;

    @NotNull(message = AdminConstants.VALIDATION_FEED_RECENCY_DECAY_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_RECENCY_DECAY_MIN, message = AdminConstants.VALIDATION_FEED_RECENCY_DECAY_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_RECENCY_DECAY_MAX, message = AdminConstants.VALIDATION_FEED_RECENCY_DECAY_MAX_MESSAGE)
    private Double recencyGravityDecay;

    @NotNull(message = AdminConstants.VALIDATION_FEED_ANTI_CLUSTERING_REQUIRED)
    @Min(value = AdminConstants.FEED_ANTI_CLUSTERING_WINDOW_MIN, message = AdminConstants.VALIDATION_FEED_ANTI_CLUSTERING_MIN_MESSAGE)
    @Max(value = AdminConstants.FEED_ANTI_CLUSTERING_WINDOW_MAX, message = AdminConstants.VALIDATION_FEED_ANTI_CLUSTERING_MAX_MESSAGE)
    private Integer antiClusteringWindow;

    @NotNull(message = AdminConstants.VALIDATION_FEED_POSTS_PER_REEL_REQUIRED)
    @Min(value = AdminConstants.FEED_POSTS_PER_REEL_MIN, message = AdminConstants.VALIDATION_FEED_POSTS_PER_REEL_MIN_MESSAGE)
    @Max(value = AdminConstants.FEED_POSTS_PER_REEL_MAX, message = AdminConstants.VALIDATION_FEED_POSTS_PER_REEL_MAX_MESSAGE)
    private Integer postsPerReel;

    @NotNull(message = AdminConstants.VALIDATION_FEED_SEEN_PENALTY_REQUIRED)
    @DecimalMin(value = AdminConstants.FEED_SEEN_PENALTY_MIN, message = AdminConstants.VALIDATION_FEED_SEEN_PENALTY_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.FEED_SEEN_PENALTY_MAX, message = AdminConstants.VALIDATION_FEED_SEEN_PENALTY_MAX_MESSAGE)
    private Double seenPostPenaltyMultiplier;

    @NotNull(message = AdminConstants.VALIDATION_FEED_SUGGESTED_INTERVAL_REQUIRED)
    @Min(value = AdminConstants.FEED_SUGGESTED_INTERVAL_MIN, message = AdminConstants.VALIDATION_FEED_SUGGESTED_INTERVAL_MIN_MESSAGE)
    @Max(value = AdminConstants.FEED_SUGGESTED_INTERVAL_MAX, message = AdminConstants.VALIDATION_FEED_SUGGESTED_INTERVAL_MAX_MESSAGE)
    private Integer suggestedCreatorsInterval;

    @NotNull(message = AdminConstants.VALIDATION_FEED_ALL_CAUGHT_UP_REQUIRED)
    @Min(value = AdminConstants.FEED_ALL_CAUGHT_UP_HOURS_MIN, message = AdminConstants.VALIDATION_FEED_ALL_CAUGHT_UP_MIN_MESSAGE)
    @Max(value = AdminConstants.FEED_ALL_CAUGHT_UP_HOURS_MAX, message = AdminConstants.VALIDATION_FEED_ALL_CAUGHT_UP_MAX_MESSAGE)
    private Integer allCaughtUpHoursThreshold;
}

