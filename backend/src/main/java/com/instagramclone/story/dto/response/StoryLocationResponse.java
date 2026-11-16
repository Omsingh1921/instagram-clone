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
public class StoryLocationResponse {

    private UUID id;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private Double xPercent;
    private Double yPercent;
}
