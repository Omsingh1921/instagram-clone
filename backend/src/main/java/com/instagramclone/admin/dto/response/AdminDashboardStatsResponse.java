package com.instagramclone.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsResponse {

    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long deactivatedUsers;

    private long totalPosts;
    private long totalReels;
    private long activeStories;
    private long totalStories;
    private long totalComments;

    private long totalReports;
    private long openReports;
    private long reviewedReports;
    private long resolvedReports;
    private long dismissedReports;
    private long actionedThisWeek;

    // Period comparison & growth deltas (vs previous window of periodDays)
    private int periodDays;
    private double usersGrowthPercent;
    private double postsGrowthPercent;
    private double reelsGrowthPercent;
    private double storiesGrowthPercent;

    // Engagement Metrics (Posts + Reels)
    private long totalLikes;
    private double likesGrowthPercent;
    private long totalEngagementComments;
    private double commentsGrowthPercent;
    private long totalShares;
    private double sharesGrowthPercent;
    private long totalSaves;
    private double savesGrowthPercent;

    private List<DailyPlatformMetric> growthSeries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyPlatformMetric {
        private String date;
        private String label;
        private long users;
        private long posts;
        private long reels;
        private long stories;
        private long likes;
        private long comments;
        private long engagement;
    }
}
