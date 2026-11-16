package com.instagramclone.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeletionConfigResponse {

    private UUID id;
    private Integer trashRetentionDays;
    private Boolean pseudoPermanentEnabled;
    private Integer mediaPurgeDelayDays;
    private Boolean legalHoldEnabled;
    private Integer adminTakedownPreserveDays;
    private Integer accountGraceDays;
    private Integer cronBatchSize;
    private LocalDateTime updatedAt;
}
