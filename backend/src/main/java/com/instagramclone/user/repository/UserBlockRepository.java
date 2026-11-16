package com.instagramclone.user.repository;

import com.instagramclone.user.entity.UserBlock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {

    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    Optional<UserBlock> findByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    Page<UserBlock> findByBlockerId(UUID blockerId, Pageable pageable);

    void deleteByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);

    @Query("SELECT COUNT(b) > 0 FROM UserBlock b WHERE " +
           "(b.blocker.id = :userA AND b.blocked.id = :userB) OR " +
           "(b.blocker.id = :userB AND b.blocked.id = :userA)")
    boolean existsBlockBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);

    @Query("SELECT b FROM UserBlock b JOIN b.blocked u LEFT JOIN u.profile p " +
           "WHERE b.blocker.id = :blockerId AND (" +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(p.displayName IS NOT NULL AND LOWER(p.displayName) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<UserBlock> searchBlockedUsers(
            @Param("blockerId") UUID blockerId,
            @Param("query") String query,
            Pageable pageable);
}
