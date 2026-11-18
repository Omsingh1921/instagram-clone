package com.instagramclone.call.mapper;

import com.instagramclone.call.dto.response.CallSessionResponse;
import com.instagramclone.call.entity.CallSession;
import com.instagramclone.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CallMapper {

    private final UserMapper userMapper;

    public CallSessionResponse toResponse(CallSession session) {
        if (session == null) return null;

        java.util.List<com.instagramclone.user.dto.response.UserSummaryResponse> participantList = null;
        if (session.getParticipants() != null && !session.getParticipants().isEmpty()) {
            participantList = session.getParticipants().stream()
                    .filter(p -> p.getStatus() == com.instagramclone.call.enums.CallParticipantStatus.JOINED)
                    .map(p -> userMapper.toUserSummaryResponse(p.getUser()))
                    .collect(java.util.stream.Collectors.toList());
        }

        return CallSessionResponse.builder()
                .id(session.getId())
                .conversationId(session.getConversationId())
                .caller(userMapper.toUserSummaryResponse(session.getCaller()))
                .recipient(session.getRecipient() != null ? userMapper.toUserSummaryResponse(session.getRecipient()) : null)
                .isGroup(session.getIsGroup())
                .participants(participantList)
                .callType(session.getCallType())
                .status(session.getStatus())
                .startedAt(session.getStartedAt())
                .connectedAt(session.getConnectedAt())
                .endedAt(session.getEndedAt())
                .durationSeconds(session.getDurationSeconds())
                .createdAt(session.getCreatedAt())
                .build();
    }
}

