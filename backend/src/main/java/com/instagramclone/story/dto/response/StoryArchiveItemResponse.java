package com.instagramclone.story.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.instagramclone.post.enums.MediaType;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StoryArchiveItemResponse {

    private UUID id;
    private String mediaUrl;
    private MediaType mediaType;
    private String caption;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private long viewCount;
    private long likeCount;
    private boolean isCloseFriendsOnly;
    private boolean isArchived;
}
