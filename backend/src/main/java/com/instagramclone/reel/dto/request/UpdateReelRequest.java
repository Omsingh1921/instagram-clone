package com.instagramclone.reel.dto.request;

import com.instagramclone.common.constants.ValidationConstants;
import com.instagramclone.common.validation.annotation.TrimValidator;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TrimValidator
public class UpdateReelRequest {

    @Size(max = ValidationConstants.CAPTION_MAX_LENGTH, message = ValidationConstants.CAPTION_MAX_LENGTH_MESSAGE)
    private String caption;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @Size(max = 150, message = "Audio title must not exceed 150 characters")
    private String audioTitle;

    @Size(max = 150, message = "Audio artist must not exceed 150 characters")
    private String audioArtist;

    private Boolean hideLikeCount;

    private Boolean commentsDisabled;
}
