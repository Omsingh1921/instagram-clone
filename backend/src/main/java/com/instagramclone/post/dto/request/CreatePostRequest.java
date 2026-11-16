package com.instagramclone.post.dto.request;

import com.instagramclone.common.constants.ValidationConstants;
import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.post.constants.PostConstants;
import com.instagramclone.post.enums.PostVisibility;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TrimValidator
public class CreatePostRequest {

    @Size(max = ValidationConstants.CAPTION_MAX_LENGTH, message = ValidationConstants.CAPTION_MAX_LENGTH_MESSAGE)
    private String caption;

    @Size(max = PostConstants.MAX_LOCATION_LENGTH, message = PostConstants.VALIDATION_LOCATION_MAX_LENGTH_MESSAGE)
    private String location;

    private UUID collaboratorId;

    @Builder.Default
    private Boolean commentsDisabled = false;

    @Builder.Default
    private Boolean hideLikeCount = false;

    @NotNull(message = PostConstants.VALIDATION_VISIBILITY_REQUIRED)
    @Builder.Default
    private PostVisibility visibility = PostVisibility.PUBLIC;

    @NotEmpty(message = PostConstants.VALIDATION_MEDIA_REQUIRED)
    @Size(max = PostConstants.MAX_MEDIA_COUNT, message = PostConstants.VALIDATION_MEDIA_MAX_MESSAGE)
    @Valid
    @Builder.Default
    private List<PostMediaRequest> media = new ArrayList<>();

    @Builder.Default
    private List<CreatePostUserTagRequest> taggedUsers = new ArrayList<>();
}
