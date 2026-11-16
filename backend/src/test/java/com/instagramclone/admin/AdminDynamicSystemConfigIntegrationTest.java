package com.instagramclone.admin;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.admin.constants.DynamicSystemConfigKeys;
import com.instagramclone.admin.dto.request.UpdateDynamicSystemConfigRequest;
import com.instagramclone.auth.dto.request.LoginRequest;
import com.instagramclone.config.CorsConfig;
import com.instagramclone.mail.enums.EmailType;
import com.instagramclone.mail.service.interfaces.IEmailPreferenceService;
import com.instagramclone.mail.template.EmailTemplateRenderer;
import com.instagramclone.mail.template.RenderedEmail;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminDynamicSystemConfigIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private EmailTemplateRenderer emailTemplateRenderer;

    @Autowired
    private IEmailPreferenceService emailPreferenceService;

    @Autowired
    private CorsConfig corsConfig;

    private User admin;
    private User regularUser;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        admin = userRepository.save(User.builder()
                .username("dyn_admin")
                .email("dynadmin@configs.test")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ROLE_ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        regularUser = userRepository.save(User.builder()
                .username("dyn_user")
                .email("dynuser@configs.test")
                .passwordHash(passwordEncoder.encode("UserPass123!"))
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .failedLoginAttempts(0)
                .build());

        userSettingsRepository.save(UserSettings.builder().user(admin).isPrivate(false).build());
        userSettingsRepository.save(UserSettings.builder().user(regularUser).isPrivate(false).build());

        adminToken = jwtTokenProvider.generateTokenForUser(admin.getId(), admin.getUsername(), admin.getEmail());
        userToken = jwtTokenProvider.generateTokenForUser(regularUser.getId(), regularUser.getUsername(), regularUser.getEmail());
    }

    @Test
    @DisplayName("GET /admin/dynamic-config returns all seeded configs; regular users receive 403; public endpoint exposes only public keys")
    void accessControlAndPublicProjection() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dynamic-config")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(11))
                .andExpect(jsonPath("$.data[*].key", hasItem(DynamicSystemConfigKeys.CLIENT_BASE_URL)))
                .andExpect(jsonPath("$.data[*].key", hasItem(DynamicSystemConfigKeys.SECURITY_LOCKOUT_MAX_ATTEMPTS)));

        mockMvc.perform(get("/api/v1/admin/dynamic-config")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/dynamic-config/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].key", hasItem(DynamicSystemConfigKeys.CLIENT_BASE_URL)))
                .andExpect(jsonPath("$.data[*].key", hasItem(DynamicSystemConfigKeys.USER_USERNAME_COOLDOWN_DAYS)))
                .andExpect(jsonPath("$.data[*].key", not(hasItem(DynamicSystemConfigKeys.SECURITY_LOCKOUT_MAX_ATTEMPTS))))
                .andExpect(jsonPath("$.data[*].key", not(hasItem(DynamicSystemConfigKeys.MAIL_FROM_ADDRESS))));
    }

    @Test
    @DisplayName("Updating client.base_url applies live to CORS preflight, emails, and resets cleanly without restart")
    void clientBaseUrlRuntimeUpdateCorsEmailsAndReset() throws Exception {
        String customFrontend = "https://custom-tunnel.trycloudflare.com";

        // Update with trailing slash -> normalized cleanly
        UpdateDynamicSystemConfigRequest req = UpdateDynamicSystemConfigRequest.builder()
                .value(customFrontend + "/")
                .build();

        mockMvc.perform(put("/api/v1/admin/dynamic-config/client.base_url")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.key").value("client.base_url"))
                .andExpect(jsonPath("$.data.value").value(customFrontend))
                .andExpect(jsonPath("$.data.isPublic").value(true))
                .andExpect(jsonPath("$.data.updatedBy").value("dyn_admin"));

        // 1. Live CORS preflight immediately permits new origin without backend restart
        mockMvc.perform(options("/api/v1/health")
                        .header(HttpHeaders.ORIGIN, customFrontend)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, customFrontend));

        // Unauthorized origins remain rejected
        mockMvc.perform(options("/api/v1/health")
                        .header(HttpHeaders.ORIGIN, "https://evil-domain.example.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());

        // 1b. Live WebSocket & SockJS handshake origin validation permits new client.base_url without restart
        var baseCorsConfig = corsConfig.buildBaseCorsConfiguration();
        assertThat(corsConfig.isWebSocketOriginAllowed(customFrontend, baseCorsConfig)).isTrue();
        assertThat(corsConfig.isWebSocketOriginAllowed("https://evil-domain.example.com", baseCorsConfig)).isFalse();
        mockMvc.perform(get("/ws/info")
                        .header(HttpHeaders.ORIGIN, customFrontend))
                .andExpect(status().isOk());
        mockMvc.perform(get("/ws/info")
                        .header(HttpHeaders.ORIGIN, "https://evil-domain.example.com"))
                .andExpect(status().isForbidden());

        // 2. Email templates and unsubscribe links reflect new client.base_url immediately
        String unsubUrl = emailPreferenceService.generateUnsubscribeUrl(regularUser.getId(), EmailType.POST_LIKED);
        assertThat(unsubUrl).startsWith(customFrontend + "/unsubscribe");

        RenderedEmail welcomeEmail = emailTemplateRenderer.render(EmailType.WELCOME, Map.of("username", "dyn_user"), unsubUrl);
        assertThat(welcomeEmail.htmlBody()).contains(customFrontend + "/explore");
        assertThat(welcomeEmail.htmlBody()).contains(customFrontend + "/settings/notifications");

        // 3. Reset client.base_url reverts to factory default
        mockMvc.perform(post("/api/v1/admin/dynamic-config/client.base_url/reset")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.value").value("http://localhost:5173"));
    }

    @Test
    @DisplayName("Validation rejects invalid URLs/bounds and runtime lockout updates apply live without restart")
    void validationAndRuntimeLockoutEnforcement() throws Exception {
        // Invalid URL rejected
        mockMvc.perform(put("/api/v1/admin/dynamic-config/client.base_url")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDynamicSystemConfigRequest("ftp://invalid.host"))))
                .andExpect(status().isBadRequest());

        // Max accounts > 3 rejected due to DB slot constraint
        mockMvc.perform(put("/api/v1/admin/dynamic-config/user.max_accounts_per_email")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDynamicSystemConfigRequest("4"))))
                .andExpect(status().isBadRequest());

        // Unknown key returns 404
        mockMvc.perform(put("/api/v1/admin/dynamic-config/non.existent.key")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDynamicSystemConfigRequest("123"))))
                .andExpect(status().isNotFound());

        // Lower lockout threshold live from 5 -> 2 and verify account locks on 2nd failed attempt
        mockMvc.perform(put("/api/v1/admin/dynamic-config/security.lockout_max_attempts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDynamicSystemConfigRequest("2"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.value").value("2"));

        LoginRequest wrongLogin = LoginRequest.builder()
                .usernameOrEmail("dyn_user")
                .password("WrongPass!")
                .build();

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongLogin)))
                    .andExpect(status().isUnauthorized());
        }

        User updatedUser = userRepository.findById(regularUser.getId()).orElseThrow();
        assertThat(updatedUser.getFailedLoginAttempts()).isEqualTo(2);
        assertThat(updatedUser.getLockoutUntil()).isNotNull();

        // Reset all resets security.lockout_max_attempts back to 5
        mockMvc.perform(post("/api/v1/admin/dynamic-config/reset")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.key=='security.lockout_max_attempts')].value", hasItem("5")));
    }
}

