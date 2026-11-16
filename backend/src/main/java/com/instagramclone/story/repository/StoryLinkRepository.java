package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoryLinkRepository extends JpaRepository<StoryLink, UUID> {
    List<StoryLink> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
