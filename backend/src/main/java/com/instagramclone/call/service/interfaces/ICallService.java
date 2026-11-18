package com.instagramclone.call.service.interfaces;

import com.instagramclone.call.dto.request.CallSignalRequest;
import com.instagramclone.call.dto.request.InitiateCallRequest;
import com.instagramclone.call.dto.response.CallSessionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface ICallService {

    CallSessionResponse initiateCall(UUID callerId, InitiateCallRequest request);

    CallSessionResponse initiateGroupCall(UUID callerId, com.instagramclone.call.dto.request.InitiateGroupCallRequest request);

    CallSessionResponse answerCall(UUID userId, UUID callId);

    CallSessionResponse rejectCall(UUID userId, UUID callId);

    CallSessionResponse endCall(UUID userId, UUID callId);

    void relaySignal(UUID senderId, CallSignalRequest signalRequest);

    Page<CallSessionResponse> getUserCallHistory(UUID userId, Pageable pageable);

    Optional<CallSessionResponse> getActiveCall(UUID userId);

    CallSessionResponse getCallById(UUID callId, UUID requestingUserId);

    CallSessionResponse joinGroupCall(UUID userId, UUID callId);

    CallSessionResponse leaveGroupCall(UUID userId, UUID callId);

    Optional<CallSessionResponse> getActiveGroupCall(UUID conversationId);
}

