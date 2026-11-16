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
public class StoryHashtagRequest {

    @NotBlank(message = "Hashtag is required")
    @Size(max = 100, message = "Hashtag must not exceed 100 characters")
    private String hashtag;

    private Double xPercent;
    private Double yPercent;
}
