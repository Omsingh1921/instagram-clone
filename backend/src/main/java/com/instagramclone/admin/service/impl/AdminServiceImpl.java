package com.instagramclone.admin.service.impl;

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
import com.instagramclone.admin.service.interfaces.IAdminAnalyticsService;
import com.instagramclone.admin.service.interfaces.IAdminContentModerationService;
import com.instagramclone.admin.service.interfaces.IAdminReportService;
import com.instagramclone.admin.service.interfaces.IAdminService;
import com.instagramclone.admin.service.interfaces.IAdminUserManagementService;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.user.enums.Role;
import com.instagramclone.user.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Facade preserving {@link IAdminService} for cross-module compatibility while delegating
 * each responsibility cleanly to single-purpose services.
 */
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements IAdminService {

    private final IAdminReportService reportService;
    private final IAdminUserManagementService userManagementService;
    private final IAdminAnalyticsService analyticsService;
    private final IAdminContentModerationService contentModerationService;

    @Override
    public ReportResponse createReport(CreateReportRequest request) {
        return reportService.createReport(request);
    }

    @Override
    public PageResponse<ReportResponse> getReports(ReportStatus status, ReportTargetType targetType, Pageable pageable) {
        return reportService.getReports(status, targetType, pageable);
    }

    @Override
    public ReportResponse getReportById(UUID reportId) {
        return reportService.getReportById(reportId);
    }

    @Override
    public ReportResponse resolveReport(UUID reportId, ResolveReportRequest request) {
        return reportService.resolveReport(reportId, request);
    }

    @Override
    public void updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
        userManagementService.updateUserStatus(userId, request);
    }

    @Override
    public PageResponse<AdminUserResponse> getUsers(String query, UserStatus status, Role role, Pageable pageable) {
        return userManagementService.getUsers(query, status, role, pageable);
    }

    @Override
    public AdminDashboardStatsResponse getDashboardStats(int days) {
        return analyticsService.getDashboardStats(days);
    }

    @Override
    public List<AdminActivityItemResponse> getRecentActivity(int limit) {
        return analyticsService.getRecentActivity(limit);
    }

    @Override
    public PageResponse<AdminContentItemResponse> getContentItems(String type, String query, Pageable pageable) {
        return contentModerationService.getContentItems(type, query, pageable);
    }

    @Override
    public void deleteContentItem(String type, UUID contentId) {
        contentModerationService.deleteContentItem(type, contentId);
    }
}
