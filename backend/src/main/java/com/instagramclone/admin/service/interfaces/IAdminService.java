package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.CreateReportRequest;
import com.instagramclone.admin.dto.request.ResolveReportRequest;
import com.instagramclone.admin.dto.request.UpdateUserStatusRequest;
import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.admin.dto.response.AdminDashboardStatsResponse;
import com.instagramclone.admin.dto.response.AdminUserResponse;
import com.instagramclone.admin.dto.response.ReportResponse;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Aggregated Admin Facade interface preserved for backward compatibility with
 * cross-module callers.
 * Focused admin controllers and internal clients inject the segregated
 * single-purpose interfaces directly.
 */
public interface IAdminService {

    ReportResponse createReport(CreateReportRequest request);

    PageResponse<ReportResponse> getReports(ReportStatus status, ReportTargetType targetType, Pageable pageable);

    ReportResponse getReportById(UUID reportId);

    ReportResponse resolveReport(UUID reportId, ResolveReportRequest request);

    void updateUserStatus(UUID userId, UpdateUserStatusRequest request);

    PageResponse<AdminUserResponse> getUsers(String query, UserStatus status, Role role, Pageable pageable);

    default AdminDashboardStatsResponse getDashboardStats() {
        return getDashboardStats(7);
    }

    AdminDashboardStatsResponse getDashboardStats(int days);

    List<AdminActivityItemResponse> getRecentActivity(int limit);

    PageResponse<AdminContentItemResponse> getContentItems(String type, String query, Pageable pageable);

    void deleteContentItem(String type, UUID contentId);
}
