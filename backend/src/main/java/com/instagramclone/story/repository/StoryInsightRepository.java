package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryInsightRepository extends JpaRepository<StoryInsight, UUID> {
    Optional<StoryInsight> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
