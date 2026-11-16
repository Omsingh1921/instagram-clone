package com.instagramclone.admin.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.dto.request.UpdateModerationConfigRequest;
import com.instagramclone.admin.dto.response.ModerationConfigResponse;
import com.instagramclone.admin.entity.DynamicModerationConfig;
import com.instagramclone.admin.repository.DynamicModerationConfigRepository;
import com.instagramclone.admin.service.interfaces.IDynamicModerationConfigService;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DynamicModerationConfigServiceImpl
        extends AbstractDynamicConfigService<DynamicModerationConfig, UpdateModerationConfigRequest, ModerationConfigResponse>
        implements IDynamicModerationConfigService {

    private static final String REDIS_KEY = "admin:config:moderation";
    private static final String DEFAULT_BANNED_WORDS = "spam,scam,fraud,hate,abuse,harassment,malware";

    private final DynamicModerationConfigRepository repository;

    public DynamicModerationConfigServiceImpl(
            DynamicModerationConfigRepository repository,
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
    protected Class<DynamicModerationConfig> getEntityClass() {
        return DynamicModerationConfig.class;
    }

    @Override
    protected String getAuditTargetType() {
        return "DYNAMIC_MODERATION";
    }

    @Override
    protected String getUpdateAuditAction() {
        return "UPDATE_MODERATION_CONFIG";
    }

    @Override
    protected String getResetAuditAction() {
        return "RESET_MODERATION_CONFIG";
    }

    @Override
    protected Optional<DynamicModerationConfig> findPrimaryConfig() {
        return repository.findFirstByOrderByCreatedAtAsc();
    }

    @Override
    protected DynamicModerationConfig saveConfig(DynamicModerationConfig entity) {
        return repository.save(entity);
    }

    @Override
    protected DynamicModerationConfig newEmptyEntity() {
        return DynamicModerationConfig.builder().build();
    }

    @Override
    protected DynamicModerationConfig createDefaultEntity() {
        return DynamicModerationConfig.builder()
                .autoQuarantineReportThreshold(5)
                .profanityBannedWords(DEFAULT_BANNED_WORDS)
                .nsfwBlurThreshold(0.85)
                .copyrightStrikeLimit(3)
                .build();
    }

    @Override
    protected void applyUpdate(DynamicModerationConfig config, UpdateModerationConfigRequest request) {
        config.setAutoQuarantineReportThreshold(request.getAutoQuarantineReportThreshold());
        config.setProfanityBannedWords(request.getProfanityBannedWords());
        config.setNsfwBlurThreshold(request.getNsfwBlurThreshold());
        config.setCopyrightStrikeLimit(request.getCopyrightStrikeLimit());
    }

    @Override
    protected void applyDefaults(DynamicModerationConfig config) {
        config.setAutoQuarantineReportThreshold(5);
        config.setProfanityBannedWords(DEFAULT_BANNED_WORDS);
        config.setNsfwBlurThreshold(0.85);
        config.setCopyrightStrikeLimit(3);
    }

    @Override
    protected String describeUpdateAudit(DynamicModerationConfig saved) {
        return "Threshold: " + saved.getAutoQuarantineReportThreshold()
                + ", StrikeLimit: " + saved.getCopyrightStrikeLimit();
    }

    @Override
    protected ModerationConfigResponse toResponse(DynamicModerationConfig config) {
        return ModerationConfigResponse.builder()
                .id(config.getId())
                .autoQuarantineReportThreshold(config.getAutoQuarantineReportThreshold())
                .profanityBannedWords(config.getProfanityBannedWords())
                .nsfwBlurThreshold(config.getNsfwBlurThreshold())
                .copyrightStrikeLimit(config.getCopyrightStrikeLimit())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
