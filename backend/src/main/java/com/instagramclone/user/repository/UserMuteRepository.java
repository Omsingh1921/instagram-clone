package com.instagramclone.user.repository;

import com.instagramclone.user.entity.UserMute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserMuteRepository extends JpaRepository<UserMute, UUID> {

    boolean existsByUserIdAndMutedUserId(UUID userId, UUID mutedUserId);

    Optional<UserMute> findByUserIdAndMutedUserId(UUID userId, UUID mutedUserId);

    Page<UserMute> findByUserId(UUID userId, Pageable pageable);

    void deleteByUserIdAndMutedUserId(UUID userId, UUID mutedUserId);

    @Query("SELECT m.mutedUser.id FROM UserMute m WHERE m.user.id = :userId AND m.mutePosts = true")
    List<UUID> findMutedUserIdsForPosts(@Param("userId") UUID userId);

    @Query("SELECT m.mutedUser.id FROM UserMute m WHERE m.user.id = :userId AND m.muteStories = true")
    List<UUID> findMutedUserIdsForStories(@Param("userId") UUID userId);
}
