package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryAddYours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryAddYoursRepository extends JpaRepository<StoryAddYours, UUID> {
    Optional<StoryAddYours> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
