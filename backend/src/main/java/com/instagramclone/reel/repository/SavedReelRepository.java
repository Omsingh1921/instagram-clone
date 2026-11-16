package com.instagramclone.reel.repository;

import com.instagramclone.reel.entity.SavedReel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedReelRepository extends JpaRepository<SavedReel, UUID> {

    Optional<SavedReel> findByUserIdAndReelId(UUID userId, UUID reelId);

    boolean existsByUserIdAndReelId(UUID userId, UUID reelId);

    Page<SavedReel> findByUserId(UUID userId, Pageable pageable);

    void deleteByReelId(UUID reelId);

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT sr.createdAt FROM SavedReel sr WHERE sr.createdAt >= :since")
    java.util.List<java.time.LocalDateTime> findCreatedAtSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
