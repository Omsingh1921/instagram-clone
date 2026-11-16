package com.instagramclone.admin;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.admin.dto.request.CreateReportRequest;
import com.instagramclone.admin.dto.request.ResolveReportRequest;
import com.instagramclone.admin.dto.request.UpdateUserStatusRequest;
import com.instagramclone.admin.enums.ModerationAction;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.auth.dto.request.LoginRequest;
import com.instagramclone.auth.entity.RefreshToken;
import com.instagramclone.notification.entity.Notification;
import com.instagramclone.notification.enums.NotificationType;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.entity.PostMedia;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.enums.ReelStatus;
import com.instagramclone.story.entity.Story;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminModerationSecurityIntegrationTest extends BaseIntegrationTest {

    private User admin;
    private User creator;
    private User viewer;

    private String adminToken;
    private String creatorToken;
    private String viewerToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        admin = userRepository.save(User.builder()
                .username("system_admin")
                .email("admin@test.com")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ROLE_ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        creator = userRepository.save(User.builder()
                .username("content_creator")
                .email("creator@test.com")
                .passwordHash(passwordEncoder.encode("CreatorPass123!"))
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        viewer = userRepository.save(User.builder()
                .username("feed_viewer")
                .email("viewer@test.com")
                .passwordHash(passwordEncoder.encode("ViewerPass123!"))
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        userSettingsRepository.save(UserSettings.builder().user(admin).isPrivate(false).build());
        userSettingsRepository.save(UserSettings.builder().user(creator).isPrivate(false).build());
        userSettingsRepository.save(UserSettings.builder().user(viewer).isPrivate(false).build());

        adminToken = jwtTokenProvider.generateTokenForUser(admin.getId(), admin.getUsername(), admin.getEmail(), UUID.randomUUID(), "ROLE_ADMIN");
        creatorToken = jwtTokenProvider.generateTokenForUser(creator.getId(), creator.getUsername(), creator.getEmail());
        viewerToken = jwtTokenProvider.generateTokenForUser(viewer.getId(), viewer.getUsername(), viewer.getEmail());
    }

    @Test
    @DisplayName("Admin resolving report with CONTENT_TAKEDOWN on Reel enforces strict 404 for non-admins and sends notification")
    void testReelTakedownStrictAdminVisibilityAndNotification() throws Exception {
        Reel reel = reelRepository.save(Reel.builder()
                .user(creator)
                .videoUrl("https://cloudinary.com/test/copyright_reel.mp4")
                .caption("Copyrighted music reel")
                .durationMs(15000L)
                .status(ReelStatus.READY)
                .build());

        // Viewer reports the reel
        CreateReportRequest reportReq = CreateReportRequest.builder()
                .targetType(ReportTargetType.REEL)
                .targetId(reel.getId())
                .reasonCode("COPYRIGHT")
                .description("Infringing audio track")
                .build();

        String reportJson = mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID reportId = UUID.fromString(objectMapper.readTree(reportJson).path("data").path("id").asText());

        // Admin resolves report with REMOVE_CONTENT
        ResolveReportRequest resolveReq = ResolveReportRequest.builder()
                .status(ReportStatus.RESOLVED)
                .action(ModerationAction.REMOVE_CONTENT)
                .resolutionNotes("Confirmed copyright infringement takedown")
                .build();

        mockMvc.perform(put("/api/v1/admin/reports/" + reportId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"))
                .andExpect(jsonPath("$.data.action").value("REMOVE_CONTENT"));

        // Verify strict visibility: Viewer gets 404
        mockMvc.perform(get("/api/v1/reels/" + reel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isNotFound());

        // Verify strict visibility: Creator author gets 404
        mockMvc.perform(get("/api/v1/reels/" + reel.getId())
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isNotFound());

        // Verify strict visibility: Admin gets 200 OK (for moderation audits)
        mockMvc.perform(get("/api/v1/reels/" + reel.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(reel.getId().toString()));

        // Verify feed query does not return this soft-deleted reel
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + reel.getId() + "')]").doesNotExist());

        // Verify in-app CONTENT_REMOVED notification delivered to creator
        await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            List<Notification> notifs = notificationRepository.findAll();
            assertThat(notifs).anyMatch(n ->
                    n.getRecipient().getId().equals(creator.getId()) &&
                    n.getType() == NotificationType.CONTENT_REMOVED &&
                    reel.getId().equals(n.getReelId()));
        });
    }

    @Test
    @DisplayName("Admin resolving report with REMOVE_CONTENT on Post enforces strict 404 for non-admins and sends notification")
    void testPostTakedownStrictAdminVisibilityAndNotification() throws Exception {
        Post post = postRepository.save(Post.builder()
                .user(creator)
                .caption("Copyrighted image post")
                .build());

        PostMedia media = PostMedia.builder()
                .post(post)
                .mediaUrl("https://cloudinary.com/test/photo.jpg")
                .mediaType(com.instagramclone.post.enums.MediaType.IMAGE)
                .displayOrder(0)
                .build();
        postMediaRepository.save(media);

        // Viewer reports the post
        CreateReportRequest reportReq = CreateReportRequest.builder()
                .targetType(ReportTargetType.POST)
                .targetId(post.getId())
                .reasonCode("POLICY_VIOLATION")
                .description("Inappropriate image")
                .build();

        String reportJson = mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID reportId = UUID.fromString(objectMapper.readTree(reportJson).path("data").path("id").asText());

        // Admin resolves report with REMOVE_CONTENT
        ResolveReportRequest resolveReq = ResolveReportRequest.builder()
                .status(ReportStatus.RESOLVED)
                .action(ModerationAction.REMOVE_CONTENT)
                .resolutionNotes("Removed per policy guidelines")
                .build();

        mockMvc.perform(put("/api/v1/admin/reports/" + reportId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk());

        // Viewer gets 404
        mockMvc.perform(get("/api/v1/posts/" + post.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isNotFound());

        // Creator gets 404
        mockMvc.perform(get("/api/v1/posts/" + post.getId())
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isNotFound());

        // Admin gets 200 OK
        mockMvc.perform(get("/api/v1/posts/" + post.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(post.getId().toString()));

        // Verify in-app notification delivered
        await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            List<Notification> notifs = notificationRepository.findAll();
            assertThat(notifs).anyMatch(n ->
                    n.getRecipient().getId().equals(creator.getId()) &&
                    n.getType() == NotificationType.CONTENT_REMOVED &&
                    post.getId().equals(n.getPostId()));
        });
    }

    @Test
    @DisplayName("Admin direct delete on Post and Reel sends CONTENT_REMOVED notification to author")
    void testDirectAdminDeleteSendsNotification() throws Exception {
        Reel reel = reelRepository.save(Reel.builder()
                .user(creator)
                .videoUrl("https://cloudinary.com/test/direct_del.mp4")
                .caption("Direct delete reel")
                .durationMs(10000L)
                .status(ReelStatus.READY)
                .build());

        mockMvc.perform(delete("/api/v1/reels/" + reel.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            List<Notification> reelNotifs = notificationRepository.findAll();
            assertThat(reelNotifs).anyMatch(n ->
                    n.getRecipient().getId().equals(creator.getId()) &&
                    n.getType() == NotificationType.CONTENT_REMOVED &&
                    reel.getId().equals(n.getReelId()));
        });

        Post post = postRepository.save(Post.builder()
                .user(creator)
                .caption("Direct delete post")
                .build());

        mockMvc.perform(delete("/api/v1/posts/" + post.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            List<Notification> allNotifs = notificationRepository.findAll();
            assertThat(allNotifs).anyMatch(n ->
                    n.getRecipient().getId().equals(creator.getId()) &&
                    n.getType() == NotificationType.CONTENT_REMOVED &&
                    post.getId().equals(n.getPostId()));
        });

        Story story = storyRepository.save(Story.builder()
                .user(creator)
                .mediaUrl("https://cloudinary.com/test/direct_del_story.jpg")
                .mediaType(com.instagramclone.post.enums.MediaType.IMAGE)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .caption("Direct delete story")
                .build());

        // Admin can view user stories
        mockMvc.perform(get("/api/v1/users/" + creator.getId() + "/stories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Admin can delete user's story
        mockMvc.perform(delete("/api/v1/stories/" + story.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            List<Notification> allNotifs = notificationRepository.findAll();
            assertThat(allNotifs).anyMatch(n ->
                    n.getRecipient().getId().equals(creator.getId()) &&
                    n.getType() == NotificationType.CONTENT_REMOVED);
        });
    }

    @Test
    @DisplayName("Admin account suspension immediately revokes sessions, blocks login, and unsuspension restores access")
    void testAccountSuspensionAndUnsuspensionCycle() throws Exception {
        UUID sessionId = UUID.randomUUID();
        String activeUserToken = jwtTokenProvider.generateTokenForUser(creator.getId(), creator.getUsername(), creator.getEmail(), sessionId);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(creator)
                .sessionId(sessionId)
                .tokenHash("sample_refresh_token_hash")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build());

        // User can access protected endpoints before suspension
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + activeUserToken))
                .andExpect(status().isOk());

        // Admin suspends user
        UpdateUserStatusRequest suspendReq = UpdateUserStatusRequest.builder()
                .status(UserStatus.SUSPENDED)
                .build();

        mockMvc.perform(put("/api/v1/admin/users/" + creator.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk());

        // Refresh token is revoked
        List<RefreshToken> activeRefreshTokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(creator.getId());
        assertThat(activeRefreshTokens).isEmpty();

        // Active access token is immediately rejected
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + activeUserToken))
                .andExpect(status().isUnauthorized());

        // Login attempt is blocked with 403 Forbidden (ACCOUNT_SUSPENDED)
        LoginRequest loginReq = LoginRequest.builder()
                .usernameOrEmail(creator.getUsername())
                .password("CreatorPass123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(com.instagramclone.user.constants.UserConstants.ERR_ACCOUNT_SUSPENDED));

        // User receives ACCOUNT_SUSPENDED notification
        await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            List<Notification> suspendedNotifs = notificationRepository.findAll();
            assertThat(suspendedNotifs).anyMatch(n ->
                    n.getRecipient().getId().equals(creator.getId()) &&
                    n.getType() == NotificationType.ACCOUNT_SUSPENDED);
        });

        // Admin un-suspends user (status -> ACTIVE)
        UpdateUserStatusRequest unsuspendReq = UpdateUserStatusRequest.builder()
                .status(UserStatus.ACTIVE)
                .build();

        mockMvc.perform(put("/api/v1/admin/users/" + creator.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unsuspendReq)))
                .andExpect(status().isOk());

        // Login attempt succeeds now
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());

        // User receives ACCOUNT_UNSUSPENDED notification
        await().atMost(java.time.Duration.ofSeconds(5)).untilAsserted(() -> {
            List<Notification> reinstatedNotifs = notificationRepository.findAll();
            assertThat(reinstatedNotifs).anyMatch(n ->
                    n.getRecipient().getId().equals(creator.getId()) &&
                    n.getType() == NotificationType.ACCOUNT_UNSUSPENDED);
        });
    }

    @Test
    @DisplayName("Admin can view private user profile, posts, reels, stories and delete user account, while admin account deletion is rejected")
    void testAdminCanViewPrivateUserContentAndDeleteUserAccount() throws Exception {
        // Set creator account to private
        UserSettings settings = userSettingsRepository.findByUserId(creator.getId()).orElseThrow();
        settings.setPrivate(true);
        userSettingsRepository.save(settings);

        // Save a post, reel, and story for private user
        Post post = postRepository.save(Post.builder()
                .user(creator)
                .caption("Private user post")
                .build());

        Reel reel = reelRepository.save(Reel.builder()
                .user(creator)
                .videoUrl("https://cloudinary.com/test/private_reel.mp4")
                .caption("Private user reel")
                .status(ReelStatus.READY)
                .durationMs(12000L)
                .build());

        Story story = storyRepository.save(Story.builder()
                .user(creator)
                .mediaUrl("https://cloudinary.com/test/private_story.jpg")
                .mediaType(com.instagramclone.post.enums.MediaType.IMAGE)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .caption("Private user story")
                .build());

        // 1. Admin can view private user profile
        mockMvc.perform(get("/api/v1/users/" + creator.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("content_creator"));

        // 2. Admin can view private user's posts
        mockMvc.perform(get("/api/v1/users/" + creator.getId() + "/posts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isNotEmpty());

        // 3. Admin can view private user's reels
        mockMvc.perform(get("/api/v1/users/" + creator.getId() + "/reels")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isNotEmpty());

        // 4. Admin can view private user's stories
        mockMvc.perform(get("/api/v1/users/" + creator.getId() + "/stories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stories").isNotEmpty());

        // 5. Admin can delete user's account via /api/v1/admin/users/{userId}
        mockMvc.perform(delete("/api/v1/admin/users/" + creator.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        User deletedUser = userRepository.findById(creator.getId()).orElseThrow();
        assertThat(deletedUser.getIsDeleted()).isTrue();

        // 6. Admin attempting to delete own admin account or another admin is strictly rejected
        mockMvc.perform(delete("/api/v1/admin/users/" + admin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }
}
