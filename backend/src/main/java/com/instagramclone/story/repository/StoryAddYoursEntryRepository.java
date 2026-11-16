package com.instagramclone.story.repository;

import com.instagramclone.story.entity.StoryAddYoursEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoryAddYoursEntryRepository extends JpaRepository<StoryAddYoursEntry, UUID> {
    long countByAddYoursId(UUID addYoursId);
    List<StoryAddYoursEntry> findByAddYoursId(UUID addYoursId);
    boolean existsByAddYoursIdAndUserId(UUID addYoursId, UUID userId);
    void deleteByAddYoursId(UUID addYoursId);
}
