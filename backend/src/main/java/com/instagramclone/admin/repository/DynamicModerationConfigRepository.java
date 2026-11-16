package com.instagramclone.admin.repository;

import com.instagramclone.admin.entity.DynamicModerationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DynamicModerationConfigRepository extends JpaRepository<DynamicModerationConfig, UUID> {
    Optional<DynamicModerationConfig> findFirstByOrderByCreatedAtAsc();
}
