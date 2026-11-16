package com.instagramclone.admin.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for updating a single dynamic system configuration value.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDynamicSystemConfigRequest {

    @NotNull(message = "Config value is required")
    private String value;
}

