package com.instagramclone.user;

import java.util.UUID;
import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.admin.dto.request.CreateReportRequest;
import com.instagramclone.admin.dto.request.ResolveReportRequest;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.auth.dto.request.ChangePasswordRequest;
import com.instagramclone.user.dto.request.UpdateSettingsRequest;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SettingsAdminIntegrationTest extends BaseIntegrationTest {

        private User regularUser;
        private User adminUser;
        private String userToken;
        private String adminToken;

        @BeforeEach
        void setUp() {
                cleanDatabase();

                regularUser = userRepository.save(User.builder()
                                .username("regular_user")
                                .email("regular@example.com")
                                .passwordHash(passwordEncoder.encode("CurrentPass123!"))
                                .status(UserStatus.ACTIVE)
                                .emailVerified(true)
                                .role(Role.ROLE_USER)
                                .build());

                adminUser = userRepository.save(User.builder()
                                .username("admin_user")
                                .email("admin@example.com")
                                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                                .status(UserStatus.ACTIVE)
                                .emailVerified(true)
                                .role(Role.ROLE_ADMIN)
                                .build());

                userToken = jwtTokenProvider.generateTokenForUser(regularUser.getId(), regularUser.getUsername(),
                                regularUser.getEmail());
                adminToken = jwtTokenProvider.generateTokenForUser(adminUser.getId(), adminUser.getUsername(),
                                adminUser.getEmail());
        }

        @Test
        @DisplayName("Settings - Fetch and update privacy and notification settings")
        void settings_ShouldUpdateSuccessfully() throws Exception {
                // Fetch initial
                mockMvc.perform(get("/api/v1/users/me/settings")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.privacy.privateAccount").value(false));

                // Update to private
                UpdateSettingsRequest updateReq = UpdateSettingsRequest.builder()
                                .privateAccount(true)
                                .notifyLikes(false)
                                .build();

                mockMvc.perform(put("/api/v1/users/me/settings")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.privacy.privateAccount").value(true))
                                .andExpect(jsonPath("$.data.notifications.likes").value(false));
        }

        @Test
        @DisplayName("Password Change - Should validate old password and reject bad credentials")
        void changePassword_ShouldEnforceSecurityRules() throws Exception {
                // Wrong old password -> 400
                ChangePasswordRequest wrongOld = ChangePasswordRequest.builder()
                                .currentPassword("WrongPassword123!")
                                .newPassword("BrandNewPass123!")
                                .confirmPassword("BrandNewPass123!")
                                .build();

                mockMvc.perform(put("/api/v1/users/me/password")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(wrongOld)))
                                .andExpect(status().isBadRequest());

                // Correct old password -> success
                ChangePasswordRequest legit = ChangePasswordRequest.builder()
                                .currentPassword("CurrentPass123!")
                                .newPassword("BrandNewPass123!")
                                .confirmPassword("BrandNewPass123!")
                                .build();

                mockMvc.perform(put("/api/v1/users/me/password")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(legit)))
                                .andExpect(status().isOk());

                User reloaded = userRepository.findById(regularUser.getId()).orElseThrow();
                assertThat(passwordEncoder.matches("BrandNewPass123!", reloaded.getPasswordHash())).isTrue();
        }

        @Test
        @DisplayName("Admin - Regular user cannot access admin report queue; Admin can resolve report")
        void adminEndpoints_ShouldEnforceRoleSecurity() throws Exception {
                // User creates a report
                CreateReportRequest reportReq = CreateReportRequest.builder()
                                .targetType(ReportTargetType.USER)
                                .targetId(adminUser.getId())
                                .reasonCode("SPAM")
                                .description("Suspicious automated activity")
                                .build();

                String reportJson = mockMvc.perform(post("/api/v1/reports")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reportReq)))
                                .andExpect(status().isCreated())
                                .andReturn().getResponse().getContentAsString();

                UUID reportId = UUID.fromString(objectMapper.readTree(reportJson).get("data").get("id").asText());

                // Regular user cannot view admin reports -> 403 Forbidden
                mockMvc.perform(get("/api/v1/admin/reports")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isForbidden());

                // Admin can view and resolve
                mockMvc.perform(get("/api/v1/admin/reports")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.content[0].reasonCode").value("SPAM"));

                ResolveReportRequest resolveReq = ResolveReportRequest.builder()
                                .status(ReportStatus.RESOLVED)
                                .resolutionNotes("Verified, no violation found")
                                .build();

                mockMvc.perform(put("/api/v1/admin/reports/{reportId}", reportId)
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(resolveReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.status").value("RESOLVED"));
        }

        @Test
        @DisplayName("Screen Time & Break Reminder - Should record heartbeats, compute 7-day summary, and persist break reminder")
        void screenTimeAndBreakReminder_ShouldPersistAndAggregate() throws Exception {
                // Persist valid break reminder interval (20 minutes)
                UpdateSettingsRequest reminderReq = UpdateSettingsRequest.builder()
                                .breakReminderMinutes(20)
                                .build();

                mockMvc.perform(put("/api/v1/users/me/settings")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reminderReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.breakReminderMinutes").value(20));

                // Reject invalid break reminder interval
                UpdateSettingsRequest badReminderReq = UpdateSettingsRequest.builder()
                                .breakReminderMinutes(15)
                                .build();

                mockMvc.perform(put("/api/v1/users/me/settings")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(badReminderReq)))
                                .andExpect(status().isBadRequest());

                // Record two heartbeats for today (60s + 120s = 180s = 3m)
                String today = java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString();
                String hb1 = "{\"activeSeconds\":60,\"usageDate\":\"" + today + "\"}";
                String hb2 = "{\"activeSeconds\":120,\"usageDate\":\"" + today + "\"}";

                mockMvc.perform(post("/api/v1/users/me/screen-time/heartbeat")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(hb1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.todaySeconds").value(60));

                mockMvc.perform(post("/api/v1/users/me/screen-time/heartbeat")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(hb2))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.todaySeconds").value(180))
                                .andExpect(jsonPath("$.data.todayMinutes").value(3));

                // Retrieve 7-day summary
                mockMvc.perform(get("/api/v1/users/me/screen-time")
                                .param("days", "7")
                                .param("today", today)
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.daysRequested").value(7))
                                .andExpect(jsonPath("$.data.todayMinutes").value(3))
                                .andExpect(jsonPath("$.data.breakReminderMinutes").value(20))
                                .andExpect(jsonPath("$.data.dailyBreakdown.length()").value(7))
                                .andExpect(jsonPath("$.data.dailyBreakdown[6].seconds").value(180))
                                .andExpect(jsonPath("$.data.dailyBreakdown[6].minutes").value(3));
        }

        @Test
        @DisplayName("Account History - Separate endpoints return only creation date and password change summary")
        void accountHistoryEndpoints_ShouldReturnMinimalDataSeparately() throws Exception {
                // 1. Account creation date
                mockMvc.perform(get("/api/v1/users/me/account-created")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.accountCreatedAt").isNotEmpty());

                // 2. Password history initially empty (0 changes)
                mockMvc.perform(get("/api/v1/users/me/password-history")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.changeCount").value(0))
                                .andExpect(jsonPath("$.data.lastChangedAt").doesNotExist());

                // 3. Seed unrelated action + two password updates for regularUser and one for adminUser
                auditLogRepository.save(com.instagramclone.audit.entity.AuditLog.builder()
                                .userId(regularUser.getId())
                                .action("LOGIN_SUCCESS")
                                .resourceType("USER")
                                .resourceId(regularUser.getId())
                                .build());
                auditLogRepository.save(com.instagramclone.audit.entity.AuditLog.builder()
                                .userId(adminUser.getId())
                                .action("PASSWORD_CHANGED")
                                .resourceType("USER")
                                .resourceId(adminUser.getId())
                                .build());
                auditLogRepository.save(com.instagramclone.audit.entity.AuditLog.builder()
                                .userId(regularUser.getId())
                                .action("PASSWORD_CHANGED")
                                .resourceType("USER")
                                .resourceId(regularUser.getId())
                                .build());
                com.instagramclone.audit.entity.AuditLog latestReset = auditLogRepository.save(
                                com.instagramclone.audit.entity.AuditLog.builder()
                                                .userId(regularUser.getId())
                                                .action("PASSWORD_RESET_COMPLETED")
                                                .resourceType("USER")
                                                .resourceId(regularUser.getId())
                                                .build());

                mockMvc.perform(get("/api/v1/users/me/password-history")
                                .header("Authorization", "Bearer " + userToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.changeCount").value(2))
                                .andExpect(jsonPath("$.data.lastChangedAt").isNotEmpty());

                assertThat(latestReset.getCreatedAt()).isNotNull();
        }
}
