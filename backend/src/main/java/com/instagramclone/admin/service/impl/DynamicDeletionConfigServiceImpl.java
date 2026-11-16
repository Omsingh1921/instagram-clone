package com.instagramclone.admin.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.dto.request.UpdateDeletionConfigRequest;
import com.instagramclone.admin.dto.response.DeletionConfigResponse;
import com.instagramclone.admin.entity.DynamicDeletionConfig;
import com.instagramclone.admin.repository.DynamicDeletionConfigRepository;
import com.instagramclone.admin.service.interfaces.IDynamicDeletionConfigService;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DynamicDeletionConfigServiceImpl
        extends AbstractDynamicConfigService<DynamicDeletionConfig, UpdateDeletionConfigRequest, DeletionConfigResponse>
        implements IDynamicDeletionConfigService {

    private static final String REDIS_KEY = "admin:config:deletion";
    private final DynamicDeletionConfigRepository repository;

    public DynamicDeletionConfigServiceImpl(
            DynamicDeletionConfigRepository repository,
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
    protected Class<DynamicDeletionConfig> getEntityClass() {
        return DynamicDeletionConfig.class;
    }

    @Override
    protected String getAuditTargetType() {
        return "DYNAMIC_DELETION";
    }

    @Override
    protected String getUpdateAuditAction() {
        return "UPDATE_DELETION_CONFIG";
    }

    @Override
    protected String getResetAuditAction() {
        return "RESET_DELETION_CONFIG";
    }

    @Override
    protected Optional<DynamicDeletionConfig> findPrimaryConfig() {
        return repository.findFirstByOrderByCreatedAtAsc();
    }

    @Override
    protected DynamicDeletionConfig saveConfig(DynamicDeletionConfig entity) {
        return repository.save(entity);
    }

    @Override
    protected DynamicDeletionConfig newEmptyEntity() {
        return DynamicDeletionConfig.builder().build();
    }

    @Override
    protected DynamicDeletionConfig createDefaultEntity() {
        return DynamicDeletionConfig.builder()
                .trashRetentionDays(30)
                .pseudoPermanentEnabled(true)
                .mediaPurgeDelayDays(30)
                .legalHoldEnabled(false)
                .adminTakedownPreserveDays(365)
                .accountGraceDays(30)
                .cronBatchSize(500)
                .build();
    }

    @Override
    protected void applyUpdate(DynamicDeletionConfig config, UpdateDeletionConfigRequest request) {
        config.setTrashRetentionDays(request.getTrashRetentionDays());
        config.setPseudoPermanentEnabled(request.getPseudoPermanentEnabled());
        config.setMediaPurgeDelayDays(request.getMediaPurgeDelayDays());
        config.setLegalHoldEnabled(request.getLegalHoldEnabled());
        config.setAdminTakedownPreserveDays(request.getAdminTakedownPreserveDays());
        config.setAccountGraceDays(request.getAccountGraceDays());
        config.setCronBatchSize(request.getCronBatchSize());
    }

    @Override
    protected void applyDefaults(DynamicDeletionConfig config) {
        config.setTrashRetentionDays(30);
        config.setPseudoPermanentEnabled(true);
        config.setMediaPurgeDelayDays(30);
        config.setLegalHoldEnabled(false);
        config.setAdminTakedownPreserveDays(365);
        config.setAccountGraceDays(30);
        config.setCronBatchSize(500);
    }

    @Override
    protected String describeUpdateAudit(DynamicDeletionConfig saved) {
        return "TrashDays: " + saved.getTrashRetentionDays()
                + ", PseudoPermanent: " + saved.getPseudoPermanentEnabled()
                + ", LegalHold: " + saved.getLegalHoldEnabled();
    }

    @Override
    protected DeletionConfigResponse toResponse(DynamicDeletionConfig config) {
        return DeletionConfigResponse.builder()
                .id(config.getId())
                .trashRetentionDays(config.getTrashRetentionDays())
                .pseudoPermanentEnabled(config.getPseudoPermanentEnabled())
                .mediaPurgeDelayDays(config.getMediaPurgeDelayDays())
                .legalHoldEnabled(config.getLegalHoldEnabled())
                .adminTakedownPreserveDays(config.getAdminTakedownPreserveDays())
                .accountGraceDays(config.getAccountGraceDays())
                .cronBatchSize(config.getCronBatchSize())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
