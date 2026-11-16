package com.instagramclone.user.repository;

import com.instagramclone.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findAllByEmail(String email);

    long countByEmail(String email);

    @Query("SELECT u.accountSlot FROM User u WHERE u.email = :email ORDER BY u.accountSlot ASC")
    List<Integer> findAccountSlotsByEmail(@Param("email") String email);

    List<User> findByEmailAndEmailVerifiedFalse(String email);

    default List<User> findUnverifiedByEmail(String email) {
        return findByEmailAndEmailVerifiedFalse(email);
    }

    Optional<User> findByEmailAndAccountSlot(String email, Integer accountSlot);

    Optional<User> findByUsernameOrEmail(String username, String email);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.username = :username")
    Optional<User> findByUsernameForUpdate(@Param("username") String username);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.username = :username OR u.email = :email")
    Optional<User> findByUsernameOrEmailForUpdate(@Param("username") String username, @Param("email") String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByRole(com.instagramclone.user.enums.Role role);

    Optional<User> findByIdAndIsDeletedFalse(UUID id);

    Optional<User> findByUsernameAndIsDeletedFalse(String username);

    Optional<User> findByEmailAndIsDeletedFalse(String email);

    boolean existsByUsernameAndIsDeletedFalse(String username);

    boolean existsByEmailAndIsDeletedFalse(String email);

    Page<User> findAllByIsDeletedFalse(Pageable pageable);

    @Query("SELECT u FROM User u WHERE LOWER(u.previousUsername) = LOWER(:previousUsername) AND u.usernameLastChangedAt >= :afterDate")
    Optional<User> findByPreviousUsernameReservedAfter(@Param("previousUsername") String previousUsername, @Param("afterDate") LocalDateTime afterDate);

    @Query("SELECT u FROM User u LEFT JOIN u.profile p WHERE u.isDeleted = false AND u.isActive = true AND u.status = com.instagramclone.user.enums.UserStatus.ACTIVE AND " +
           "u.role = com.instagramclone.user.enums.Role.ROLE_USER AND LOWER(u.username) != 'admin' AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.displayName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:viewerId IS NULL OR (u.id != :viewerId AND " +
           "u.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :viewerId) AND " +
           "u.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :viewerId)))")
    Page<User> searchUsers(@Param("query") String query, @Param("viewerId") UUID viewerId, Pageable pageable);

    default Page<User> searchUsers(String query, Pageable pageable) {
        return searchUsers(query, null, pageable);
    }

    @Query("SELECT u FROM User u LEFT JOIN u.profile p WHERE " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.displayName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<User> searchAllUsersForAdmin(@Param("query") String query, Pageable pageable);

    @Query("SELECT u.username FROM User u WHERE u.username IN :usernames")
    List<String> findExistingUsernamesIn(@Param("usernames") java.util.Collection<String> usernames);

    @Query("SELECT u FROM User u WHERE u.isDeleted = false AND u.isActive = true AND u.status = com.instagramclone.user.enums.UserStatus.ACTIVE AND " +
           "u.role = com.instagramclone.user.enums.Role.ROLE_USER AND LOWER(u.username) != 'admin' AND " +
           "u.id != :viewerId AND " +
           "u.id NOT IN (SELECT f.following.id FROM Follow f WHERE f.follower.id = :viewerId) AND " +
           "u.id NOT IN (SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :viewerId) AND " +
           "u.id NOT IN (SELECT b.blocker.id FROM UserBlock b WHERE b.blocked.id = :viewerId) AND " +
           "u.id NOT IN (SELECT rep.targetId FROM Report rep WHERE rep.reporter.id = :viewerId AND rep.targetType = com.instagramclone.admin.enums.ReportTargetType.USER)")
    List<User> findSuggestedUserCandidates(@Param("viewerId") UUID viewerId, Pageable pageable);

    long countByStatus(com.instagramclone.user.enums.UserStatus status);

    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.isDeleted = false")
    long countActiveUsers();

    @Query("SELECT u FROM User u LEFT JOIN u.profile p WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.displayName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:role IS NULL OR u.role = :role)")
    Page<User> findUsersForAdmin(
            @Param("query") String query,
            @Param("status") com.instagramclone.user.enums.UserStatus status,
            @Param("role") com.instagramclone.user.enums.Role role,
            Pageable pageable
    );

    public interface UserProfileStatsProjection {
        long getFollowerCount();
        long getFollowingCount();
        long getPostCount();
    }

    @Query(value = "SELECT " +
           "(SELECT COUNT(*) FROM follows WHERE following_id = :userId) AS followerCount, " +
           "(SELECT COUNT(*) FROM follows WHERE follower_id = :userId) AS followingCount, " +
           "(SELECT COUNT(*) FROM posts WHERE user_id = :userId AND is_deleted = false) AS postCount",
           nativeQuery = true)
    UserProfileStatsProjection getUserProfileStats(@Param("userId") UUID userId);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT u.createdAt FROM User u WHERE u.createdAt >= :since")
    List<LocalDateTime> findCreatedAtSince(@Param("since") LocalDateTime since);

    @Query("SELECT u.createdAt FROM User u WHERE u.id = :userId")
    Optional<LocalDateTime> findCreatedAtById(@Param("userId") UUID userId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.isDeleted = false ORDER BY u.createdAt DESC")
    List<User> findRecentUsers(Pageable pageable);
}
