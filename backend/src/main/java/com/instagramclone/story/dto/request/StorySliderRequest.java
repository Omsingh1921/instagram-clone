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
public class StorySliderRequest {

    @NotBlank(message = "Slider question cannot be blank")
    @Size(max = 200, message = "Slider question must not exceed 200 characters")
    private String question;

    @Builder.Default
    @Size(max = 10, message = "Emoji character string cannot exceed 10 characters")
    private String emoji = "🔥";
}
