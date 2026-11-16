package com.instagramclone.mail.repository;

import com.instagramclone.mail.entity.DynamicEmailServerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DynamicEmailServerConfigRepository extends JpaRepository<DynamicEmailServerConfig, UUID> {
    Optional<DynamicEmailServerConfig> findFirstByOrderByCreatedAtAsc();
}
