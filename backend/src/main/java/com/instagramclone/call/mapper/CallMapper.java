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
        return CallSessionResponse.builder()
                .id(session.getId())
                .conversationId(session.getConversationId())
                .caller(userMapper.toUserSummaryResponse(session.getCaller()))
                .recipient(userMapper.toUserSummaryResponse(session.getRecipient()))
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

