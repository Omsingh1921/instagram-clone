package com.instagramclone.post.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.instagramclone.post.constants.PostConstants;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostMediaTagRequest {

    @NotNull(message = PostConstants.VALIDATION_TAGGED_USER_ID_REQUIRED)
    private UUID taggedUserId;

    @DecimalMin(value = PostConstants.COORD_PERCENT_MIN, message = PostConstants.VALIDATION_X_COORD_MIN_MESSAGE)
    @DecimalMax(value = PostConstants.COORD_PERCENT_MAX, message = PostConstants.VALIDATION_X_COORD_MAX_MESSAGE)
    @JsonProperty("xPercent")
    private Double xPercent;

    @DecimalMin(value = PostConstants.COORD_PERCENT_MIN, message = PostConstants.VALIDATION_Y_COORD_MIN_MESSAGE)
    @DecimalMax(value = PostConstants.COORD_PERCENT_MAX, message = PostConstants.VALIDATION_Y_COORD_MAX_MESSAGE)
    @JsonProperty("yPercent")
    private Double yPercent;
}
