package com.instagramclone.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedConfigResponse {

    private UUID id;
    private Double weightShare;
    private Double weightSave;
    private Double weightComment;
    private Double weightLike;
    private Double authorAffinityWeight;
    private Double topicAffinityWeight;
    private Double followingBonus;
    private Double recencyGravityDecay;
    private Integer antiClusteringWindow;
    private Integer postsPerReel;
    private Double seenPostPenaltyMultiplier;
    private Integer suggestedCreatorsInterval;
    private Integer allCaughtUpHoursThreshold;
    private Boolean isActive;
    private LocalDateTime updatedAt;
}

