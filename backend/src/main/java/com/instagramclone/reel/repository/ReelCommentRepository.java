package com.instagramclone.reel.repository;

import com.instagramclone.reel.entity.ReelComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReelCommentRepository extends JpaRepository<ReelComment, UUID> {

    Page<ReelComment> findByReelIdOrderByCreatedAtAsc(UUID reelId, Pageable pageable);

    long countByReelId(UUID reelId);

    void deleteByReelId(UUID reelId);

    long countByIsDeletedFalse();

    long countByIsDeletedFalseAndCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT rc.createdAt FROM ReelComment rc WHERE rc.isDeleted = false AND rc.createdAt >= :since")
    java.util.List<java.time.LocalDateTime> findCreatedAtSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
