package com.instagramclone.admin.repository;

import com.instagramclone.admin.entity.DynamicFeatureFlagConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DynamicFeatureFlagRepository extends JpaRepository<DynamicFeatureFlagConfig, UUID> {
    Optional<DynamicFeatureFlagConfig> findFirstByOrderByCreatedAtAsc();
}
