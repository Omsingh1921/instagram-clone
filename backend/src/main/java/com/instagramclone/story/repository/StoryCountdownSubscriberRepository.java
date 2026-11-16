package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryCountdownSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryCountdownSubscriberRepository extends JpaRepository<StoryCountdownSubscriber, UUID> {
    boolean existsByCountdownIdAndUserId(UUID countdownId, UUID userId);
    Optional<StoryCountdownSubscriber> findByCountdownIdAndUserId(UUID countdownId, UUID userId);
    void deleteByCountdownIdAndUserId(UUID countdownId, UUID userId);
    void deleteByCountdownId(UUID countdownId);
}
