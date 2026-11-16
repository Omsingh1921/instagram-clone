package com.instagramclone.engagement.dto.request;

import com.instagramclone.engagement.constants.EngagementConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCollectionRequest {

    @NotBlank(message = EngagementConstants.VALIDATION_COLLECTION_NAME_REQUIRED)
    @Size(max = EngagementConstants.COLLECTION_NAME_MAX_LENGTH, message = EngagementConstants.VALIDATION_COLLECTION_NAME_MAX_LENGTH_MESSAGE)
    private String name;

    private String coverMediaUrl;

    private List<UUID> initialPostIds;
}
