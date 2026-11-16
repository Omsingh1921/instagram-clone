package com.instagramclone.feed.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.entity.DynamicFeedConfig;
import com.instagramclone.admin.service.interfaces.IDynamicFeedConfigService;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.engagement.service.interfaces.IEngagementService;
import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.feed.dto.response.FeedItemResponse;
import com.instagramclone.feed.dto.response.UserAffinityProfile;
import com.instagramclone.feed.enums.FeedItemType;
import com.instagramclone.feed.service.interfaces.IFeedRankingEngine;
import com.instagramclone.feed.service.interfaces.IFeedService;
import com.instagramclone.feed.service.interfaces.IUserAffinityService;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.post.dto.response.PostMediaResponse;
import com.instagramclone.post.entity.Post;
import com.instagramclone.post.entity.PostMedia;
import com.instagramclone.post.entity.PostNotInterested;
import com.instagramclone.post.enums.MediaType;
import com.instagramclone.post.enums.PostVisibility;
import com.instagramclone.post.repository.PostNotInterestedRepository;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.entity.ReelNotInterested;
import com.instagramclone.reel.enums.ReelStatus;
import com.instagramclone.reel.repository.ReelNotInterestedRepository;
import com.instagramclone.reel.repository.ReelRepository;
import com.instagramclone.reel.service.interfaces.IReelEngagementService;
import com.instagramclone.security.service.interfaces.IPrivacyService;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.repository.CloseFriendRepository;
import com.instagramclone.user.repository.UserMuteRepository;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.utility.RedisUtility;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Production implementation of Instagram 4-stage algorithmic feed service.
 */
@Service
@RequiredArgsConstructor
public class FeedServiceImpl implements IFeedService {

    private static final Logger log = LoggerFactory.getLogger(FeedServiceImpl.class);
    private static final String PAGE0_CACHE_PREFIX = FeedConstants.CACHE_HOME_FEED_PAGE0_PREFIX;
    private static final Duration PAGE0_CACHE_TTL = Duration.ofMinutes(3);

    private final com.instagramclone.admin.repository.ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final ReelRepository reelRepository;
    private final FollowRepository followRepository;
    private final UserMuteRepository userMuteRepository;
    private final PostNotInterestedRepository postNotInterestedRepository;
    private final ReelNotInterestedRepository reelNotInterestedRepository;
    private final CloseFriendRepository closeFriendRepository;
    private final UserRepository userRepository;
    private final IEngagementService engagementService;
    private final IReelEngagementService reelEngagementService;
    private final IPrivacyService privacyService;
    private final IUserAffinityService userAffinityService;
    private final IFeedRankingEngine feedRankingEngine;
    private final FeedDiversityFilter feedDiversityFilter;
    private final RedisUtility redisUtility;
    private final ObjectMapper objectMapper;
    private final IMediaUrlService mediaUrlService;

    @Autowired(required = false)
    private IDynamicFeedConfigService dynamicFeedConfigService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FeedItemResponse> getHomeFeed(String mode, Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Check Page 0 snapshot cache for rapid initial load (< 5ms)
        if (pageable.getPageNumber() == 0 && (mode == null || FeedConstants.MODE_ALGORITHMIC.equalsIgnoreCase(mode))) {
            String cacheKey = PAGE0_CACHE_PREFIX + currentUserId;
            Optional<String> cached = redisUtility.get(cacheKey);
            if (cached.isPresent()) {
                try {
                    PageResponse<FeedItemResponse> cachedResp = objectMapper.readValue(cached.get(), new TypeReference<PageResponse<FeedItemResponse>>() {});
                    if (cachedResp != null && cachedResp.getContent() != null) {
                        for (FeedItemResponse item : cachedResp.getContent()) {
                            if (item.getMedia() != null) {
                                for (PostMediaResponse pm : item.getMedia()) {
                                    pm.setMediaUrl(mediaUrlService.maskUrl(pm.getMediaUrl()));
                                }
                            }
                            if (item.getVideoUrl() != null) {
                                item.setVideoUrl(mediaUrlService.maskUrl(item.getVideoUrl()));
                            }
                            if (item.getThumbnailUrl() != null) {
                                item.setThumbnailUrl(mediaUrlService.maskUrl(item.getThumbnailUrl()));
                            }
                            if (item.getAuthor() != null) {
                                item.getAuthor().setAvatarUrl(mediaUrlService.maskUrl(item.getAuthor().getAvatarUrl()));
                            }
                        }
                    }
                    return cachedResp;
                } catch (Exception ex) {
                    log.debug("[FEED] Page 0 cache read error: {}", ex.getMessage());
                }
            }
        }

        List<UUID> mutedUserIds = userMuteRepository.findMutedUserIdsForPosts(currentUserId);
        Set<UUID> mutedSet = (mutedUserIds != null) ? new HashSet<>(mutedUserIds) : Collections.emptySet();
        List<UUID> followingList = followRepository.findFollowingIdsByFollowerId(currentUserId);
        Set<UUID> followingSet = (followingList != null) ? new HashSet<>(followingList) : Collections.emptySet();

        List<UUID> reportedUserIds = reportRepository.findReportedUserIdsByReporterId(currentUserId);
        Set<UUID> reportedUserSet = (reportedUserIds != null) ? new HashSet<>(reportedUserIds) : Collections.emptySet();
        List<UUID> reportedPostIds = reportRepository.findReportedPostIdsByReporterId(currentUserId);
        Set<UUID> reportedPostSet = (reportedPostIds != null) ? new HashSet<>(reportedPostIds) : Collections.emptySet();
        List<UUID> reportedReelIds = reportRepository.findReportedReelIdsByReporterId(currentUserId);
        Set<UUID> reportedReelSet = (reportedReelIds != null) ? new HashSet<>(reportedReelIds) : Collections.emptySet();

        // 2. Handle FAVORITES mode (Close Friends Only)
        if (FeedConstants.MODE_FAVORITES.equalsIgnoreCase(mode)) {
            Set<UUID> favoriteIds = closeFriendRepository.findFriendIdsByUserId(currentUserId);
            if (favoriteIds == null || favoriteIds.isEmpty()) {
                return PageResponse.from(new PageImpl<>(Collections.emptyList(), pageable, 0));
            }

            Page<Post> postsPage = postRepository.findByUser_IdInAndIsDeletedFalseOrderByCreatedAtDesc(favoriteIds, pageable);
            List<FeedItemResponse> items = postsPage.getContent().stream()
                    .filter(p -> p.getUser() != null && !mutedSet.contains(p.getUser().getId()) && !reportedUserSet.contains(p.getUser().getId()) && !reportedPostSet.contains(p.getId()))
                    .map(p -> toFeedItemResponse(p, currentUserId))
                    .toList();
            return PageResponse.from(new PageImpl<>(items, pageable, postsPage.getTotalElements()));
        }

        // 3. Handle FOLLOWING mode (Chronological Followed-Only)
        if (FeedConstants.MODE_FOLLOWING.equalsIgnoreCase(mode)) {
            if (followingSet.isEmpty()) {
                return PageResponse.from(new PageImpl<>(Collections.emptyList(), pageable, 0));
            }

            Page<Post> postsPage = postRepository.findByUser_IdInAndIsDeletedFalseOrderByCreatedAtDesc(followingSet, pageable);
            List<FeedItemResponse> items = postsPage.getContent().stream()
                    .filter(p -> p.getUser() != null && !mutedSet.contains(p.getUser().getId()) && !reportedUserSet.contains(p.getUser().getId()) && !reportedPostSet.contains(p.getId()))
                    .map(p -> toFeedItemResponse(p, currentUserId))
                    .toList();
            return PageResponse.from(new PageImpl<>(items, pageable, postsPage.getTotalElements()));
        }

        // 4. Default: ALGORITHMIC 4-Stage Pipeline
        int targetPageSize = pageable.getPageSize();
        int pageNum = pageable.getPageNumber();

        long totalPostsInDb = postRepository.countByIsDeletedFalse();
        long totalReelsInDb = reelRepository.countByIsDeletedFalse();
        long totalAvailableInDb = totalPostsInDb + totalReelsInDb;

        // Calculate available pages to enable continuous circular looping (modulo pagination)
        int totalPostPages = (totalPostsInDb > 0) ? (int) Math.ceil((double) totalPostsInDb / targetPageSize) : 1;
        int totalReelPages = (totalReelsInDb > 0) ? (int) Math.ceil((double) totalReelsInDb / targetPageSize) : 1;

        int effectivePostPage = pageNum % Math.max(1, totalPostPages);
        int effectiveReelPage = pageNum % Math.max(1, totalReelPages);
        int loopCycle = (totalPostPages > 0) ? (pageNum / totalPostPages) : 0;

        Pageable postPageable = PageRequest.of(effectivePostPage, targetPageSize, pageable.getSort());
        Pageable reelPageable = PageRequest.of(effectiveReelPage, targetPageSize, pageable.getSort());

        // Stage 1: Candidate Generation (Sourcing)
        Page<Post> postsPage = postRepository.findTimelinePosts(currentUserId, postPageable);
        Page<Reel> reelsPage = reelRepository.findFeedReels(ReelStatus.READY, currentUserId, reelPageable);

        // Stage 2: Feature & Signal Extraction
        UserAffinityProfile affinityProfile = userAffinityService.getAffinityProfile(currentUserId);
        Set<UUID> seenSet = userAffinityService.getSeenItemIds(currentUserId);

        List<FeedItemResponse> postCandidates = new ArrayList<>(postsPage.getContent().stream()
                .filter(p -> p.getUser() != null && !mutedSet.contains(p.getUser().getId()) && !reportedUserSet.contains(p.getUser().getId()) && !reportedPostSet.contains(p.getId()))
                .map(p -> toFeedItemResponse(p, currentUserId))
                .toList());

        // If timeline posts are fewer than targetPageSize, supplement with public discovery posts from explore
        if (postCandidates.size() < targetPageSize) {
            try {
                Page<Post> explorePostsPage = postRepository.findExplorePosts(
                        PostVisibility.PUBLIC, currentUserId, postPageable);
                List<FeedItemResponse> exploreCandidates = explorePostsPage.getContent().stream()
                        .filter(p -> p.getUser() != null && !mutedSet.contains(p.getUser().getId()) && !reportedUserSet.contains(p.getUser().getId()) && !reportedPostSet.contains(p.getId()))
                        .map(p -> toFeedItemResponse(p, currentUserId))
                        .toList();
                Set<UUID> existingIds = postCandidates.stream().map(FeedItemResponse::getId).collect(Collectors.toSet());
                for (FeedItemResponse exp : exploreCandidates) {
                    if (!existingIds.contains(exp.getId())) {
                        postCandidates.add(exp);
                        existingIds.add(exp.getId());
                    }
                }
            } catch (Exception ex) {
                log.debug("[FEED] Explore post candidate sourcing fallback: {}", ex.getMessage());
            }
        }

        // If candidates are still fewer than targetPageSize, backfill from Page 0 to ensure full page
        if (postCandidates.size() < targetPageSize && effectivePostPage > 0) {
            try {
                Page<Post> fallbackPage = postRepository.findExplorePosts(
                        PostVisibility.PUBLIC, currentUserId, PageRequest.of(0, targetPageSize, pageable.getSort()));
                Set<UUID> existingIds = postCandidates.stream().map(FeedItemResponse::getId).collect(Collectors.toSet());
                for (Post p : fallbackPage.getContent()) {
                    if (p.getUser() != null && !existingIds.contains(p.getId())) {
                        postCandidates.add(toFeedItemResponse(p, currentUserId));
                        existingIds.add(p.getId());
                        if (postCandidates.size() >= targetPageSize) break;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        List<FeedItemResponse> reelCandidates = new ArrayList<>(reelsPage.getContent().stream()
                .filter(r -> r.getUser() != null && !mutedSet.contains(r.getUser().getId()) && !reportedUserSet.contains(r.getUser().getId()) && !reportedReelSet.contains(r.getId()))
                .map(r -> toFeedItemResponse(r, currentUserId))
                .toList());

        // On repeated loop cycles, shuffle candidates slightly so the user gets dynamic variety
        if (loopCycle > 0 && !postCandidates.isEmpty()) {
            Collections.shuffle(postCandidates, new Random(currentUserId.hashCode() + loopCycle));
        }
        if (loopCycle > 0 && !reelCandidates.isEmpty()) {
            Collections.shuffle(reelCandidates, new Random(currentUserId.hashCode() + loopCycle + 77));
        }

        // Stage 3: Multi-Task Value Scoring & Ranking with Seen Exclusion
        // Filter out items already seen by the user so refreshed feeds always serve fresh content
        List<FeedItemResponse> unseenPosts = (seenSet != null && !seenSet.isEmpty())
                ? postCandidates.stream().filter(p -> !seenSet.contains(p.getId())).toList()
                : postCandidates;

        List<FeedItemResponse> unseenReels = (seenSet != null && !seenSet.isEmpty())
                ? reelCandidates.stream().filter(r -> !seenSet.contains(r.getId())).toList()
                : reelCandidates;

        // Graceful fallback & recirculation: Ensure we have enough posts to fill the requested page
        List<FeedItemResponse> postsToRank = new ArrayList<>(unseenPosts);
        if (postsToRank.size() < targetPageSize && !postCandidates.isEmpty()) {
            Set<UUID> rankedIds = postsToRank.stream().map(FeedItemResponse::getId).collect(Collectors.toSet());
            for (FeedItemResponse candidate : postCandidates) {
                if (!rankedIds.contains(candidate.getId())) {
                    postsToRank.add(candidate);
                    rankedIds.add(candidate.getId());
                    if (postsToRank.size() >= targetPageSize) {
                        break;
                    }
                }
            }
        }

        List<FeedItemResponse> reelsToRank = new ArrayList<>(unseenReels);
        if (reelsToRank.size() < 2 && !reelCandidates.isEmpty()) {
            Set<UUID> rankedReelIds = reelsToRank.stream().map(FeedItemResponse::getId).collect(Collectors.toSet());
            for (FeedItemResponse candidate : reelCandidates) {
                if (!rankedReelIds.contains(candidate.getId())) {
                    reelsToRank.add(candidate);
                    rankedReelIds.add(candidate.getId());
                    if (reelsToRank.size() >= 2) {
                        break;
                    }
                }
            }
        }

        List<FeedItemResponse> rankedPosts = feedRankingEngine.rankHomeFeed(
                currentUserId, postsToRank, affinityProfile, followingSet, seenSet);
        List<FeedItemResponse> rankedReels = feedRankingEngine.rankHomeFeed(
                currentUserId, reelsToRank, affinityProfile, followingSet, seenSet);

        // Stage 4: Re-Ranking, Diversity, Anti-Clustering
        int postsPerReel = 3;
        int antiClusteringWindow = FeedConstants.DEFAULT_ANTI_CLUSTERING_WINDOW;

        if (dynamicFeedConfigService != null) {
            try {
                DynamicFeedConfig cfg = dynamicFeedConfigService.getActiveConfig();
                if (cfg != null) {
                    if (cfg.getPostsPerReel() != null) postsPerReel = cfg.getPostsPerReel();
                    if (cfg.getAntiClusteringWindow() != null) antiClusteringWindow = cfg.getAntiClusteringWindow();
                }
            } catch (Exception ignored) {
            }
        }

        List<FeedItemResponse> interleaved = feedDiversityFilter.interleavePostsAndReels(
                rankedPosts, rankedReels, postsPerReel);
        List<FeedItemResponse> diverseFeed = feedDiversityFilter.applyAntiClustering(
                interleaved, antiClusteringWindow);

        int pageSize = pageable.getPageSize();
        List<FeedItemResponse> pagedList = diverseFeed.size() > pageSize
                ? diverseFeed.subList(0, pageSize)
                : diverseFeed;

        // Endless loop totalElements calculation: Ensures last=false so infinite scroll never stops
        long infiniteTotal = Math.max(totalAvailableInDb, (long) (pageNum + 5) * pageSize);

        PageResponse<FeedItemResponse> response = PageResponse.from(new PageImpl<>(pagedList, pageable, infiniteTotal));

        // Automatically record served items as seen so subsequent refreshes never serve the same items
        List<UUID> servedIds = pagedList.stream()
                .map(FeedItemResponse::getId)
                .filter(Objects::nonNull)
                .toList();
        if (!servedIds.isEmpty()) {
            userAffinityService.recordSeenItems(currentUserId, servedIds);
            redisUtility.delete(PAGE0_CACHE_PREFIX + currentUserId);
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FeedItemResponse> getExploreFeed(Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserPrincipal()
                .map(com.instagramclone.security.principal.UserPrincipal::getId)
                .orElse(null);

        int candidatePoolSize = Math.max(pageable.getPageSize() * 2, 30);
        Pageable candidatePageable = PageRequest.of(pageable.getPageNumber(), candidatePoolSize);

        Page<Post> postsPage = postRepository.findExplorePosts(PostVisibility.PUBLIC, currentUserId, candidatePageable);
        Page<Reel> reelsPage = reelRepository.findFeedReels(ReelStatus.READY, currentUserId, candidatePageable);

        UserAffinityProfile affinityProfile = userAffinityService.getAffinityProfile(currentUserId);
        Set<UUID> seenSet = (currentUserId != null) ? userAffinityService.getSeenItemIds(currentUserId) : Collections.emptySet();

        List<UUID> expReportedUserIds = (currentUserId != null) ? reportRepository.findReportedUserIdsByReporterId(currentUserId) : Collections.emptyList();
        Set<UUID> expReportedUserSet = (expReportedUserIds != null) ? new HashSet<>(expReportedUserIds) : Collections.emptySet();
        List<UUID> expReportedPostIds = (currentUserId != null) ? reportRepository.findReportedPostIdsByReporterId(currentUserId) : Collections.emptyList();
        Set<UUID> expReportedPostSet = (expReportedPostIds != null) ? new HashSet<>(expReportedPostIds) : Collections.emptySet();
        List<UUID> expReportedReelIds = (currentUserId != null) ? reportRepository.findReportedReelIdsByReporterId(currentUserId) : Collections.emptyList();
        Set<UUID> expReportedReelSet = (expReportedReelIds != null) ? new HashSet<>(expReportedReelIds) : Collections.emptySet();

        List<FeedItemResponse> postCandidates = postsPage.getContent().stream()
                .filter(p -> p.getUser() != null && !expReportedUserSet.contains(p.getUser().getId()) && !expReportedPostSet.contains(p.getId()))
                .map(p -> toFeedItemResponse(p, currentUserId))
                .toList();

        List<FeedItemResponse> reelCandidates = reelsPage.getContent().stream()
                .filter(r -> r.getUser() != null && !expReportedUserSet.contains(r.getUser().getId()) && !expReportedReelSet.contains(r.getId()))
                .map(r -> toFeedItemResponse(r, currentUserId))
                .toList();

        List<FeedItemResponse> unseenPosts = (seenSet != null && !seenSet.isEmpty())
                ? postCandidates.stream().filter(p -> !seenSet.contains(p.getId())).toList()
                : postCandidates;
        List<FeedItemResponse> unseenReels = (seenSet != null && !seenSet.isEmpty())
                ? reelCandidates.stream().filter(r -> !seenSet.contains(r.getId())).toList()
                : reelCandidates;

        List<FeedItemResponse> postsToRank = !unseenPosts.isEmpty() ? unseenPosts : postCandidates;
        List<FeedItemResponse> reelsToRank = !unseenReels.isEmpty() ? unseenReels : reelCandidates;

        List<FeedItemResponse> rankedPosts = feedRankingEngine.rankExploreFeed(currentUserId, postsToRank, affinityProfile, seenSet);
        List<FeedItemResponse> rankedReels = feedRankingEngine.rankExploreFeed(currentUserId, reelsToRank, affinityProfile, seenSet);

        List<FeedItemResponse> interleaved = feedDiversityFilter.interleavePostsAndReels(rankedPosts, rankedReels, 2);
        List<FeedItemResponse> diverseExplore = feedDiversityFilter.applyAntiClustering(
                interleaved, FeedConstants.DEFAULT_ANTI_CLUSTERING_WINDOW);

        int pageSize = pageable.getPageSize();
        List<FeedItemResponse> pagedList = diverseExplore.size() > pageSize
                ? diverseExplore.subList(0, pageSize)
                : diverseExplore;
        long totalElements = postsPage.getTotalElements() + reelsPage.getTotalElements();

        if (currentUserId != null) {
            List<UUID> servedIds = pagedList.stream()
                    .map(FeedItemResponse::getId)
                    .filter(Objects::nonNull)
                    .toList();
            if (!servedIds.isEmpty()) {
                userAffinityService.recordSeenItems(currentUserId, servedIds);
            }
        }

        return PageResponse.from(new PageImpl<>(pagedList, pageable, totalElements));
    }

    @Override
    public void recordSeen(UUID viewerId, List<UUID> itemIds) {
        if (viewerId == null || itemIds == null || itemIds.isEmpty()) return;
        userAffinityService.recordSeenItems(viewerId, itemIds);
        redisUtility.delete(PAGE0_CACHE_PREFIX + viewerId);
    }

    @Override
    @Transactional
    public void markNotInterested(UUID viewerId, UUID itemId, String itemType) {
        if (viewerId == null || itemId == null) return;

        User viewer = userRepository.findById(viewerId).orElse(null);
        if (viewer == null) return;

        if (itemType == null || FeedConstants.ITEM_TYPE_POST.equalsIgnoreCase(itemType)) {
            Optional<Post> postOpt = postRepository.findById(itemId);
            if (postOpt.isPresent()) {
                Post post = postOpt.get();
                if (!postNotInterestedRepository.existsByUserIdAndPostId(viewerId, itemId)) {
                    PostNotInterested record = PostNotInterested.builder()
                            .user(viewer)
                            .post(post)
                            .build();
                    postNotInterestedRepository.save(record);
                }
                UUID authorId = post.getUser() != null ? post.getUser().getId() : null;
                userAffinityService.recordNegativeFeedback(viewerId, authorId, itemId);
            }
        } else if (FeedConstants.ITEM_TYPE_REEL.equalsIgnoreCase(itemType)) {
            Optional<Reel> reelOpt = reelRepository.findById(itemId);
            if (reelOpt.isPresent()) {
                Reel reel = reelOpt.get();
                if (!reelNotInterestedRepository.existsByUserIdAndReelId(viewerId, itemId)) {
                    ReelNotInterested record = ReelNotInterested.builder()
                            .user(viewer)
                            .reel(reel)
                            .build();
                    reelNotInterestedRepository.save(record);
                }
                UUID authorId = reel.getUser() != null ? reel.getUser().getId() : null;
                userAffinityService.recordNegativeFeedback(viewerId, authorId, itemId);
            }
        }

        redisUtility.delete(PAGE0_CACHE_PREFIX + viewerId);
    }

    private List<PostAuthorResponse> fetchSuggestedUsers(UUID viewerId, Set<UUID> followingSet) {
        if (viewerId == null) return Collections.emptyList();
        try {
            List<User> candidates = userRepository.findSuggestedUserCandidates(viewerId, PageRequest.of(0, 30));
            if (candidates == null || candidates.isEmpty()) return Collections.emptyList();
            return candidates.stream()
                    .filter(u -> !followingSet.contains(u.getId()))
                    .limit(5)
                    .map(u -> PostAuthorResponse.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                            .avatarUrl(u.getProfile() != null ? mediaUrlService.maskUrl(u.getProfile().getAvatarUrl()) : null)
                            .build())
                    .toList();
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    private FeedItemResponse toFeedItemResponse(Post post, UUID viewerId) {
        User u = post.getUser();
        List<PostMediaResponse> mediaResponses = new ArrayList<>();
        if (post.getMediaList() != null) {
            for (PostMedia pm : post.getMediaList()) {
                mediaResponses.add(PostMediaResponse.builder()
                        .id(pm.getId())
                        .mediaUrl(mediaUrlService.maskUrl(pm.getMediaUrl()))
                        .mediaType(pm.getMediaType())
                        .displayOrder(pm.getDisplayOrder())
                        .width(pm.getWidth())
                        .height(pm.getHeight())
                        .build());
            }
        }

        long likeCount = engagementService.getLikeCount(post.getId());
        long commentCount = engagementService.getCommentCount(post.getId());
        long shareCount = engagementService.getShareCount(post.getId());
        boolean liked = viewerId != null && engagementService.isLikedByUser(post.getId(), viewerId);
        boolean saved = viewerId != null && engagementService.isSavedByUser(post.getId(), viewerId);

        return FeedItemResponse.builder()
                .id(post.getId())
                .itemType(FeedItemType.POST)
                .author(PostAuthorResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                        .avatarUrl(u.getProfile() != null ? mediaUrlService.maskUrl(u.getProfile().getAvatarUrl()) : null)
                        .build())
                .caption(post.getCaption())
                .location(post.getLocation())
                .media(mediaResponses)
                .likeCount(likeCount)
                .commentCount(commentCount)
                .shareCount(shareCount)
                .viewCount(0)
                .likedByCurrentUser(liked)
                .savedByCurrentUser(saved)
                .isPinned(post.isPinned())
                .commentsDisabled(post.isCommentsDisabled())
                .hideLikeCount(post.isHideLikeCount())
                .isArchived(post.isArchived())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private FeedItemResponse toFeedItemResponse(Reel reel, UUID viewerId) {
        User u = reel.getUser();

        List<PostMediaResponse> mediaResponses = new ArrayList<>();
        mediaResponses.add(PostMediaResponse.builder()
                .id(reel.getId())
                .mediaUrl(mediaUrlService.maskUrl(reel.getVideoUrl()))
                .mediaType(MediaType.VIDEO)
                .displayOrder(0)
                .width(1080)
                .height(1920)
                .build());

        long likeCount = reelEngagementService.getLikeCount(reel.getId());
        long commentCount = reelEngagementService.getCommentCount(reel.getId());
        long shareCount = reelEngagementService.getShareCount(reel.getId());
        boolean liked = viewerId != null && reelEngagementService.isLikedByUser(reel.getId(), viewerId);
        boolean saved = viewerId != null && reelEngagementService.isSavedByUser(reel.getId(), viewerId);

        String effectiveThumbnail = reel.getThumbnailUrl();
        if ((effectiveThumbnail == null || effectiveThumbnail.isBlank()) && reel.getVideoUrl() != null) {
            if (reel.getVideoUrl().contains("cloudinary.com")) {
                effectiveThumbnail = reel.getVideoUrl().replaceFirst("/video/upload/", "/video/upload/so_0,w_720,c_limit,q_auto,f_jpg/").replaceFirst("\\.[^/.]+$", ".jpg");
            } else {
                effectiveThumbnail = reel.getVideoUrl().replaceFirst("\\.[^/.]+$", ".jpg");
            }
        }

        return FeedItemResponse.builder()
                .id(reel.getId())
                .itemType(FeedItemType.REEL)
                .author(PostAuthorResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                        .avatarUrl(u.getProfile() != null ? mediaUrlService.maskUrl(u.getProfile().getAvatarUrl()) : null)
                        .build())
                .caption(reel.getCaption())
                .videoUrl(mediaUrlService.maskUrl(reel.getVideoUrl()))
                .thumbnailUrl(mediaUrlService.maskUrl(effectiveThumbnail))
                .audioTrack(reel.getAudioTitle())
                .duration(reel.getDurationMs() != null ? (int) (reel.getDurationMs() / 1000) : 0)
                .media(mediaResponses)
                .likeCount(likeCount)
                .commentCount(commentCount)
                .shareCount(shareCount)
                .viewCount(reelEngagementService.getViewCount(reel.getId()))
                .likedByCurrentUser(liked)
                .savedByCurrentUser(saved)
                .isPinned(reel.isPinned())
                .commentsDisabled(false)
                .hideLikeCount(reel.isHideLikeCount())
                .isArchived(reel.isArchived())
                .isReel(true)
                .contentType(FeedConstants.ITEM_TYPE_REEL)
                .createdAt(reel.getCreatedAt())
                .updatedAt(reel.getUpdatedAt())
                .build();
    }
}
