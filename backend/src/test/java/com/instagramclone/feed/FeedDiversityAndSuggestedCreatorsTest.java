package com.instagramclone.feed;

import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.enums.FeedItemType;
import com.instagramclone.feed.service.impl.FeedDiversityFilter;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Feed Diversity and In-Feed Units Tests")
class FeedDiversityAndSuggestedCreatorsTest {

    private FeedDiversityFilter diversityFilter;

    @BeforeEach
    void setUp() {
        diversityFilter = new FeedDiversityFilter();
    }

    @Test
    @DisplayName("Should inject Suggested Creators carousel at specified interval")
    void shouldInjectSuggestedCreatorsCarousel() {
        List<FeedItemResponse> items = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            items.add(FeedItemResponse.builder()
                    .id(UUID.randomUUID())
                    .itemType(FeedItemType.POST)
                    .caption("Post #" + i)
                    .build());
        }

        List<PostAuthorResponse> suggested = List.of(
                PostAuthorResponse.builder().id(UUID.randomUUID()).username("photographer_1").build(),
                PostAuthorResponse.builder().id(UUID.randomUUID()).username("designer_2").build()
        );

        List<FeedItemResponse> withSuggested = diversityFilter.injectSuggestedCreators(items, suggested, 5);

        assertThat(withSuggested).hasSize(11);
        FeedItemResponse suggestedUnit = withSuggested.get(5);
        assertThat(suggestedUnit.getItemType()).isEqualTo(FeedItemType.SUGGESTED_CREATOR);
        assertThat(suggestedUnit.getSuggestedAccounts()).hasSize(2);
        assertThat(suggestedUnit.getRecommendationReason()).isEqualTo("Suggested for you");
    }

    @Test
    @DisplayName("Should inject All Caught Up notice when top items were previously viewed")
    void shouldInjectAllCaughtUpNotice() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        UUID id3 = UUID.randomUUID();
        UUID id4 = UUID.randomUUID();

        List<FeedItemResponse> items = List.of(
                FeedItemResponse.builder().id(id1).isSeen(true).caption("Old 1").build(),
                FeedItemResponse.builder().id(id2).isSeen(true).caption("Old 2").build(),
                FeedItemResponse.builder().id(id3).isSeen(true).caption("Old 3").build(),
                FeedItemResponse.builder().id(id4).isSeen(false).caption("Explore 1").build()
        );

        Set<UUID> seenIds = Set.of(id1, id2, id3);

        List<FeedItemResponse> withNotice = diversityFilter.injectAllCaughtUpNotice(items, seenIds);

        assertThat(withNotice).hasSize(5);
        boolean hasCaughtUpNotice = withNotice.stream()
                .anyMatch(i -> i.getItemType() == FeedItemType.ALL_CAUGHT_UP_NOTICE);
        assertThat(hasCaughtUpNotice).isTrue();
    }
}

