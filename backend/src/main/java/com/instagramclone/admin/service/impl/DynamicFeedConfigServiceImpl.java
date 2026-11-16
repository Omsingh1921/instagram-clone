package com.instagramclone.admin.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.dto.request.UpdateFeedConfigRequest;
import com.instagramclone.admin.dto.response.FeedConfigResponse;
import com.instagramclone.admin.entity.DynamicFeedConfig;
import com.instagramclone.admin.repository.DynamicFeedConfigRepository;
import com.instagramclone.admin.service.interfaces.IDynamicFeedConfigService;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DynamicFeedConfigServiceImpl
        extends AbstractDynamicConfigService<DynamicFeedConfig, UpdateFeedConfigRequest, FeedConfigResponse>
        implements IDynamicFeedConfigService {

    private static final String REDIS_KEY = "admin:config:feed";
    private final DynamicFeedConfigRepository repository;

    public DynamicFeedConfigServiceImpl(
            DynamicFeedConfigRepository repository,
            Optional<StringRedisTemplate> redisTemplate,
            ObjectMapper objectMapper,
            Optional<IAuditLogService> auditLogService) {
        super(redisTemplate, objectMapper, auditLogService);
        this.repository = repository;
    }

    @Override
    protected String getRedisKey() {
        return REDIS_KEY;
    }

    @Override
    protected Class<DynamicFeedConfig> getEntityClass() {
        return DynamicFeedConfig.class;
    }

    @Override
    protected String getAuditTargetType() {
        return "DYNAMIC_FEED";
    }

    @Override
    protected String getUpdateAuditAction() {
        return "UPDATE_FEED_CONFIG";
    }

    @Override
    protected String getResetAuditAction() {
        return "RESET_FEED_CONFIG";
    }

    @Override
    protected Optional<DynamicFeedConfig> findPrimaryConfig() {
        return repository.findFirstByOrderByCreatedAtAsc();
    }

    @Override
    protected Optional<DynamicFeedConfig> findConfigForRead() {
        return repository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
                .or(repository::findFirstByOrderByCreatedAtAsc);
    }

    @Override
    protected DynamicFeedConfig saveConfig(DynamicFeedConfig entity) {
        return repository.save(entity);
    }

    @Override
    protected DynamicFeedConfig newEmptyEntity() {
        return DynamicFeedConfig.builder().build();
    }

    @Override
    protected DynamicFeedConfig createDefaultEntity() {
        return DynamicFeedConfig.builder()
                .weightShare(4.0)
                .weightSave(3.0)
                .weightComment(2.5)
                .weightLike(1.0)
                .authorAffinityWeight(25.0)
                .topicAffinityWeight(20.0)
                .followingBonus(15.0)
                .recencyGravityDecay(0.8)
                .antiClusteringWindow(4)
                .postsPerReel(3)
                .seenPostPenaltyMultiplier(0.25)
                .suggestedCreatorsInterval(7)
                .allCaughtUpHoursThreshold(72)
                .isActive(true)
                .build();
    }

    @Override
    protected void applyUpdate(DynamicFeedConfig config, UpdateFeedConfigRequest request) {
        config.setWeightShare(request.getWeightShare());
        config.setWeightSave(request.getWeightSave());
        config.setWeightComment(request.getWeightComment());
        config.setWeightLike(request.getWeightLike());
        config.setAuthorAffinityWeight(request.getAuthorAffinityWeight());
        config.setTopicAffinityWeight(request.getTopicAffinityWeight());
        config.setFollowingBonus(request.getFollowingBonus());
        config.setRecencyGravityDecay(request.getRecencyGravityDecay());
        config.setAntiClusteringWindow(request.getAntiClusteringWindow());
        config.setPostsPerReel(request.getPostsPerReel());
        config.setSeenPostPenaltyMultiplier(request.getSeenPostPenaltyMultiplier());
        config.setSuggestedCreatorsInterval(request.getSuggestedCreatorsInterval());
        config.setAllCaughtUpHoursThreshold(request.getAllCaughtUpHoursThreshold());
    }

    @Override
    protected void applyDefaults(DynamicFeedConfig config) {
        config.setWeightShare(4.0);
        config.setWeightSave(3.0);
        config.setWeightComment(2.5);
        config.setWeightLike(1.0);
        config.setAuthorAffinityWeight(25.0);
        config.setTopicAffinityWeight(20.0);
        config.setFollowingBonus(15.0);
        config.setRecencyGravityDecay(0.8);
        config.setAntiClusteringWindow(4);
        config.setPostsPerReel(3);
        config.setSeenPostPenaltyMultiplier(0.25);
        config.setSuggestedCreatorsInterval(7);
        config.setAllCaughtUpHoursThreshold(72);
        config.setIsActive(true);
    }

    @Override
    protected String describeUpdateAudit(DynamicFeedConfig saved) {
        return "ShareWeight: " + saved.getWeightShare()
                + ", GravityDecay: " + saved.getRecencyGravityDecay();
    }

    @Override
    protected FeedConfigResponse toResponse(DynamicFeedConfig c) {
        return FeedConfigResponse.builder()
                .id(c.getId())
                .weightShare(c.getWeightShare())
                .weightSave(c.getWeightSave())
                .weightComment(c.getWeightComment())
                .weightLike(c.getWeightLike())
                .authorAffinityWeight(c.getAuthorAffinityWeight())
                .topicAffinityWeight(c.getTopicAffinityWeight())
                .followingBonus(c.getFollowingBonus())
                .recencyGravityDecay(c.getRecencyGravityDecay())
                .antiClusteringWindow(c.getAntiClusteringWindow())
                .postsPerReel(c.getPostsPerReel())
                .seenPostPenaltyMultiplier(c.getSeenPostPenaltyMultiplier())
                .suggestedCreatorsInterval(c.getSuggestedCreatorsInterval())
                .allCaughtUpHoursThreshold(c.getAllCaughtUpHoursThreshold())
                .isActive(c.getIsActive())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
