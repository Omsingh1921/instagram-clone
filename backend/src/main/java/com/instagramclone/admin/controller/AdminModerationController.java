package com.instagramclone.admin.controller;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.CreateReportRequest;
import com.instagramclone.admin.dto.request.ResolveReportRequest;
import com.instagramclone.admin.dto.response.ReportResponse;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.service.interfaces.IAdminReportService;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping(AdminConstants.BASE_PATH)
@RequiredArgsConstructor
public class AdminModerationController {

    private final IAdminReportService reportService;

    @PostMapping(AdminConstants.REPORTS_PATH)
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @Valid @RequestBody CreateReportRequest request) {
        ReportResponse response = reportService.createReport(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(AdminConstants.MSG_REPORT_SUBMITTED, response));
    }

    @GetMapping(AdminConstants.ADMIN_REPORTS_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<PageResponse<ReportResponse>>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportTargetType targetType,
            @PageableDefault(size = AdminConstants.DEFAULT_REPORT_PAGE_SIZE, sort = AdminConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ReportResponse> reports = reportService.getReports(status, targetType, pageable);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_REPORTS_RETRIEVED, reports));
    }

    @GetMapping(AdminConstants.ADMIN_REPORT_BY_ID_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(@PathVariable UUID reportId) {
        ReportResponse response = reportService.getReportById(reportId);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_REPORT_RETRIEVED, response));
    }

    @PutMapping(AdminConstants.ADMIN_REPORT_BY_ID_PATH)
    @PreAuthorize(AdminConstants.HAS_ROLE_ADMIN)
    public ResponseEntity<ApiResponse<ReportResponse>> resolveReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody ResolveReportRequest request) {
        ReportResponse response = reportService.resolveReport(reportId, request);
        return ResponseEntity.ok(ApiResponse.success(AdminConstants.MSG_REPORT_UPDATED, response));
    }
}

