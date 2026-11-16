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
public class AdminActivityItemResponse {

    private String id;
    private String type; // POST_CREATED, REEL_UPLOADED, STORY_CREATED, REPORT_SUBMITTED, USER_FOLLOWED, USER_JOINED
    private String actionText;
    private UserSummaryResponse actor;
    private String targetType;
    private UUID targetId;
    private String previewUrl;
    private LocalDateTime createdAt;
}

