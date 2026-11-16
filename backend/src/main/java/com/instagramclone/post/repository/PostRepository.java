package com.instagramclone.post.repository;

import com.instagramclone.post.entity.Post;
import com.instagramclone.post.enums.PostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

       long countByIsDeletedFalse();

       long countByUserIdAndIsDeletedFalse(UUID userId);

       long countByUserIdAndIsPinnedTrueAndIsDeletedFalse(UUID userId);

       default long countByUserId(UUID userId) {
              return countByUserIdAndIsDeletedFalse(userId);
       }

       @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND p.isArchived = false AND " +
                     "(p.user.id = :userId OR (p.collaborator.id = :userId AND p.collabStatus = com.instagramclone.post.enums.CollabStatus.ACCEPTED)) "
                     +
                     "ORDER BY p.isPinned DESC, p.createdAt DESC")
       Page<Post> findUserAndCollabPosts(@Param("userId") UUID userId, Pageable pageable);

       @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND p.isArchived = true AND p.user.id = :userId " +
                     "ORDER BY p.archivedAt DESC, p.createdAt DESC")
       Page<Post> findArchivedPosts(@Param("userId") UUID userId, Pageable pageable);

       @Query("SELECT p FROM Post p WHERE p.isDeleted = true AND p.user.id = :userId AND p.deletedAt >= :cutoff " +
                     "ORDER BY p.deletedAt DESC")
       Page<Post> findRecentlyDeletedPosts(@Param("userId") UUID userId,
                     @Param("cutoff") java.time.LocalDateTime cutoff, Pageable pageable);

       Page<Post> findByUserIdAndIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(UUID userId, Pageable pageable);

       default Page<Post> findByUserIdAndIsDeletedFalse(UUID userId, Pageable pageable) {
              return findUserAndCollabPosts(userId, pageable);
       }

       default Page<Post> findByUserId(UUID userId, Pageable pageable) {
              return findUserAndCollabPosts(userId, pageable);
       }

       Page<Post> findByUser_IdInAndIsDeletedFalseOrderByCreatedAtDesc(
                     @Param("userIds") Collection<UUID> userIds,
                     Pageable pageable);

       default Page<Post> findByUser_IdInOrderByCreatedAtDesc(
                     Collection<UUID> userIds,
                     Pageable pageable) {
              return findByUser_IdInAndIsDeletedFalseOrderByCreatedAtDesc(userIds, pageable);
       }

       Optional<Post> findByIdAndIsDeletedFalse(UUID id);

       @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND p.isArchived = false AND p.user.isDeleted = false AND p.user.isActive = true AND p.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE AND (p.user.id = :userId OR (p.user.id IN "
                     +
                     "(SELECT f.following.id FROM Follow f WHERE f.follower.id = :userId) AND " +
                     "p.user.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :userId) AND " +
                     "p.user.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :userId))) " +
                     "AND (:userId IS NULL OR (p.user.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :userId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER) AND "
                     +
                     "p.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :userId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.POST))) "
                     +
                     "AND (:userId IS NULL OR p.id NOT IN (SELECT pni.post.id FROM com.instagramclone.post.entity.PostNotInterested pni WHERE pni.user.id = :userId)) "
                     +
                     "ORDER BY p.createdAt DESC")
       Page<Post> findTimelinePosts(@Param("userId") UUID userId, Pageable pageable);

       @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND p.isArchived = false AND p.user.isDeleted = false AND p.user.isActive = true AND p.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE AND p.visibility = :visibility AND "
                     +
                     "(:excludeUserId IS NULL OR p.user.id != :excludeUserId) AND " +
                     "p.user.id NOT IN (SELECT s.user.id FROM UserSettings s WHERE s.isPrivate = true) AND " +
                     "(:excludeUserId IS NULL OR (p.user.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :excludeUserId) AND "
                     +
                     "p.user.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :excludeUserId))) AND "
                     +
                     "(:excludeUserId IS NULL OR (p.user.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :excludeUserId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER) AND "
                     +
                     "p.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :excludeUserId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.POST))) AND "
                     +
                     "(:excludeUserId IS NULL OR p.id NOT IN (SELECT pni.post.id FROM com.instagramclone.post.entity.PostNotInterested pni WHERE pni.user.id = :excludeUserId)) "
                     +
                     "ORDER BY p.createdAt DESC")
       Page<Post> findExplorePosts(@Param("visibility") PostVisibility visibility,
                     @Param("excludeUserId") UUID excludeUserId, Pageable pageable);

       @Query("SELECT p FROM Post p LEFT JOIN FETCH p.mediaList WHERE p.isDeleted = false AND p.id = :id")
       Optional<Post> findByIdWithMedia(@Param("id") UUID id);

       @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND p.user.isDeleted = false AND p.user.isActive = true AND p.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE AND "
                     +
                     "p.user.role = com.instagramclone.user.enums.Role.ROLE_USER AND LOWER(p.user.username) != 'admin' AND p.visibility = :visibility AND "
                     +
                     "p.user.id NOT IN (SELECT s.user.id FROM UserSettings s WHERE s.isPrivate = true) AND " +
                     "(:viewerId IS NULL OR (p.user.id != :viewerId AND p.user.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :viewerId) AND "
                     +
                     "p.user.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :viewerId) AND " +
                     "p.user.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER) AND "
                     +
                     "p.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.POST))) AND "
                     +
                     "LOWER(p.caption) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY p.createdAt DESC")
       Page<Post> searchPosts(@Param("query") String query, @Param("visibility") PostVisibility visibility,
                     @Param("viewerId") UUID viewerId, Pageable pageable);

       default Page<Post> searchPosts(String query, PostVisibility visibility, Pageable pageable) {
              return searchPosts(query, visibility, null, pageable);
       }

       @Query("SELECT DISTINCT p FROM Post p " +
                     "JOIN p.mediaList m " +
                     "JOIN com.instagramclone.post.entity.PostMediaTag pmt ON pmt.postMedia = m " +
                     "WHERE pmt.taggedUser.id = :userId " +
                     "AND p.isDeleted = false " +
                     "AND p.user.isDeleted = false " +
                     "AND p.user.isActive = true " +
                     "AND p.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE " +
                     "ORDER BY p.createdAt DESC")
       Page<Post> findTaggedPostsByUserId(@Param("userId") UUID userId, Pageable pageable);

       long countByIsDeletedFalseAndCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

       @Query("SELECT p.createdAt FROM Post p WHERE p.isDeleted = false AND p.createdAt >= :since")
       java.util.List<java.time.LocalDateTime> findCreatedAtSince(@Param("since") java.time.LocalDateTime since);

       @Query("SELECT p FROM Post p WHERE p.isDeleted = false AND " +
                     "(:query IS NULL OR :query = '' OR LOWER(p.caption) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.user.username) LIKE LOWER(CONCAT('%', :query, '%'))) "
                     +
                     "ORDER BY p.createdAt DESC")
       Page<Post> findForAdmin(@Param("query") String query, Pageable pageable);
}
