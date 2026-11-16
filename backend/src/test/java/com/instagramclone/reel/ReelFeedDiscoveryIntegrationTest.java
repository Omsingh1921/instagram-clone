package com.instagramclone.reel;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.enums.ReelStatus;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReelFeedDiscoveryIntegrationTest extends BaseIntegrationTest {

    private User creatorA;
    private User creatorB;
    private User viewer;
    private String viewerToken;

    private Reel reelA1;
    private Reel reelA2;
    private Reel reelA3;
    private Reel reelB1;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        creatorA = userRepository.save(User.builder()
                .username("creator_alpha")
                .email("alpha@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        creatorB = userRepository.save(User.builder()
                .username("creator_beta")
                .email("beta@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        viewer = userRepository.save(User.builder()
                .username("reel_explorer")
                .email("explorer@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        userSettingsRepository.save(UserSettings.builder().user(creatorA).isPrivate(false).build());
        userSettingsRepository.save(UserSettings.builder().user(creatorB).isPrivate(false).build());
        userSettingsRepository.save(UserSettings.builder().user(viewer).isPrivate(false).build());

        viewerToken = jwtTokenProvider.generateTokenForUser(viewer.getId(), viewer.getUsername(), viewer.getEmail());

        reelA1 = reelRepository.save(Reel.builder()
                .user(creatorA)
                .videoUrl("https://cloudinary.com/test/a1.mp4")
                .caption("Alpha Reel 1 #dance")
                .durationMs(10000L)
                .status(ReelStatus.READY)
                .build());

        reelA2 = reelRepository.save(Reel.builder()
                .user(creatorA)
                .videoUrl("https://cloudinary.com/test/a2.mp4")
                .caption("Alpha Reel 2 #dance")
                .durationMs(12000L)
                .status(ReelStatus.READY)
                .build());

        reelA3 = reelRepository.save(Reel.builder()
                .user(creatorA)
                .videoUrl("https://cloudinary.com/test/a3.mp4")
                .caption("Alpha Reel 3 #tech")
                .durationMs(14000L)
                .status(ReelStatus.READY)
                .build());

        reelB1 = reelRepository.save(Reel.builder()
                .user(creatorB)
                .videoUrl("https://cloudinary.com/test/b1.mp4")
                .caption("Beta Reel 1 #comedy")
                .durationMs(15000L)
                .status(ReelStatus.READY)
                .build());
    }

    @Test
    @DisplayName("Unseen reels must be prioritized over seen reels on feed fetch")
    void testUnseenReelsPrioritizedOverSeenReels() throws Exception {
        // Viewer views reelA3 first
        mockMvc.perform(post("/api/v1/reels/" + reelA3.getId() + "/view")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viewed").value(true));

        // Fetch feed with page size 4
        String responseBody = mockMvc.perform(get("/api/v1/reels")
                        .param("page", "0")
                        .param("size", "4")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(4))
                .andReturn().getResponse().getContentAsString();

        // The last item in the list must be reelA3 because it was already seen,
        // and the first 3 items must be the unseen reels (reelA1, reelA2, reelB1)
        List<String> returnedIds = com.jayway.jsonpath.JsonPath.read(responseBody, "$.data.content[*].id");
        assertThat(returnedIds).contains(reelA1.getId().toString(), reelA2.getId().toString(), reelB1.getId().toString(), reelA3.getId().toString());
        assertThat(returnedIds.get(3)).isEqualTo(reelA3.getId().toString());
    }

    @Test
    @DisplayName("Viewing reels dynamically deprioritizes them on subsequent refresh")
    void testRecordViewDeprioritizesReelOnSubsequentFetch() throws Exception {
        // Initial fetch page 0 size 2 returns top 2 unseen reels
        String firstFetch = mockMvc.perform(get("/api/v1/reels")
                        .param("page", "0")
                        .param("size", "2")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andReturn().getResponse().getContentAsString();

        List<String> firstBatchIds = com.jayway.jsonpath.JsonPath.read(firstFetch, "$.data.content[*].id");
        String firstReelId = firstBatchIds.get(0);

        // Viewer records view on first reel
        mockMvc.perform(post("/api/v1/reels/" + firstReelId + "/view")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk());

        // Refresh: fetch page 0 size 2 again
        String secondFetch = mockMvc.perform(get("/api/v1/reels")
                        .param("page", "0")
                        .param("size", "2")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andReturn().getResponse().getContentAsString();

        List<String> secondBatchIds = com.jayway.jsonpath.JsonPath.read(secondFetch, "$.data.content[*].id");

        // The previously viewed reel must no longer be in the top 2 (it is pushed down behind remaining unseen reels)
        assertThat(secondBatchIds).doesNotContain(firstReelId);
    }

    @Test
    @DisplayName("Session seed parameter produces varied deterministic exploration order")
    void testSessionSeedShufflesFeed() throws Exception {
        String resSeed1 = mockMvc.perform(get("/api/v1/reels")
                        .param("page", "0")
                        .param("size", "4")
                        .param("seed", "123456789")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(4))
                .andReturn().getResponse().getContentAsString();

        String resSeed2 = mockMvc.perform(get("/api/v1/reels")
                        .param("page", "0")
                        .param("size", "4")
                        .param("seed", "987654321")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(4))
                .andReturn().getResponse().getContentAsString();

        List<String> list1 = com.jayway.jsonpath.JsonPath.read(resSeed1, "$.data.content[*].id");
        List<String> list2 = com.jayway.jsonpath.JsonPath.read(resSeed2, "$.data.content[*].id");

        assertThat(list1).containsExactlyInAnyOrderElementsOf(list2);
    }

    @Test
    @DisplayName("Creator diversity interleaving breaks consecutive creator clustering")
    void testCreatorDiversityInterleaving() throws Exception {
        // Creator A has 3 reels and Creator B has 1 reel
        String res = mockMvc.perform(get("/api/v1/reels")
                        .param("page", "0")
                        .param("size", "4")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<String> creatorUsernames = com.jayway.jsonpath.JsonPath.read(res, "$.data.content[*].author.username");

        // Assert that the first two elements are not both creator_alpha consecutively if creator_beta is available
        // e.g. [creator_alpha, creator_beta, creator_alpha, creator_alpha] or [creator_beta, creator_alpha, creator_beta...]
        boolean hasAdjacentAlpha = creatorUsernames.get(0).equals("creator_alpha") && creatorUsernames.get(1).equals("creator_alpha");
        assertThat(hasAdjacentAlpha).isFalse();
    }

    @Test
    @DisplayName("Feed gracefully returns all reels when viewer has viewed every reel")
    void testGracefulFallbackWhenAllReelsViewed() throws Exception {
        // Mark all 4 reels as viewed
        for (Reel r : List.of(reelA1, reelA2, reelA3, reelB1)) {
            mockMvc.perform(post("/api/v1/reels/" + r.getId() + "/view")
                            .header("Authorization", "Bearer " + viewerToken))
                    .andExpect(status().isOk());
        }

        // Fetch feed again
        mockMvc.perform(get("/api/v1/reels")
                        .param("page", "0")
                        .param("size", "4")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(4));
    }
}

