package com.instagramclone.admin.entity;

import com.instagramclone.common.entity.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Persisted key-value runtime system configuration managed via the Admin Configuration Hub.
 */
@Entity
@Table(name = "dynamic_system_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DynamicSystemConfig extends BaseAuditableEntity {

    @Column(name = "config_key", nullable = false, unique = true, length = 120)
    private String configKey;

    @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
    private String configValue;

    @Column(name = "default_value", nullable = false, columnDefinition = "TEXT")
    private String defaultValue;

    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private String category = "GENERAL";

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = Boolean.FALSE;

    @Column(name = "is_secret", nullable = false)
    @Builder.Default
    private Boolean isSecret = Boolean.FALSE;

    @Column(name = "updated_by", length = 150)
    private String updatedBy;
}

