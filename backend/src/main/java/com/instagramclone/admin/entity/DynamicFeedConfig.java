package com.instagramclone.admin.entity;

import com.instagramclone.common.entity.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "dynamic_feed_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DynamicFeedConfig extends BaseAuditableEntity {

    @Column(name = "weight_share", nullable = false)
    @Builder.Default
    private Double weightShare = 4.0;

    @Column(name = "weight_save", nullable = false)
    @Builder.Default
    private Double weightSave = 3.0;

    @Column(name = "weight_comment", nullable = false)
    @Builder.Default
    private Double weightComment = 2.5;

    @Column(name = "weight_like", nullable = false)
    @Builder.Default
    private Double weightLike = 1.0;

    @Column(name = "author_affinity_weight", nullable = false)
    @Builder.Default
    private Double authorAffinityWeight = 25.0;

    @Column(name = "topic_affinity_weight", nullable = false)
    @Builder.Default
    private Double topicAffinityWeight = 20.0;

    @Column(name = "following_bonus", nullable = false)
    @Builder.Default
    private Double followingBonus = 15.0;

    @Column(name = "recency_gravity_decay", nullable = false)
    @Builder.Default
    private Double recencyGravityDecay = 0.8;

    @Column(name = "anti_clustering_window", nullable = false)
    @Builder.Default
    private Integer antiClusteringWindow = 4;

    @Column(name = "posts_per_reel", nullable = false)
    @Builder.Default
    private Integer postsPerReel = 3;

    @Column(name = "seen_post_penalty_multiplier", nullable = false)
    @Builder.Default
    private Double seenPostPenaltyMultiplier = 0.25;

    @Column(name = "suggested_creators_interval", nullable = false)
    @Builder.Default
    private Integer suggestedCreatorsInterval = 7;

    @Column(name = "all_caught_up_hours_threshold", nullable = false)
    @Builder.Default
    private Integer allCaughtUpHoursThreshold = 72;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}

