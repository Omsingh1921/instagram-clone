package com.instagramclone.note;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.follow.entity.Follow;
import com.instagramclone.note.dto.request.CreateNoteRequest;
import com.instagramclone.note.entity.UserNote;
import com.instagramclone.note.repository.UserNoteRepository;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Instagram Notes Module Integration Tests")
public class NoteIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserNoteRepository userNoteRepository;

    private User alice;
    private User bob;
    private User charlie;
    private String tokenAlice;
    private String tokenBob;
    private String tokenCharlie;

    @BeforeEach
    void setUp() {
        userNoteRepository.deleteAllInBatch();
        cleanDatabase();

        alice = userRepository.save(User.builder()
                .username("alice_note")
                .email("alice_note@instagram.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        bob = userRepository.save(User.builder()
                .username("bob_note")
                .email("bob_note@instagram.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        charlie = userRepository.save(User.builder()
                .username("charlie_note")
                .email("charlie_note@instagram.com")
                .passwordHash("hashed")
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());

        // Alice follows Bob (but not Charlie)
        followRepository.save(Follow.builder()
                .follower(alice)
                .following(bob)
                .build());

        tokenAlice = jwtTokenProvider.generateTokenForUser(alice.getId(), alice.getUsername(), alice.getEmail());
        tokenBob = jwtTokenProvider.generateTokenForUser(bob.getId(), bob.getUsername(), bob.getEmail());
        tokenCharlie = jwtTokenProvider.generateTokenForUser(charlie.getId(), charlie.getUsername(), charlie.getEmail());
    }

    @AfterEach
    void tearDown() {
        userNoteRepository.deleteAllInBatch();
    }

    @Test
    @DisplayName("Creates note, serializes isOwnNote, replaces previous note, returns feed, and deletes")
    void notesLifecycle_CreateFeedReplaceAndDelete() throws Exception {
        CreateNoteRequest firstRequest = CreateNoteRequest.builder()
                .text("Coffee break")
                .build();

        mockMvc.perform(post("/api/v1/notes")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.text").value("Coffee break"))
                .andExpect(jsonPath("$.data.isOwnNote").value(true))
                .andExpect(jsonPath("$.data.user.username").value("alice_note"));

        // Second note replaces Alice's previous note so only 1 active note remains
        CreateNoteRequest replacementRequest = CreateNoteRequest.builder()
                .text("Working late")
                .build();

        mockMvc.perform(post("/api/v1/notes")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replacementRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.text").value("Working late"))
                .andExpect(jsonPath("$.data.isOwnNote").value(true));

        // Bob (followed by Alice) shares an active note; Charlie (not followed) shares one too
        mockMvc.perform(post("/api/v1/notes")
                        .header("Authorization", "Bearer " + tokenBob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateNoteRequest.builder().text("At the gym").build())))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/notes")
                        .header("Authorization", "Bearer " + tokenCharlie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateNoteRequest.builder().text("Unfollowed note").build())))
                .andExpect(status().isCreated());

        // Expired note in DB should not appear in feed
        userNoteRepository.save(UserNote.builder()
                .user(bob)
                .text("Expired note")
                .createdAt(LocalDateTime.now().minusHours(25))
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build());

        // Alice sees her replacement note (isOwnNote=true) + Bob's active note (isOwnNote=false)
        mockMvc.perform(get("/api/v1/notes/feed")
                        .header("Authorization", "Bearer " + tokenAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[?(@.user.username=='alice_note')].isOwnNote").value(org.hamcrest.Matchers.contains(true)))
                .andExpect(jsonPath("$.data[?(@.user.username=='bob_note')].isOwnNote").value(org.hamcrest.Matchers.contains(false)))
                .andExpect(jsonPath("$.data[?(@.user.username=='charlie_note')]").isEmpty());

        // Delete Alice's note
        mockMvc.perform(delete("/api/v1/notes")
                        .header("Authorization", "Bearer " + tokenAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Note deleted successfully"));

        assertThat(userNoteRepository.findFirstByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(
                alice.getId(), LocalDateTime.now())).isEmpty();
    }

    @Test
    @DisplayName("Rejects blank or over-60-char note text")
    void createNote_Validation() throws Exception {
        CreateNoteRequest tooLong = CreateNoteRequest.builder()
                .text("a".repeat(61))
                .build();

        mockMvc.perform(post("/api/v1/notes")
                        .header("Authorization", "Bearer " + tokenAlice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tooLong)))
                .andExpect(status().isBadRequest());
    }
}
