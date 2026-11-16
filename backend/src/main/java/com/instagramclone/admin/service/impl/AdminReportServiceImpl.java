package com.instagramclone.admin.service.impl;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.dto.request.CreateReportRequest;
import com.instagramclone.admin.dto.request.ResolveReportRequest;
import com.instagramclone.admin.dto.response.ReportResponse;
import com.instagramclone.admin.entity.Report;
import com.instagramclone.admin.enums.ModerationAction;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.repository.ReportRepository;
import com.instagramclone.admin.service.interfaces.IAdminReportService;
import com.instagramclone.admin.service.support.UserModerationSupport;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ConflictException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.feed.constants.FeedConstants;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.utility.RedisUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminReportServiceImpl implements IAdminReportService {

    private static final Logger log = LoggerFactory.getLogger(AdminReportServiceImpl.class);

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final IAuditLogService auditLogService;
    private final AdminMapper adminMapper;
    private final UserModerationSupport userModerationSupport;
    private final RedisUtility redisUtility;
    private final Map<ReportTargetType, ModerationTargetStrategy> strategyMap;

    public AdminReportServiceImpl(
            ReportRepository reportRepository,
            UserRepository userRepository,
            IAuditLogService auditLogService,
            AdminMapper adminMapper,
            UserModerationSupport userModerationSupport,
            RedisUtility redisUtility,
            List<ModerationTargetStrategy> targetStrategies) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.adminMapper = adminMapper;
        this.userModerationSupport = userModerationSupport;
        this.redisUtility = redisUtility;
        this.strategyMap = new EnumMap<>(ReportTargetType.class);
        if (targetStrategies != null) {
            for (ModerationTargetStrategy strategy : targetStrategies) {
                this.strategyMap.put(strategy.getSupportedType(), strategy);
            }
        }
    }

    @Override
    @Transactional
    public ReportResponse createReport(CreateReportRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User reporter = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(AdminConstants.ERR_REPORTER_NOT_FOUND));

        UUID targetId = request.getTargetId();
        ModerationTargetStrategy strategy = getStrategy(request.getTargetType());
        strategy.validateReportable(targetId, currentUserId);

        if (request.getTargetType() != ReportTargetType.PROBLEM) {
            boolean alreadyReported = reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
                    currentUserId, request.getTargetType(), targetId, List.of(ReportStatus.OPEN, ReportStatus.REVIEWED));
            if (alreadyReported) {
                throw new ConflictException(
                        "You have already submitted a pending report for this " + request.getTargetType().name().toLowerCase());
            }
        }

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(request.getTargetType())
                .targetId(targetId)
                .reasonCode(request.getReasonCode().trim())
                .description(request.getDescription())
                .status(ReportStatus.OPEN)
                .action(ModerationAction.NO_ACTION)
                .build();

        Report saved = reportRepository.save(report);
        log.info("Report {} created by user {} for target {} ID {}",
                saved.getId(), reporter.getUsername(), request.getTargetType(), targetId);

        evictReporterFeedCache(currentUserId);
        return adminMapper.toReportResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> getReports(ReportStatus status, ReportTargetType targetType, Pageable pageable) {
        Page<Report> page;
        if (status != null && targetType != null) {
            page = reportRepository.findByStatusAndTargetType(status, targetType, pageable);
        } else if (status != null) {
            page = reportRepository.findByStatus(status, pageable);
        } else if (targetType != null) {
            page = reportRepository.findByTargetType(targetType, pageable);
        } else {
            page = reportRepository.findAll(pageable);
        }
        return PageResponse.from(page.map(adminMapper::toReportResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException(AdminConstants.ERR_REPORT_NOT_FOUND + reportId));
        return adminMapper.toReportResponse(report);
    }

    @Override
    @Transactional
    public ReportResponse resolveReport(UUID reportId, ResolveReportRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User reviewer = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(AdminConstants.ERR_REVIEWER_NOT_FOUND));

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException(AdminConstants.ERR_REPORT_NOT_FOUND + reportId));

        ModerationAction action = request.getAction() != null ? request.getAction() : ModerationAction.NO_ACTION;

        report.setStatus(request.getStatus());
        report.setAction(action);
        report.setReviewer(reviewer);
        report.setResolutionNotes(request.getResolutionNotes());
        report.setResolvedAt(LocalDateTime.now());

        executeResolutionAction(report, action, reviewer);

        Report updated = reportRepository.save(report);
        auditLogService.record(reviewer.getId(), "ADMIN_RESOLVE_REPORT", "REPORT", reportId, null,
                "Status: " + request.getStatus() + ", Action: " + action);

        log.info("Report {} resolved with status {} and action {} by reviewer {}",
                reportId, request.getStatus(), action, reviewer.getUsername());

        return adminMapper.toReportResponse(updated);
    }

    private void executeResolutionAction(Report report, ModerationAction action, User reviewer) {
        ModerationTargetStrategy strategy = getStrategy(report.getTargetType());
        if (action == ModerationAction.REMOVE_CONTENT) {
            strategy.executeTakedown(report.getTargetId(), reviewer);
        } else if (action == ModerationAction.SUSPEND_USER) {
            strategy.resolveOwnerId(report.getTargetId()).ifPresent(ownerId ->
                    userModerationSupport.suspendUserByModeration(
                            ownerId,
                            reviewer,
                            "ADMIN_SUSPEND_USER",
                            "User suspended by admin resolution"));
        } else if (action == ModerationAction.WARN_USER) {
            strategy.resolveOwnerId(report.getTargetId()).ifPresent(ownerId ->
                    userModerationSupport.warnUser(ownerId, report.getTargetType(), report.getTargetId(), reviewer));
        }
    }

    private ModerationTargetStrategy getStrategy(ReportTargetType targetType) {
        ModerationTargetStrategy strategy = strategyMap.get(targetType);
        if (strategy == null) {
            throw new BadRequestException("Unsupported report target type: " + targetType);
        }
        return strategy;
    }

    private void evictReporterFeedCache(UUID reporterId) {
        try {
            if (redisUtility != null) {
                redisUtility.delete(FeedConstants.CACHE_HOME_FEED_PAGE0_PREFIX + reporterId);
                redisUtility.delete("user:suggestions:seen:" + reporterId);
            }
        } catch (Exception ex) {
            log.debug("Cache eviction on report error: {}", ex.getMessage());
        }
    }
}

