package com.instagramclone.story;

import com.instagramclone.BaseIntegrationTest;
import com.instagramclone.follow.entity.Follow;
import com.instagramclone.post.dto.request.CreatePostRequest;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.enums.MediaType;
import com.instagramclone.post.enums.PostVisibility;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.story.dto.request.AddHighlightItemsRequest;
import com.instagramclone.story.dto.request.CreateHighlightRequest;
import com.instagramclone.story.dto.request.CreateStoryRequest;
import com.instagramclone.story.dto.request.StoryAddYoursRequest;
import com.instagramclone.story.dto.request.StoryCountdownRequest;
import com.instagramclone.story.dto.request.StoryHashtagRequest;
import com.instagramclone.story.dto.request.StoryLinkRequest;
import com.instagramclone.story.dto.request.StoryLocationRequest;
import com.instagramclone.story.dto.request.StoryQuizRequest;
import com.instagramclone.story.dto.request.StoryQuizVoteRequest;
import com.instagramclone.story.dto.request.StoryReactionRequest;
import com.instagramclone.story.dto.request.StoryReplyRequest;
import com.instagramclone.story.dto.request.StoryReportRequest;
import com.instagramclone.story.dto.request.StorySliderRequest;
import com.instagramclone.story.dto.request.StorySliderVoteRequest;
import com.instagramclone.story.entity.Story;
import com.instagramclone.story.service.interfaces.IStoryService;
import com.instagramclone.user.entity.Profile;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.entity.UserSettings;
import com.instagramclone.user.enums.StoryReplyPermission;
import com.instagramclone.user.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StoryComprehensiveLifecycleIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private IStoryService storyService;

    private User creator;
    private User follower;
    private User stranger;

    private String creatorToken;
    private String followerToken;
    private String strangerToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        creator = userRepository.save(User.builder()
                .username("pro_creator")
                .email("creator@storytest.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
        profileRepository.save(Profile.builder()
                .user(creator)
                .displayName("Pro Creator")
                .avatarUrl("https://cloudinary.com/avatar/creator.jpg")
                .build());

        follower = userRepository.save(User.builder()
                .username("faithful_fan")
                .email("follower@storytest.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
        profileRepository.save(Profile.builder()
                .user(follower)
                .displayName("Faithful Fan")
                .avatarUrl("https://cloudinary.com/avatar/follower.jpg")
                .build());

        stranger = userRepository.save(User.builder()
                .username("random_stranger")
                .email("stranger@storytest.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build());
        profileRepository.save(Profile.builder()
                .user(stranger)
                .displayName("Random Stranger")
                .avatarUrl("https://cloudinary.com/avatar/stranger.jpg")
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(creator)
                .isPrivate(false)
                .storyRepliesAllowed(StoryReplyPermission.EVERYONE)
                .allowStorySharing(true)
                .allowStoryResharing(true)
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(follower)
                .isPrivate(false)
                .build());

        userSettingsRepository.save(UserSettings.builder()
                .user(stranger)
                .isPrivate(false)
                .build());

        followRepository.save(Follow.builder()
                .follower(follower)
                .following(creator)
                .build());

        creatorToken = jwtTokenProvider.generateTokenForUser(creator.getId(), creator.getUsername(), creator.getEmail());
        followerToken = jwtTokenProvider.generateTokenForUser(follower.getId(), follower.getUsername(), follower.getEmail());
        strangerToken = jwtTokenProvider.generateTokenForUser(stranger.getId(), stranger.getUsername(), stranger.getEmail());
    }

    @Test
    @DisplayName("Interactive Stickers - Create story with quiz, slider, countdown, links, location, hashtag, and add-yours")
    void createStoryWithComprehensiveInteractiveStickers() throws Exception {
        CreateStoryRequest request = CreateStoryRequest.builder()
                .mediaUrl("https://cloudinary.com/test/interactive_story.jpg")
                .mediaType(MediaType.IMAGE)
                .caption("Full interactive showcase ✨")
                .audioTitle("Levitating")
                .audioArtist("Dua Lipa")
                .filterName("Clarendon")
                .quiz(StoryQuizRequest.builder()
                        .question("Which framework powers this backend?")
                        .options(List.of("Spring Boot", "Django", "Express", "Rails"))
                        .correctOptionIndex(0)
                        .build())
                .slider(StorySliderRequest.builder()
                        .question("Rate this architecture!")
                        .emoji("🔥")
                        .build())
                .countdown(StoryCountdownRequest.builder()
                        .title("Product Launch 🚀")
                        .targetDate(LocalDateTime.now().plusDays(7))
                        .build())
                .addYours(StoryAddYoursRequest.builder()
                        .promptText("Drop your best sunset! 🌅")
                        .build())
                .links(List.of(StoryLinkRequest.builder()
                        .url("https://instagram.com/deepmind")
                        .title("DeepMind Tech")
                        .xPercent(50.0)
                        .yPercent(80.0)
                        .build()))
                .locations(List.of(StoryLocationRequest.builder()
                        .locationName("Tokyo, Japan")
                        .latitude(35.6762)
                        .longitude(139.6503)
                        .xPercent(30.0)
                        .yPercent(20.0)
                        .build()))
                .hashtags(List.of(StoryHashtagRequest.builder()
                        .hashtag("architecture")
                        .xPercent(70.0)
                        .yPercent(20.0)
                        .build()))
                .build();

        String res = mockMvc.perform(post("/api/v1/stories")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.caption").value("Full interactive showcase ✨"))
                .andExpect(jsonPath("$.data.audioTitle").value("Levitating"))
                .andExpect(jsonPath("$.data.audioArtist").value("Dua Lipa"))
                .andExpect(jsonPath("$.data.filterName").value("Clarendon"))
                .andExpect(jsonPath("$.data.quiz.question").value("Which framework powers this backend?"))
                .andExpect(jsonPath("$.data.quiz.options[0]").value("Spring Boot"))
                .andExpect(jsonPath("$.data.slider.question").value("Rate this architecture!"))
                .andExpect(jsonPath("$.data.slider.emoji").value("🔥"))
                .andExpect(jsonPath("$.data.countdown.title").value("Product Launch 🚀"))
                .andExpect(jsonPath("$.data.addYours.promptText").value("Drop your best sunset! 🌅"))
                .andExpect(jsonPath("$.data.links[0].title").value("DeepMind Tech"))
                .andExpect(jsonPath("$.data.locations[0].locationName").value("Tokyo, Japan"))
                .andExpect(jsonPath("$.data.hashtags[0].hashtag").value("architecture"))
                .andReturn().getResponse().getContentAsString();

        UUID storyId = UUID.fromString(objectMapper.readTree(res).get("data").get("id").asText());

        // 1. Follower votes in Quiz
        StoryQuizVoteRequest quizVote = StoryQuizVoteRequest.builder().selectedOption(0).build();
        mockMvc.perform(post("/api/v1/stories/{storyId}/quiz/vote", storyId)
                        .header("Authorization", "Bearer " + followerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quizVote)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalVotes").value(1))
                .andExpect(jsonPath("$.data.userVote").value(0))
                .andExpect(jsonPath("$.data.correctOptionIndex").value(0));

        // 2. Follower votes on Emoji Slider
        StorySliderVoteRequest sliderVote = StorySliderVoteRequest.builder().sliderValue(0.95).build();
        mockMvc.perform(post("/api/v1/stories/{storyId}/slider/vote", storyId)
                        .header("Authorization", "Bearer " + followerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sliderVote)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalVotes").value(1))
                .andExpect(jsonPath("$.data.userVote").value(0.95))
                .andExpect(jsonPath("$.data.averageValue").value(0.95));

        // 3. Follower toggles countdown reminder
        mockMvc.perform(post("/api/v1/stories/{storyId}/countdown/remind", storyId)
                        .header("Authorization", "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasSubscribed").value(true))
                .andExpect(jsonPath("$.data.totalSubscribers").value(1));

        // 4. Follower reacts with quick emoji 🔥
        StoryReactionRequest reactReq = StoryReactionRequest.builder().emoji("🔥").build();
        mockMvc.perform(post("/api/v1/stories/{storyId}/react", storyId)
                        .header("Authorization", "Bearer " + followerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reactReq)))
                .andExpect(status().isOk());

        // 5. Creator views story insights
        mockMvc.perform(get("/api/v1/stories/{storyId}/insights", storyId)
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.storyId").value(storyId.toString()));
    }

    @Test
    @DisplayName("Story Privacy & Hiding - Creator hides story from follower and follower feed excludes creator")
    void hideStoryFromUserLifecycle() throws Exception {
        // Creator posts story
        CreateStoryRequest request = CreateStoryRequest.builder()
                .mediaUrl("https://cloudinary.com/test/secret_story.jpg")
                .mediaType(MediaType.IMAGE)
                .caption("Not for everyone's eyes")
                .build();
        mockMvc.perform(post("/api/v1/stories")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Follower can initially see the story
        mockMvc.perform(get("/api/v1/stories/feed")
                        .header("Authorization", "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.user.username == 'pro_creator')]").exists());

        // Creator hides story from follower
        mockMvc.perform(post("/api/v1/users/story-privacy/hide/{userId}", follower.getId())
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk());

        // Creator verifies follower is in hidden list
        mockMvc.perform(get("/api/v1/users/story-privacy/hidden")
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].username").value("faithful_fan"));

        // Follower's feed now excludes creator's story
        mockMvc.perform(get("/api/v1/stories/feed")
                        .header("Authorization", "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.user.username == 'pro_creator')]").doesNotExist());

        // Follower requests creator's stories directly -> empty stories returned
        mockMvc.perform(get("/api/v1/users/{userId}/stories", creator.getId())
                        .header("Authorization", "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stories").isEmpty());

        // Creator unhides story from follower
        mockMvc.perform(delete("/api/v1/users/story-privacy/unhide/{userId}", follower.getId())
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk());

        // Follower's feed once again includes creator's story
        mockMvc.perform(get("/api/v1/stories/feed")
                        .header("Authorization", "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.user.username == 'pro_creator')]").exists());
    }

    @Test
    @DisplayName("Story Reply Permissions - Enforces OFF and FOLLOWING permissions")
    void storyReplyPermissions_Enforcement() throws Exception {
        // Creator posts story
        CreateStoryRequest request = CreateStoryRequest.builder()
                .mediaUrl("https://cloudinary.com/test/discussion_story.jpg")
                .mediaType(MediaType.IMAGE)
                .caption("Let's talk about replies")
                .build();
        String res = mockMvc.perform(post("/api/v1/stories")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID storyId = UUID.fromString(objectMapper.readTree(res).get("data").get("id").asText());

        // 1. Follower can reply when replies are EVERYONE
        StoryReplyRequest reply = StoryReplyRequest.builder().content("Awesome update!").build();
        mockMvc.perform(post("/api/v1/stories/{storyId}/reply", storyId)
                        .header("Authorization", "Bearer " + followerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reply)))
                .andExpect(status().isOk());

        // 2. Creator changes reply permission to FOLLOWING only
        UserSettings settings = userSettingsRepository.findByUserId(creator.getId()).orElseThrow();
        settings.setStoryRepliesAllowed(StoryReplyPermission.FOLLOWING);
        userSettingsRepository.save(settings);

        // Follower can still reply
        mockMvc.perform(post("/api/v1/stories/{storyId}/reply", storyId)
                        .header("Authorization", "Bearer " + followerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reply)))
                .andExpect(status().isOk());

        // Stranger (non-follower) tries to reply -> 403 Forbidden
        mockMvc.perform(post("/api/v1/stories/{storyId}/reply", storyId)
                        .header("Authorization", "Bearer " + strangerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reply)))
                .andExpect(status().isForbidden());

        // 3. Creator turns replies OFF
        settings.setStoryRepliesAllowed(StoryReplyPermission.OFF);
        userSettingsRepository.save(settings);

        // Follower tries to reply -> 403 Forbidden
        mockMvc.perform(post("/api/v1/stories/{storyId}/reply", storyId)
                        .header("Authorization", "Bearer " + followerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reply)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Story Archive & Calendar - Expired stories appear in private archive and can be reshared")
    void storyArchiveAndCalendarLifecycle() throws Exception {
        // Creator posts story
        CreateStoryRequest request = CreateStoryRequest.builder()
                .mediaUrl("https://cloudinary.com/test/archive_story.jpg")
                .mediaType(MediaType.IMAGE)
                .caption("Golden hour memory")
                .build();
        String res = mockMvc.perform(post("/api/v1/stories")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID storyId = UUID.fromString(objectMapper.readTree(res).get("data").get("id").asText());

        // Simulate expiration (story is past 24 hours)
        Story story = storyRepository.findById(storyId).orElseThrow();
        story.setExpiresAt(LocalDateTime.now().minusHours(2));
        storyRepository.save(story);

        // Run auto-archive
        int archived = storyService.cleanupExpiredStories();
        assertThat(archived).isGreaterThanOrEqualTo(1);

        // 1. Creator fetches Story Archive -> story is present
        mockMvc.perform(get("/api/v1/stories/archive")
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(storyId.toString()))
                .andExpect(jsonPath("$.data.content[0].caption").value("Golden hour memory"))
                .andExpect(jsonPath("$.data.content[0].archived").value(true));

        // 2. Creator fetches Calendar archive
        mockMvc.perform(get("/api/v1/stories/archive/calendar")
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk());

        // 3. Creator reshares archived story as a memory
        mockMvc.perform(post("/api/v1/stories/archive/{storyId}/reshare", storyId)
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.caption").value(org.hamcrest.Matchers.containsString("Memory from")));
    }

    @Test
    @DisplayName("Cross-Content Resharing - Share post to story and report story")
    void sharePostToStoryAndReport() throws Exception {
        // Creator publishes a Post
        Post post = postRepository.save(Post.builder()
                .user(creator)
                .caption("My viral photography post")
                .visibility(PostVisibility.PUBLIC)
                .build());

        // Follower shares post to their Story
        mockMvc.perform(post("/api/v1/stories/share/post/{postId}", post.getId())
                        .header("Authorization", "Bearer " + followerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.caption").value("Shared post by @pro_creator"))
                .andExpect(jsonPath("$.data.sharedPostId").value(post.getId().toString()));

        // Stranger reports the story
        Story reportedStory = storyRepository.findAll().get(0);
        StoryReportRequest reportReq = StoryReportRequest.builder()
                .reason("SPAM")
                .details("Suspected commercial advertisement spam")
                .build();

        mockMvc.perform(post("/api/v1/stories/{storyId}/report", reportedStory.getId())
                        .header("Authorization", "Bearer " + strangerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportReq)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Highlight Items - Add and remove stories from highlights dynamically")
    void highlightItemsAddAndRemove() throws Exception {
        // Creator posts 2 stories
        CreateStoryRequest req1 = CreateStoryRequest.builder()
                .mediaUrl("https://cloudinary.com/test/h1.jpg")
                .mediaType(MediaType.IMAGE)
                .caption("H1")
                .build();
        CreateStoryRequest req2 = CreateStoryRequest.builder()
                .mediaUrl("https://cloudinary.com/test/h2.jpg")
                .mediaType(MediaType.IMAGE)
                .caption("H2")
                .build();
        String r1 = mockMvc.perform(post("/api/v1/stories")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String r2 = mockMvc.perform(post("/api/v1/stories")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();

        UUID s1 = UUID.fromString(objectMapper.readTree(r1).get("data").get("id").asText());
        UUID s2 = UUID.fromString(objectMapper.readTree(r2).get("data").get("id").asText());

        // Create highlight with s1
        CreateHighlightRequest createHl = CreateHighlightRequest.builder()
                .title("Dynamic Highlights")
                .storyIds(List.of(s1))
                .build();
        String hlRes = mockMvc.perform(post("/api/v1/stories/highlights")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createHl)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID hlId = UUID.fromString(objectMapper.readTree(hlRes).get("data").get("id").asText());

        // Append s2 to highlight
        AddHighlightItemsRequest addReq = AddHighlightItemsRequest.builder().storyIds(List.of(s2)).build();
        mockMvc.perform(post("/api/v1/stories/highlights/{highlightId}/items", hlId)
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stories.length()").value(2));

        // Remove s1 from highlight
        mockMvc.perform(delete("/api/v1/stories/highlights/{highlightId}/items/{storyId}", hlId, s1)
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk());
    }
}
