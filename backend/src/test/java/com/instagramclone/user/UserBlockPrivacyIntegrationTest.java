package com.instagramclone.user;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.chat.dto.request.CreateConversationRequest;
import com.instagramclone.engagement.dto.request.CreateCommentRequest;
import com.instagramclone.follow.entity.Follow;
import com.instagramclone.follow.entity.FollowRequest;
import com.instagramclone.follow.enums.FollowRequestStatus;
import com.instagramclone.notification.entity.Notification;
import com.instagramclone.notification.enums.NotificationType;
import com.instagramclone.post.entity.Post;
import com.instagramclone.user.dto.request.BlockUserRequest;
import com.instagramclone.user.entity.CloseFriend;
import com.instagramclone.user.entity.Profile;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserBlock;
import com.instagramclone.user.enums.BlockReason;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserBlockPrivacyIntegrationTest extends BaseIntegrationTest {

    private User userA;
    private User userB;
    private User userC;
    private String tokenA;
    private String tokenB;
    private String tokenC;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        userA = userRepository.save(User.builder()
                .username("alice_blocker")
                .email("alice@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        profileRepository.save(Profile.builder()
                .user(userA)
                .displayName("Alice Blocker")
                .build());

        userB = userRepository.save(User.builder()
                .username("bob_blocked")
                .email("bob@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        profileRepository.save(Profile.builder()
                .user(userB)
                .displayName("Bob Blocked")
                .build());

        userC = userRepository.save(User.builder()
                .username("charlie_spammer")
                .email("charlie@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        profileRepository.save(Profile.builder()
                .user(userC)
                .displayName("Charlie Spammer")
                .build());

        tokenA = jwtTokenProvider.generateTokenForUser(userA.getId(), userA.getUsername(), userA.getEmail());
        tokenB = jwtTokenProvider.generateTokenForUser(userB.getId(), userB.getUsername(), userB.getEmail());
        tokenC = jwtTokenProvider.generateTokenForUser(userC.getId(), userC.getUsername(), userC.getEmail());
    }

    @Test
    @DisplayName("Block Privacy - Blocked user cannot follow blocker")
    void follow_WhenBlockedByTarget_ShouldBeRejected() throws Exception {
        userBlockRepository.save(UserBlock.builder()
                .blocker(userA)
                .blocked(userB)
                .build());

        mockMvc.perform(post("/api/v1/users/" + userA.getId() + "/follow")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You cannot follow this user"));
    }

    @Test
    @DisplayName("Block Privacy - Blocker cannot follow blocked user without unblocking first")
    void follow_WhenUserBlockedTarget_ShouldBeRejected() throws Exception {
        userBlockRepository.save(UserBlock.builder()
                .blocker(userA)
                .blocked(userB)
                .build());

        mockMvc.perform(post("/api/v1/users/" + userB.getId() + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You have blocked this user. Unblock them first to follow."));
    }

    @Test
    @DisplayName("Block Privacy - Blocked user cannot initiate direct conversation with blocker")
    void conversation_WhenBlocked_ShouldBeRejected() throws Exception {
        userBlockRepository.save(UserBlock.builder()
                .blocker(userA)
                .blocked(userB)
                .build());

        CreateConversationRequest req = CreateConversationRequest.builder()
                .recipientId(userA.getId())
                .build();

        mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Cannot create conversation with this user"));
    }

    @Test
    @DisplayName("Block Parity - Block user with reason and future accounts options")
    void blockUser_WithOptions_ShouldPersistReasonAndFutureAccounts() throws Exception {
        BlockUserRequest request = BlockUserRequest.builder()
                .reason(BlockReason.SPAM)
                .blockFutureAccounts(true)
                .notes("Sending unsolicited commercial spam")
                .build();

        mockMvc.perform(post("/api/v1/users/" + userB.getId() + "/block")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User blocked successfully"));

        UserBlock block = userBlockRepository.findByBlockerIdAndBlockedId(userA.getId(), userB.getId())
                .orElseThrow();
        assertThat(block.getReason()).isEqualTo(BlockReason.SPAM);
        assertThat(block.getBlockFutureAccounts()).isTrue();
        assertThat(block.getNotes()).isEqualTo("Sending unsolicited commercial spam");
    }

    @Test
    @DisplayName("Block Parity - Mutual follow relationships and pending requests severed upon block")
    void blockUser_ShouldSeverMutualFollowsAndPendingRequests() throws Exception {
        // Alice follows Bob & Bob follows Alice
        followRepository.save(Follow.builder().follower(userA).following(userB).build());
        followRepository.save(Follow.builder().follower(userB).following(userA).build());

        // Bob has a pending follow request to Alice
        followRequestRepository.save(FollowRequest.builder()
                .requester(userB)
                .target(userA)
                .status(FollowRequestStatus.PENDING)
                .build());

        // Alice blocks Bob
        mockMvc.perform(post("/api/v1/users/" + userB.getId() + "/block")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        // Assert follows severed both ways
        assertThat(followRepository.existsByFollowerIdAndFollowingId(userA.getId(), userB.getId())).isFalse();
        assertThat(followRepository.existsByFollowerIdAndFollowingId(userB.getId(), userA.getId())).isFalse();

        // Assert pending follow requests purged
        assertThat(followRequestRepository.existsByRequesterIdAndTargetId(userB.getId(), userA.getId())).isFalse();
    }

    @Test
    @DisplayName("Block Parity - Close friends mutual severance upon block")
    void blockUser_ShouldRemoveFromCloseFriends() throws Exception {
        // Alice adds Bob to Close Friends, Bob adds Alice to Close Friends
        closeFriendRepository.save(CloseFriend.builder().user(userA).friend(userB).build());
        closeFriendRepository.save(CloseFriend.builder().user(userB).friend(userA).build());

        // Alice blocks Bob
        mockMvc.perform(post("/api/v1/users/" + userB.getId() + "/block")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        // Both removed from Close Friends
        assertThat(closeFriendRepository.existsByUserIdAndFriendId(userA.getId(), userB.getId())).isFalse();
        assertThat(closeFriendRepository.existsByUserIdAndFriendId(userB.getId(), userA.getId())).isFalse();
    }

    @Test
    @DisplayName("Block Parity - Purges reciprocal notifications and suppresses new ones")
    void blockUser_ShouldPurgeNotificationsAndSuppressNewOnes() throws Exception {
        // Existing notification from Bob to Alice
        notificationRepository.save(Notification.builder()
                .recipient(userA)
                .actor(userB)
                .type(NotificationType.FOLLOW)
                .read(false)
                .build());

        // Existing notification from Alice to Bob
        notificationRepository.save(Notification.builder()
                .recipient(userB)
                .actor(userA)
                .type(NotificationType.POST_LIKED)
                .read(false)
                .build());

        // Alice blocks Bob
        mockMvc.perform(post("/api/v1/users/" + userB.getId() + "/block")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        // Verify past notifications purged
        List<Notification> remaining = notificationRepository.findAll();
        assertThat(remaining).isEmpty();
    }

    @Test
    @DisplayName("Block Parity - Query block status endpoint for dynamic UI headers")
    void getBlockStatus_ShouldReturnCorrectStatus() throws Exception {
        // Before block: can interact
        mockMvc.perform(get("/api/v1/users/" + userB.getId() + "/block-status")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasBlocked").value(false))
                .andExpect(jsonPath("$.data.isBlockedBy").value(false))
                .andExpect(jsonPath("$.data.isBlocked").value(false))
                .andExpect(jsonPath("$.data.canInteract").value(true));

        // Alice blocks Bob
        mockMvc.perform(post("/api/v1/users/" + userB.getId() + "/block")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        // From Alice's view: hasBlocked = true, canInteract = false
        mockMvc.perform(get("/api/v1/users/" + userB.getId() + "/block-status")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasBlocked").value(true))
                .andExpect(jsonPath("$.data.isBlockedBy").value(false))
                .andExpect(jsonPath("$.data.isBlocked").value(true))
                .andExpect(jsonPath("$.data.canInteract").value(false));

        // From Bob's view: isBlockedBy = true, canInteract = false
        mockMvc.perform(get("/api/v1/users/" + userA.getId() + "/block-status")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasBlocked").value(false))
                .andExpect(jsonPath("$.data.isBlockedBy").value(true))
                .andExpect(jsonPath("$.data.isBlocked").value(true))
                .andExpect(jsonPath("$.data.canInteract").value(false));
    }

    @Test
    @DisplayName("Block Parity - Search and pagination within blocked accounts list")
    void searchBlockedUsers_ShouldFilterByQuery() throws Exception {
        // Alice blocks Bob and Charlie
        userBlockRepository.save(UserBlock.builder().blocker(userA).blocked(userB).reason(BlockReason.SPAM).build());
        userBlockRepository.save(UserBlock.builder().blocker(userA).blocked(userC).reason(BlockReason.HARASSMENT).build());

        // Filter by "bob"
        mockMvc.perform(get("/api/v1/users/me/blocks")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("query", "bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].username").value("bob_blocked"))
                .andExpect(jsonPath("$.data.content[0].reason").value("SPAM"));

        // No query -> returns all blocked accounts
        mockMvc.perform(get("/api/v1/users/me/blocks")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2));
    }

    @Test
    @DisplayName("Block Parity - Engagement attempts on blocker's posts return 404 masked")
    void engagement_WhenBlocked_ShouldReturn404NotFound() throws Exception {
        // Alice creates a post
        Post post = postRepository.save(Post.builder()
                .user(userA)
                .caption("Alice's public post")
                .build());

        // Alice blocks Bob
        userBlockRepository.save(UserBlock.builder().blocker(userA).blocked(userB).build());

        // Bob attempts to like Alice's post -> 404
        mockMvc.perform(post("/api/v1/posts/" + post.getId() + "/like")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // Bob attempts to comment on Alice's post -> 404
        CreateCommentRequest commentReq = new CreateCommentRequest();
        commentReq.setText("Nice post!");
        mockMvc.perform(post("/api/v1/posts/" + post.getId() + "/comments")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isNotFound());

        // Bob attempts to save Alice's post -> 404
        mockMvc.perform(post("/api/v1/posts/" + post.getId() + "/save")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Block Parity - Unblocking user restores interaction capability")
    void unblockUser_ShouldRestoreAbilityToInteract() throws Exception {
        // Alice blocks Bob
        userBlockRepository.save(UserBlock.builder().blocker(userA).blocked(userB).build());

        // Alice unblocks Bob
        mockMvc.perform(delete("/api/v1/users/" + userB.getId() + "/block")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User unblocked successfully"));

        assertThat(userBlockRepository.existsByBlockerIdAndBlockedId(userA.getId(), userB.getId())).isFalse();

        // Status reflects unblocked
        mockMvc.perform(get("/api/v1/users/" + userB.getId() + "/block-status")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canInteract").value(true));
    }
}
