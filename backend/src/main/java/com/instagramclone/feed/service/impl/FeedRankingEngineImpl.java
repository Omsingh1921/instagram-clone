package com.instagramclone.feed.service.impl;

import com.instagramclone.admin.entity.DynamicFeedConfig;
import com.instagramclone.admin.service.interfaces.IDynamicFeedConfigService;
import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.dto.response.UserAffinityProfile;
import com.instagramclone.feed.service.interfaces.IFeedRankingEngine;
import com.instagramclone.reel.dto.response.ReelResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class FeedRankingEngineImpl implements IFeedRankingEngine {

    private final Optional<IDynamicFeedConfigService> dynamicFeedConfigService;

    public FeedRankingEngineImpl() {
        this.dynamicFeedConfigService = Optional.empty();
    }

    @Autowired
    public FeedRankingEngineImpl(@Autowired(required = false) IDynamicFeedConfigService dynamicFeedConfigService) {
        this.dynamicFeedConfigService = Optional.ofNullable(dynamicFeedConfigService);
    }

    private record ActiveRankingWeights(
            double weightShare,
            double weightSave,
            double weightComment,
            double weightLike,
            double authorWeight,
            double topicWeight,
            double followingBonusWeight,
            double recencyDecay,
            double seenPenaltyMultiplier
    ) {}

    private ActiveRankingWeights resolveActiveWeights() {
        double weightShare = FeedConstants.DEFAULT_WEIGHT_SHARE;
        double weightSave = FeedConstants.DEFAULT_WEIGHT_SAVE;
        double weightComment = FeedConstants.DEFAULT_WEIGHT_COMMENT;
        double weightLike = FeedConstants.DEFAULT_WEIGHT_LIKE;
        double authorWeight = FeedConstants.DEFAULT_WEIGHT_AUTHOR_AFFINITY;
        double topicWeight = FeedConstants.DEFAULT_WEIGHT_TOPIC_AFFINITY;
        double followingBonusWeight = FeedConstants.DEFAULT_WEIGHT_FOLLOWING_BONUS;
        double recencyDecay = FeedConstants.DEFAULT_RECENCY_GRAVITY;
        double seenPenaltyMultiplier = FeedConstants.DEFAULT_SEEN_PENALTY_MULTIPLIER;

        if (dynamicFeedConfigService.isPresent()) {
            try {
                DynamicFeedConfig cfg = dynamicFeedConfigService.get().getActiveConfig();
                if (cfg != null) {
                    if (cfg.getWeightShare() != null) weightShare = cfg.getWeightShare();
                    if (cfg.getWeightSave() != null) weightSave = cfg.getWeightSave();
                    if (cfg.getWeightComment() != null) weightComment = cfg.getWeightComment();
                    if (cfg.getWeightLike() != null) weightLike = cfg.getWeightLike();
                    if (cfg.getAuthorAffinityWeight() != null) authorWeight = cfg.getAuthorAffinityWeight();
                    if (cfg.getTopicAffinityWeight() != null) topicWeight = cfg.getTopicAffinityWeight();
                    if (cfg.getFollowingBonus() != null) followingBonusWeight = cfg.getFollowingBonus();
                    if (cfg.getRecencyGravityDecay() != null) recencyDecay = cfg.getRecencyGravityDecay();
                    if (cfg.getSeenPostPenaltyMultiplier() != null) seenPenaltyMultiplier = cfg.getSeenPostPenaltyMultiplier();
                }
            } catch (Exception ignored) {
            }
        }

        return new ActiveRankingWeights(
                weightShare, weightSave, weightComment, weightLike,
                authorWeight, topicWeight, followingBonusWeight, recencyDecay, seenPenaltyMultiplier
        );
    }

    @Override
    public List<FeedItemResponse> rankHomeFeed(
            UUID viewerId,
            List<FeedItemResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> followingIds,
            Set<UUID> seenItemIds
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        ActiveRankingWeights weights = resolveActiveWeights();
        List<FeedItemResponse> scoredList = new ArrayList<>(candidates.size());

        for (FeedItemResponse item : candidates) {
            boolean isSeen = seenItemIds != null && item.getId() != null && seenItemIds.contains(item.getId());
            item.setIsSeen(isSeen);

            double score = scoreItem(item, profile, followingIds, now, true, isSeen, weights);
            item.setRankingScore(score);

            if (item.getRecommendationReason() == null || item.getRecommendationReason().isBlank()) {
                item.setRecommendationReason(resolveRecommendationReason(item, profile, followingIds, isSeen));
            }
            scoredList.add(item);
        }

        scoredList.sort(Comparator.comparingDouble(FeedItemResponse::getRankingScore).reversed());
        return scoredList;
    }

    @Override
    public List<FeedItemResponse> rankExploreFeed(
            UUID viewerId,
            List<FeedItemResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> seenItemIds
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        ActiveRankingWeights weights = resolveActiveWeights();
        List<FeedItemResponse> scoredList = new ArrayList<>(candidates.size());

        for (FeedItemResponse item : candidates) {
            boolean isSeen = seenItemIds != null && item.getId() != null && seenItemIds.contains(item.getId());
            item.setIsSeen(isSeen);

            double score = scoreItem(item, profile, Collections.emptySet(), now, false, isSeen, weights);
            item.setRankingScore(score);

            if (item.getRecommendationReason() == null || item.getRecommendationReason().isBlank()) {
                item.setRecommendationReason(resolveExploreReason(item, profile, isSeen));
            }
            scoredList.add(item);
        }

        scoredList.sort(Comparator.comparingDouble(FeedItemResponse::getRankingScore).reversed());
        return scoredList;
    }

    @Override
    public List<ReelResponse> rankReelsFeed(
            UUID viewerId,
            List<ReelResponse> candidates,
            UserAffinityProfile profile,
            Set<UUID> followingIds,
            Set<UUID> seenReelIds,
            Long seed
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }

        LocalDateTime now = LocalDateTime.now();
        ActiveRankingWeights weights = resolveActiveWeights();
        List<Map.Entry<ReelResponse, Double>> scored = new ArrayList<>(candidates.size());

        for (ReelResponse reel : candidates) {
            boolean isSeen = seenReelIds != null && reel.getId() != null && seenReelIds.contains(reel.getId());
            double score = scoreReel(reel, profile, followingIds, now, isSeen, seed, weights);
            scored.add(new AbstractMap.SimpleEntry<>(reel, score));
        }

        scored.sort((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()));
        List<ReelResponse> sorted = scored.stream().map(Map.Entry::getKey).toList();
        return applyCreatorDiversityInterleaving(sorted);
    }

    private List<ReelResponse> applyCreatorDiversityInterleaving(List<ReelResponse> ranked) {
        if (ranked == null || ranked.size() <= 2) {
            return ranked;
        }

        List<ReelResponse> result = new ArrayList<>(ranked.size());
        List<ReelResponse> remaining = new LinkedList<>(ranked);

        while (!remaining.isEmpty()) {
            UUID lastAuthorId = result.isEmpty() || result.get(result.size() - 1).getAuthor() == null
                    ? null
                    : result.get(result.size() - 1).getAuthor().getId();

            Iterator<ReelResponse> it = remaining.iterator();
            ReelResponse chosen = null;
            while (it.hasNext()) {
                ReelResponse candidate = it.next();
                UUID candidateAuthorId = candidate.getAuthor() != null ? candidate.getAuthor().getId() : null;
                if (lastAuthorId == null || candidateAuthorId == null || !candidateAuthorId.equals(lastAuthorId)) {
                    chosen = candidate;
                    it.remove();
                    break;
                }
            }

            if (chosen == null) {
                chosen = remaining.remove(0);
            }
            result.add(chosen);
        }

        return result;
    }

    private double scoreItem(
            FeedItemResponse item,
            UserAffinityProfile profile,
            Set<UUID> followingIds,
            LocalDateTime now,
            boolean isHomeFeed,
            boolean isSeen,
            ActiveRankingWeights weights
    ) {
        UUID authorId = (item.getAuthor() != null) ? item.getAuthor().getId() : null;

        // 1. Author Affinity Signal
        double authorAffinity = (profile != null && authorId != null)
                ? profile.getAffinityWithCreator(authorId)
                : 0.0;
        double authorScore = Math.min(weights.authorWeight() * FeedConstants.AUTHOR_AFFINITY_CAP_MULTIPLIER,
                authorAffinity * FeedConstants.AUTHOR_AFFINITY_SCALE);

        // 2. Following Relationship Bonus
        double followBonus = 0.0;
        if (followingIds != null && authorId != null && followingIds.contains(authorId)) {
            followBonus = weights.followingBonusWeight();
        }

        // 3. Topic & Hashtag Affinity Signal
        Set<String> tags = FeedInteractionEventListener.extractHashtags(item.getCaption());
        double topicScore = 0.0;
        if (profile != null && !tags.isEmpty()) {
            for (String tag : tags) {
                topicScore += profile.getAffinityWithHashtag(tag);
            }
            topicScore = Math.min(weights.topicWeight() * FeedConstants.TOPIC_AFFINITY_CAP_MULTIPLIER,
                    topicScore * FeedConstants.TOPIC_AFFINITY_SCALE);
        }

        // 4. Engagement Velocity & Quality Signal
        boolean isSaved = Boolean.TRUE.equals(item.getSavedByCurrentUser());
        double rawEngagement = (item.getLikeCount() * weights.weightLike())
                + (item.getCommentCount() * weights.weightComment())
                + (item.getShareCount() * weights.weightShare())
                + (isSaved ? FeedConstants.BOOST_SAVED_POST : 0.0) * weights.weightSave();

        double logMultiplier = isHomeFeed ? FeedConstants.LOG_SCALE_HOME : FeedConstants.LOG_SCALE_EXPLORE;
        double engagementScore = Math.log1p(Math.max(0.0, rawEngagement)) * logMultiplier;

        // 5. Special Boosts
        double pinBoost = Boolean.TRUE.equals(item.getIsPinned()) ? FeedConstants.BOOST_PINNED_POST : 0.0;

        double baseScore = authorScore + followBonus + topicScore + engagementScore + pinBoost;

        // 6. Seen State Soft Dampening
        if (isSeen) {
            baseScore = baseScore * weights.seenPenaltyMultiplier();
        }

        // 7. Gravity Time-Decay
        LocalDateTime createdAt = item.getCreatedAt() != null ? item.getCreatedAt() : now;
        long hoursOld = Math.max(0, Duration.between(createdAt, now).toHours());
        double decayFactor = Math.pow(FeedConstants.TIME_DECAY_BASE + hoursOld, weights.recencyDecay());

        return (baseScore + FeedConstants.RANKING_SCORE_EPSILON) / Math.max(FeedConstants.MIN_DECAY_FACTOR, decayFactor);
    }

    private double scoreReel(
            ReelResponse reel,
            UserAffinityProfile profile,
            Set<UUID> followingIds,
            LocalDateTime now,
            boolean isSeen,
            Long seed,
            ActiveRankingWeights weights
    ) {
        UUID authorId = (reel.getAuthor() != null) ? reel.getAuthor().getId() : null;

        double authorAffinity = (profile != null && authorId != null)
                ? profile.getAffinityWithCreator(authorId)
                : 0.0;
        double authorScore = Math.min(weights.authorWeight() * FeedConstants.AUTHOR_AFFINITY_CAP_MULTIPLIER,
                authorAffinity * FeedConstants.AUTHOR_AFFINITY_SCALE);

        double followBonus = (followingIds != null && authorId != null && followingIds.contains(authorId))
                ? weights.followingBonusWeight()
                : 0.0;

        Set<String> tags = FeedInteractionEventListener.extractHashtags(reel.getCaption());
        double topicScore = 0.0;
        if (profile != null && !tags.isEmpty()) {
            for (String tag : tags) {
                topicScore += profile.getAffinityWithHashtag(tag);
            }
            topicScore = Math.min(weights.topicWeight() * FeedConstants.TOPIC_AFFINITY_CAP_MULTIPLIER,
                    topicScore * FeedConstants.TOPIC_AFFINITY_SCALE);
        }

        double rawEngagement = (reel.getLikeCount() * weights.weightLike())
                + (reel.getCommentCount() * weights.weightComment())
                + (reel.getShareCount() * weights.weightShare())
                + (reel.getViewCount() * FeedConstants.BOOST_REEL_VIEW);

        double engagementScore = Math.log1p(Math.max(0.0, rawEngagement)) * FeedConstants.LOG_SCALE_REELS;

        double baseScore = authorScore + followBonus + topicScore + engagementScore;

        if (isSeen) {
            baseScore = baseScore * weights.seenPenaltyMultiplier();
        }

        if (seed != null && reel.getId() != null) {
            double seedJitter = ((Math.abs(Objects.hash(reel.getId(), seed)) % 1000) / 1000.0) * FeedConstants.REELS_EXPLORATION_JITTER_WEIGHT;
            baseScore += seedJitter;
        }

        LocalDateTime createdAt = reel.getCreatedAt() != null ? reel.getCreatedAt() : now;
        long hoursOld = Math.max(0, Duration.between(createdAt, now).toHours());
        double decayFactor = Math.pow(FeedConstants.TIME_DECAY_BASE + hoursOld, weights.recencyDecay());

        return (baseScore + FeedConstants.RANKING_SCORE_EPSILON) / Math.max(FeedConstants.MIN_DECAY_FACTOR, decayFactor);
    }

    private String resolveRecommendationReason(FeedItemResponse item, UserAffinityProfile profile, Set<UUID> followingIds, boolean isSeen) {
        if (isSeen) {
            return FeedConstants.REASON_PREVIOUSLY_VIEWED;
        }

        UUID authorId = (item.getAuthor() != null) ? item.getAuthor().getId() : null;
        if (followingIds != null && authorId != null && followingIds.contains(authorId)) {
            return FeedConstants.REASON_FOLLOWED_CREATOR;
        }

        Set<String> tags = FeedInteractionEventListener.extractHashtags(item.getCaption());
        if (profile != null && !tags.isEmpty()) {
            for (String tag : tags) {
                if (profile.getAffinityWithHashtag(tag) > FeedConstants.THRESHOLD_HASHTAG_AFFINITY_HIGH) {
                    return FeedConstants.REASON_SUGGESTED_PREFIX + "#" + tag;
                }
            }
        }

        if (item.getLikeCount() > FeedConstants.THRESHOLD_POPULAR_LIKES || item.getShareCount() > FeedConstants.THRESHOLD_POPULAR_SHARES) {
            return FeedConstants.REASON_POPULAR_NETWORK;
        }
        return FeedConstants.REASON_SUGGESTED_FOR_YOU;
    }

    private String resolveExploreReason(FeedItemResponse item, UserAffinityProfile profile, boolean isSeen) {
        if (isSeen) {
            return FeedConstants.REASON_PREVIOUSLY_VIEWED;
        }
        Set<String> tags = FeedInteractionEventListener.extractHashtags(item.getCaption());
        if (profile != null && !tags.isEmpty()) {
            for (String tag : tags) {
                if (profile.getAffinityWithHashtag(tag) > FeedConstants.THRESHOLD_HASHTAG_AFFINITY_MEDIUM) {
                    return FeedConstants.REASON_EXPLORE_PREFIX + "#" + tag;
                }
            }
        }
        return FeedConstants.REASON_POPULAR_EXPLORE;
    }
}

