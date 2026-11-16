package com.instagramclone.admin.repository;

import com.instagramclone.admin.entity.Report;
import com.instagramclone.admin.enums.ReportStatus;
import com.instagramclone.admin.enums.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    Page<Report> findByTargetType(ReportTargetType targetType, Pageable pageable);

    Page<Report> findByStatusAndTargetType(ReportStatus status, ReportTargetType targetType, Pageable pageable);

    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);

    long countByTargetTypeAndTargetId(ReportTargetType targetType, UUID targetId);

    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(
            UUID reporterId, ReportTargetType targetType, UUID targetId, java.util.Collection<ReportStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT r.targetId FROM Report r WHERE r.reporter.id = :reporterId AND r.targetType = com.instagramclone.admin.enums.ReportTargetType.USER")
    java.util.List<UUID> findReportedUserIdsByReporterId(@org.springframework.data.repository.query.Param("reporterId") UUID reporterId);

    @org.springframework.data.jpa.repository.Query("SELECT r.targetId FROM Report r WHERE r.reporter.id = :reporterId AND r.targetType = com.instagramclone.admin.enums.ReportTargetType.POST")
    java.util.List<UUID> findReportedPostIdsByReporterId(@org.springframework.data.repository.query.Param("reporterId") UUID reporterId);

    @org.springframework.data.jpa.repository.Query("SELECT r.targetId FROM Report r WHERE r.reporter.id = :reporterId AND r.targetType = com.instagramclone.admin.enums.ReportTargetType.REEL")
    java.util.List<UUID> findReportedReelIdsByReporterId(@org.springframework.data.repository.query.Param("reporterId") UUID reporterId);

    @org.springframework.data.jpa.repository.Query("SELECT r.targetId FROM Report r WHERE r.reporter.id = :reporterId AND r.targetType = com.instagramclone.admin.enums.ReportTargetType.STORY")
    java.util.List<UUID> findReportedStoryIdsByReporterId(@org.springframework.data.repository.query.Param("reporterId") UUID reporterId);

    long countByStatusInAndResolvedAtAfter(java.util.Collection<ReportStatus> statuses, java.time.LocalDateTime resolvedAt);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Report r JOIN FETCH r.reporter ORDER BY r.createdAt DESC")
    java.util.List<Report> findRecentReports(Pageable pageable);
}
