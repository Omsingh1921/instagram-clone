package com.instagramclone.media.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.media.dto.request.UpdateMediaConfigRequest;
import com.instagramclone.media.dto.response.MediaConfigResponse;
import com.instagramclone.media.entity.DynamicMediaConfig;
import com.instagramclone.media.repository.DynamicMediaConfigRepository;
import com.instagramclone.media.service.interfaces.IDynamicMediaConfigService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DynamicMediaConfigServiceImpl implements IDynamicMediaConfigService {

    private static final Logger log = LoggerFactory.getLogger(DynamicMediaConfigServiceImpl.class);
    private static final String REDIS_KEY = "admin:config:media";

    private final DynamicMediaConfigRepository repository;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final ObjectMapper objectMapper;
    private final Optional<IAuditLogService> auditLogService;

    @PostConstruct
    public void onStartup() {
        try {
            initDefaultConfig();
        } catch (Exception ex) {
            log.warn("Could not initialize default dynamic media config: {}", ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void initDefaultConfig() {
        if (repository.findFirstByOrderByCreatedAtAsc().isEmpty()) {
            DynamicMediaConfig defaultConfig = DynamicMediaConfig.builder()
                    .maxReelBytes(262144000L) // 250MB
                    .maxPostBytes(104857600L) // 100MB
                    .maxReelDurationSec(90)
                    .maxStoryDurationSec(60)
                    .allowedMimeTypes("video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp")
                    .build();
            repository.save(defaultConfig);
            log.info("Initialized default dynamic media configuration");
            evictCache();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MediaConfigResponse getConfigResponse() {
        return toResponse(getActiveConfig());
    }

    @Override
    @Transactional(readOnly = true)
    public DynamicMediaConfig getActiveConfig() {
        if (redisTemplate.isPresent()) {
            try {
                String cached = redisTemplate.get().opsForValue().get(REDIS_KEY);
                if (cached != null && !cached.isBlank()) {
                    return objectMapper.readValue(cached, DynamicMediaConfig.class);
                }
            } catch (Exception e) {
                log.warn("Redis read failed for media config: {}", e.getMessage());
            }
        }

        DynamicMediaConfig config = repository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> {
                    DynamicMediaConfig fallback = DynamicMediaConfig.builder()
                            .maxReelBytes(262144000L)
                            .maxPostBytes(104857600L)
                            .maxReelDurationSec(90)
                            .maxStoryDurationSec(60)
                            .allowedMimeTypes("video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp")
                            .build();
                    return repository.save(fallback);
                });

        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().opsForValue().set(
                        REDIS_KEY,
                        objectMapper.writeValueAsString(config),
                        Duration.ofMinutes(30)
                );
            } catch (Exception e) {
                log.warn("Redis write failed for media config: {}", e.getMessage());
            }
        }

        return config;
    }

    @Override
    @Transactional
    public MediaConfigResponse updateConfig(UpdateMediaConfigRequest request, UUID adminId) {
        DynamicMediaConfig config = repository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> DynamicMediaConfig.builder().build());

        config.setMaxReelBytes(request.getMaxReelBytes());
        config.setMaxPostBytes(request.getMaxPostBytes());
        config.setMaxReelDurationSec(request.getMaxReelDurationSec());
        config.setMaxStoryDurationSec(request.getMaxStoryDurationSec());
        config.setAllowedMimeTypes(request.getAllowedMimeTypes());

        DynamicMediaConfig saved = repository.save(config);
        evictCache();

        auditLogService.ifPresent(audit -> {
            try {
                audit.record(
                        adminId,
                        "UPDATE_MEDIA_CONFIG",
                        "DYNAMIC_MEDIA",
                        saved.getId(),
                        null,
                        "MaxReelBytes: " + saved.getMaxReelBytes() + ", MaxReelDur: " + saved.getMaxReelDurationSec()
                );
            } catch (Exception ex) {
                log.warn("Failed to audit update media config: {}", ex.getMessage());
            }
        });

        return toResponse(saved);
    }

    @Override
    @Transactional
    public MediaConfigResponse resetToDefault(UUID adminId) {
        DynamicMediaConfig config = repository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> DynamicMediaConfig.builder().build());

        config.setMaxReelBytes(262144000L);
        config.setMaxPostBytes(104857600L);
        config.setMaxReelDurationSec(90);
        config.setMaxStoryDurationSec(60);
        config.setAllowedMimeTypes("video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp");

        DynamicMediaConfig saved = repository.save(config);
        evictCache();

        auditLogService.ifPresent(audit -> {
            try {
                audit.record(
                        adminId,
                        "RESET_MEDIA_CONFIG",
                        "DYNAMIC_MEDIA",
                        saved.getId(),
                        null,
                        "Reset to defaults"
                );
            } catch (Exception ex) {
                log.warn("Failed to audit reset media config: {}", ex.getMessage());
            }
        });

        return toResponse(saved);
    }

    private void evictCache() {
        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().delete(REDIS_KEY);
            } catch (Exception e) {
                log.warn("Failed to delete Redis cache for media config: {}", e.getMessage());
            }
        }
    }

    private MediaConfigResponse toResponse(DynamicMediaConfig config) {
        return MediaConfigResponse.builder()
                .id(config.getId())
                .maxReelBytes(config.getMaxReelBytes())
                .maxPostBytes(config.getMaxPostBytes())
                .maxReelDurationSec(config.getMaxReelDurationSec())
                .maxStoryDurationSec(config.getMaxStoryDurationSec())
                .allowedMimeTypes(config.getAllowedMimeTypes())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
