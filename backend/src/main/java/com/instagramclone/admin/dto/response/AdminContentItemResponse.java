package com.instagramclone.admin.dto.response;

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
public class AdminContentItemResponse {

    private UUID id;
    private String contentType; // POST, REEL, STORY
    private UserSummaryResponse author;
    private String caption;
    private String mediaUrl;
    private String thumbnailUrl;
    private String mediaType;
    private long likesCount;
    private long commentsCount;
    private boolean isArchived;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}

