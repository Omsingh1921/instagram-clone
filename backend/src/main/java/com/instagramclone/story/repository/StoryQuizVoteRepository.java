package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryQuizVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryQuizVoteRepository extends JpaRepository<StoryQuizVote, UUID> {
    Optional<StoryQuizVote> findByQuizIdAndUserId(UUID quizId, UUID userId);
    List<StoryQuizVote> findByQuizId(UUID quizId);
    void deleteByQuizId(UUID quizId);
}
