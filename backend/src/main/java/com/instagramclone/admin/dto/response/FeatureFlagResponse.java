package com.instagramclone.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureFlagResponse {

    private UUID id;
    private Boolean reelsUploadEnabled;
    private Boolean storyCreationEnabled;
    private Boolean voiceMessagesEnabled;
    private Boolean maintenanceModeEnabled;
    private String maintenanceMessage;
    private LocalDateTime updatedAt;
}
