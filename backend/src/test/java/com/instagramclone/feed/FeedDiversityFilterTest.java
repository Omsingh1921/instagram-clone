package com.instagramclone.feed;

import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.enums.FeedItemType;
import com.instagramclone.feed.service.impl.FeedDiversityFilter;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Feed Diversity Filter Tests")
class FeedDiversityFilterTest {

    private FeedDiversityFilter diversityFilter;

    @BeforeEach
    void setUp() {
        diversityFilter = new FeedDiversityFilter();
    }

    @Test
    @DisplayName("Should prevent consecutive items from the same author (Anti-Clustering)")
    void shouldPreventConsecutiveItemsFromSameAuthor() {
        UUID authorA = UUID.randomUUID();
        UUID authorB = UUID.randomUUID();
        UUID authorC = UUID.randomUUID();

        // 3 items from Author A, followed by Author B and C
        FeedItemResponse itemA1 = buildItem(authorA, "A1");
        FeedItemResponse itemA2 = buildItem(authorA, "A2");
        FeedItemResponse itemA3 = buildItem(authorA, "A3");
        FeedItemResponse itemB1 = buildItem(authorB, "B1");
        FeedItemResponse itemC1 = buildItem(authorC, "C1");

        List<FeedItemResponse> ranked = List.of(itemA1, itemA2, itemA3, itemB1, itemC1);

        // Window size 2: Author A cannot appear twice in a 2-item sliding window if alternatives exist
        List<FeedItemResponse> filtered = diversityFilter.applyAntiClustering(ranked, 2);

        assertThat(filtered).hasSize(5);
        // The first item should be A1
        assertThat(filtered.get(0).getAuthor().getId()).isEqualTo(authorA);
        // The second item should NOT be A2 (should be B1 or C1)
        assertThat(filtered.get(1).getAuthor().getId()).isNotEqualTo(authorA);
    }

    @Test
    @DisplayName("Should smoothly interleave posts and reels according to ratio")
    void shouldInterleavePostsAndReelsAccordingToRatio() {
        UUID author = UUID.randomUUID();

        List<FeedItemResponse> posts = List.of(
                buildItem(author, "P1"),
                buildItem(author, "P2"),
                buildItem(author, "P3"),
                buildItem(author, "P4"),
                buildItem(author, "P5"),
                buildItem(author, "P6")
        );

        List<FeedItemResponse> reels = List.of(
                buildReelItem(author, "R1"),
                buildReelItem(author, "R2")
        );

        // 3 posts : 1 reel ratio
        List<FeedItemResponse> interleaved = diversityFilter.interleavePostsAndReels(posts, reels, 3);

        assertThat(interleaved).hasSize(8);
        assertThat(interleaved.get(0).getCaption()).isEqualTo("P1");
        assertThat(interleaved.get(1).getCaption()).isEqualTo("P2");
        assertThat(interleaved.get(2).getCaption()).isEqualTo("P3");
        assertThat(interleaved.get(3).getCaption()).isEqualTo("R1"); // 1st reel after 3 posts!
        assertThat(interleaved.get(4).getCaption()).isEqualTo("P4");
        assertThat(interleaved.get(5).getCaption()).isEqualTo("P5");
        assertThat(interleaved.get(6).getCaption()).isEqualTo("P6");
        assertThat(interleaved.get(7).getCaption()).isEqualTo("R2"); // 2nd reel after next 3 posts!
    }

    @Test
    @DisplayName("Should let fresher / higher-ranked reel lead feed when post has lower ranking score")
    void shouldLetHigherRankedReelLeadFeed() {
        UUID author = UUID.randomUUID();

        FeedItemResponse stalePost = buildItem(author, "Old Post");
        stalePost.setRankingScore(0.27);
        stalePost.setCreatedAt(java.time.LocalDateTime.now().minusDays(8));

        FeedItemResponse freshReel = buildReelItem(author, "Fresh Reel");
        freshReel.setRankingScore(0.60);
        freshReel.setCreatedAt(java.time.LocalDateTime.now().minusDays(3));

        List<FeedItemResponse> interleaved = diversityFilter.interleavePostsAndReels(
                List.of(stalePost), List.of(freshReel), 3);

        assertThat(interleaved).hasSize(2);
        // Fresh higher-ranked reel must lead at index 0!
        assertThat(interleaved.get(0).getCaption()).isEqualTo("Fresh Reel");
        assertThat(interleaved.get(1).getCaption()).isEqualTo("Old Post");
    }

    private FeedItemResponse buildItem(UUID authorId, String caption) {
        return FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder().id(authorId).username("user_" + authorId).build())
                .caption(caption)
                .build();
    }

    private FeedItemResponse buildReelItem(UUID authorId, String caption) {
        return FeedItemResponse.builder()
                .id(UUID.randomUUID())
                .itemType(FeedItemType.REEL)
                .author(PostAuthorResponse.builder().id(authorId).username("user_" + authorId).build())
                .caption(caption)
                .videoUrl("https://cdn.example.com/reel.mp4")
                .isReel(true)
                .build();
    }
}
