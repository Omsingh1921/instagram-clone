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

@DisplayName("Feed Seen and Not-Interested Tests")
class FeedSeenAndNotInterestedTest {

    private FeedRankingEngineImpl rankingEngine;

    @BeforeEach
    void setUp() {
        rankingEngine = new FeedRankingEngineImpl();
    }

    @Test
    @DisplayName("Should dampen ranking score of seen posts below unseen posts")
    void shouldDampenSeenPostScoreBelowUnseenPost() {
        UUID viewerId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        UUID seenPostId = UUID.randomUUID();
        UUID unseenPostId = UUID.randomUUID();

        // Seen post has higher initial likes (50 vs 5), but is in seenItemIds set
        FeedItemResponse seenPost = FeedItemResponse.builder()
                .id(seenPostId)
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(authorId).username("creator").build())
                .caption("Awesome content you already saw")
                .likeCount(50)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        FeedItemResponse unseenPost = FeedItemResponse.builder()
                .id(unseenPostId)
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(authorId).username("creator").build())
                .caption("Fresh new update")
                .likeCount(5)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        List<FeedItemResponse> candidates = List.of(seenPost, unseenPost);
        Set<UUID> seenIds = Set.of(seenPostId);
        Set<UUID> followingIds = Set.of(authorId);

        List<FeedItemResponse> ranked = rankingEngine.rankHomeFeed(viewerId, candidates, null, followingIds, seenIds);

        // Unseen post should be ranked #1 despite fewer likes
        assertThat(ranked).hasSize(2);
        assertThat(ranked.get(0).getId()).isEqualTo(unseenPostId);
        assertThat(ranked.get(0).getIsSeen()).isFalse();

        assertThat(ranked.get(1).getId()).isEqualTo(seenPostId);
        assertThat(ranked.get(1).getIsSeen()).isTrue();
        assertThat(ranked.get(1).getRecommendationReason()).isEqualTo("Previously viewed");
    }

    @Test
    @DisplayName("Should flag explore seen items with Previously viewed reason")
    void shouldFlagExploreSeenItems() {
        UUID viewerId = UUID.randomUUID();
        UUID seenItemId = UUID.randomUUID();

        FeedItemResponse exploreItem = FeedItemResponse.builder()
                .id(seenItemId)
                .itemType(FeedItemType.POST)
                .caption("Explore photography #travel")
                .likeCount(100)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        List<FeedItemResponse> ranked = rankingEngine.rankExploreFeed(viewerId, List.of(exploreItem), null, Set.of(seenItemId));

        assertThat(ranked).hasSize(1);
        assertThat(ranked.get(0).getIsSeen()).isTrue();
        assertThat(ranked.get(0).getRecommendationReason()).isEqualTo("Previously viewed");
    }
}

