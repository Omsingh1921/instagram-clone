package com.instagramclone.admin.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.dto.request.UpdateFeatureFlagRequest;
import com.instagramclone.admin.dto.response.FeatureFlagResponse;
import com.instagramclone.admin.entity.DynamicFeatureFlagConfig;
import com.instagramclone.admin.repository.DynamicFeatureFlagRepository;
import com.instagramclone.admin.service.interfaces.IDynamicFeatureFlagService;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DynamicFeatureFlagServiceImpl
        extends AbstractDynamicConfigService<DynamicFeatureFlagConfig, UpdateFeatureFlagRequest, FeatureFlagResponse>
        implements IDynamicFeatureFlagService {

    private static final String REDIS_KEY = "admin:config:features";
    private static final String DEFAULT_MAINTENANCE_MESSAGE =
            "Instagram is currently undergoing scheduled maintenance. Please check back shortly.";

    private final DynamicFeatureFlagRepository repository;

    public DynamicFeatureFlagServiceImpl(
            DynamicFeatureFlagRepository repository,
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
    protected Class<DynamicFeatureFlagConfig> getEntityClass() {
        return DynamicFeatureFlagConfig.class;
    }

    @Override
    protected String getAuditTargetType() {
        return "DYNAMIC_FEATURE_FLAGS";
    }

    @Override
    protected String getUpdateAuditAction() {
        return "UPDATE_FEATURE_FLAGS";
    }

    @Override
    protected String getResetAuditAction() {
        return "RESET_FEATURE_FLAGS";
    }

    @Override
    protected Optional<DynamicFeatureFlagConfig> findPrimaryConfig() {
        return repository.findFirstByOrderByCreatedAtAsc();
    }

    @Override
    protected DynamicFeatureFlagConfig saveConfig(DynamicFeatureFlagConfig entity) {
        return repository.save(entity);
    }

    @Override
    protected DynamicFeatureFlagConfig newEmptyEntity() {
        return DynamicFeatureFlagConfig.builder().build();
    }

    @Override
    protected DynamicFeatureFlagConfig createDefaultEntity() {
        return DynamicFeatureFlagConfig.builder()
                .reelsUploadEnabled(true)
                .storyCreationEnabled(true)
                .voiceMessagesEnabled(true)
                .maintenanceModeEnabled(false)
                .maintenanceMessage(DEFAULT_MAINTENANCE_MESSAGE)
                .build();
    }

    @Override
    protected void applyUpdate(DynamicFeatureFlagConfig config, UpdateFeatureFlagRequest request) {
        config.setReelsUploadEnabled(request.getReelsUploadEnabled());
        config.setStoryCreationEnabled(request.getStoryCreationEnabled());
        config.setVoiceMessagesEnabled(request.getVoiceMessagesEnabled());
        config.setMaintenanceModeEnabled(request.getMaintenanceModeEnabled());
        config.setMaintenanceMessage(request.getMaintenanceMessage());
    }

    @Override
    protected void applyDefaults(DynamicFeatureFlagConfig config) {
        config.setReelsUploadEnabled(true);
        config.setStoryCreationEnabled(true);
        config.setVoiceMessagesEnabled(true);
        config.setMaintenanceModeEnabled(false);
        config.setMaintenanceMessage(DEFAULT_MAINTENANCE_MESSAGE);
    }

    @Override
    protected String describeUpdateAudit(DynamicFeatureFlagConfig saved) {
        return "ReelsUpload: " + saved.getReelsUploadEnabled()
                + ", Maintenance: " + saved.getMaintenanceModeEnabled();
    }

    @Override
    protected FeatureFlagResponse toResponse(DynamicFeatureFlagConfig config) {
        return FeatureFlagResponse.builder()
                .id(config.getId())
                .reelsUploadEnabled(config.getReelsUploadEnabled())
                .storyCreationEnabled(config.getStoryCreationEnabled())
                .voiceMessagesEnabled(config.getVoiceMessagesEnabled())
                .maintenanceModeEnabled(config.getMaintenanceModeEnabled())
                .maintenanceMessage(config.getMaintenanceMessage())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
