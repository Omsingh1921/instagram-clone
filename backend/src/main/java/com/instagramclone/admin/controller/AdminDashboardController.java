package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.admin.dto.response.AdminDashboardStatsResponse;
import com.instagramclone.admin.service.interfaces.IAdminAnalyticsService;
import com.instagramclone.admin.service.interfaces.IAdminContentModerationService;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(AdminConstants.BASE_PATH)
@RequiredArgsConstructor
public class AdminDashboardController {

    private final IAdminAnalyticsService analyticsService;
    private final IAdminContentModerationService contentModerationService;

    @GetMapping(AdminConstants.ADMIN_DASHBOARD_STATS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getDashboardStats(
            @RequestParam(defaultValue = "7") int days) {
        AdminDashboardStatsResponse stats = analyticsService.getDashboardStats(days);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_STATS_RETRIEVED, stats));
    }

    @GetMapping(AdminConstants.ADMIN_STATS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getStatsAlias(
            @RequestParam(defaultValue = "7") int days) {
        AdminDashboardStatsResponse stats = analyticsService.getDashboardStats(days);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_STATS_RETRIEVED, stats));
    }

    @GetMapping(AdminConstants.ADMIN_ACTIVITY_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<List<AdminActivityItemResponse>>> getRecentActivity(
            @RequestParam(defaultValue = "12") int limit) {
        List<AdminActivityItemResponse> items = analyticsService.getRecentActivity(limit);
        return ResponseEntity.ok(ApiResponse.success("Recent activity retrieved successfully", items));
    }

    @GetMapping(AdminConstants.ADMIN_CONTENT_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<PageResponse<AdminContentItemResponse>>> getContentItems(
            @RequestParam(defaultValue = "POSTS") String type,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = AdminConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<AdminContentItemResponse> content = contentModerationService.getContentItems(type, query, pageable);
        return ResponseEntity.ok(ApiResponse.success("Platform content retrieved successfully", content));
    }

    @DeleteMapping(AdminConstants.ADMIN_CONTENT_DELETE_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<Void>> deleteContentItem(
            @PathVariable String type,
            @PathVariable UUID contentId) {
        contentModerationService.deleteContentItem(type, contentId);
        return ResponseEntity.ok(ApiResponse.success("Content item removed successfully", null));
    }
}

