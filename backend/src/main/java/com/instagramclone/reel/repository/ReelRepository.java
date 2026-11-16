package com.instagramclone.reel.repository;

import com.instagramclone.reel.entity.Reel;
import com.instagramclone.reel.enums.ReelStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReelRepository extends JpaRepository<Reel, UUID> {

       Page<Reel> findByStatus(ReelStatus status, Pageable pageable);

       Page<Reel> findByStatusOrderByCreatedAtDesc(ReelStatus status, Pageable pageable);

       @Query("SELECT r FROM Reel r WHERE r.user.id = :userId AND r.status = :status AND r.isDeleted = false AND r.isArchived = false ORDER BY r.isPinned DESC, r.createdAt DESC")
       Page<Reel> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") ReelStatus status,
                     Pageable pageable);

       long countByUserId(UUID userId);

       long countByIsDeletedFalse();

       long countByUserIdAndIsPinnedTrueAndIsDeletedFalse(UUID userId);

       @Query(value = "SELECT r FROM Reel r LEFT JOIN ReelView rv ON rv.reel = r AND rv.user.id = :viewerId WHERE r.status = :status "
                     +
                     "AND r.isDeleted = false AND r.isArchived = false " +
                     "AND r.user.isDeleted = false AND r.user.isActive = true AND r.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE "
                     +
                     "AND (r.user.id NOT IN (SELECT s.user.id FROM UserSettings s WHERE s.isPrivate = true) " +
                     "     OR (:viewerId IS NOT NULL AND (r.user.id = :viewerId OR r.user.id IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :viewerId)))) "
                     +
                     "AND (:viewerId IS NULL OR (r.user.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :viewerId) "
                     +
                     "     AND r.user.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :viewerId) "
                     +
                     "     AND r.user.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER) "
                     +
                     "     AND r.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.REEL))) "
                     +
                     "AND (:viewerId IS NULL OR r.user.id != :viewerId) " +
                      "AND (:viewerId IS NULL OR r.id NOT IN (SELECT ni.reel.id FROM ReelNotInterested ni WHERE ni.user.id = :viewerId)) "
                     +
                     "ORDER BY (CASE WHEN rv.id IS NULL THEN 0 ELSE 1 END) ASC, r.createdAt DESC", countQuery = "SELECT count(r) FROM Reel r WHERE r.status = :status "
                                   +
                                   "AND r.isDeleted = false AND r.isArchived = false " +
                                   "AND r.user.isDeleted = false AND r.user.isActive = true AND r.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE "
                                   +
                                   "AND (r.user.id NOT IN (SELECT s.user.id FROM UserSettings s WHERE s.isPrivate = true) "
                                   +
                                   "     OR (:viewerId IS NOT NULL AND (r.user.id = :viewerId OR r.user.id IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :viewerId)))) "
                                   +
                                   "AND (:viewerId IS NULL OR (r.user.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :viewerId) "
                     +
                     "     AND r.user.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :viewerId) "
                     +
                     "     AND r.user.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER) "
                     +
                     "     AND r.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.REEL))) "
                                   +
                                   "AND (:viewerId IS NULL OR r.user.id != :viewerId) " +
                                    "AND (:viewerId IS NULL OR r.id NOT IN (SELECT ni.reel.id FROM ReelNotInterested ni WHERE ni.user.id = :viewerId))")
       Page<Reel> findFeedReels(@Param("status") ReelStatus status, @Param("viewerId") UUID viewerId,
                     Pageable pageable);

       @Query(value = "SELECT r FROM Reel r LEFT JOIN ReelView rv ON rv.reel = r AND rv.user.id = :viewerId WHERE r.status = :status "
                     +
                     "AND r.isDeleted = false AND r.isArchived = false " +
                     "AND r.user.isDeleted = false AND r.user.isActive = true AND r.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE "
                     +
                     "AND r.user.id IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :viewerId) " +
                      "AND (:viewerId IS NULL OR r.user.id != :viewerId) " +
                     "AND r.user.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :viewerId) "
                     +
                     "AND r.user.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :viewerId) "
                     +
                     "AND (:viewerId IS NULL OR (r.user.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER) "
                     +
                     "     AND r.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.REEL))) " +
                     "AND r.id NOT IN (SELECT ni.reel.id FROM ReelNotInterested ni WHERE ni.user.id = :viewerId) " +
                     "ORDER BY (CASE WHEN rv.id IS NULL THEN 0 ELSE 1 END) ASC, r.createdAt DESC", countQuery = "SELECT count(r) FROM Reel r WHERE r.status = :status "
                                   +
                                   "AND r.isDeleted = false AND r.isArchived = false " +
                                   "AND r.user.isDeleted = false AND r.user.isActive = true AND r.user.status = com.instagramclone.user.enums.UserStatus.ACTIVE "
                                   +
                                   "AND r.user.id IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :viewerId) " +
                                    "AND (:viewerId IS NULL OR r.user.id != :viewerId) "
                                   +
                                   "AND r.user.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :viewerId) "
                     +
                     "AND r.user.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :viewerId) "
                     +
                     "AND (:viewerId IS NULL OR (r.user.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER) "
                     +
                     "     AND r.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.REEL))) "
                                   +
                                   "AND r.id NOT IN (SELECT ni.reel.id FROM ReelNotInterested ni WHERE ni.user.id = :viewerId)")
       Page<Reel> findFollowingReels(@Param("status") ReelStatus status, @Param("viewerId") UUID viewerId,
                     Pageable pageable);

       @Query("SELECT r FROM Reel r WHERE r.user.id = :userId AND r.status = com.instagramclone.reel.enums.ReelStatus.DRAFT AND r.isDeleted = false ORDER BY r.createdAt DESC")
       Page<Reel> findDraftReels(@Param("userId") UUID userId, Pageable pageable);

       @Query("SELECT r FROM Reel r WHERE r.user.id = :userId AND r.isArchived = true AND r.isDeleted = false ORDER BY r.archivedAt DESC")
       Page<Reel> findArchivedReels(@Param("userId") UUID userId, Pageable pageable);

       @Query("SELECT r FROM Reel r WHERE r.user.id = :userId AND r.isDeleted = true AND r.isPermanentlyDeleted = false AND r.deletedAt >= :cutoff ORDER BY r.deletedAt DESC")
       Page<Reel> findRecentlyDeletedReels(@Param("userId") UUID userId,
                     @Param("cutoff") java.time.LocalDateTime cutoff, Pageable pageable);

       @Query("SELECT s.reel FROM SavedReel s WHERE s.user.id = :userId AND s.reel.isDeleted = false AND s.reel.isArchived = false ORDER BY s.createdAt DESC")
       Page<Reel> findSavedReels(@Param("userId") UUID userId, Pageable pageable);

       @Query("SELECT r FROM Reel r WHERE r.status = com.instagramclone.reel.enums.ReelStatus.READY AND r.isDeleted = false AND r.isArchived = false "
                     +
                     "AND LOWER(r.audioTitle) = LOWER(:audioTitle) ORDER BY r.createdAt DESC")
       Page<Reel> findByAudioTitle(@Param("audioTitle") String audioTitle, Pageable pageable);

       @Query("SELECT COUNT(r) FROM Reel r WHERE r.status = com.instagramclone.reel.enums.ReelStatus.READY AND r.isDeleted = false AND r.isArchived = false "
                     +
                     "AND LOWER(r.audioTitle) = LOWER(:audioTitle)")
       long countByAudioTitle(@Param("audioTitle") String audioTitle);

       @Query("SELECT r FROM Reel r WHERE r.status = com.instagramclone.reel.enums.ReelStatus.READY AND r.isDeleted = false AND r.isArchived = false "
                     +
                     "AND LOWER(r.caption) LIKE LOWER(CONCAT('%', :hashtag, '%')) ORDER BY r.createdAt DESC")
       Page<Reel> findByHashtag(@Param("hashtag") String hashtag, Pageable pageable);

       long countByIsDeletedFalseAndCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

       @Query("SELECT r.createdAt FROM Reel r WHERE r.isDeleted = false AND r.createdAt >= :since")
       java.util.List<java.time.LocalDateTime> findCreatedAtSince(@Param("since") java.time.LocalDateTime since);

       @Query("SELECT r FROM Reel r WHERE r.isDeleted = false AND "
                     + "(:query IS NULL OR :query = '' OR LOWER(r.caption) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(r.user.username) LIKE LOWER(CONCAT('%', :query, '%'))) "
                     + "ORDER BY r.createdAt DESC")
       Page<Reel> findForAdmin(@Param("query") String query, Pageable pageable);

}
