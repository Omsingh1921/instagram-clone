package com.instagramclone.reel.repository;

import com.instagramclone.reel.entity.ReelView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReelViewRepository extends JpaRepository<ReelView, UUID> {

    boolean existsByReelIdAndUserId(UUID reelId, UUID userId);

    long countByReelId(UUID reelId);

    void deleteByReelId(UUID reelId);

    @Query("SELECT rv.reel.id FROM ReelView rv WHERE rv.user.id = :userId")
    List<UUID> findViewedReelIdsByUserId(@Param("userId") UUID userId);
}
