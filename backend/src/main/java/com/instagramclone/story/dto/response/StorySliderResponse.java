package com.instagramclone.story.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StorySliderResponse {

    private UUID id;
    private String question;
    private String emoji;
    private Double averageValue;
    private Double userVote;
    private long totalVotes;
}
