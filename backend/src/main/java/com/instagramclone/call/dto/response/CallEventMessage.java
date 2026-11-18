package com.instagramclone.call.dto.response;

import com.instagramclone.call.enums.CallType;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallEventMessage {

    private String eventType; // INCOMING_CALL, CALL_ACCEPTED, CALL_REJECTED, CALL_ENDED, CALL_BUSY, SIGNAL, PARTICIPANT_JOINED, PARTICIPANT_LEFT
    private UUID callId;
    private UUID conversationId;
    private UserSummaryResponse caller;
    private UserSummaryResponse recipient;
    private CallType callType;
    private String signalType; // offer, answer, ice-candidate (when eventType == SIGNAL)
    private Object signalData; // SDP or candidate data
    private Integer durationSeconds;
    private String reason;
    private Boolean isGroup;
    private String groupName;
    private String groupAvatarUrl;
    private java.util.List<UserSummaryResponse> participants;
    private UserSummaryResponse participant;
}

