package com.instagramclone.admin.dto.request;

import com.instagramclone.admin.constants.AdminConstants;
import com.instagramclone.admin.enums.ReportTargetType;
import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.common.validation.annotation.ValidUUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

import com.instagramclone.common.constants.ValidationConstants;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TrimValidator
public class CreateReportRequest {

    @NotNull(message = AdminConstants.VALIDATION_TARGET_TYPE_REQUIRED)
    private ReportTargetType targetType;

    @NotNull(message = AdminConstants.VALIDATION_TARGET_ID_REQUIRED)
    @ValidUUID(required = true, message = AdminConstants.VALIDATION_TARGET_ID_INVALID_UUID)
    private UUID targetId;

    @NotBlank(message = ValidationConstants.REPORT_REASON_REQUIRED)
    @Size(max = AdminConstants.MAX_REPORT_REASON_CODE_LENGTH, message = AdminConstants.VALIDATION_REASON_CODE_MAX_LENGTH_MESSAGE)
    private String reasonCode;

    @Size(max = ValidationConstants.REPORT_REASON_MAX_LENGTH, message = ValidationConstants.REPORT_REASON_MAX_LENGTH_MESSAGE)
    private String description;
}
