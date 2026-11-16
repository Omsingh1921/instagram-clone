package com.instagramclone.note.repository;

import com.instagramclone.note.entity.UserNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNoteRepository extends JpaRepository<UserNote, UUID> {

    Optional<UserNote> findFirstByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime now);

    @Query("SELECT n FROM UserNote n JOIN FETCH n.user u LEFT JOIN FETCH u.profile p " +
           "WHERE n.user.id IN :userIds AND n.expiresAt > :now " +
           "ORDER BY n.createdAt DESC")
    List<UserNote> findActiveNotesByUserIds(@Param("userIds") Collection<UUID> userIds, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM UserNote n WHERE n.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
