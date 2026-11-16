package com.instagramclone.admin.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.service.interfaces.IDynamicConfigService;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.entity.BaseAuditableEntity;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Shared Template Method base class implementing Redis caching (30-min TTL), DB fallback,
 * default startup initialization, cache eviction, and audit logging across dynamic admin configs.
 */
public abstract class AbstractDynamicConfigService<E extends BaseAuditableEntity, REQ, RES>
        implements IDynamicConfigService<E, REQ, RES> {

    private static final Logger log = LoggerFactory.getLogger(AbstractDynamicConfigService.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    private final Optional<StringRedisTemplate> redisTemplate;
    private final ObjectMapper objectMapper;
    private final Optional<IAuditLogService> auditLogService;

    protected AbstractDynamicConfigService(
            Optional<StringRedisTemplate> redisTemplate,
            ObjectMapper objectMapper,
            Optional<IAuditLogService> auditLogService) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
    }

    @PostConstruct
    public void onStartup() {
        try {
            initDefaultConfig();
        } catch (Exception ex) {
            log.warn("Could not initialize default {}: {}", getAuditTargetType(), ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void initDefaultConfig() {
        if (findPrimaryConfig().isEmpty()) {
            saveConfig(createDefaultEntity());
            log.info("Initialized default {} configuration", getAuditTargetType());
            evictCache();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public RES getConfigResponse() {
        return toResponse(getActiveConfig());
    }

    @Override
    @Transactional(readOnly = true)
    public E getActiveConfig() {
        if (redisTemplate.isPresent()) {
            try {
                String cached = redisTemplate.get().opsForValue().get(getRedisKey());
                if (cached != null && !cached.isBlank()) {
                    return objectMapper.readValue(cached, getEntityClass());
                }
            } catch (Exception e) {
                log.warn("Redis read failed for {}: {}", getAuditTargetType(), e.getMessage());
            }
        }

        E config = findConfigForRead().orElseGet(() -> saveConfig(createDefaultEntity()));

        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().opsForValue().set(
                        getRedisKey(),
                        objectMapper.writeValueAsString(config),
                        CACHE_TTL
                );
            } catch (Exception e) {
                log.warn("Redis write failed for {}: {}", getAuditTargetType(), e.getMessage());
            }
        }

        return config;
    }

    @Override
    @Transactional
    public RES updateConfig(REQ request, UUID adminId) {
        E config = findPrimaryConfig().orElseGet(this::newEmptyEntity);
        applyUpdate(config, request);
        E saved = saveConfig(config);
        evictCache();
        recordAudit(adminId, getUpdateAuditAction(), saved.getId(), describeUpdateAudit(saved));
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RES resetToDefault(UUID adminId) {
        E config = findPrimaryConfig().orElseGet(this::newEmptyEntity);
        applyDefaults(config);
        E saved = saveConfig(config);
        evictCache();
        recordAudit(adminId, getResetAuditAction(), saved.getId(), "Reset to defaults");
        return toResponse(saved);
    }

    protected void evictCache() {
        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().delete(getRedisKey());
            } catch (Exception e) {
                log.warn("Failed to delete Redis cache for {}: {}", getAuditTargetType(), e.getMessage());
            }
        }
    }

    private void recordAudit(UUID adminId, String action, UUID entityId, String details) {
        auditLogService.ifPresent(audit -> {
            try {
                audit.record(adminId, action, getAuditTargetType(), entityId, null, details);
            } catch (Exception ex) {
                log.warn("Failed to audit {} ({}): {}", action, getAuditTargetType(), ex.getMessage());
            }
        });
    }

    protected Optional<E> findConfigForRead() {
        return findPrimaryConfig();
    }

    protected abstract String getRedisKey();

    protected abstract Class<E> getEntityClass();

    protected abstract String getAuditTargetType();

    protected abstract String getUpdateAuditAction();

    protected abstract String getResetAuditAction();

    protected abstract Optional<E> findPrimaryConfig();

    protected abstract E saveConfig(E entity);

    protected abstract E newEmptyEntity();

    protected abstract E createDefaultEntity();

    protected abstract void applyUpdate(E entity, REQ request);

    protected abstract void applyDefaults(E entity);

    protected abstract String describeUpdateAudit(E saved);

    protected abstract RES toResponse(E entity);
}

