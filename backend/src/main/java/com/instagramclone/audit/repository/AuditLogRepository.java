package com.instagramclone.audit.repository;

import com.instagramclone.audit.entity.AuditLog;
import com.instagramclone.user.dto.response.PasswordHistoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    @Query("""
            SELECT new com.instagramclone.user.dto.response.PasswordHistoryResponse(
                MAX(a.createdAt),
                COUNT(a)
            )
            FROM AuditLog a
            WHERE a.userId = :userId
              AND a.action IN :actions
            """)
    PasswordHistoryResponse findPasswordHistorySummary(
            @Param("userId") UUID userId,
            @Param("actions") Collection<String> actions);
}
