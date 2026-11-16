package com.instagramclone.story.dto.request;

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
public class StoryReportRequest {

    @NotBlank(message = "Report reason is required")
    private String reason;

    @Size(max = 1000, message = "Details cannot exceed 1000 characters")
    private String details;
}
