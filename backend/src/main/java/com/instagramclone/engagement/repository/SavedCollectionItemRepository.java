package com.instagramclone.engagement.repository;

import com.instagramclone.engagement.entity.SavedCollectionItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedCollectionItemRepository extends JpaRepository<SavedCollectionItem, UUID> {
    Page<SavedCollectionItem> findByCollectionIdOrderByCreatedAtDesc(UUID collectionId, Pageable pageable);
    Page<SavedCollectionItem> findByCollectionIdAndPostIsNotNullOrderByCreatedAtDesc(UUID collectionId, Pageable pageable);
    Page<SavedCollectionItem> findByCollectionIdAndReelIsNotNullOrderByCreatedAtDesc(UUID collectionId, Pageable pageable);
    boolean existsByCollectionIdAndPostId(UUID collectionId, UUID postId);
    boolean existsByCollectionIdAndReelId(UUID collectionId, UUID reelId);
    Optional<SavedCollectionItem> findByCollectionIdAndPostId(UUID collectionId, UUID postId);
    Optional<SavedCollectionItem> findByCollectionIdAndReelId(UUID collectionId, UUID reelId);
    long countByCollectionId(UUID collectionId);
}
