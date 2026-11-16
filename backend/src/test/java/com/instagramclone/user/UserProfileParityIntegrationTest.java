package com.instagramclone.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.auth.dto.request.LoginRequest;
import com.instagramclone.auth.dto.request.RegisterRequest;
import com.instagramclone.user.dto.request.UpdateProfileRequest;
import com.instagramclone.user.dto.request.VerifyUserRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserProfileParityIntegrationTest extends BaseIntegrationTest {

    private String userToken;
    private UUID userId;

    private String adminToken;
    private UUID adminId;

    @BeforeEach
    void setUp() throws Exception {
        cleanDatabase();

        // 1. Create standard test user
        String signupToken = createValidSignupTicket("peter@bugle.com");
        RegisterRequest register = RegisterRequest.builder()
                .signupToken(signupToken)
                .username("peter_parker")
                .password("Spidey2026!")
                .displayName("Spider-Man")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = LoginRequest.builder()
                .usernameOrEmail("peter_parker")
                .password("Spidey2026!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        this.userToken = root.path("data").path("accessToken").asText();
        this.userId = UUID.fromString(root.path("data").path("user").path("id").asText());

        // 2. Create admin user
        String adminSignupTicket = createValidSignupTicket("admin@instagramclone.internal");
        RegisterRequest adminRegister = RegisterRequest.builder()
                .signupToken(adminSignupTicket)
                .username("system_admin")
                .password("Spidey2026!")
                .displayName("System Admin")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminRegister)))
                .andExpect(status().isCreated());

        com.instagramclone.user.entity.User adminUser = userRepository.findByUsername("system_admin").orElseThrow();
        adminUser.setRole(com.instagramclone.user.enums.Role.ROLE_ADMIN);
        userRepository.save(adminUser);

        LoginRequest adminLogin = LoginRequest.builder()
                .usernameOrEmail("system_admin")
                .password("Spidey2026!")
                .build();

        MvcResult adminLoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode adminRoot = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString());
        this.adminToken = adminRoot.path("data").path("accessToken").asText();
        this.adminId = UUID.fromString(adminRoot.path("data").path("user").path("id").asText());
    }

    @Test
    @DisplayName("Update Profile: Pronouns & Gender should be saved and returned in profile response")
    void testUpdateProfile_PronounsAndGender_ShouldSucceed() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .displayName("Spider Hero")
                .pronouns("they/them")
                .gender("CUSTOM")
                .bio("Web-slinger in NYC")
                .build();

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.displayName").value("Spider Hero"))
                .andExpect(jsonPath("$.data.pronouns").value("they/them"))
                .andExpect(jsonPath("$.data.gender").value("CUSTOM"));

        // Verify retrieval via GET /users/me
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pronouns").value("they/them"))
                .andExpect(jsonPath("$.data.gender").value("CUSTOM"));
    }

    @Test
    @DisplayName("Username Policy: 14-day cooldown enforces reservation and allows reverting")
    void testUsernamePolicy_CooldownAndReversion() throws Exception {
        // Step 1: First change should succeed
        UpdateProfileRequest firstChange = UpdateProfileRequest.builder()
                .username("spidey_hero")
                .build();

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstChange)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("spidey_hero"))
                .andExpect(jsonPath("$.data.previousUsername").value("peter_parker"))
                .andExpect(jsonPath("$.data.canChangeUsername").value(false));

        // Step 2: Immediate change to a third username should be blocked by 14-day cooldown
        UpdateProfileRequest thirdChange = UpdateProfileRequest.builder()
                .username("spider_wall_crawler")
                .build();

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(thirdChange)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("14 days")));

        // Step 3: Reverting back to previous username (peter_parker) is allowed during cooldown
        UpdateProfileRequest revertChange = UpdateProfileRequest.builder()
                .username("peter_parker")
                .build();

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(revertChange)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("peter_parker"));
    }

    @Test
    @DisplayName("Username Anti-Sniping: Third-party cannot claim a reserved previous username within 14 days")
    void testUsernameAntiSniping_ReservedUsernameCannotBeClaimed() throws Exception {
        // User 1 changes username to spidey_hero, reserving peter_parker
        UpdateProfileRequest firstChange = UpdateProfileRequest.builder()
                .username("spidey_hero")
                .build();

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstChange)))
                .andExpect(status().isOk());

        // User 2 creates account and attempts to change their username to peter_parker
        String user2Ticket = createValidSignupTicket("eddie@dailyglobe.com");
        RegisterRequest user2Register = RegisterRequest.builder()
                .signupToken(user2Ticket)
                .username("eddie_brock")
                .password("Venom2026!")
                .displayName("Eddie Brock")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user2Register)))
                .andExpect(status().isCreated());

        LoginRequest user2Login = LoginRequest.builder()
                .usernameOrEmail("eddie_brock")
                .password("Venom2026!")
                .build();

        MvcResult u2LoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user2Login)))
                .andExpect(status().isOk())
                .andReturn();

        String user2Token = objectMapper.readTree(u2LoginResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // User 2 tries to claim peter_parker
        UpdateProfileRequest claimReserved = UpdateProfileRequest.builder()
                .username("peter_parker")
                .build();

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header("Authorization", "Bearer " + user2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(claimReserved)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This username is currently reserved"));
    }

    @Test
    @DisplayName("Avatar Removal: DELETE /api/v1/users/me/avatar removes avatar and resets to null")
    void testAvatarRemoval_ShouldResetToNull() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me/avatar")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Avatar removed successfully"))
                .andExpect(jsonPath("$.data.avatarUrl").doesNotExist());
    }

    @Test
    @DisplayName("Account Verification: Only ADMIN can verify accounts, normal users get 403")
    void testAdminVerification_RBAC() throws Exception {
        VerifyUserRequest verifyReq = VerifyUserRequest.builder()
                .verified(true)
                .build();

        // Regular user cannot verify accounts
        mockMvc.perform(patch("/api/v1/users/" + userId + "/verify")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isForbidden());

        // Admin can verify accounts
        mockMvc.perform(patch("/api/v1/users/" + userId + "/verify")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isVerified").value(true));

        // Verify public profile reflects blue badge
        mockMvc.perform(get("/api/v1/users/" + userId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isVerified").value(true));
    }

    @Test
    @DisplayName("Professional Account Options: Creator category, contact info, and visibility toggles")
    void testProfessionalProfileOptions() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .accountType("CREATOR")
                .category("Digital Creator")
                .showCategoryBadge(true)
                .contactEmail("contact@spidey.org")
                .contactPhone("+1-555-0199")
                .showContactInfo(true)
                .build();

        mockMvc.perform(put("/api/v1/users/me/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accountType").value("CREATOR"))
                .andExpect(jsonPath("$.data.category").value("Digital Creator"))
                .andExpect(jsonPath("$.data.showCategoryBadge").value(true))
                .andExpect(jsonPath("$.data.contactEmail").value("contact@spidey.org"))
                .andExpect(jsonPath("$.data.contactPhone").value("+1-555-0199"))
                .andExpect(jsonPath("$.data.showContactInfo").value(true));
    }
}

