package com.instagramclone.story.repository;

import com.instagramclone.story.entity.UserStoryHiddenUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserStoryHiddenUserRepository extends JpaRepository<UserStoryHiddenUser, UUID> {

    boolean existsByUserIdAndHiddenUserId(UUID userId, UUID hiddenUserId);

    Optional<UserStoryHiddenUser> findByUserIdAndHiddenUserId(UUID userId, UUID hiddenUserId);

    List<UserStoryHiddenUser> findByUserId(UUID userId);

    @Query("SELECT h.hiddenUser.id FROM UserStoryHiddenUser h WHERE h.user.id = :userId")
    List<UUID> findHiddenUserIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT h.user.id FROM UserStoryHiddenUser h WHERE h.hiddenUser.id = :hiddenUserId")
    List<UUID> findUserIdsWhoHidFromUser(@Param("hiddenUserId") UUID hiddenUserId);

    void deleteByUserIdAndHiddenUserId(UUID userId, UUID hiddenUserId);
}
