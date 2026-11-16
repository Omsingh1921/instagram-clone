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
public class CreateQuestionAnswerRequest {

    @NotBlank(message = "Answer cannot be blank")
    @Size(max = 500, message = "Answer cannot exceed 500 characters")
    private String text;
}
