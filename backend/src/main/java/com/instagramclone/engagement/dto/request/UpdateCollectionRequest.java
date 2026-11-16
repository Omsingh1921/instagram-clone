package com.instagramclone.engagement.dto.request;

import com.instagramclone.engagement.constants.EngagementConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCollectionRequest {

    @NotBlank(message = EngagementConstants.VALIDATION_COLLECTION_NAME_REQUIRED)
    @Size(max = EngagementConstants.COLLECTION_NAME_MAX_LENGTH, message = EngagementConstants.VALIDATION_COLLECTION_NAME_MUST_NOT_EXCEED_MESSAGE)
    private String name;

    private String coverMediaUrl;
}
