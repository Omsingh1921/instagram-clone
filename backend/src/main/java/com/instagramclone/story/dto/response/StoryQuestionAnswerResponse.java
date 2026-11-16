package com.instagramclone.story.dto.response;

import com.instagramclone.user.dto.response.UserSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoryQuestionAnswerResponse {
    private UUID id;
    private UserSummaryResponse respondent;
    private String responseText;
    private LocalDateTime createdAt;
}
