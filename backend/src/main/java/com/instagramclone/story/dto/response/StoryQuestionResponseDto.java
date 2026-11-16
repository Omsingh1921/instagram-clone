package com.instagramclone.story.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryQuestionResponseDto {
    private UUID id;
    private String prompt;
    private long totalResponses;
    private boolean hasResponded;
}
