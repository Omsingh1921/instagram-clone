package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryQuizRepository extends JpaRepository<StoryQuiz, UUID> {
    Optional<StoryQuiz> findByStoryId(UUID storyId);
    void deleteByStoryId(UUID storyId);
}
