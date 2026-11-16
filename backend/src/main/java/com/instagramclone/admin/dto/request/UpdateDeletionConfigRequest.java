package com.instagramclone.admin.dto.request;

import com.instagramclone.admin.constants.AdminConstants;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDeletionConfigRequest {

    @NotNull(message = AdminConstants.VALIDATION_TRASH_RETENTION_REQUIRED)
    @Min(value = AdminConstants.TRASH_RETENTION_DAYS_MIN, message = AdminConstants.VALIDATION_TRASH_RETENTION_MIN_MESSAGE)
    @Max(value = AdminConstants.TRASH_RETENTION_DAYS_MAX, message = AdminConstants.VALIDATION_TRASH_RETENTION_MAX_MESSAGE)
    private Integer trashRetentionDays;

    @NotNull(message = AdminConstants.VALIDATION_PSEUDO_PERMANENT_REQUIRED)
    private Boolean pseudoPermanentEnabled;

    @NotNull(message = AdminConstants.VALIDATION_MEDIA_PURGE_DELAY_REQUIRED)
    @Min(value = AdminConstants.MEDIA_PURGE_DELAY_DAYS_MIN, message = AdminConstants.VALIDATION_MEDIA_PURGE_DELAY_MIN_MESSAGE)
    @Max(value = AdminConstants.MEDIA_PURGE_DELAY_DAYS_MAX, message = AdminConstants.VALIDATION_MEDIA_PURGE_DELAY_MAX_MESSAGE)
    private Integer mediaPurgeDelayDays;

    @NotNull(message = AdminConstants.VALIDATION_LEGAL_HOLD_REQUIRED)
    private Boolean legalHoldEnabled;

    @NotNull(message = AdminConstants.VALIDATION_ADMIN_TAKEDOWN_PRESERVE_REQUIRED)
    @Min(value = AdminConstants.ADMIN_TAKEDOWN_PRESERVE_DAYS_MIN, message = AdminConstants.VALIDATION_ADMIN_TAKEDOWN_PRESERVE_MIN_MESSAGE)
    @Max(value = AdminConstants.ADMIN_TAKEDOWN_PRESERVE_DAYS_MAX, message = AdminConstants.VALIDATION_ADMIN_TAKEDOWN_PRESERVE_MAX_MESSAGE)
    private Integer adminTakedownPreserveDays;

    @NotNull(message = AdminConstants.VALIDATION_ACCOUNT_GRACE_REQUIRED)
    @Min(value = AdminConstants.ACCOUNT_GRACE_DAYS_MIN, message = AdminConstants.VALIDATION_ACCOUNT_GRACE_MIN_MESSAGE)
    @Max(value = AdminConstants.ACCOUNT_GRACE_DAYS_MAX, message = AdminConstants.VALIDATION_ACCOUNT_GRACE_MAX_MESSAGE)
    private Integer accountGraceDays;

    @NotNull(message = AdminConstants.VALIDATION_CRON_BATCH_SIZE_REQUIRED)
    @Min(value = AdminConstants.CRON_BATCH_SIZE_MIN, message = AdminConstants.VALIDATION_CRON_BATCH_SIZE_MIN_MESSAGE)
    @Max(value = AdminConstants.CRON_BATCH_SIZE_MAX, message = AdminConstants.VALIDATION_CRON_BATCH_SIZE_MAX_MESSAGE)
    private Integer cronBatchSize;
}
