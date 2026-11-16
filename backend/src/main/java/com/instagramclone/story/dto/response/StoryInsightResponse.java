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
public class StoryInsightResponse {

    private UUID storyId;
    private Long impressions;
    private Long reach;
    private Long forwards;
    private Long backwards;
    private Long exits;
    private Long replies;
    private Long profileVisits;
}
