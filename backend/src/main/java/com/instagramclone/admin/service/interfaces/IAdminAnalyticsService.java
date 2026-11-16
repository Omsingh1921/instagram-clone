package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.dto.response.AdminDashboardStatsResponse;

import java.util.List;

/**
 * Segregated contract for Admin dashboard KPI metrics and recent platform activity streams.
 */
public interface IAdminAnalyticsService {

    default AdminDashboardStatsResponse getDashboardStats() {
        return getDashboardStats(7);
    }

    AdminDashboardStatsResponse getDashboardStats(int days);

    List<AdminActivityItemResponse> getRecentActivity(int limit);
}

