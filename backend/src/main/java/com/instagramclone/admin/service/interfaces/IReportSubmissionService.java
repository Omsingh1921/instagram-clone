package com.instagramclone.admin.service.interfaces;

import com.instagramclone.admin.dto.request.CreateReportRequest;
import com.instagramclone.admin.dto.response.ReportResponse;

/**
 * Narrow interface (ISP) for modules and public endpoints that only submit moderation reports.
 */
public interface IReportSubmissionService {

    ReportResponse createReport(CreateReportRequest request);
}

