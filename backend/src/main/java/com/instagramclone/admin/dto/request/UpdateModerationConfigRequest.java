package com.instagramclone.admin.dto.request;

import com.instagramclone.admin.constants.AdminConstants;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class UpdateModerationConfigRequest {

    @NotNull(message = AdminConstants.VALIDATION_AUTO_QUARANTINE_REQUIRED)
    @Min(value = AdminConstants.AUTO_QUARANTINE_THRESHOLD_MIN, message = AdminConstants.VALIDATION_AUTO_QUARANTINE_MIN_MESSAGE)
    @Max(value = AdminConstants.AUTO_QUARANTINE_THRESHOLD_MAX, message = AdminConstants.VALIDATION_AUTO_QUARANTINE_MAX_MESSAGE)
    private Integer autoQuarantineReportThreshold;

    @NotBlank(message = AdminConstants.VALIDATION_PROFANITY_BANNED_WORDS_REQUIRED)
    private String profanityBannedWords;

    @NotNull(message = AdminConstants.VALIDATION_NSFW_BLUR_THRESHOLD_REQUIRED)
    @DecimalMin(value = AdminConstants.NSFW_BLUR_THRESHOLD_MIN, message = AdminConstants.VALIDATION_NSFW_BLUR_MIN_MESSAGE)
    @DecimalMax(value = AdminConstants.NSFW_BLUR_THRESHOLD_MAX, message = AdminConstants.VALIDATION_NSFW_BLUR_MAX_MESSAGE)
    private Double nsfwBlurThreshold;

    @NotNull(message = AdminConstants.VALIDATION_COPYRIGHT_STRIKE_LIMIT_REQUIRED)
    @Min(value = AdminConstants.COPYRIGHT_STRIKE_LIMIT_MIN, message = AdminConstants.VALIDATION_COPYRIGHT_STRIKE_MIN_MESSAGE)
    @Max(value = AdminConstants.COPYRIGHT_STRIKE_LIMIT_MAX, message = AdminConstants.VALIDATION_COPYRIGHT_STRIKE_MAX_MESSAGE)
    private Integer copyrightStrikeLimit;
}
