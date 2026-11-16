package com.instagramclone.config;

import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Configuration
@Slf4j
public class CorsConfig {

    private final Environment environment;

    @Lazy
    @Autowired(required = false)
    private IDynamicSystemConfigReader dynamicSystemConfigReader;

    @Value("${app.security.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,https://approximate-sustained-accompanied-logical.trycloudflare.com/}")
    private String[] allowedOrigins;

    public CorsConfig(@Autowired(required = false) Environment environment) {
        this.environment = environment;
    }

    public CorsConfig() {
        this(null);
    }

    public void setAllowedOrigins(String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public boolean isProductionEnvironment() {
        if (environment == null) {
            return false;
        }
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Resolves and validates allowed origins or origin patterns for both HTTP CORS
     * and WebSocket STOMP.
     */
    public List<String> resolveAllowedOriginPatterns() {
        List<String> configuredOrigins = new ArrayList<>();
        if (allowedOrigins != null) {
            for (String origin : allowedOrigins) {
                if (origin != null && !origin.trim().isEmpty()) {
                    configuredOrigins.add(origin.trim());
                }
            }
        }

        if (isProductionEnvironment()) {
            if (configuredOrigins.isEmpty()) {
                throw new IllegalStateException(
                        "Production CORS configuration requires explicit allowed origins (e.g. via CORS_ALLOWED_ORIGINS or app.security.cors.allowed-origins). "
                                +
                                "Empty origin configuration is forbidden in production.");
            }

            for (String origin : configuredOrigins) {
                if (origin.equals("*") || origin.contains("*")) {
                    throw new IllegalStateException(
                            "Wildcard origin pattern '" + origin
                                    + "' is strictly forbidden in production with allowCredentials=true.");
                }
                if (origin.contains("localhost") || origin.contains("127.0.0.1")) {
                    throw new IllegalStateException(
                            "Localhost origin '" + origin + "' is forbidden in production environment.");
                }
                if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
                    throw new IllegalStateException(
                            "CORS origin '" + origin
                                    + "' is invalid. Explicit scheme (http:// or https://) is required.");
                }
            }
            return configuredOrigins;
        }

        List<String> patterns = new ArrayList<>();
        patterns.add("http://localhost:5173");
        patterns.add("http://127.0.0.1:5173");
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");
        for (String origin : configuredOrigins) {
            if (!"*".equals(origin) && !patterns.contains(origin)) {
                patterns.add(origin);
            }
        }
        return patterns;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration baseConfig = buildBaseCorsConfiguration();

        return request -> buildEffectiveCorsConfiguration(baseConfig);
    }

    /**
     * Builds the startup-validated base CORS configuration shared by HTTP CORS and WebSocket Origin checks.
     */
    public CorsConfiguration buildBaseCorsConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> resolvedOrigins = resolveAllowedOriginPatterns();

        if (isProductionEnvironment()) {
            // In production: only allow explicitly configured and validated origins (exact match)
            configuration.setAllowedOrigins(resolvedOrigins);
            log.info("Configured production CORS with {} explicit allowed origins: {}", resolvedOrigins.size(),
                    resolvedOrigins);
        } else {
            configuration.setAllowedOriginPatterns(resolvedOrigins);
            log.info("Configured development CORS with allowed origin patterns: {}", resolvedOrigins);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        return configuration;
    }

    /**
     * Merges the runtime {@code client.base_url} origin into a copy of {@code baseConfig} when valid.
     */
    public CorsConfiguration buildEffectiveCorsConfiguration(CorsConfiguration baseConfig) {
        String dynamicOrigin = resolveDynamicClientOrigin();
        if (dynamicOrigin == null) {
            return baseConfig;
        }
        CorsConfiguration dynamicConfig = new CorsConfiguration(baseConfig);
        if (isProductionEnvironment()) {
            if (dynamicConfig.getAllowedOrigins() == null
                    || !dynamicConfig.getAllowedOrigins().contains(dynamicOrigin)) {
                dynamicConfig.addAllowedOrigin(dynamicOrigin);
            }
        } else {
            if (dynamicConfig.getAllowedOriginPatterns() == null
                    || !dynamicConfig.getAllowedOriginPatterns().contains(dynamicOrigin)) {
                dynamicConfig.addAllowedOriginPattern(dynamicOrigin);
            }
        }
        return dynamicConfig;
    }

    /**
     * Validates an incoming WebSocket handshake {@code Origin} against startup CORS rules plus runtime {@code client.base_url}.
     */
    public boolean isWebSocketOriginAllowed(String origin, CorsConfiguration baseConfig) {
        if (origin == null || origin.isBlank()) {
            return true;
        }
        return buildEffectiveCorsConfiguration(baseConfig).checkOrigin(origin) != null;
    }

    private String resolveDynamicClientOrigin() {
        if (dynamicSystemConfigReader == null) {
            return null;
        }
        try {
            String rawBaseUrl = dynamicSystemConfigReader.getClientBaseUrl(null);
            if (rawBaseUrl == null || rawBaseUrl.isBlank() || rawBaseUrl.contains("*")) {
                return null;
            }
            URI uri = URI.create(rawBaseUrl.trim());
            String scheme = uri.getScheme();
            String authority = uri.getAuthority();
            if (scheme == null || authority == null || authority.isBlank()) {
                return null;
            }
            String normalizedScheme = scheme.toLowerCase(Locale.ROOT);
            if (!"http".equals(normalizedScheme) && !"https".equals(normalizedScheme)) {
                return null;
            }
            String origin = normalizedScheme + "://" + authority;
            if (isProductionEnvironment()) {
                String lower = origin.toLowerCase(Locale.ROOT);
                if (lower.contains("localhost") || lower.contains("127.0.0.1")) {
                    return null;
                }
            }
            return origin;
        } catch (Exception ex) {
            log.debug("Ignoring invalid dynamic client.base_url for CORS: {}", ex.getMessage());
            return null;
        }
    }
}
