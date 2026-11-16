package com.instagramclone.engagement.repository;

import com.instagramclone.engagement.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    long countByIsDeletedFalse();

    long countByPostIdAndIsDeletedFalse(UUID postId);

    default long countByPostId(UUID postId) {
        return countByPostIdAndIsDeletedFalse(postId);
    }

    Page<Comment> findByPostIdAndParentCommentIsNullAndIsDeletedFalse(UUID postId, Pageable pageable);

    default Page<Comment> findRootCommentsByPostId(UUID postId, Pageable pageable) {
        return findByPostIdAndParentCommentIsNullAndIsDeletedFalse(postId, pageable);
    }

    Page<Comment> findByParentCommentIdAndIsDeletedFalse(UUID parentId, Pageable pageable);

    default Page<Comment> findRepliesByParentCommentId(UUID parentId, Pageable pageable) {
        return findByParentCommentIdAndIsDeletedFalse(parentId, pageable);
    }

    Optional<Comment> findByIdAndIsDeletedFalse(UUID id);

    Page<Comment> findByUserIdAndIsDeletedFalse(UUID userId, Pageable pageable);

    void deleteByPostId(UUID postId);

    long countByIsDeletedFalseAndCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT c.createdAt FROM Comment c WHERE c.isDeleted = false AND c.createdAt >= :since")
    java.util.List<java.time.LocalDateTime> findCreatedAtSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
