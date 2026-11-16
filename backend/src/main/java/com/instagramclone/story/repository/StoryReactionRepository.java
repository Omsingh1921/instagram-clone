package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryReactionRepository extends JpaRepository<StoryReaction, UUID> {
    List<StoryReaction> findByStoryId(UUID storyId);
    Optional<StoryReaction> findByStoryIdAndUserIdAndEmoji(UUID storyId, UUID userId, String emoji);
    long countByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
