package com.instagramclone.feed;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.feed.dto.response.UserAffinityProfile;
import com.instagramclone.feed.service.impl.UserAffinityServiceImpl;
import com.instagramclone.utility.RedisUtility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@DisplayName("User Affinity Service Unit Tests")
class UserAffinityServiceTest {

    private RedisUtility redisUtility;
    private ObjectMapper objectMapper;
    private UserAffinityServiceImpl affinityService;

    @BeforeEach
    void setUp() {
        redisUtility = Mockito.mock(RedisUtility.class);
        objectMapper = new ObjectMapper();
        when(redisUtility.get(anyString())).thenReturn(Optional.empty()); // simulate cache miss, fallback to in-memory

        affinityService = new UserAffinityServiceImpl(redisUtility, objectMapper);
    }

    @Test
    @DisplayName("Should initialize empty profile on cold start")
    void shouldInitializeEmptyProfileOnColdStart() {
        UUID viewerId = UUID.randomUUID();
        UserAffinityProfile profile = affinityService.getAffinityProfile(viewerId);

        assertThat(profile).isNotNull();
        assertThat(profile.getViewerId()).isEqualTo(viewerId);
        assertThat(profile.getCreatorAffinity()).isEmpty();
        assertThat(profile.getHashtagAffinity()).isEmpty();
    }

    @Test
    @DisplayName("Should accumulate creator and hashtag affinity on interaction")
    void shouldAccumulateAffinitiesOnInteraction() {
        UUID viewerId = UUID.randomUUID();
        UUID creatorA = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        // 1. Like post with #nature and #photography
        affinityService.recordInteraction(viewerId, creatorA, postId, Set.of("#nature", "#photography"), FeedConstants.EVENT_POST_LIKED);

        UserAffinityProfile profile = affinityService.getAffinityProfile(viewerId);
        assertThat(profile.getAffinityWithCreator(creatorA)).isEqualTo(1.0);
        assertThat(profile.getAffinityWithHashtag("nature")).isEqualTo(1.0);
        assertThat(profile.getAffinityWithHashtag("photography")).isEqualTo(1.0);

        // 2. Share post from creatorA (higher weight)
        affinityService.recordInteraction(viewerId, creatorA, UUID.randomUUID(), Set.of("#nature"), FeedConstants.EVENT_POST_SHARED);

        profile = affinityService.getAffinityProfile(viewerId);
        assertThat(profile.getAffinityWithCreator(creatorA)).isEqualTo(5.0); // 1.0 + 4.0
        assertThat(profile.getAffinityWithHashtag("nature")).isEqualTo(4.0); // 1.0 + 3.0
    }

    @Test
    @DisplayName("Should penalize creator affinity on negative feedback")
    void shouldPenalizeCreatorAffinityOnNegativeFeedback() {
        UUID viewerId = UUID.randomUUID();
        UUID creatorA = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        // Initial like
        affinityService.recordInteraction(viewerId, creatorA, postId, Set.of("tech"), FeedConstants.EVENT_POST_LIKED);
        assertThat(affinityService.getAffinityProfile(viewerId).getAffinityWithCreator(creatorA)).isEqualTo(1.0);

        // Negative feedback (e.g., Hide / Not interested)
        affinityService.recordNegativeFeedback(viewerId, creatorA, postId);

        UserAffinityProfile profile = affinityService.getAffinityProfile(viewerId);
        assertThat(profile.getAffinityWithCreator(creatorA)).isLessThan(0.0);
        assertThat(profile.getRecentInteractedItemIds()).contains(postId);
    }
}
