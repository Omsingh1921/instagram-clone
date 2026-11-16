package com.instagramclone.engagement.repository;

import com.instagramclone.engagement.entity.PostShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostShareRepository extends JpaRepository<PostShare, UUID> {
    long countByPostId(UUID postId);

    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT ps.createdAt FROM PostShare ps WHERE ps.createdAt >= :since")
    java.util.List<java.time.LocalDateTime> findCreatedAtSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
