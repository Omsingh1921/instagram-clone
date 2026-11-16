package com.instagramclone.story.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryCountdownRequest {

    @NotBlank(message = "Countdown title cannot be blank")
    @Size(max = 100, message = "Countdown title must not exceed 100 characters")
    private String title;

    @NotNull(message = "Target date is required")
    @Future(message = "Target date must be in the future")
    private LocalDateTime targetDate;
}
