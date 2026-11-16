package com.instagramclone.feed;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.admin.dto.request.UpdateFeedConfigRequest;
import com.instagramclone.feed.dto.request.FeedSeenRequest;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.enums.PostVisibility;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Dynamic Feed Config & Telemetry Integration Tests")
class DynamicFeedConfigIntegrationTest extends BaseIntegrationTest {

    private User admin;
    private User regularUser;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        admin = userRepository.save(User.builder()
                .username("feed_admin")
                .email("admin@feedtest.com")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ROLE_ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        regularUser = userRepository.save(User.builder()
                .username("feed_viewer")
                .email("viewer@feedtest.com")
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

    @Test
    @DisplayName("Admin can retrieve and update dynamic feed config; Non-admin receives 403")
    void testDynamicFeedConfigAdminEndpoints() throws Exception {
        // 1. Retrieve default feed config
        mockMvc.perform(get("/api/v1/admin/feed/config")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.weightShare").value(4.0))
                .andExpect(jsonPath("$.data.postsPerReel").value(3));

        // 2. Update feed config
        UpdateFeedConfigRequest updateReq = UpdateFeedConfigRequest.builder()
                .weightShare(6.0)
                .weightSave(4.5)
                .weightComment(3.0)
                .weightLike(1.0)
                .authorAffinityWeight(30.0)
                .topicAffinityWeight(25.0)
                .followingBonus(20.0)
                .recencyGravityDecay(1.1)
                .antiClusteringWindow(5)
                .postsPerReel(4)
                .seenPostPenaltyMultiplier(0.15)
                .suggestedCreatorsInterval(8)
                .allCaughtUpHoursThreshold(48)
                .build();

        mockMvc.perform(put("/api/v1/admin/feed/config")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.weightShare").value(6.0))
                .andExpect(jsonPath("$.data.postsPerReel").value(4))
                .andExpect(jsonPath("$.data.seenPostPenaltyMultiplier").value(0.15));

        // 3. Non-admin receives 403 Forbidden
        mockMvc.perform(get("/api/v1/admin/feed/config")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User can record seen impressions and mark posts not-interested")
    void testSeenAndNotInterestedEndpoints() throws Exception {
        User creator = userRepository.save(User.builder()
                .username("content_creator")
                .email("creator@feedtest.com")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        Post post = postRepository.save(Post.builder()
                .user(creator)
                .caption("Awesome tech post #coding")
                .visibility(PostVisibility.PUBLIC)
                .isDeleted(false)
                .isArchived(false)
                .createdAt(LocalDateTime.now())
                .build());

        // 1. Record seen impression
        FeedSeenRequest seenRequest = FeedSeenRequest.builder()
                .itemIds(List.of(post.getId()))
                .build();

        mockMvc.perform(post("/api/v1/feed/seen")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(seenRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Seen impressions recorded successfully"));

        // 2. Mark not interested
        mockMvc.perform(post("/api/v1/feed/items/" + post.getId() + "/not-interested?itemType=POST")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Item marked as not interested"));
    }
}

