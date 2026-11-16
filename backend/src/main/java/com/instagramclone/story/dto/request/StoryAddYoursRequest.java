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
public class StoryAddYoursRequest {

    @NotBlank(message = "Prompt text is required")
    @Size(max = 150, message = "Prompt text must not exceed 150 characters")
    private String promptText;
}
