package com.instagramclone.feed;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.repository.ReportRepository;
import com.instagramclone.admin.service.interfaces.IDynamicFeedConfigService;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.engagement.service.interfaces.IEngagementService;
import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.service.impl.FeedDiversityFilter;
import com.instagramclone.feed.service.interfaces.IFeedRankingEngine;
import com.instagramclone.feed.service.interfaces.IUserAffinityService;
import com.instagramclone.feed.service.impl.FeedServiceImpl;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.repository.PostNotInterestedRepository;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.reel.repository.ReelNotInterestedRepository;
import com.instagramclone.reel.repository.ReelRepository;
import com.instagramclone.reel.service.interfaces.IReelEngagementService;
import com.instagramclone.security.service.interfaces.IPrivacyService;
import com.instagramclone.security.principal.UserPrincipal;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import com.instagramclone.user.repository.CloseFriendRepository;
import com.instagramclone.user.repository.UserMuteRepository;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.utility.RedisUtility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feed Favorites & Mode Tests")
class FeedFavoritesModeTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private ReelRepository reelRepository;
    @Mock
    private FollowRepository followRepository;
    @Mock
    private UserMuteRepository userMuteRepository;
    @Mock
    private PostNotInterestedRepository postNotInterestedRepository;
    @Mock
    private ReelNotInterestedRepository reelNotInterestedRepository;
    @Mock
    private CloseFriendRepository closeFriendRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private IEngagementService engagementService;
    @Mock
    private IReelEngagementService reelEngagementService;
    @Mock
    private IPrivacyService privacyService;
    @Mock
    private IUserAffinityService userAffinityService;
    @Mock
    private IFeedRankingEngine feedRankingEngine;
    @Mock
    private FeedDiversityFilter feedDiversityFilter;
    @Mock
    private RedisUtility redisUtility;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private com.instagramclone.media.service.interfaces.IMediaUrlService mediaUrlService;

    private FeedServiceImpl feedService;
    private UUID currentUserId;

    @BeforeEach
    void setUp() {
        currentUserId = UUID.randomUUID();
        User testUser = User.builder()
                .id(currentUserId)
                .username("testviewer")
                .role(Role.ROLE_USER)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .build();
        UserPrincipal principal = UserPrincipal.create(testUser);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        feedService = new FeedServiceImpl(
                reportRepository,
                postRepository,
                reelRepository,
                followRepository,
                userMuteRepository,
                postNotInterestedRepository,
                reelNotInterestedRepository,
                closeFriendRepository,
                userRepository,
                engagementService,
                reelEngagementService,
                privacyService,
                userAffinityService,
                feedRankingEngine,
                feedDiversityFilter,
                redisUtility,
                objectMapper,
                mediaUrlService);
    }

    @Test
    @DisplayName("Should return empty page when user has no close friends in FAVORITES mode")
    void shouldReturnEmptyPageWhenNoCloseFriends() {
        when(closeFriendRepository.findFriendIdsByUserId(currentUserId)).thenReturn(Collections.emptySet());

        PageResponse<FeedItemResponse> response = feedService.getHomeFeed("FAVORITES", PageRequest.of(0, 10));

        assertThat(response.getContent()).isEmpty();
        verify(postRepository, never()).findByUser_IdInAndIsDeletedFalseOrderByCreatedAtDesc(any(), any());
    }

    @Test
    @DisplayName("Should query exclusively close friends' posts in FAVORITES mode")
    void shouldQueryOnlyFavoritesPosts() {
        UUID favoriteId = UUID.randomUUID();
        when(closeFriendRepository.findFriendIdsByUserId(currentUserId)).thenReturn(Set.of(favoriteId));

        User favUser = User.builder().id(favoriteId).username("bff").build();
        Post favPost = Post.builder().id(UUID.randomUUID()).user(favUser).caption("Close friends only!").build();

        when(postRepository.findByUser_IdInAndIsDeletedFalseOrderByCreatedAtDesc(eq(Set.of(favoriteId)),
                any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(favPost)));

        PageResponse<FeedItemResponse> response = feedService.getHomeFeed("FAVORITES", PageRequest.of(0, 10));

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getCaption()).isEqualTo("Close friends only!");
        assertThat(response.getContent().get(0).getAuthor().getUsername()).isEqualTo("bff");
    }
}
