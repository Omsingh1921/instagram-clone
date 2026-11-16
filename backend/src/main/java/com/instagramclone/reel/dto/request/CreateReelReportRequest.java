package com.instagramclone.reel.dto.request;

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
public class CreateReelReportRequest {

    @NotBlank(message = "Report reason code is required")
    @Size(max = 50, message = "Reason code must not exceed 50 characters")
    private String reasonCode;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
}
