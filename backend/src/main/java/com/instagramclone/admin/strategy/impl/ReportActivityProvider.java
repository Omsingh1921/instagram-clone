package com.instagramclone.admin.strategy.impl;

import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.entity.Report;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.repository.ReportRepository;
import com.instagramclone.admin.strategy.AdminActivityProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class ReportActivityProvider implements AdminActivityProvider {

    private final ReportRepository reportRepository;
    private final AdminMapper adminMapper;

    @Override
    public List<AdminActivityItemResponse> fetchRecent(Pageable slice) {
        List<AdminActivityItemResponse> items = new ArrayList<>();
        for (Report report : reportRepository.findRecentReports(slice)) {
            String tType = report.getTargetType() != null
                    ? report.getTargetType().name().toLowerCase(Locale.ENGLISH)
                    : "content";
            items.add(AdminActivityItemResponse.builder()
                    .id("report-" + report.getId())
                    .type("REPORT_SUBMITTED")
                    .actionText("reported a " + tType)
                    .actor(adminMapper.toUserSummary(report.getReporter()))
                    .targetType(report.getTargetType() != null ? report.getTargetType().name() : "REPORT")
                    .targetId(report.getTargetId())
                    .createdAt(report.getCreatedAt())
                    .build());
        }
        return items;
    }
}

