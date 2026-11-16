package com.instagramclone.admin.dto.request;

import com.instagramclone.admin.constants.AdminConstants;
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
public class UpdateFeatureFlagRequest {

    @NotNull(message = AdminConstants.VALIDATION_REELS_UPLOAD_REQUIRED)
    private Boolean reelsUploadEnabled;

    @NotNull(message = AdminConstants.VALIDATION_STORY_CREATION_REQUIRED)
    private Boolean storyCreationEnabled;

    @NotNull(message = AdminConstants.VALIDATION_VOICE_MESSAGES_REQUIRED)
    private Boolean voiceMessagesEnabled;

    @NotNull(message = AdminConstants.VALIDATION_MAINTENANCE_MODE_REQUIRED)
    private Boolean maintenanceModeEnabled;

    @NotBlank(message = AdminConstants.VALIDATION_MAINTENANCE_MESSAGE_REQUIRED)
    private String maintenanceMessage;
}
