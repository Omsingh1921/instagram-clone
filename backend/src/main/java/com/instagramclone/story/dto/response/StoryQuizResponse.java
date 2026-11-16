package com.instagramclone.story.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StoryQuizResponse {

    private UUID id;
    private String question;
    private List<String> options;
    private int correctOptionIndex;
    private Integer userVote;
    private Map<Integer, Long> optionVoteCounts;
    private long totalVotes;
}
