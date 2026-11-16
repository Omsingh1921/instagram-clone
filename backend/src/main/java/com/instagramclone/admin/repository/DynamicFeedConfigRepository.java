package com.instagramclone.admin.repository;

import com.instagramclone.admin.entity.DynamicFeedConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DynamicFeedConfigRepository extends JpaRepository<DynamicFeedConfig, UUID> {
    Optional<DynamicFeedConfig> findFirstByIsActiveTrueOrderByCreatedAtDesc();
    Optional<DynamicFeedConfig> findFirstByOrderByCreatedAtAsc();
}

