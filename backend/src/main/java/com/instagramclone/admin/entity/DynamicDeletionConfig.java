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

@Entity
@Table(name = "dynamic_deletion_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DynamicDeletionConfig extends BaseAuditableEntity {

    @Column(name = "trash_retention_days", nullable = false)
    @Builder.Default
    private Integer trashRetentionDays = 30;

    @Column(name = "pseudo_permanent_enabled", nullable = false)
    @Builder.Default
    private Boolean pseudoPermanentEnabled = true;

    @Column(name = "media_purge_delay_days", nullable = false)
    @Builder.Default
    private Integer mediaPurgeDelayDays = 30;

    @Column(name = "legal_hold_enabled", nullable = false)
    @Builder.Default
    private Boolean legalHoldEnabled = false;

    @Column(name = "admin_takedown_preserve_days", nullable = false)
    @Builder.Default
    private Integer adminTakedownPreserveDays = 365;

    @Column(name = "account_grace_days", nullable = false)
    @Builder.Default
    private Integer accountGraceDays = 30;

    @Column(name = "cron_batch_size", nullable = false)
    @Builder.Default
    private Integer cronBatchSize = 500;
}
