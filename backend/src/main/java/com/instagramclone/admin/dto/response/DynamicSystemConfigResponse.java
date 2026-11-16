package com.instagramclone.admin.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO representing a runtime system configuration entry.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DynamicSystemConfigResponse {

    private String key;
    private String value;
    private String defaultValue;
    private String category;
    private String description;

    @JsonProperty("isPublic")
    private Boolean isPublic;

    @JsonProperty("isSecret")
    private Boolean isSecret;

    private String updatedBy;
    private LocalDateTime updatedAt;
}

