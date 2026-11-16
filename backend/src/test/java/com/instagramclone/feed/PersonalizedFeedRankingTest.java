package com.instagramclone.feed;

import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.dto.response.UserAffinityProfile;
import com.instagramclone.feed.enums.FeedItemType;
import com.instagramclone.feed.service.impl.FeedRankingEngineImpl;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Personalized Feed Ranking Engine Tests")
class PersonalizedFeedRankingTest {

    private FeedRankingEngineImpl rankingEngine;

    @BeforeEach
    void setUp() {
        rankingEngine = new FeedRankingEngineImpl();
    }

    @Test
    @DisplayName("Should rank creator with high affinity above low affinity creator")
    void shouldRankHighAffinityCreatorAboveLowAffinityCreator() {
        UUID viewerId = UUID.randomUUID();
        UUID closeFriend = UUID.randomUUID();
        UUID casualCreator = UUID.randomUUID();

        UserAffinityProfile profile = UserAffinityProfile.builder()
                .viewerId(viewerId)
                .creatorAffinity(Map.of(closeFriend, 25.0, casualCreator, 1.0))
                .build();

        Set<UUID> followingIds = Set.of(closeFriend, casualCreator);

        FeedItemResponse itemFromCasual = FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(casualCreator).username("casual").build())
                .caption("Just a quick update")
                .likeCount(5)
                .createdAt(LocalDateTime.now().minusMinutes(10))
                .build();

        FeedItemResponse itemFromCloseFriend = FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(closeFriend).username("friend").build())
                .caption("Exciting news!")
                .likeCount(5)
                .createdAt(LocalDateTime.now().minusMinutes(10))
                .build();

        List<FeedItemResponse> candidates = List.of(itemFromCasual, itemFromCloseFriend);
        List<FeedItemResponse> ranked = rankingEngine.rankHomeFeed(viewerId, candidates, profile, followingIds);

        assertThat(ranked).hasSize(2);
        // Close friend's item should rank first due to higher author affinity
        assertThat(ranked.get(0).getAuthor().getId()).isEqualTo(closeFriend);
        assertThat(ranked.get(0).getRankingScore()).isGreaterThan(ranked.get(1).getRankingScore());
        assertThat(ranked.get(0).getRecommendationReason()).isEqualTo("Followed creator");
    }

    @Test
    @DisplayName("Should boost explore content that matches viewer's favorite hashtags")
    void shouldBoostExploreContentMatchingViewerHashtags() {
        UUID viewerId = UUID.randomUUID();
        UUID creatorA = UUID.randomUUID();
        UUID creatorB = UUID.randomUUID();

        // Viewer loves #photography and #fitness
        UserAffinityProfile profile = UserAffinityProfile.builder()
                .viewerId(viewerId)
                .hashtagAffinity(Map.of("photography", 20.0, "fitness", 15.0))
                .build();

        FeedItemResponse unrelatedPost = FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(creatorA).username("random").build())
                .caption("Enjoying my lunch today #food #lunch")
                .likeCount(10)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        FeedItemResponse matchingPost = FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(creatorB).username("photographer").build())
                .caption("Sunset through the lens #photography #goldenhour")
                .likeCount(10)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        List<FeedItemResponse> candidates = List.of(unrelatedPost, matchingPost);
        List<FeedItemResponse> ranked = rankingEngine.rankExploreFeed(viewerId, candidates, profile);

        assertThat(ranked).hasSize(2);
        // The photography post should rank at position 0 because of topic match
        assertThat(ranked.get(0).getId()).isEqualTo(matchingPost.getId());
        assertThat(ranked.get(0).getRecommendationReason()).contains("#photography");
    }

    @Test
    @DisplayName("Should apply recency gravity decay so ancient posts yield to fresh content")
    void shouldApplyRecencyDecay() {
        UUID viewerId = UUID.randomUUID();
        UUID author = UUID.randomUUID();

        UserAffinityProfile profile = UserAffinityProfile.builder().viewerId(viewerId).build();

        FeedItemResponse oldViralPost = FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(author).username("author").build())
                .caption("Old memory")
                .likeCount(50)
                .createdAt(LocalDateTime.now().minusDays(15)) // 15 days ago
                .build();

        FeedItemResponse freshPost = FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(author).username("author").build())
                .caption("Happening right now!")
                .likeCount(15)
                .createdAt(LocalDateTime.now().minusMinutes(5)) // 5 minutes ago
                .build();

        List<FeedItemResponse> candidates = List.of(oldViralPost, freshPost);
        List<FeedItemResponse> ranked = rankingEngine.rankHomeFeed(viewerId, candidates, profile, Collections.emptySet());

        assertThat(ranked.get(0).getId()).isEqualTo(freshPost.getId());
        assertThat(ranked.get(0).getRankingScore()).isGreaterThan(ranked.get(1).getRankingScore());
    }
}
