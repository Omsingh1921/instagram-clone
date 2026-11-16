package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoryLocationRepository extends JpaRepository<StoryLocation, UUID> {
    List<StoryLocation> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
