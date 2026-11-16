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
public class StoryLinkRequest {

    @NotBlank(message = "Link URL is required")
    @Size(max = 1000, message = "URL must not exceed 1000 characters")
    private String url;

    @Size(max = 100, message = "Link sticker title must not exceed 100 characters")
    private String title;

    private Double xPercent;
    private Double yPercent;
}
