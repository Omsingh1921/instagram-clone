package com.instagramclone.post.dto.request;

import com.instagramclone.common.constants.ValidationConstants;
import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.post.constants.PostConstants;
import com.instagramclone.post.enums.PostVisibility;
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
public class UpdatePostRequest {

    @Size(max = ValidationConstants.CAPTION_MAX_LENGTH, message = ValidationConstants.CAPTION_MAX_LENGTH_MESSAGE)
    private String caption;

    @Size(max = PostConstants.MAX_LOCATION_LENGTH, message = PostConstants.VALIDATION_LOCATION_MAX_LENGTH_MESSAGE)
    private String location;

    private Boolean commentsDisabled;

    private Boolean hideLikeCount;

    private PostVisibility visibility;
}
