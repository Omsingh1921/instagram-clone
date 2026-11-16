package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryQuestionRepository extends JpaRepository<StoryQuestion, UUID> {
    Optional<StoryQuestion> findByStoryId(UUID storyId);
}
