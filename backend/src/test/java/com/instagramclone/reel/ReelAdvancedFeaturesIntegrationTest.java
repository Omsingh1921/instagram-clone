package com.instagramclone.reel;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.follow.entity.Follow;
import com.instagramclone.reel.dto.request.CreateReelRequest;
import com.instagramclone.reel.dto.request.UpdateReelRequest;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.enums.ReelStatus;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserBlock;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.UserStatus;
import java.util.UUID;
import com.instagramclone.reel.dto.request.CreateReelReportRequest;
import com.instagramclone.engagement.dto.request.CreateCollectionRequest;
import com.instagramclone.engagement.dto.request.UpdateCollectionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReelAdvancedFeaturesIntegrationTest extends BaseIntegrationTest {

    private User publicCreator;
    private User privateCreator;
    private User viewer;
    private User followerViewer;
    private User blockedViewer;

    private String publicCreatorToken;
    private String privateCreatorToken;
    private String viewerToken;
    private String followerViewerToken;
    private String blockedViewerToken;

    private Reel publicReel;
    private Reel privateReel;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        publicCreator = userRepository.save(User.builder()
                .username("public_creator")
                .email("public_creator@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        privateCreator = userRepository.save(User.builder()
                .username("private_creator")
                .email("private_creator@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        viewer = userRepository.save(User.builder()
                .username("reel_viewer_one")
                .email("viewer_one@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        followerViewer = userRepository.save(User.builder()
                .username("reel_follower_viewer")
                .email("follower_viewer@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        blockedViewer = userRepository.save(User.builder()
                .username("reel_blocked_viewer")
                .email("blocked_viewer@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(publicCreator)
                .isPrivate(false)
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(privateCreator)
                .isPrivate(true)
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(viewer)
                .isPrivate(false)
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(followerViewer)
                .isPrivate(false)
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(blockedViewer)
                .isPrivate(false)
                .build());

        // followerViewer follows privateCreator
        followRepository.save(Follow.builder()
                .follower(followerViewer)
                .following(privateCreator)
                .build());

        // publicCreator blocks blockedViewer
        userBlockRepository.save(UserBlock.builder()
                .blocker(publicCreator)
                .blocked(blockedViewer)
                .build());

        publicCreatorToken = jwtTokenProvider.generateTokenForUser(publicCreator.getId(), publicCreator.getUsername(), publicCreator.getEmail());
        privateCreatorToken = jwtTokenProvider.generateTokenForUser(privateCreator.getId(), privateCreator.getUsername(), privateCreator.getEmail());
        viewerToken = jwtTokenProvider.generateTokenForUser(viewer.getId(), viewer.getUsername(), viewer.getEmail());
        followerViewerToken = jwtTokenProvider.generateTokenForUser(followerViewer.getId(), followerViewer.getUsername(), followerViewer.getEmail());
        blockedViewerToken = jwtTokenProvider.generateTokenForUser(blockedViewer.getId(), blockedViewer.getUsername(), blockedViewer.getEmail());

        publicReel = reelRepository.save(Reel.builder()
                .user(publicCreator)
                .videoUrl("https://cloudinary.com/test/public_reel.mp4")
                .caption("Public viral reel")
                .durationMs(12000L)
                .status(ReelStatus.READY)
                .build());

        privateReel = reelRepository.save(Reel.builder()
                .user(privateCreator)
                .videoUrl("https://cloudinary.com/test/private_reel.mp4")
                .caption("Private personal reel")
                .durationMs(15000L)
                .status(ReelStatus.READY)
                .build());
    }

    @Test
    @DisplayName("Who Liked This Reel - Return users who liked reel with follow state")
    void getReelLikes_ShouldReturnFollowUserResponses() throws Exception {
        // Viewer and followerViewer like publicReel
        mockMvc.perform(post("/api/v1/reels/{reelId}/like", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/reels/{reelId}/like", publicReel.getId())
                        .header("Authorization", "Bearer " + followerViewerToken))
                .andExpect(status().isOk());

        // publicCreator also follows followerViewer to test followedByCurrentUser flag
        followRepository.save(Follow.builder()
                .follower(publicCreator)
                .following(followerViewer)
                .build());

        // publicCreator fetches who liked their reel
        mockMvc.perform(get("/api/v1/reels/{reelId}/likes", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[?(@.username == 'reel_follower_viewer')].followedByCurrentUser").value(true))
                .andExpect(jsonPath("$.data.content[?(@.username == 'reel_viewer_one')].followedByCurrentUser").value(false));
    }

    @Test
    @DisplayName("Who Liked This Reel - Enforces privacy and block access rules")
    void getReelLikes_ShouldEnforcePrivacyAndBlockChecks() throws Exception {
        // followerViewer likes privateReel
        mockMvc.perform(post("/api/v1/reels/{reelId}/like", privateReel.getId())
                        .header("Authorization", "Bearer " + followerViewerToken))
                .andExpect(status().isOk());

        // Stranger viewer (non-follower) attempts to get likes on private reel -> 403 Forbidden
        mockMvc.perform(get("/api/v1/reels/{reelId}/likes", privateReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());

        // Blocked viewer attempts to get likes on public reel -> 404 Not Found
        mockMvc.perform(get("/api/v1/reels/{reelId}/likes", publicReel.getId())
                        .header("Authorization", "Bearer " + blockedViewerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Global Reels Feed - Excludes private accounts for strangers and excludes blocked users")
    void getReelsFeed_ShouldFilterPrivateAndBlockedAccounts() throws Exception {
        // 1. Stranger viewer fetches global feed:
        // Must see publicReel, but MUST NOT see privateReel!
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.caption == 'Public viral reel')]").exists())
                .andExpect(jsonPath("$.data.content[?(@.caption == 'Private personal reel')]").doesNotExist());

        // 2. followerViewer (who follows privateCreator) fetches global feed:
        // Should see BOTH publicReel and privateReel!
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + followerViewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.caption == 'Public viral reel')]").exists())
                .andExpect(jsonPath("$.data.content[?(@.caption == 'Private personal reel')]").exists());

        // 3. blockedViewer (blocked by publicCreator) fetches global feed:
        // Must NOT see publicReel!
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + blockedViewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.caption == 'Public viral reel')]").doesNotExist());
    }

    @Test
    @DisplayName("Reel Creation - Duration Bounds Validation (3s - 90s)")
    void createReel_ShouldValidateDurationBounds() throws Exception {
        // Less than 3s (e.g. 2,000ms) -> 400 Bad Request
        CreateReelRequest tooShort = CreateReelRequest.builder()
                .videoUrl("https://cloudinary.com/test/too_short.mp4")
                .caption("Too short")
                .durationMs(2000L)
                .build();

        mockMvc.perform(post("/api/v1/reels")
                        .header("Authorization", "Bearer " + publicCreatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tooShort)))
                .andExpect(status().isBadRequest());

        // More than 90s (e.g. 95,000ms) -> 400 Bad Request
        CreateReelRequest tooLong = CreateReelRequest.builder()
                .videoUrl("https://cloudinary.com/test/too_long.mp4")
                .caption("Too long")
                .durationMs(95000L)
                .build();

        mockMvc.perform(post("/api/v1/reels")
                        .header("Authorization", "Bearer " + publicCreatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tooLong)))
                .andExpect(status().isBadRequest());

        // Valid duration (15,000ms) -> 201 Created
        CreateReelRequest validReel = CreateReelRequest.builder()
                .videoUrl("https://cloudinary.com/test/valid.mp4")
                .caption("Valid reel")
                .durationMs(15000L)
                .build();

        mockMvc.perform(post("/api/v1/reels")
                        .header("Authorization", "Bearer " + publicCreatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReel)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.durationMs").value(15000));
    }

    @Test
    @DisplayName("Archive & Unarchive Reel - Hides from feed, visible in archived list, restores on unarchive")
    void archiveAndUnarchiveReel_ShouldToggleVisibility() throws Exception {
        // 1. Creator archives publicReel -> 200 OK with isArchived = true
        mockMvc.perform(put("/api/v1/reels/{reelId}/archive", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isArchived").value(true));

        // 2. Stranger viewer checks global feed -> publicReel must NOT be present
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").doesNotExist());

        // 3. Creator checks archived reels -> publicReel must be present
        mockMvc.perform(get("/api/v1/reels/archived")
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists());

        // 4. Stranger viewer tries to access creator's archived reels -> 200 with empty list (only owner's reels)
        mockMvc.perform(get("/api/v1/reels/archived")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());

        // 5. Creator unarchives publicReel -> 200 OK with isArchived = false
        mockMvc.perform(put("/api/v1/reels/{reelId}/archive", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isArchived").value(false));

        // 6. Global feed now includes publicReel again
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists());
    }

    @Test
    @DisplayName("Soft-Delete, 30-Day Recovery & Permanent Deletion Lifecycle")
    void softDeleteLifecycle_ShouldSupportRecentlyDeletedRestoreAndPermanentDelete() throws Exception {
        // 1. Creator soft-deletes publicReel -> 200 OK
        mockMvc.perform(delete("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk());

        // 2. Excluded from global feed
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").doesNotExist());

        // 3. Appears in creator's Recently Deleted with daysRemainingUntilPermanentDelete = 30
        mockMvc.perform(get("/api/v1/reels/recently-deleted")
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists())
                .andExpect(jsonPath("$.data.content[0].daysRemainingUntilPermanentDelete").value(30));

        // 4. Non-owner cannot see it in recently deleted
        mockMvc.perform(get("/api/v1/reels/recently-deleted")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());

        // 5. Restore reel -> 200 OK
        mockMvc.perform(post("/api/v1/reels/{reelId}/restore", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk());

        // 6. Global feed has the restored reel
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists());

        // 7. Re-delete and permanently purge
        mockMvc.perform(delete("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/reels/{reelId}/permanent", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk());

        // 8. Outside illusion: Direct lookup returns 404 Not Found
        mockMvc.perform(get("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isNotFound());

        // 9. Absent from Recently Deleted list
        mockMvc.perform(get("/api/v1/reels/recently-deleted")
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").doesNotExist());

        // 10. Attempting restore returns 404 Not Found
        mockMvc.perform(post("/api/v1/reels/{reelId}/restore", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isNotFound());

        // 11. In DB: Row remains soft-deleted and marked as permanently deleted (assets preserved)
        Reel softPurgedReel = reelRepository.findById(publicReel.getId()).orElseThrow();
        assertThat(softPurgedReel.getIsDeleted()).isTrue();
        assertThat(softPurgedReel.isPermanentlyDeleted()).isTrue();
        assertThat(softPurgedReel.getPermanentlyDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("Save & Unsave Reel - Tracks in Saved Reels subtab")
    void saveAndUnsaveReel_ShouldTrackSavedReels() throws Exception {
        // 1. Viewer saves publicReel -> 200 OK with saved = true
        mockMvc.perform(post("/api/v1/reels/{reelId}/save", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.saved").value(true));

        // 2. Viewer fetches saved reels -> publicReel is present with savedByCurrentUser = true
        mockMvc.perform(get("/api/v1/reels/saved")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists())
                .andExpect(jsonPath("$.data.content[0].savedByCurrentUser").value(true));

        // 3. Viewer un-saves publicReel -> 200 OK with saved = false
        mockMvc.perform(post("/api/v1/reels/{reelId}/save", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.saved").value(false));

        // 4. Saved list is now empty
        mockMvc.perform(get("/api/v1/reels/saved")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").doesNotExist());
    }

    @Test
    @DisplayName("Update Reel - Author can edit caption and location; non-author is forbidden")
    void updateReel_ShouldUpdateCaptionAndLocation() throws Exception {
        UpdateReelRequest updateRequest = UpdateReelRequest.builder()
                .caption("Updated caption #reels")
                .location("Bandra, Mumbai")
                .hideLikeCount(true)
                .commentsDisabled(true)
                .build();

        // 1. Non-author attempts update -> 403 Forbidden
        mockMvc.perform(put("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());

        // 2. Author updates reel -> 200 OK with updated attributes
        mockMvc.perform(put("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.caption").value("Updated caption #reels"))
                .andExpect(jsonPath("$.data.location").value("Bandra, Mumbai"))
                .andExpect(jsonPath("$.data.hideLikeCount").value(true))
                .andExpect(jsonPath("$.data.commentsDisabled").value(true));
    }

    @Test
    @DisplayName("Reel Draft Lifecycle - Save as Draft, Exclude from Feed, and Publish")
    void draftLifecycle_ShouldSaveAndPublish() throws Exception {
        CreateReelRequest draftRequest = CreateReelRequest.builder()
                .videoUrl("https://cloudinary.com/test/draft_reel.mp4")
                .caption("My work in progress reel")
                .durationMs(10000L)
                .build();

        // 1. Creator saves reel as draft -> 201 Created with status DRAFT
        String draftRes = mockMvc.perform(post("/api/v1/reels/drafts")
                        .header("Authorization", "Bearer " + publicCreatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(draftRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();

        String draftIdStr = objectMapper.readTree(draftRes).path("data").path("id").asText();
        UUID draftId = UUID.fromString(draftIdStr);

        // 2. Draft appears in creator's drafts list -> 200 OK
        mockMvc.perform(get("/api/v1/reels/drafts")
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + draftId + "')]").exists());

        // 3. Draft must NOT appear in global reels feed for viewer
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + draftId + "')]").doesNotExist());

        // 4. Non-owner cannot publish creator's draft -> 403 Forbidden
        mockMvc.perform(put("/api/v1/reels/{reelId}/publish", draftId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());

        // 5. Creator publishes the draft -> 200 OK with status READY
        mockMvc.perform(put("/api/v1/reels/{reelId}/publish", draftId)
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("READY"));

        // 6. Reel now appears in global feed!
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + draftId + "')]").exists());
    }

    @Test
    @DisplayName("Not Interested Signal - Suppresses Reel from Viewer Feed and Allows Removal")
    void notInterested_ShouldSuppressFromFeed() throws Exception {
        // 1. Initial state: viewer sees publicReel in global feed
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists());

        // 2. Viewer marks publicReel as not interested -> 200 OK
        mockMvc.perform(post("/api/v1/reels/{reelId}/not-interested", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk());

        // 3. Viewer checks feed again -> publicReel must be suppressed!
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").doesNotExist());

        // 4. Other users (e.g. followerViewer) are not affected and still see publicReel
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + followerViewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists());

        // 5. Viewer undoes / removes not interested -> 200 OK
        mockMvc.perform(delete("/api/v1/reels/{reelId}/not-interested", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk());

        // 6. Viewer feed now includes publicReel again
        mockMvc.perform(get("/api/v1/reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicReel.getId() + "')]").exists());
    }

    @Test
    @DisplayName("Delete Feature - Soft-deleted reel returns 404 when requested by direct ID for non-admin viewers")
    void deleteReel_SoftDelete_ShouldHideFromDirectIdForNonAdmin() throws Exception {
        // Creator soft-deletes publicReel
        mockMvc.perform(delete("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk());

        // Stranger/viewer attempts to access soft-deleted reel directly -> 404 NOT FOUND
        mockMvc.perform(get("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Archive Feature - Archived reel returns 404 to strangers, visible to owner, and restored via explicit DELETE unarchive")
    void archiveReel_ShouldBlockStrangersViaDirectId_AndUnarchiveRestores() throws Exception {
        // 1. Creator archives publicReel
        mockMvc.perform(put("/api/v1/reels/{reelId}/archive", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isArchived").value(true));

        // 2. Stranger attempts to fetch archived reel -> 404 NOT FOUND
        mockMvc.perform(get("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isNotFound());

        // 3. Creator fetches their own archived reel -> 200 OK
        mockMvc.perform(get("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isArchived").value(true));

        // 4. Creator checks alias endpoint GET /api/v1/users/me/archived-reels -> 200 OK
        mockMvc.perform(get("/api/v1/users/me/archived-reels")
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(publicReel.getId().toString()));

        // 5. Creator explicitly unarchives reel via DELETE /api/v1/reels/{id}/archive
        mockMvc.perform(delete("/api/v1/reels/{reelId}/archive", publicReel.getId())
                        .header("Authorization", "Bearer " + publicCreatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isArchived").value(false));

        // 6. Stranger can now view the unarchived reel again
        mockMvc.perform(get("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isArchived").value(false));
    }

    @Test
    @DisplayName("Save Feature - Explicit DELETE unsave, toggle, and GET /api/v1/users/me/saved-reels alias work cleanly")
    void saveAndUnsaveReel_ExplicitDeleteAndUserMeSavedAlias_ShouldWork() throws Exception {
        // 1. Viewer saves publicReel
        mockMvc.perform(post("/api/v1/reels/{reelId}/save", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.saved").value(true));

        // 2. Check alias endpoint GET /api/v1/users/me/saved-reels
        mockMvc.perform(get("/api/v1/users/me/saved-reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(publicReel.getId().toString()));

        // 3. Viewer explicitly unsaves reel via DELETE /api/v1/reels/{id}/save
        mockMvc.perform(delete("/api/v1/reels/{reelId}/save", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk());

        // 4. Saved list is now empty
        mockMvc.perform(get("/api/v1/users/me/saved-reels")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    @Test
    @DisplayName("Report Feature - Report reel creates open case, and duplicate submission returns 409 Conflict")
    void reportReel_ShouldCreateReportAndBlockDuplicateSubmission() throws Exception {
        CreateReelReportRequest req = CreateReelReportRequest.builder()
                .reasonCode("SPAM")
                .description("Suspicious advertising in video")
                .build();

        // 1. Viewer reports publicCreator's reel -> 201 CREATED
        mockMvc.perform(post("/api/v1/reels/{reelId}/reports", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.targetType").value("REEL"))
                .andExpect(jsonPath("$.data.targetId").value(publicReel.getId().toString()))
                .andExpect(jsonPath("$.data.status").value("OPEN"));

        // 2. Viewer attempts duplicate report -> 409 CONFLICT
        mockMvc.perform(post("/api/v1/reels/{reelId}/reports", publicReel.getId())
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());

        // 3. Reel itself remains completely accessible to other viewers (reporting does NOT auto-delete)
        mockMvc.perform(get("/api/v1/reels/{reelId}", publicReel.getId())
                        .header("Authorization", "Bearer " + followerViewerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Collection Feature - Rename collection and fetch paginated collection reels")
    void collectionLifecycle_RenameAndGetCollectionReels_ShouldWork() throws Exception {
        // 1. Viewer creates collection
        CreateCollectionRequest createReq = CreateCollectionRequest.builder()
                .name("Old Reels Collection")
                .build();

        String res = mockMvc.perform(post("/api/v1/collections")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String collectionId = objectMapper.readTree(res).path("data").path("id").asText();

        // 2. Viewer adds publicReel to collection
        mockMvc.perform(post("/api/v1/collections/{id}/items", collectionId)
                        .param("reelId", publicReel.getId().toString())
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk());

        // 3. Fetch collection reels -> 1 reel returned
        mockMvc.perform(get("/api/v1/collections/{id}/reels", collectionId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(publicReel.getId().toString()));

        // 4. Rename collection via PUT /api/v1/collections/{id}
        UpdateCollectionRequest updateReq = UpdateCollectionRequest.builder()
                .name("Top Comedy Reels")
                .build();

        mockMvc.perform(put("/api/v1/collections/{id}", collectionId)
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Top Comedy Reels"));
    }
}
