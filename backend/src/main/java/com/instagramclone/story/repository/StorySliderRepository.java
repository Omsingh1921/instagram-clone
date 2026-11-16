package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StorySlider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StorySliderRepository extends JpaRepository<StorySlider, UUID> {
    Optional<StorySlider> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
