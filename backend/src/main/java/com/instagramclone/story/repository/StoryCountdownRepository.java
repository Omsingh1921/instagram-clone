package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryCountdown;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryCountdownRepository extends JpaRepository<StoryCountdown, UUID> {
    Optional<StoryCountdown> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
