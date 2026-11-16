package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.ResolveReportRequest;
import com.instagramclone.admin.dto.response.ReportResponse;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Segregated admin report review and moderation resolution contract.
 */
public interface IAdminReportService extends IReportSubmissionService {

    PageResponse<ReportResponse> getReports(ReportStatus status, ReportTargetType targetType, Pageable pageable);

    ReportResponse getReportById(UUID reportId);

    ReportResponse resolveReport(UUID reportId, ResolveReportRequest request);
}

