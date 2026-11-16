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
public class StoryLocationRequest {

    @NotBlank(message = "Location name is required")
    @Size(max = 150, message = "Location name must not exceed 150 characters")
    private String locationName;

    private Double latitude;
    private Double longitude;
    private Double xPercent;
    private Double yPercent;
}
