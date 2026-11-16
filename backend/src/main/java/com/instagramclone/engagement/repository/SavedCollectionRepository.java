package com.instagramclone.engagement.repository;

import com.instagramclone.engagement.entity.SavedCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedCollectionRepository extends JpaRepository<SavedCollection, UUID> {
    List<SavedCollection> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    Optional<SavedCollection> findByIdAndUserId(UUID id, UUID userId);
}
