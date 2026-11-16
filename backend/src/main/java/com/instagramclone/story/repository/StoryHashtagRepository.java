package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryHashtag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoryHashtagRepository extends JpaRepository<StoryHashtag, UUID> {
    List<StoryHashtag> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
