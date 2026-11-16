package com.instagramclone.mail.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.mail.config.MailProperties;
import com.instagramclone.mail.dto.request.UpdateEmailServerConfigRequest;
import com.instagramclone.mail.dto.response.EmailServerConfigResponse;
import com.instagramclone.mail.entity.DynamicEmailServerConfig;
import com.instagramclone.mail.provider.IEmailProvider;
import com.instagramclone.mail.repository.DynamicEmailServerConfigRepository;
import com.instagramclone.mail.service.interfaces.IDynamicEmailServerConfigService;
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
public class DynamicEmailServerConfigServiceImpl implements IDynamicEmailServerConfigService {

    private static final Logger log = LoggerFactory.getLogger(DynamicEmailServerConfigServiceImpl.class);
    private static final String REDIS_KEY = "admin:config:email:server";

    private final DynamicEmailServerConfigRepository repository;
    private final Optional<StringRedisTemplate> redisTemplate;
    private final ObjectMapper objectMapper;
    private final Optional<IAuditLogService> auditLogService;
    private final IEmailProvider emailProvider;
    private final MailProperties mailProperties;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String envMailUsername;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.password:}")
    private String envMailPassword;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.host:smtp.gmail.com}")
    private String envMailHost;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.port:587}")
    private int envMailPort;

    @PostConstruct
    public void onStartup() {
        try {
            initDefaultConfig();
        } catch (Exception ex) {
            log.warn("Could not initialize default dynamic email server config: {}", ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void initDefaultConfig() {
        boolean hasEnvCredentials = envMailUsername != null && !envMailUsername.isBlank()
                && envMailPassword != null && !envMailPassword.isBlank();

        java.util.Optional<DynamicEmailServerConfig> existingOpt = repository.findFirstByOrderByCreatedAtAsc();
        if (existingOpt.isEmpty()) {
            DynamicEmailServerConfig defaultConfig = DynamicEmailServerConfig.builder()
                    .providerName("SMTP")
                    .host(envMailHost != null && !envMailHost.isBlank() ? envMailHost : "smtp.gmail.com")
                    .port(envMailPort > 0 ? envMailPort : 587)
                    .username(envMailUsername != null ? envMailUsername : "")
                    .password(envMailPassword != null ? envMailPassword : "")
                    .authEnabled(true)
                    .starttlsEnabled(true)
                    .sslEnabled(false)
                    .connectionTimeoutMs(10000)
                    .simulationMode(!hasEnvCredentials)
                    .rateLimitPerHour(1000)
                    .build();
            repository.save(defaultConfig);
            log.info("Initialized default dynamic email server configuration (simulationMode={})", !hasEnvCredentials);
            evictCache();
        } else if (hasEnvCredentials) {
            DynamicEmailServerConfig config = existingOpt.get();
            boolean needsUpdate = false;
            if (config.getUsername() == null || config.getUsername().isBlank()) {
                config.setUsername(envMailUsername);
                needsUpdate = true;
            }
            if (config.getPassword() == null || config.getPassword().isBlank()) {
                config.setPassword(envMailPassword);
                needsUpdate = true;
            }
            if (Boolean.TRUE.equals(config.getSimulationMode())) {
                config.setSimulationMode(false);
                needsUpdate = true;
            }
            if (needsUpdate) {
                repository.save(config);
                log.info("Synchronized dynamic email server configuration with environment credentials (simulationMode=false)");
                evictCache();
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public EmailServerConfigResponse getConfigResponse() {
        return toResponse(getActiveConfig());
    }

    @Override
    @Transactional(readOnly = true)
    public DynamicEmailServerConfig getActiveConfig() {
        // Try redis cache first
        if (redisTemplate.isPresent()) {
            try {
                String cached = redisTemplate.get().opsForValue().get(REDIS_KEY);
                if (cached != null && !cached.isBlank()) {
                    return objectMapper.readValue(cached, DynamicEmailServerConfig.class);
                }
            } catch (Exception e) {
                log.warn("Redis read failed for email server config: {}", e.getMessage());
            }
        }

        DynamicEmailServerConfig config = repository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> {
                    DynamicEmailServerConfig fallback = DynamicEmailServerConfig.builder()
                            .providerName("SMTP")
                            .host("smtp.gmail.com")
                            .port(587)
                            .username("")
                            .password("")
                            .authEnabled(true)
                            .starttlsEnabled(true)
                            .sslEnabled(false)
                            .connectionTimeoutMs(10000)
                            .simulationMode(true)
                            .rateLimitPerHour(1000)
                            .build();
                    return repository.save(fallback);
                });

        // Write to cache
        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().opsForValue().set(
                        REDIS_KEY,
                        objectMapper.writeValueAsString(config),
                        Duration.ofMinutes(30)
                );
            } catch (Exception e) {
                log.warn("Redis write failed for email server config: {}", e.getMessage());
            }
        }

        return config;
    }

    @Override
    @Transactional
    public EmailServerConfigResponse updateConfig(UpdateEmailServerConfigRequest request, UUID adminId) {
        DynamicEmailServerConfig config = repository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> DynamicEmailServerConfig.builder().build());

        config.setProviderName(request.getProviderName());
        config.setHost(request.getHost());
        config.setPort(request.getPort());
        if (request.getUsername() != null) {
            config.setUsername(request.getUsername());
        }
        // Only update password if a new non-empty password is submitted
        if (request.getPassword() != null && !request.getPassword().isBlank() && !request.getPassword().startsWith("****")) {
            config.setPassword(request.getPassword());
        }
        config.setAuthEnabled(request.getAuthEnabled());
        config.setStarttlsEnabled(request.getStarttlsEnabled());
        config.setSslEnabled(request.getSslEnabled());
        config.setConnectionTimeoutMs(request.getConnectionTimeoutMs());
        config.setSimulationMode(request.getSimulationMode());
        config.setRateLimitPerHour(request.getRateLimitPerHour());

        DynamicEmailServerConfig saved = repository.save(config);
        evictCache();

        auditLogService.ifPresent(audit -> {
            try {
                audit.record(
                        adminId,
                        "UPDATE_EMAIL_SERVER_CONFIG",
                        "DYNAMIC_EMAIL_SERVER",
                        saved.getId(),
                        null,
                        "Host: " + saved.getHost() + ", Port: " + saved.getPort() + ", SimMode: " + saved.getSimulationMode()
                );
            } catch (Exception ex) {
                log.warn("Failed to audit update email server config: {}", ex.getMessage());
            }
        });

        return toResponse(saved);
    }

    @Override
    @Transactional
    public EmailServerConfigResponse resetToDefault(UUID adminId) {
        DynamicEmailServerConfig config = repository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> DynamicEmailServerConfig.builder().build());

        boolean hasEnvCredentials = envMailUsername != null && !envMailUsername.isBlank()
                && envMailPassword != null && !envMailPassword.isBlank();

        config.setProviderName("SMTP");
        config.setHost(envMailHost != null && !envMailHost.isBlank() ? envMailHost : "smtp.gmail.com");
        config.setPort(envMailPort > 0 ? envMailPort : 587);
        config.setUsername(envMailUsername != null ? envMailUsername : "");
        config.setPassword(envMailPassword != null ? envMailPassword : "");
        config.setAuthEnabled(true);
        config.setStarttlsEnabled(true);
        config.setSslEnabled(false);
        config.setConnectionTimeoutMs(10000);
        config.setSimulationMode(!hasEnvCredentials);
        config.setRateLimitPerHour(1000);

        DynamicEmailServerConfig saved = repository.save(config);
        evictCache();

        auditLogService.ifPresent(audit -> {
            try {
                audit.record(
                        adminId,
                        "RESET_EMAIL_SERVER_CONFIG",
                        "DYNAMIC_EMAIL_SERVER",
                        saved.getId(),
                        null,
                        "Reset to defaults"
                );
            } catch (Exception ex) {
                log.warn("Failed to audit reset email server config: {}", ex.getMessage());
            }
        });

        return toResponse(saved);
    }

    @Override
    public void sendTestEmail(String recipientEmail, UUID adminId) {
        DynamicEmailServerConfig config = getActiveConfig();
        String subject = "Instagram Clone: SMTP Test Handshake";
        String html = "<div style='font-family:sans-serif;padding:20px;'>"
                + "<h2>SMTP Handshake Successful!</h2>"
                + "<p>This is a live test email sent via <strong>" + config.getHost() + ":" + config.getPort() + "</strong>.</p>"
                + "<p>Simulation Mode: <strong>" + config.getSimulationMode() + "</strong></p>"
                + "<p>Timestamp: " + java.time.LocalDateTime.now() + "</p>"
                + "</div>";
        String text = "SMTP Handshake Successful!\nHost: " + config.getHost() + ":" + config.getPort()
                + "\nSimulation Mode: " + config.getSimulationMode();

        String effectiveFrom = (config.getUsername() != null && !config.getUsername().isBlank())
                ? config.getUsername()
                : mailProperties.getFrom();
        String effectiveName = (mailProperties.getFromName() != null && !mailProperties.getFromName().isBlank())
                ? mailProperties.getFromName()
                : "Instagram Mail Server";

        emailProvider.send(
                recipientEmail,
                subject,
                html,
                text,
                effectiveFrom,
                effectiveName
        );

        auditLogService.ifPresent(audit -> {
            try {
                audit.record(
                        adminId,
                        "TEST_EMAIL_SERVER_DISPATCH",
                        "DYNAMIC_EMAIL_SERVER",
                        config.getId(),
                        null,
                        "Dispatched test email to: " + recipientEmail
                );
            } catch (Exception ex) {
                log.warn("Failed to audit test email dispatch: {}", ex.getMessage());
            }
        });
    }

    private void evictCache() {
        if (redisTemplate.isPresent()) {
            try {
                redisTemplate.get().delete(REDIS_KEY);
            } catch (Exception e) {
                log.warn("Failed to delete Redis cache for email server config: {}", e.getMessage());
            }
        }
    }

    private EmailServerConfigResponse toResponse(DynamicEmailServerConfig config) {
        boolean hasPass = config.getPassword() != null && !config.getPassword().isBlank();
        return EmailServerConfigResponse.builder()
                .id(config.getId())
                .providerName(config.getProviderName())
                .host(config.getHost())
                .port(config.getPort())
                .username(config.getUsername())
                .hasPassword(hasPass)
                .maskedPassword(hasPass ? "********" : "")
                .authEnabled(config.getAuthEnabled())
                .starttlsEnabled(config.getStarttlsEnabled())
                .sslEnabled(config.getSslEnabled())
                .connectionTimeoutMs(config.getConnectionTimeoutMs())
                .simulationMode(config.getSimulationMode())
                .rateLimitPerHour(config.getRateLimitPerHour())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
