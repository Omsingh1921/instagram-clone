package com.instagramclone.admin.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.dto.request.UpdateDynamicSystemConfigRequest;
import com.instagramclone.admin.dto.response.DynamicSystemConfigResponse;
import com.instagramclone.admin.entity.DynamicSystemConfig;
import com.instagramclone.admin.repository.DynamicSystemConfigRepository;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigService;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class DynamicSystemConfigServiceImpl implements IDynamicSystemConfigService {

    private static final Logger log = LoggerFactory.getLogger(DynamicSystemConfigServiceImpl.class);
    private static final String REDIS_MAP_KEY = "admin:config:system:map";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private record SeedDefinition(
            String key,
            String defaultValue,
            String category,
            String description,
            boolean isPublic,
            boolean isSecret
    ) {}

    private static final List<SeedDefinition> DEFAULT_DEFINITIONS = List.of(
            new SeedDefinition(
                    DynamicSystemConfigKeys.CLIENT_BASE_URL,
                    DynamicSystemConfigKeys.DEFAULT_CLIENT_BASE_URL,
                    "GENERAL",
                    "Frontend Web Application Base URL for emails and redirect links",
                    true,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.AUTH_SIGNUP_OTP_EXPIRY_MINUTES,
                    "10",
                    "AUTH",
                    "Signup email verification OTP validity duration in minutes",
                    false,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.AUTH_PASSWORD_RESET_EXPIRY_MINUTES,
                    "15",
                    "AUTH",
                    "Password reset challenge token validity duration in minutes",
                    false,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.AUTH_OTP_MAX_ATTEMPTS,
                    "5",
                    "AUTH",
                    "Maximum failed OTP verification attempts before code is invalidated",
                    false,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.USER_USERNAME_COOLDOWN_DAYS,
                    "14",
                    "USER",
                    "Cooldown window in days between consecutive username modifications",
                    true,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.USER_MAX_ACCOUNTS_PER_EMAIL,
                    "3",
                    "USER",
                    "Maximum secondary user accounts allowed per primary email address (1-3)",
                    true,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.USER_ACCOUNT_DELETION_GRACE_DAYS,
                    "15",
                    "USER",
                    "Grace period in days to recover a soft-deleted user account",
                    true,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.MAIL_FROM_ADDRESS,
                    "no-reply@instagram.com",
                    "NOTIFICATIONS",
                    "Default system email sender address",
                    false,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.MAIL_FROM_NAME,
                    "Instagram",
                    "NOTIFICATIONS",
                    "Default system email sender display name",
                    false,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.SECURITY_LOCKOUT_MAX_ATTEMPTS,
                    "5",
                    "SECURITY",
                    "Consecutive failed login attempts triggering account lockout",
                    false,
                    false
            ),
            new SeedDefinition(
                    DynamicSystemConfigKeys.SECURITY_LOCKOUT_DURATION_MINUTES,
                    "15",
                    "SECURITY",
                    "Account lockout temporary suspension window in minutes",
                    false,
                    false
            )
    );

    private final DynamicSystemConfigRepository repository;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final ObjectMapper objectMapper;
    private final Optional<IAuditLogService> auditLogService;
    private final Optional<UserRepository> userRepository;

    public DynamicSystemConfigServiceImpl(
            DynamicSystemConfigRepository repository,
            Optional<StringRedisTemplate> redisTemplate,
            ObjectMapper objectMapper,
            Optional<IAuditLogService> auditLogService,
            Optional<UserRepository> userRepository) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void onStartup() {
        try {
            initDefaultConfigs();
        } catch (Exception ex) {
            log.warn("Could not initialize default dynamic system configs: {}", ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void initDefaultConfigs() {
        boolean inserted = false;
        for (SeedDefinition def : DEFAULT_DEFINITIONS) {
            if (!repository.existsByConfigKey(def.key())) {
                DynamicSystemConfig entity = DynamicSystemConfig.builder()
                        .configKey(def.key())
                        .configValue(def.defaultValue())
                        .defaultValue(def.defaultValue())
                        .category(def.category())
                        .description(def.description())
                        .isPublic(def.isPublic())
                        .isSecret(def.isSecret())
                        .build();
                repository.save(entity);
                inserted = true;
            }
        }
        if (inserted) {
            log.info("Initialized default dynamic system configurations");
            evictCache();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DynamicSystemConfigResponse> getAllConfigs() {
        return repository.findAllByIsDeletedFalseOrderByCategoryAscConfigKeyAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DynamicSystemConfigResponse> getPublicConfigs() {
        return repository.findAllByIsPublicTrueAndIsSecretFalseAndIsDeletedFalseOrderByCategoryAscConfigKeyAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public DynamicSystemConfigResponse updateConfig(String key, UpdateDynamicSystemConfigRequest request, UUID adminId) {
        DynamicSystemConfig config = findByKeyOrThrow(key);
        String validatedValue = normalizeAndValidateValue(config.getConfigKey(), request != null ? request.getValue() : null);

        config.setConfigValue(validatedValue);
        config.setUpdatedBy(resolveAdminIdentifier(adminId));
        DynamicSystemConfig saved = repository.save(config);

        evictCache();
        recordAudit(adminId, "UPDATE_SYSTEM_CONFIG", saved.getId(),
                "Updated system config [" + saved.getConfigKey() + "]" + (Boolean.TRUE.equals(saved.getIsSecret()) ? "" : " -> " + validatedValue));

        return toResponse(saved);
    }

    @Override
    @Transactional
    public DynamicSystemConfigResponse resetConfig(String key, UUID adminId) {
        DynamicSystemConfig config = findByKeyOrThrow(key);
        config.setConfigValue(config.getDefaultValue());
        config.setUpdatedBy(resolveAdminIdentifier(adminId));
        DynamicSystemConfig saved = repository.save(config);

        evictCache();
        recordAudit(adminId, "RESET_SYSTEM_CONFIG", saved.getId(),
                "Reset system config [" + saved.getConfigKey() + "] to factory default");

        return toResponse(saved);
    }

    @Override
    @Transactional
    public List<DynamicSystemConfigResponse> resetAllConfigs(UUID adminId) {
        String adminLabel = resolveAdminIdentifier(adminId);
        List<DynamicSystemConfig> all = repository.findAllByIsDeletedFalseOrderByCategoryAscConfigKeyAsc();
        for (DynamicSystemConfig config : all) {
            config.setConfigValue(config.getDefaultValue());
            config.setUpdatedBy(adminLabel);
        }
        List<DynamicSystemConfig> saved = repository.saveAll(all);
        evictCache();
        recordAudit(adminId, "RESET_ALL_SYSTEM_CONFIGS", null,
                "Reset all " + saved.size() + " dynamic system configurations to factory defaults");

        return saved.stream().map(this::toResponse).toList();
    }

    @Override
    public String getString(String key, String fallback) {
        if (key == null || key.isBlank()) {
            return fallback;
        }
        Map<String, String> cachedMap = loadConfigValueMap();
        String val = cachedMap.get(key.trim());
        return (val != null && !val.isBlank()) ? val : fallback;
    }

    @Override
    public int getInt(String key, int fallback, int min, int max) {
        String raw = getString(key, null);
        if (raw == null || raw.isBlank()) {
            return clamp(fallback, min, max);
        }
        try {
            return clamp(Integer.parseInt(raw.trim()), min, max);
        } catch (NumberFormatException ex) {
            log.warn("Invalid integer config for key [{}]: '{}', using fallback {}", key, raw, fallback);
            return clamp(fallback, min, max);
        }
    }

    @Override
    public long getLong(String key, long fallback, long min, long max) {
        String raw = getString(key, null);
        if (raw == null || raw.isBlank()) {
            return clamp(fallback, min, max);
        }
        try {
            return clamp(Long.parseLong(raw.trim()), min, max);
        } catch (NumberFormatException ex) {
            log.warn("Invalid long config for key [{}]: '{}', using fallback {}", key, raw, fallback);
            return clamp(fallback, min, max);
        }
    }

    @Override
    public String getClientBaseUrl(String fallbackUrl) {
        String defaultVal = (fallbackUrl != null && !fallbackUrl.isBlank())
                ? fallbackUrl
                : DynamicSystemConfigKeys.DEFAULT_CLIENT_BASE_URL;
        String raw = getString(DynamicSystemConfigKeys.CLIENT_BASE_URL, defaultVal);
        return stripTrailingSlashes(raw);
    }

    @Override
    public String buildClientUrl(String relativePath) {
        String base = getClientBaseUrl(DynamicSystemConfigKeys.DEFAULT_CLIENT_BASE_URL);
        if (relativePath == null || relativePath.isBlank()) {
            return base;
        }
        String cleanPath = relativePath.startsWith("/") ? relativePath : "/" + relativePath;
        return base + cleanPath;
    }

    @Override
    public String resolveClientEndpointUrl(String configuredUrl, String defaultPath) {
        String baseUrl = getClientBaseUrl(DynamicSystemConfigKeys.DEFAULT_CLIENT_BASE_URL);
        boolean isCustomDynamicBase = !DynamicSystemConfigKeys.DEFAULT_CLIENT_BASE_URL.equalsIgnoreCase(baseUrl);

        if (!isCustomDynamicBase && configuredUrl != null && !configuredUrl.isBlank()) {
            return stripTrailingSlashes(configuredUrl);
        }

        String path = extractPath(configuredUrl, defaultPath);
        return baseUrl + path;
    }

    private Map<String, String> loadConfigValueMap() {
        if (redisTemplate.isPresent()) {
            try {
                String cached = redisTemplate.get().opsForValue().get(REDIS_MAP_KEY);
                if (cached != null && !cached.isBlank()) {
                    return objectMapper.readValue(cached, new TypeReference<>() {});
                }
            } catch (Exception ex) {
                log.warn("Redis read failed for dynamic system configs: {}", ex.getMessage());
            }
        }

        Map<String, String> dbMap = new LinkedHashMap<>();
        try {
            List<DynamicSystemConfig> entries = repository.findAllByIsDeletedFalseOrderByCategoryAscConfigKeyAsc();
            for (DynamicSystemConfig entry : entries) {
                dbMap.put(entry.getConfigKey(), entry.getConfigValue());
            }
        } catch (Exception ex) {
            log.warn("DB read failed for dynamic system configs: {}", ex.getMessage());
            return dbMap;
        }

        if (!dbMap.isEmpty() && redisTemplate.isPresent()) {
            try {
                redisTemplate.get().opsForValue().set(
                        REDIS_MAP_KEY,
                        objectMapper.writeValueAsString(dbMap),
                        CACHE_TTL
                );
            } catch (Exception ex) {
                log.warn("Redis write failed for dynamic system configs: {}", ex.getMessage());
            }
        }

        return dbMap;
    }

    private DynamicSystemConfig findByKeyOrThrow(String key) {
        String normalizedKey = key != null ? key.trim() : "";
        return repository.findByConfigKeyAndIsDeletedFalse(normalizedKey)
                .orElseThrow(() -> new ResourceNotFoundException(AdminConstants.ERR_DYNAMIC_CONFIG_NOT_FOUND + normalizedKey));
    }

    private String normalizeAndValidateValue(String key, String rawValue) {
        if (rawValue == null || rawValue.trim().isEmpty()) {
            throw new BadRequestException("Configuration value cannot be empty for key: " + key);
        }
        String trimmed = rawValue.trim();

        return switch (key) {
            case DynamicSystemConfigKeys.CLIENT_BASE_URL -> validateClientBaseUrl(trimmed);
            case DynamicSystemConfigKeys.AUTH_SIGNUP_OTP_EXPIRY_MINUTES,
                 DynamicSystemConfigKeys.AUTH_PASSWORD_RESET_EXPIRY_MINUTES,
                 DynamicSystemConfigKeys.SECURITY_LOCKOUT_DURATION_MINUTES ->
                    String.valueOf(parseBoundedInt(key, trimmed, 1, 1440));
            case DynamicSystemConfigKeys.AUTH_OTP_MAX_ATTEMPTS ->
                    String.valueOf(parseBoundedInt(key, trimmed, 1, 20));
            case DynamicSystemConfigKeys.USER_USERNAME_COOLDOWN_DAYS ->
                    String.valueOf(parseBoundedInt(key, trimmed, 0, 365));
            case DynamicSystemConfigKeys.USER_MAX_ACCOUNTS_PER_EMAIL ->
                    String.valueOf(parseBoundedInt(key, trimmed, 1, 3));
            case DynamicSystemConfigKeys.USER_ACCOUNT_DELETION_GRACE_DAYS ->
                    String.valueOf(parseBoundedInt(key, trimmed, 1, 180));
            case DynamicSystemConfigKeys.MAIL_FROM_ADDRESS -> validateEmailAddress(trimmed);
            case DynamicSystemConfigKeys.MAIL_FROM_NAME -> validateDisplayName(trimmed);
            case DynamicSystemConfigKeys.SECURITY_LOCKOUT_MAX_ATTEMPTS ->
                    String.valueOf(parseBoundedInt(key, trimmed, 1, 50));
            default -> trimmed;
        };
    }

    private String validateClientBaseUrl(String rawUrl) {
        String normalized = stripTrailingSlashes(rawUrl);
        try {
            URI uri = URI.create(normalized);
            String scheme = uri.getScheme();
            if (scheme == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw new BadRequestException("client.base_url must use http:// or https://");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BadRequestException("client.base_url must include a valid host");
            }
            if (normalized.contains("*")) {
                throw new BadRequestException("client.base_url cannot contain wildcard '*' characters");
            }
            return normalized;
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("client.base_url must be a valid URL: " + ex.getMessage());
        }
    }

    private int parseBoundedInt(String key, String raw, int min, int max) {
        try {
            int parsed = Integer.parseInt(raw);
            if (parsed < min || parsed > max) {
                throw new BadRequestException(
                        String.format("%s must be between %d and %d", key, min, max));
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new BadRequestException(key + " must be a valid integer");
        }
    }

    private String validateEmailAddress(String email) {
        if (email.length() > 254 || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("mail.from_address must be a valid email address");
        }
        return email;
    }

    private String validateDisplayName(String name) {
        if (name.length() > 100) {
            throw new BadRequestException("mail.from_name must not exceed 100 characters");
        }
        return name;
    }

    private String extractPath(String configuredUrl, String defaultPath) {
        String fallbackPath = (defaultPath != null && defaultPath.startsWith("/"))
                ? defaultPath
                : (defaultPath != null && !defaultPath.isBlank() ? "/" + defaultPath : "");

        if (configuredUrl == null || configuredUrl.isBlank()) {
            return fallbackPath;
        }
        try {
            URI uri = URI.create(configuredUrl.trim());
            String path = uri.getPath();
            if (path != null && !path.isBlank()) {
                return path.startsWith("/") ? path : "/" + path;
            }
        } catch (Exception ignored) {
        }
        return fallbackPath;
    }

    private String stripTrailingSlashes(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        while (trimmed.endsWith("/") && trimmed.length() > 1) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String resolveAdminIdentifier(UUID adminId) {
        if (adminId == null) {
            return "SYSTEM";
        }
        return userRepository
                .flatMap(repo -> repo.findById(adminId).map(User::getUsername))
                .orElse(adminId.toString());
    }

    private void evictCache() {
        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().delete(REDIS_MAP_KEY);
            } catch (Exception ex) {
                log.warn("Failed to evict dynamic system config Redis cache: {}", ex.getMessage());
            }
        }
    }

    private void recordAudit(UUID adminId, String action, UUID entityId, String details) {
        auditLogService.ifPresent(audit -> {
            try {
                audit.record(adminId, action, "DYNAMIC_SYSTEM_CONFIG", entityId, null, details);
            } catch (Exception ex) {
                log.warn("Failed to audit {} for dynamic system config: {}", action, ex.getMessage());
            }
        });
    }

    private DynamicSystemConfigResponse toResponse(DynamicSystemConfig entity) {
        boolean secret = Boolean.TRUE.equals(entity.getIsSecret());
        return DynamicSystemConfigResponse.builder()
                .key(entity.getConfigKey())
                .value(secret ? "********" : entity.getConfigValue())
                .defaultValue(secret ? "********" : entity.getDefaultValue())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .isPublic(Boolean.TRUE.equals(entity.getIsPublic()))
                .isSecret(secret)
                .updatedBy(entity.getUpdatedBy())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static long clamp(long value, long min, long max) {
        return Math.max(min, Math.min(max, value));
    }
}

