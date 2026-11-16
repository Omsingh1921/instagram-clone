package com.instagramclone.admin.service.impl;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.dto.response.AdminDashboardStatsResponse;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.repository.ReportRepository;
import com.instagramclone.admin.service.interfaces.IAdminAnalyticsService;
import com.instagramclone.admin.strategy.AdminActivityProvider;
import com.instagramclone.engagement.repository.CommentRepository;
import com.instagramclone.engagement.repository.LikeRepository;
import com.instagramclone.engagement.repository.PostShareRepository;
import com.instagramclone.engagement.repository.SavedPostRepository;
import com.instagramclone.post.repository.PostRepository;
import com.instagramclone.reel.repository.ReelCommentRepository;
import com.instagramclone.reel.repository.ReelLikeRepository;
import com.instagramclone.reel.repository.ReelRepository;
import com.instagramclone.reel.repository.ReelShareRepository;
import com.instagramclone.reel.repository.SavedReelRepository;
import com.instagramclone.story.repository.StoryRepository;
import com.instagramclone.user.enums.UserStatus;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements IAdminAnalyticsService {

    private static final DateTimeFormatter METRIC_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReelRepository reelRepository;
    private final CommentRepository commentRepository;
    private final StoryRepository storyRepository;
    private final LikeRepository likeRepository;
    private final PostShareRepository postShareRepository;
    private final SavedPostRepository savedPostRepository;
    private final ReelLikeRepository reelLikeRepository;
    private final ReelCommentRepository reelCommentRepository;
    private final ReelShareRepository reelShareRepository;
    private final SavedReelRepository savedReelRepository;
    private final List<AdminActivityProvider> activityProviders;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats(int days) {
        int periodDays = Math.max(1, Math.min(days, 90));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentStart = now.minusDays(periodDays);
        LocalDateTime prevStart = now.minusDays(periodDays * 2L);
        LocalDateTime seriesSince = LocalDate.now().minusDays(periodDays - 1L).atStartOfDay();

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countActiveUsers();
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long deactivatedUsers = userRepository.countByStatus(UserStatus.DEACTIVATED);

        long totalPosts = postRepository.countByIsDeletedFalse();
        long totalReels = reelRepository.countByIsDeletedFalse();
        long activeStories = storyRepository.countActiveStories(now);
        long totalStories = storyRepository.countByIsDeletedFalse();
        long totalComments = commentRepository.countByIsDeletedFalse();

        long totalReports = reportRepository.count();
        long openReports = reportRepository.countByStatus(ReportStatus.OPEN);
        long reviewedReports = reportRepository.countByStatus(ReportStatus.REVIEWED);
        long resolvedReports = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long dismissedReports = reportRepository.countByStatus(ReportStatus.DISMISSED);
        long actionedThisWeek = reportRepository.countByStatusInAndResolvedAtAfter(
                List.of(ReportStatus.RESOLVED, ReportStatus.DISMISSED), now.minusDays(7));

        long currUsers = userRepository.countByCreatedAtBetween(currentStart, now);
        long prevUsers = userRepository.countByCreatedAtBetween(prevStart, currentStart);
        long currPosts = postRepository.countByIsDeletedFalseAndCreatedAtBetween(currentStart, now);
        long prevPosts = postRepository.countByIsDeletedFalseAndCreatedAtBetween(prevStart, currentStart);
        long currReels = reelRepository.countByIsDeletedFalseAndCreatedAtBetween(currentStart, now);
        long prevReels = reelRepository.countByIsDeletedFalseAndCreatedAtBetween(prevStart, currentStart);
        long currStories = storyRepository.countByIsDeletedFalseAndCreatedAtBetween(currentStart, now);
        long prevStories = storyRepository.countByIsDeletedFalseAndCreatedAtBetween(prevStart, currentStart);

        long totalLikes = likeRepository.count() + reelLikeRepository.count();
        long currLikes = likeRepository.countByCreatedAtBetween(currentStart, now)
                + reelLikeRepository.countByCreatedAtBetween(currentStart, now);
        long prevLikes = likeRepository.countByCreatedAtBetween(prevStart, currentStart)
                + reelLikeRepository.countByCreatedAtBetween(prevStart, currentStart);

        long totalEngagementComments = totalComments + reelCommentRepository.countByIsDeletedFalse();
        long currComments = commentRepository.countByIsDeletedFalseAndCreatedAtBetween(currentStart, now)
                + reelCommentRepository.countByIsDeletedFalseAndCreatedAtBetween(currentStart, now);
        long prevComments = commentRepository.countByIsDeletedFalseAndCreatedAtBetween(prevStart, currentStart)
                + reelCommentRepository.countByIsDeletedFalseAndCreatedAtBetween(prevStart, currentStart);

        long totalShares = postShareRepository.count() + reelShareRepository.count();
        long currShares = postShareRepository.countByCreatedAtBetween(currentStart, now)
                + reelShareRepository.countByCreatedAtBetween(currentStart, now);
        long prevShares = postShareRepository.countByCreatedAtBetween(prevStart, currentStart)
                + reelShareRepository.countByCreatedAtBetween(prevStart, currentStart);

        long totalSaves = savedPostRepository.count() + savedReelRepository.count();
        long currSaves = savedPostRepository.countByCreatedAtBetween(currentStart, now)
                + savedReelRepository.countByCreatedAtBetween(currentStart, now);
        long prevSaves = savedPostRepository.countByCreatedAtBetween(prevStart, currentStart)
                + savedReelRepository.countByCreatedAtBetween(prevStart, currentStart);

        Map<LocalDate, Long> userBuckets = bucketByDate(userRepository.findCreatedAtSince(seriesSince));
        Map<LocalDate, Long> postBuckets = bucketByDate(postRepository.findCreatedAtSince(seriesSince));
        Map<LocalDate, Long> reelBuckets = bucketByDate(reelRepository.findCreatedAtSince(seriesSince));
        Map<LocalDate, Long> storyBuckets = bucketByDate(storyRepository.findCreatedAtSince(seriesSince));
        Map<LocalDate, Long> likeBuckets = mergeBuckets(
                bucketByDate(likeRepository.findCreatedAtSince(seriesSince)),
                bucketByDate(reelLikeRepository.findCreatedAtSince(seriesSince)));
        Map<LocalDate, Long> commentBuckets = mergeBuckets(
                bucketByDate(commentRepository.findCreatedAtSince(seriesSince)),
                bucketByDate(reelCommentRepository.findCreatedAtSince(seriesSince)));
        Map<LocalDate, Long> shareBuckets = mergeBuckets(
                bucketByDate(postShareRepository.findCreatedAtSince(seriesSince)),
                bucketByDate(reelShareRepository.findCreatedAtSince(seriesSince)));
        Map<LocalDate, Long> saveBuckets = mergeBuckets(
                bucketByDate(savedPostRepository.findCreatedAtSince(seriesSince)),
                bucketByDate(savedReelRepository.findCreatedAtSince(seriesSince)));

        List<AdminDashboardStatsResponse.DailyPlatformMetric> growthSeries = new ArrayList<>(periodDays);
        LocalDate today = LocalDate.now();
        for (int i = periodDays - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            long u = userBuckets.getOrDefault(day, 0L);
            long p = postBuckets.getOrDefault(day, 0L);
            long r = reelBuckets.getOrDefault(day, 0L);
            long s = storyBuckets.getOrDefault(day, 0L);
            long l = likeBuckets.getOrDefault(day, 0L);
            long c = commentBuckets.getOrDefault(day, 0L);
            long eng = l + c + shareBuckets.getOrDefault(day, 0L) + saveBuckets.getOrDefault(day, 0L);

            growthSeries.add(AdminDashboardStatsResponse.DailyPlatformMetric.builder()
                    .date(day.toString())
                    .label(day.format(METRIC_LABEL_FORMATTER))
                    .users(u)
                    .posts(p)
                    .reels(r)
                    .stories(s)
                    .likes(l)
                    .comments(c)
                    .engagement(eng)
                    .build());
        }

        return AdminDashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .deactivatedUsers(deactivatedUsers)
                .totalPosts(totalPosts)
                .totalReels(totalReels)
                .activeStories(activeStories)
                .totalStories(totalStories)
                .totalComments(totalComments)
                .totalReports(totalReports)
                .openReports(openReports)
                .reviewedReports(reviewedReports)
                .resolvedReports(resolvedReports)
                .dismissedReports(dismissedReports)
                .actionedThisWeek(actionedThisWeek)
                .periodDays(periodDays)
                .usersGrowthPercent(computeGrowthPercent(currUsers, prevUsers))
                .postsGrowthPercent(computeGrowthPercent(currPosts, prevPosts))
                .reelsGrowthPercent(computeGrowthPercent(currReels, prevReels))
                .storiesGrowthPercent(computeGrowthPercent(currStories, prevStories))
                .totalLikes(totalLikes)
                .likesGrowthPercent(computeGrowthPercent(currLikes, prevLikes))
                .totalEngagementComments(totalEngagementComments)
                .commentsGrowthPercent(computeGrowthPercent(currComments, prevComments))
                .totalShares(totalShares)
                .sharesGrowthPercent(computeGrowthPercent(currShares, prevShares))
                .totalSaves(totalSaves)
                .savesGrowthPercent(computeGrowthPercent(currSaves, prevSaves))
                .growthSeries(growthSeries)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminActivityItemResponse> getRecentActivity(int limit) {
        int clamped = Math.max(1, Math.min(limit, 50));
        Pageable slice = PageRequest.of(0, Math.min(clamped, 10));
        List<AdminActivityItemResponse> items = new ArrayList<>();

        for (AdminActivityProvider provider : activityProviders) {
            items.addAll(provider.fetchRecent(slice));
        }

        items.sort(Comparator.comparing(
                AdminActivityItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        return items.size() > clamped ? new ArrayList<>(items.subList(0, clamped)) : items;
    }

    private double computeGrowthPercent(long current, long previous) {
        if (previous <= 0L) {
            return current > 0L ? 100.0 : 0.0;
        }
        double pct = ((double) (current - previous) / previous) * 100.0;
        return Math.round(pct * 10.0) / 10.0;
    }

    private Map<LocalDate, Long> bucketByDate(List<LocalDateTime> timestamps) {
        Map<LocalDate, Long> map = new HashMap<>();
        if (timestamps == null) {
            return map;
        }
        for (LocalDateTime ts : timestamps) {
            if (ts != null) {
                LocalDate date = ts.toLocalDate();
                map.put(date, map.getOrDefault(date, 0L) + 1L);
            }
        }
        return map;
    }

    private Map<LocalDate, Long> mergeBuckets(Map<LocalDate, Long> a, Map<LocalDate, Long> b) {
        Map<LocalDate, Long> merged = new HashMap<>(a);
        b.forEach((k, v) -> merged.put(k, merged.getOrDefault(k, 0L) + v));
        return merged;
    }
}

