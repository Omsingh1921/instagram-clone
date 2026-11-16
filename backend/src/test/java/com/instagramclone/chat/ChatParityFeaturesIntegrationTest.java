package com.instagramclone.chat;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.chat.dto.request.CreateConversationRequest;
import com.instagramclone.chat.dto.request.EditMessageRequest;
import com.instagramclone.chat.dto.request.ForwardMessageRequest;
import com.instagramclone.chat.dto.request.SendMessageRequest;
import com.instagramclone.chat.dto.request.UpdateChatThemeRequest;
import com.instagramclone.chat.dto.request.UpdateFolderRequest;
import com.instagramclone.chat.enums.InboxFolder;
import com.instagramclone.chat.enums.MessageType;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChatParityFeaturesIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private FollowRepository followRepository;

    private User alice;
    private User bob;
    private User charlie;

    private String tokenAlice;
    private String tokenBob;
    private String tokenCharlie;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        alice = userRepository.save(User.builder()
                .username("alice_chat")
                .email("alice_chat@test.com")
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        bob = userRepository.save(User.builder()
                .username("bob_chat")
                .email("bob_chat@test.com")
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        charlie = userRepository.save(User.builder()
                .username("charlie_chat")
                .email("charlie_chat@test.com")
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        tokenAlice = jwtTokenProvider.generateTokenForUser(alice.getId(), alice.getUsername(), alice.getEmail());
        tokenBob = jwtTokenProvider.generateTokenForUser(bob.getId(), bob.getUsername(), bob.getEmail());
        tokenCharlie = jwtTokenProvider.generateTokenForUser(charlie.getId(), charlie.getUsername(), charlie.getEmail());
    }

    @Test
    @DisplayName("Threaded Reply - Replying to a message returns nested replyTo summary")
    void testThreadedReply() throws Exception {
        // Alice creates conversation with Bob
        String convJson = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID conversationId = UUID.fromString(objectMapper.readTree(convJson).path("data").path("id").asText());

        // Alice sends original message
        SendMessageRequest originalReq = SendMessageRequest.builder()
                .content("Original message by Alice")
                .messageType(MessageType.TEXT)
                .build();

        String msg1Json = mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(originalReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID msg1Id = UUID.fromString(objectMapper.readTree(msg1Json).path("data").path("id").asText());

        // Bob replies to Alice's message
        SendMessageRequest replyReq = SendMessageRequest.builder()
                .content("Bob replying to Alice")
                .messageType(MessageType.TEXT)
                .replyToMessageId(msg1Id)
                .build();

        mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + tokenBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content").value("Bob replying to Alice"))
                .andExpect(jsonPath("$.data.replyTo.messageId").value(msg1Id.toString()))
                .andExpect(jsonPath("$.data.replyTo.senderUsername").value("alice_chat"))
                .andExpect(jsonPath("$.data.replyTo.contentSnippet").value("Original message by Alice"));
    }

    @Test
    @DisplayName("Edit Message - Sender can edit within 15 minutes, non-sender is blocked")
    void testEditMessage() throws Exception {
        String convJson = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID conversationId = UUID.fromString(objectMapper.readTree(convJson).path("data").path("id").asText());

        // Alice sends message
        SendMessageRequest sendReq = SendMessageRequest.builder()
                .content("Initial typo message")
                .messageType(MessageType.TEXT)
                .build();

        String msgJson = mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID messageId = UUID.fromString(objectMapper.readTree(msgJson).path("data").path("id").asText());

        // Bob tries to edit Alice's message -> 403 Forbidden
        mockMvc.perform(put("/api/v1/conversations/" + conversationId + "/messages/" + messageId)
                        .header("Authorization", "Bearer " + tokenBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EditMessageRequest("Hacked message"))))
                .andExpect(status().isForbidden());

        // Alice edits her message -> 200 OK
        mockMvc.perform(put("/api/v1/conversations/" + conversationId + "/messages/" + messageId)
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EditMessageRequest("Corrected message"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("Corrected message"))
                .andExpect(jsonPath("$.data.isEdited").value(true))
                .andExpect(jsonPath("$.data.editedAt").isNotEmpty());
    }

    @Test
    @DisplayName("In-Chat Message Pinning - Toggle pin and enforce max 3 pinned messages limit")
    void testPinMessagesInChat() throws Exception {
        String convJson = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID conversationId = UUID.fromString(objectMapper.readTree(convJson).path("data").path("id").asText());

        // Send 4 messages
        UUID[] msgIds = new UUID[4];
        for (int i = 0; i < 4; i++) {
            String mJson = mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages")
                            .header("Authorization", "Bearer " + tokenAlice)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(SendMessageRequest.builder()
                                    .content("Message #" + (i + 1))
                                    .messageType(MessageType.TEXT)
                                    .build())))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            msgIds[i] = UUID.fromString(objectMapper.readTree(mJson).path("data").path("id").asText());
        }

        // Pin 1st, 2nd, 3rd message
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages/" + msgIds[i] + "/pin")
                            .header("Authorization", "Bearer " + tokenAlice))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isPinnedInChat").value(true));
        }

        // Verify 3 pinned messages in chat banner
        mockMvc.perform(get("/api/v1/conversations/" + conversationId + "/pinned-messages")
                        .header("Authorization", "Bearer " + tokenAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3));

        // Pin 4th message -> 400 Bad Request (Limit reached)
        mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages/" + msgIds[3] + "/pin")
                        .header("Authorization", "Bearer " + tokenAlice))
                .andExpect(status().isBadRequest());

        // Unpin 1st message -> success
        mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages/" + msgIds[0] + "/pin")
                        .header("Authorization", "Bearer " + tokenAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isPinnedInChat").value(false));

        // Now pin 4th message -> success
        mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages/" + msgIds[3] + "/pin")
                        .header("Authorization", "Bearer " + tokenAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isPinnedInChat").value(true));
    }

    @Test
    @DisplayName("Forward Message - Forward to multiple target conversations")
    void testForwardMessage() throws Exception {
        // Conversation 1: Alice & Bob
        String conv1Json = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID conv1Id = UUID.fromString(objectMapper.readTree(conv1Json).path("data").path("id").asText());

        // Conversation 2: Alice & Charlie
        String conv2Json = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(charlie.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID conv2Id = UUID.fromString(objectMapper.readTree(conv2Json).path("data").path("id").asText());

        // Bob sends message to Alice in Conv 1
        String msgJson = mockMvc.perform(post("/api/v1/conversations/" + conv1Id + "/messages")
                        .header("Authorization", "Bearer " + tokenBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(SendMessageRequest.builder()
                                .content("Important announcement from Bob")
                                .messageType(MessageType.TEXT)
                                .build())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID msgId = UUID.fromString(objectMapper.readTree(msgJson).path("data").path("id").asText());

        // Alice forwards this message to Conv 2 (Alice & Charlie)
        ForwardMessageRequest forwardReq = new ForwardMessageRequest(List.of(conv2Id));
        mockMvc.perform(post("/api/v1/conversations/" + conv1Id + "/messages/" + msgId + "/forward")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forwardReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].content").value("Important announcement from Bob"))
                .andExpect(jsonPath("$.data[0].isForwarded").value(true));
    }

    @Test
    @DisplayName("Message Requests & Folders - Non-follower direct message goes to REQUESTS folder")
    void testMessageRequestsAndFolders() throws Exception {
        // Bob does NOT follow Alice -> Bob's folder is REQUESTS, Alice's folder is PRIMARY
        String convJson = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID conversationId = UUID.fromString(objectMapper.readTree(convJson).path("data").path("id").asText());

        // Bob checks requests count -> should be 1
        mockMvc.perform(get("/api/v1/conversations/requests-count")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(1));

        // Bob checks REQUESTS folder -> conversation is present
        mockMvc.perform(get("/api/v1/conversations")
                        .param("folder", "REQUESTS")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1));

        // Bob accepts message request
        mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/accept-request")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk());

        // Requests count now 0
        mockMvc.perform(get("/api/v1/conversations/requests-count")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(0));

        // Now present in PRIMARY folder
        mockMvc.perform(get("/api/v1/conversations")
                        .param("folder", "PRIMARY")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1));

        // Bob moves conversation to GENERAL folder
        mockMvc.perform(put("/api/v1/conversations/" + conversationId + "/folder")
                        .header("Authorization", "Bearer " + tokenBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateFolderRequest(InboxFolder.GENERAL))))
                .andExpect(status().isOk());

        // Verify present in GENERAL folder
        mockMvc.perform(get("/api/v1/conversations")
                        .param("folder", "GENERAL")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1));
    }

    @Test
    @DisplayName("Message Requests - Replying to a REQUESTS conversation auto-promotes sender folder to PRIMARY")
    void testReplyingToRequestPromotesToPrimary() throws Exception {
        // Bob does NOT follow Alice -> Bob receives conversation in REQUESTS
        String convJson = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID conversationId = UUID.fromString(objectMapper.readTree(convJson).path("data").path("id").asText());

        // Before replying: hidden from default primary list, visible in REQUESTS
        mockMvc.perform(get("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(0));

        mockMvc.perform(get("/api/v1/conversations")
                        .param("folder", "REQUESTS")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1));

        // Bob replies directly -> backend auto-promotes Bob's folder from REQUESTS to PRIMARY
        mockMvc.perform(post("/api/v1/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + tokenBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(SendMessageRequest.builder()
                                .content("Hey Alice, accepting by replying!")
                                .messageType(MessageType.TEXT)
                                .build())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/conversations/requests-count")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(0));

        mockMvc.perform(get("/api/v1/conversations")
                        .param("folder", "REQUESTS")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(0));

        mockMvc.perform(get("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].folder").value("PRIMARY"));
    }

    @Test
    @DisplayName("Chat Theme Customization - Update theme and verify response")
    void testChatThemeCustomization() throws Exception {
        String convJson = mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateConversationRequest(bob.getId()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID conversationId = UUID.fromString(objectMapper.readTree(convJson).path("data").path("id").asText());

        mockMvc.perform(put("/api/v1/conversations/" + conversationId + "/theme")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateChatThemeRequest("SUNSET"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.theme").value("SUNSET"));
    }
}

