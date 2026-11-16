package com.instagramclone.story.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryQuizRequest {

    @NotBlank(message = "Quiz question cannot be blank")
    @Size(max = 200, message = "Quiz question must not exceed 200 characters")
    private String question;

    @NotEmpty(message = "Quiz must have at least 2 options")
    @Size(min = 2, max = 4, message = "Quiz must have between 2 and 4 options")
    private List<@NotBlank(message = "Option cannot be blank") @Size(max = 100) String> options;

    @Builder.Default
    private int correctOptionIndex = 0;
}
