package com.instagramclone.call.controller;

import com.instagramclone.call.constants.CallConstants;
import com.instagramclone.call.dto.request.CallActionRequest;
import com.instagramclone.call.dto.request.CallSignalRequest;
import com.instagramclone.call.dto.request.InitiateCallRequest;
import com.instagramclone.call.service.interfaces.ICallService;
import com.instagramclone.common.exception.UnauthorizedException;
import com.instagramclone.security.principal.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketCallController {

    private final ICallService callService;

    @MessageMapping(CallConstants.WS_CALL_INITIATE)
    public void handleInitiateCall(@Payload @Valid InitiateCallRequest request, Principal principal) {
        UUID userId = extractUserId(principal);
        callService.initiateCall(userId, request);
    }

    @MessageMapping(CallConstants.WS_CALL_ANSWER)
    public void handleAnswerCall(@Payload @Valid CallActionRequest request, Principal principal) {
        UUID userId = extractUserId(principal);
        callService.answerCall(userId, request.getCallId());
    }

    @MessageMapping(CallConstants.WS_CALL_REJECT)
    public void handleRejectCall(@Payload @Valid CallActionRequest request, Principal principal) {
        UUID userId = extractUserId(principal);
        callService.rejectCall(userId, request.getCallId());
    }

    @MessageMapping(CallConstants.WS_CALL_END)
    public void handleEndCall(@Payload @Valid CallActionRequest request, Principal principal) {
        UUID userId = extractUserId(principal);
        callService.endCall(userId, request.getCallId());
    }

    @MessageMapping(CallConstants.WS_CALL_SIGNAL)
    public void handleSignal(@Payload @Valid CallSignalRequest request, Principal principal) {
        UUID userId = extractUserId(principal);
        log.info("STOMP Call Signal received: type={}, callId={}, from={}, to={}",
                request.getSignalType(), request.getCallId(), userId, request.getRecipientId());
        callService.relaySignal(userId, request);
    }

    @org.springframework.messaging.handler.annotation.MessageExceptionHandler(Exception.class)
    public void handleException(Exception ex) {
        log.error("Error processing WebSocket call message: {}", ex.getMessage(), ex);
    }

    private UUID extractUserId(Principal principal) {
        if (principal == null || !(principal instanceof UsernamePasswordAuthenticationToken auth)
                || !(auth.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            throw new UnauthorizedException("Authentication required for call operations");
        }
        return userPrincipal.getId();
    }
}

