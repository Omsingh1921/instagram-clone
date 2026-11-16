package com.instagramclone.admin.repository;

import com.instagramclone.admin.entity.DynamicSystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DynamicSystemConfigRepository extends JpaRepository<DynamicSystemConfig, UUID> {

    Optional<DynamicSystemConfig> findByConfigKeyAndIsDeletedFalse(String configKey);

    List<DynamicSystemConfig> findAllByIsDeletedFalseOrderByCategoryAscConfigKeyAsc();

    List<DynamicSystemConfig> findAllByIsPublicTrueAndIsSecretFalseAndIsDeletedFalseOrderByCategoryAscConfigKeyAsc();

    boolean existsByConfigKey(String configKey);
}

