package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StorySliderVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StorySliderVoteRepository extends JpaRepository<StorySliderVote, UUID> {
    Optional<StorySliderVote> findBySliderIdAndUserId(UUID sliderId, UUID userId);
    List<StorySliderVote> findBySliderId(UUID sliderId);
    
    @Query("SELECT AVG(v.sliderValue) FROM StorySliderVote v WHERE v.slider.id = :sliderId")
    Double getAverageSliderValue(@Param("sliderId") UUID sliderId);

    void deleteBySliderId(UUID sliderId);
}
