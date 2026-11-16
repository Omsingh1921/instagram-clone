package com.instagramclone.story.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorySliderVoteRequest {

    @DecimalMin(value = "0.0", message = "Slider value must be at least 0.0")
    @DecimalMax(value = "1.0", message = "Slider value cannot exceed 1.0")
    private double sliderValue;
}
