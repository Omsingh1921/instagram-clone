package com.instagramclone.story.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.post.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StoryResponse {

    private UUID id;
    private PostAuthorResponse author;
    private String mediaUrl;
    private MediaType mediaType;
    private String caption;
    private List<StoryMentionResponse> mentions;
    private LocalDateTime expiresAt;
    private boolean viewed;
    private Long viewCount;
    private boolean liked;
    private Long likeCount;
    private boolean closeFriendsOnly;
    private boolean archived;

    private String audioTitle;
    private String audioArtist;
    private String audioUrl;
    private String filterName;

    private UUID sharedPostId;
    private UUID sharedReelId;
    private UUID sharedStoryId;

    private StoryPollResponse poll;
    private StoryQuestionResponseDto question;
    private StoryQuizResponse quiz;
    private StorySliderResponse slider;
    private StoryCountdownResponse countdown;
    private StoryAddYoursResponse addYours;

    private List<StoryLinkResponse> links;
    private List<StoryLocationResponse> locations;
    private List<StoryHashtagResponse> hashtags;
    private List<StoryReactionSummaryResponse> reactions;

    private LocalDateTime createdAt;
}
