package com.instagramclone.reel.repository;

import com.instagramclone.reel.entity.ReelShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReelShareRepository extends JpaRepository<ReelShare, UUID> {
    long countByReelId(UUID reelId);

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT rs.createdAt FROM ReelShare rs WHERE rs.createdAt >= :since")
    java.util.List<java.time.LocalDateTime> findCreatedAtSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
