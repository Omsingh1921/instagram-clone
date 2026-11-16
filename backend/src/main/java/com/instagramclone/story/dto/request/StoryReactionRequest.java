package com.instagramclone.story.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
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
public class StoryReactionRequest {

    @JsonAlias({"reaction"})
    @NotBlank(message = "Emoji is required")
    @Size(max = 10, message = "Emoji character string cannot exceed 10 characters")
    private String emoji;
}
