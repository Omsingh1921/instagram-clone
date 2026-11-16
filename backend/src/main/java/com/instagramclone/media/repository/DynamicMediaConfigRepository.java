package com.instagramclone.media.repository;

import com.instagramclone.media.entity.DynamicMediaConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DynamicMediaConfigRepository extends JpaRepository<DynamicMediaConfig, UUID> {
    Optional<DynamicMediaConfig> findFirstByOrderByCreatedAtAsc();
}
