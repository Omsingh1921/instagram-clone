package com.instagramclone.media.dto.request;

import com.instagramclone.media.constants.MediaConstants;
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
public class UpdateMediaConfigRequest {

    @NotNull(message = MediaConstants.VALIDATION_MAX_REEL_BYTES_REQUIRED)
    @Min(value = MediaConstants.REEL_BYTES_MIN, message = MediaConstants.VALIDATION_MAX_REEL_BYTES_MIN_MESSAGE)
    @Max(value = MediaConstants.REEL_BYTES_MAX, message = MediaConstants.VALIDATION_MAX_REEL_BYTES_MAX_MESSAGE)
    private Long maxReelBytes;

    @NotNull(message = MediaConstants.VALIDATION_MAX_POST_BYTES_REQUIRED)
    @Min(value = MediaConstants.POST_BYTES_MIN, message = MediaConstants.VALIDATION_MAX_POST_BYTES_MIN_MESSAGE)
    @Max(value = MediaConstants.POST_BYTES_MAX, message = MediaConstants.VALIDATION_MAX_POST_BYTES_MAX_MESSAGE)
    private Long maxPostBytes;

    @NotNull(message = MediaConstants.VALIDATION_MAX_REEL_DURATION_REQUIRED)
    @Min(value = MediaConstants.REEL_DURATION_SEC_MIN, message = MediaConstants.VALIDATION_MAX_REEL_DURATION_MIN_MESSAGE)
    @Max(value = MediaConstants.REEL_DURATION_SEC_MAX, message = MediaConstants.VALIDATION_MAX_REEL_DURATION_MAX_MESSAGE)
    private Integer maxReelDurationSec;

    @NotNull(message = MediaConstants.VALIDATION_MAX_STORY_DURATION_REQUIRED)
    @Min(value = MediaConstants.STORY_DURATION_SEC_MIN, message = MediaConstants.VALIDATION_MAX_STORY_DURATION_MIN_MESSAGE)
    @Max(value = MediaConstants.STORY_DURATION_SEC_MAX, message = MediaConstants.VALIDATION_MAX_STORY_DURATION_MAX_MESSAGE)
    private Integer maxStoryDurationSec;

    @NotBlank(message = MediaConstants.VALIDATION_ALLOWED_MIME_TYPES_REQUIRED)
    private String allowedMimeTypes;
}
