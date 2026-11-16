package com.instagramclone.call;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.call.dto.request.InitiateCallRequest;
import com.instagramclone.call.entity.CallSession;
import com.instagramclone.call.enums.CallStatus;
import com.instagramclone.call.enums.CallType;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CallControllerIntegrationTest extends BaseIntegrationTest {

    private User callerUser;
    private User recipientUser;
    private String callerToken;
    private String recipientToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        String suffix1 = UUID.randomUUID().toString().substring(0, 8);
        callerUser = userRepository.save(User.builder()
                .username("caller_" + suffix1)
                .email("caller_" + suffix1 + "@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        String suffix2 = UUID.randomUUID().toString().substring(0, 8);
        recipientUser = userRepository.save(User.builder()
                .username("callee_" + suffix2)
                .email("callee_" + suffix2 + "@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        callerToken = jwtTokenProvider.generateTokenForUser(callerUser.getId(), callerUser.getUsername(), callerUser.getEmail());
        recipientToken = jwtTokenProvider.generateTokenForUser(recipientUser.getId(), recipientUser.getUsername(), recipientUser.getEmail());
    }

    @Test
    @DisplayName("Calls - Should initiate video call successfully")
    void initiateCall_ShouldCreateCallSession() throws Exception {
        InitiateCallRequest request = InitiateCallRequest.builder()
                .recipientId(recipientUser.getId())
                .callType(CallType.VIDEO)
                .build();

        mockMvc.perform(post("/api/v1/calls/initiate")
                        .header("Authorization", "Bearer " + callerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.callType").value("VIDEO"))
                .andExpect(jsonPath("$.data.status").value("RINGING"))
                .andExpect(jsonPath("$.data.caller.username").value(callerUser.getUsername()))
                .andExpect(jsonPath("$.data.recipient.username").value(recipientUser.getUsername()));

        assertThat(callSessionRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Calls - Recipient should answer ringing call successfully")
    void answerCall_ShouldTransitionToConnected() throws Exception {
        CallSession session = callSessionRepository.save(CallSession.builder()
                .caller(callerUser)
                .recipient(recipientUser)
                .callType(CallType.AUDIO)
                .status(CallStatus.RINGING)
                .startedAt(LocalDateTime.now())
                .build());

        mockMvc.perform(post("/api/v1/calls/" + session.getId() + "/answer")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONNECTED"))
                .andExpect(jsonPath("$.data.connectedAt").isNotEmpty());

        CallSession updated = callSessionRepository.findById(session.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CallStatus.CONNECTED);
    }

    @Test
    @DisplayName("Calls - Either party should end active call and compute duration")
    void endCall_ShouldComputeDurationAndClose() throws Exception {
        CallSession session = callSessionRepository.save(CallSession.builder()
                .caller(callerUser)
                .recipient(recipientUser)
                .callType(CallType.VIDEO)
                .status(CallStatus.CONNECTED)
                .startedAt(LocalDateTime.now().minusSeconds(45))
                .connectedAt(LocalDateTime.now().minusSeconds(40))
                .build());

        mockMvc.perform(post("/api/v1/calls/" + session.getId() + "/end")
                        .header("Authorization", "Bearer " + callerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ENDED"))
                .andExpect(jsonPath("$.data.durationSeconds").isNumber());

        CallSession updated = callSessionRepository.findById(session.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CallStatus.ENDED);
        assertThat(updated.getDurationSeconds()).isGreaterThanOrEqualTo(35);

        // Verify call is maintained in chat messages history
        java.util.List<com.instagramclone.chat.entity.Message> messages = messageRepository.findAll();
        assertThat(messages).isNotEmpty();
        com.instagramclone.chat.entity.Message callMsg = messages.getLast();
        assertThat(callMsg.getMessageType()).isEqualTo(com.instagramclone.chat.enums.MessageType.CALL);
        assertThat(callMsg.getContent()).contains("Video call");
    }

    @Test
    @DisplayName("Calls - Recipient declining call should record declined call in chat")
    void rejectCall_ShouldRecordDeclinedCallInChat() throws Exception {
        CallSession session = callSessionRepository.save(CallSession.builder()
                .caller(callerUser)
                .recipient(recipientUser)
                .callType(CallType.AUDIO)
                .status(CallStatus.RINGING)
                .startedAt(LocalDateTime.now())
                .build());

        mockMvc.perform(post("/api/v1/calls/" + session.getId() + "/reject")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        java.util.List<com.instagramclone.chat.entity.Message> messages = messageRepository.findAll();
        assertThat(messages).isNotEmpty();
        com.instagramclone.chat.entity.Message callMsg = messages.getLast();
        assertThat(callMsg.getMessageType()).isEqualTo(com.instagramclone.chat.enums.MessageType.CALL);
        assertThat(callMsg.getContent()).contains("Declined audio call");
    }

    @Test
    @DisplayName("Calls - Should retrieve call history paginated")
    void getCallHistory_ShouldReturnUserCalls() throws Exception {
        callSessionRepository.save(CallSession.builder()
                .caller(callerUser)
                .recipient(recipientUser)
                .callType(CallType.AUDIO)
                .status(CallStatus.ENDED)
                .startedAt(LocalDateTime.now().minusMinutes(5))
                .durationSeconds(120)
                .build());

        mockMvc.perform(get("/api/v1/calls/history")
                        .header("Authorization", "Bearer " + callerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].callType").value("AUDIO"));
    }

    @Test
    @DisplayName("Calls - Cannot call self")
    void initiateCall_ToSelf_ShouldFail() throws Exception {
        InitiateCallRequest request = InitiateCallRequest.builder()
                .recipientId(callerUser.getId())
                .callType(CallType.AUDIO)
                .build();

        mockMvc.perform(post("/api/v1/calls/initiate")
                        .header("Authorization", "Bearer " + callerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Calls - Validation fails when recipientId or callType is null")
    void initiateCall_ValidationFailsOnMissingFields() throws Exception {
        InitiateCallRequest emptyRequest = InitiateCallRequest.builder().build();

        mockMvc.perform(post("/api/v1/calls/initiate")
                        .header("Authorization", "Bearer " + callerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Calls - Validation fails when recipientId has invalid UUID string")
    void initiateCall_ValidationFailsOnInvalidUuidString() throws Exception {
        String invalidJson = """
            {
                "recipientId": "invalid-uuid-string-12345",
                "callType": "AUDIO"
            }
            """;

        mockMvc.perform(post("/api/v1/calls/initiate")
                        .header("Authorization", "Bearer " + callerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}

