package com.instagramclone.admin.repository;

import com.instagramclone.admin.entity.DynamicDeletionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DynamicDeletionConfigRepository extends JpaRepository<DynamicDeletionConfig, UUID> {
    Optional<DynamicDeletionConfig> findFirstByOrderByCreatedAtAsc();
}
