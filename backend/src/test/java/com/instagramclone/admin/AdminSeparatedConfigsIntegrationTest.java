package com.instagramclone.admin;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.admin.dto.request.UpdateDeletionConfigRequest;
import com.instagramclone.admin.dto.request.UpdateFeatureFlagRequest;
import com.instagramclone.admin.dto.request.UpdateModerationConfigRequest;
import com.instagramclone.mail.dto.request.UpdateEmailServerConfigRequest;
import com.instagramclone.media.dto.request.UpdateMediaConfigRequest;
import com.instagramclone.reel.dto.request.CreateReelRequest;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.enums.ReelStatus;
import com.instagramclone.reel.service.interfaces.IReelService;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminSeparatedConfigsIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private IReelService reelService;

    private User admin;
    private User regularUser;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        admin = userRepository.save(User.builder()
                .username("config_admin")
                .email("admin@configs.test")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ROLE_ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        regularUser = userRepository.save(User.builder()
                .username("standard_user")
                .email("user@configs.test")
                .passwordHash(passwordEncoder.encode("UserPass123!"))
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        userSettingsRepository.save(UserSettings.builder().user(admin).isPrivate(false).build());
        userSettingsRepository.save(UserSettings.builder().user(regularUser).isPrivate(false).build());

        adminToken = jwtTokenProvider.generateTokenForUser(admin.getId(), admin.getUsername(), admin.getEmail());
        userToken = jwtTokenProvider.generateTokenForUser(regularUser.getId(), regularUser.getUsername(), regularUser.getEmail());
    }

    // ==================== 1. EMAIL SERVER CONFIG TESTS ====================

    @Test
    @DisplayName("Admin can retrieve, update, test, and reset Email Server SMTP configuration")
    void testEmailServerConfigLifecycle() throws Exception {
        // 1. Get default config
        mockMvc.perform(get("/api/v1/admin/email/server")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.host").value("smtp.gmail.com"))
                .andExpect(jsonPath("$.data.port").value(587))
                .andExpect(jsonPath("$.data.simulationMode").value(true));

        // 2. Update config
        UpdateEmailServerConfigRequest updateReq = UpdateEmailServerConfigRequest.builder()
                .providerName("SENDGRID")
                .host("smtp.sendgrid.net")
                .port(465)
                .username("apikey")
                .password("SG.supersecretkey123")
                .authEnabled(true)
                .starttlsEnabled(false)
                .sslEnabled(true)
                .connectionTimeoutMs(15000)
                .simulationMode(true)
                .rateLimitPerHour(2500)
                .build();

        mockMvc.perform(put("/api/v1/admin/email/server")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.providerName").value("SENDGRID"))
                .andExpect(jsonPath("$.data.host").value("smtp.sendgrid.net"))
                .andExpect(jsonPath("$.data.port").value(465))
                .andExpect(jsonPath("$.data.hasPassword").value(true))
                .andExpect(jsonPath("$.data.maskedPassword").value("********"));

        // 3. Test Email Handshake endpoint
        mockMvc.perform(post("/api/v1/admin/email/server/test")
                        .param("recipient", "admin@instagramclone.com")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 4. Reset to Default
        mockMvc.perform(post("/api/v1/admin/email/server/reset")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.host").value("smtp.gmail.com"))
                .andExpect(jsonPath("$.data.port").value(587));
    }

    // ==================== 2. DELETION & RETENTION CONFIG TESTS ====================

    @Test
    @DisplayName("Admin can retrieve and update deletion config; Reel service respects dynamic retention")
    void testDeletionConfigLifecycleAndIntegration() throws Exception {
        // 1. Get default deletion config
        mockMvc.perform(get("/api/v1/admin/deletion/config")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trashRetentionDays").value(30))
                .andExpect(jsonPath("$.data.pseudoPermanentEnabled").value(true));

        // 2. Update trash retention to 10 days
        UpdateDeletionConfigRequest updateReq = UpdateDeletionConfigRequest.builder()
                .trashRetentionDays(10)
                .pseudoPermanentEnabled(true)
                .mediaPurgeDelayDays(15)
                .legalHoldEnabled(false)
                .adminTakedownPreserveDays(180)
                .accountGraceDays(14)
                .cronBatchSize(250)
                .build();

        mockMvc.perform(put("/api/v1/admin/deletion/config")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trashRetentionDays").value(10))
                .andExpect(jsonPath("$.data.mediaPurgeDelayDays").value(15));

        // 3. Verify ReelService applies 10-day retention cutoff:
        // Create a reel soft-deleted 20 days ago (older than 10-day cutoff)
        Reel oldReel = Reel.builder()
                .user(regularUser)
                .videoUrl("https://res.cloudinary.com/test/video/upload/old_reel.mp4")
                .thumbnailUrl("https://res.cloudinary.com/test/image/upload/thumb.jpg")
                .caption("Old Deleted Reel")
                .status(ReelStatus.READY)
                .build();
        oldReel.softDelete();
        oldReel.setDeletedAt(LocalDateTime.now().minusDays(20));
        reelRepository.save(oldReel);

        // Reel soft-deleted 5 days ago (within 10-day cutoff)
        Reel freshReel = Reel.builder()
                .user(regularUser)
                .videoUrl("https://res.cloudinary.com/test/video/upload/fresh_reel.mp4")
                .thumbnailUrl("https://res.cloudinary.com/test/image/upload/thumb2.jpg")
                .caption("Fresh Deleted Reel")
                .status(ReelStatus.READY)
                .build();
        freshReel.softDelete();
        freshReel.setDeletedAt(LocalDateTime.now().minusDays(5));
        reelRepository.save(freshReel);

        // As regularUser, query recently deleted reels
        mockMvc.perform(get("/api/v1/reels/recently-deleted")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].caption").value("Fresh Deleted Reel"));
    }

    // ==================== 3. MEDIA CONFIG & PUBLIC ACCESS ====================

    @Test
    @DisplayName("Admin can update media config and public client endpoint is accessible without authentication")
    void testMediaConfigAndPublicAccess() throws Exception {
        // Public endpoint without token should succeed (200 OK)
        mockMvc.perform(get("/api/v1/media/config/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maxReelBytes").value(262144000L));

        // Admin updates maxReelDurationSec to 120
        UpdateMediaConfigRequest updateReq = UpdateMediaConfigRequest.builder()
                .maxReelBytes(524288000L)
                .maxPostBytes(209715200L)
                .maxReelDurationSec(120)
                .maxStoryDurationSec(60)
                .allowedMimeTypes("video/mp4,video/webm,image/jpeg,image/png")
                .build();

        mockMvc.perform(put("/api/v1/admin/media/config")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maxReelDurationSec").value(120));

        // Public endpoint reflects updated configuration immediately
        mockMvc.perform(get("/api/v1/media/config/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maxReelDurationSec").value(120));
    }

    // ==================== 4. FEATURE FLAGS & TOGGLE ENFORCEMENT ====================

    @Test
    @DisplayName("Admin can toggle feature flags; Reels creation is blocked when reelsUploadEnabled is false")
    void testFeatureFlagsToggleAndEnforcement() throws Exception {
        // Public endpoint returns active feature flags
        mockMvc.perform(get("/api/v1/features/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reelsUploadEnabled").value(true));

        // Admin disables reels creation
        UpdateFeatureFlagRequest updateReq = UpdateFeatureFlagRequest.builder()
                .reelsUploadEnabled(false)
                .storyCreationEnabled(true)
                .voiceMessagesEnabled(true)
                .maintenanceModeEnabled(false)
                .maintenanceMessage("Reel uploads temporarily paused.")
                .build();

        mockMvc.perform(put("/api/v1/admin/features/config")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reelsUploadEnabled").value(false));

        // Regular user attempts to create a reel -> blocked with 400 Bad Request
        CreateReelRequest createReq = CreateReelRequest.builder()
                .videoUrl("https://res.cloudinary.com/test/video/upload/v1/reel.mp4")
                .thumbnailUrl("https://res.cloudinary.com/test/thumb.jpg")
                .caption("Testing upload toggle")
                .durationMs(15000L)
                .build();

        mockMvc.perform(post("/api/v1/reels")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Reels creation is temporarily disabled by platform administrators."));

        // Re-enable reels creation
        updateReq.setReelsUploadEnabled(true);
        mockMvc.perform(put("/api/v1/admin/features/config")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reelsUploadEnabled").value(true));
    }

    // ==================== 5. MODERATION CONFIG & RBAC SECURITY ====================

    @Test
    @DisplayName("Admin can update moderation config; Non-admin user receives 403 Forbidden")
    void testModerationConfigAndRbacSecurity() throws Exception {
        // Admin updates moderation config
        UpdateModerationConfigRequest updateReq = UpdateModerationConfigRequest.builder()
                .autoQuarantineReportThreshold(12)
                .profanityBannedWords("scam,fraud,toxic,fake")
                .nsfwBlurThreshold(0.90)
                .copyrightStrikeLimit(5)
                .build();

        mockMvc.perform(put("/api/v1/admin/moderation/config")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.autoQuarantineReportThreshold").value(12))
                .andExpect(jsonPath("$.data.copyrightStrikeLimit").value(5));

        // Non-admin user receives 403 Forbidden on all config endpoints
        mockMvc.perform(get("/api/v1/admin/email/server")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/deletion/config")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/media/config")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/features/config")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/moderation/config")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}
