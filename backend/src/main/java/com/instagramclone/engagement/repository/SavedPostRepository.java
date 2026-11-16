package com.instagramclone.engagement.repository;

import com.instagramclone.engagement.entity.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    Optional<SavedPost> findByUserIdAndPostId(UUID userId, UUID postId);

    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    Page<SavedPost> findByUserId(UUID userId, Pageable pageable);

    void deleteByPostId(UUID postId);

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT sp.createdAt FROM SavedPost sp WHERE sp.createdAt >= :since")
    java.util.List<java.time.LocalDateTime> findCreatedAtSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
