package com.instagramclone.reel.repository;

import com.instagramclone.reel.entity.ReelNotInterested;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReelNotInterestedRepository extends JpaRepository<ReelNotInterested, UUID> {

    Optional<ReelNotInterested> findByUserIdAndReelId(UUID userId, UUID reelId);

    boolean existsByUserIdAndReelId(UUID userId, UUID reelId);

    void deleteByUserIdAndReelId(UUID userId, UUID reelId);

    void deleteByReelId(UUID reelId);
}
