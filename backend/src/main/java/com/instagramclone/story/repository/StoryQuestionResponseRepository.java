package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryQuestionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoryQuestionResponseRepository extends JpaRepository<StoryQuestionResponse, UUID> {
    List<StoryQuestionResponse> findByQuestionIdOrderByCreatedAtDesc(UUID questionId);
    boolean existsByQuestionIdAndUserId(UUID questionId, UUID userId);
}
