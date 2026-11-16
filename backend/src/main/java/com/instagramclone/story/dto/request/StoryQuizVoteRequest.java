package com.instagramclone.story.dto.request;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryQuizVoteRequest {

    @Min(value = 0, message = "Selected option index must be non-negative")
    private int selectedOption;
}
