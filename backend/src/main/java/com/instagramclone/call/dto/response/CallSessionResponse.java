package com.instagramclone.call.dto.response;

import com.instagramclone.call.enums.CallStatus;
import com.instagramclone.call.enums.CallType;
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
public class CallSessionResponse {

    private UUID id;
    private UUID conversationId;
    private UserSummaryResponse caller;
    private UserSummaryResponse recipient;
    private CallType callType;
    private CallStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime connectedAt;
    private LocalDateTime endedAt;
    private Integer durationSeconds;
    private Boolean isGroup;
    private String groupName;
    private String groupAvatarUrl;
    private java.util.List<UserSummaryResponse> participants;
    private LocalDateTime createdAt;
}

