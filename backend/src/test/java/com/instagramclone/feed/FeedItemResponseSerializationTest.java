package com.instagramclone.feed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.enums.FeedItemType;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.post.dto.response.PostMediaResponse;
import com.instagramclone.post.enums.MediaType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("FeedItemResponse Serialization Tests")
class FeedItemResponseSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("Should serialize FeedItemResponse with industry standard fields and PostCard compatibility")
    void shouldSerializeFeedItemResponseProperly() throws Exception {
        UUID id = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        FeedItemResponse response = FeedItemResponse.builder()
                .id(id)
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder()
                        .id(authorId)
                        .username("testcreator")
                        .displayName("Test Creator")
                        .avatarUrl("https://example.com/avatar.jpg")
                        .build())
                .caption("Hello World #coding")
                .media(List.of(PostMediaResponse.builder()
                        .id(UUID.randomUUID())
                        .mediaUrl("https://example.com/photo.jpg")
                        .mediaType(MediaType.IMAGE)
                        .build()))
                .likeCount(42)
                .commentCount(7)
                .shareCount(3)
                .likedByCurrentUser(true)
                .savedByCurrentUser(false)
                .isReel(false)
                .contentType("POST")
                .rankingScore(18.5)
                .recommendationReason("Suggested because you like #coding")
                .createdAt(LocalDateTime.now())
                .build();

        String json = objectMapper.writeValueAsString(response);
        JsonNode node = objectMapper.readTree(json);

        // Verify standard PostCard properties exist
        assertThat(node.get("id").asText()).isEqualTo(id.toString());
        assertThat(node.get("itemType").asText()).isEqualTo("POST");
        assertThat(node.get("caption").asText()).isEqualTo("Hello World #coding");
        assertThat(node.get("likeCount").asLong()).isEqualTo(42);
        assertThat(node.get("likedByCurrentUser").asBoolean()).isTrue();
        assertThat(node.get("isReel").asBoolean()).isFalse();
        assertThat(node.get("contentType").asText()).isEqualTo("POST");
        assertThat(node.get("rankingScore").asDouble()).isEqualTo(18.5);
        assertThat(node.get("recommendationReason").asText()).isEqualTo("Suggested because you like #coding");
        assertThat(node.has("media")).isTrue();
        assertThat(node.get("media").isArray()).isTrue();
        assertThat(node.get("media").get(0).get("mediaUrl").asText()).isEqualTo("https://example.com/photo.jpg");
    }

    @Test
    @DisplayName("Should support FeedResponse as first-class industry alias of FeedItemResponse")
    void shouldSupportFeedResponseAlias() throws Exception {
        UUID id = UUID.randomUUID();
        FeedItemResponse item = FeedItemResponse.builder()
                .id(id)
                .itemType(FeedItemType.REEL)
                .isReel(true)
                .contentType("REEL")
                .caption("Awesome Reel")
                .likeCount(150)
                .rankingScore(95.0)
                .recommendationReason("Viral Reel")
                .build();

        com.instagramclone.feed.dto.response.FeedResponse feedResponse = com.instagramclone.feed.dto.response.FeedResponse.from(item);

        String json = objectMapper.writeValueAsString(feedResponse);
        JsonNode node = objectMapper.readTree(json);

        assertThat(node.get("id").asText()).isEqualTo(id.toString());
        assertThat(node.get("isReel").asBoolean()).isTrue();
        assertThat(node.get("caption").asText()).isEqualTo("Awesome Reel");
        assertThat(node.get("likeCount").asLong()).isEqualTo(150);
        assertThat(node.get("rankingScore").asDouble()).isEqualTo(95.0);
    }
}
