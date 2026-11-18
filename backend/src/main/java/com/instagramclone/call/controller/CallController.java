package com.instagramclone.call.controller;

import com.instagramclone.call.dto.request.InitiateCallRequest;
import com.instagramclone.call.dto.response.CallSessionResponse;
import com.instagramclone.call.service.interfaces.ICallService;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.ratelimit.RateLimit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calls")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
@Tag(name = "Audio & Video Calls", description = "Endpoints for managing WebRTC call sessions and call history")
@SecurityRequirement(name = "bearerAuth")
public class CallController {

    private final ICallService callService;

    @RateLimit(category = "call-initiate", limit = 15, windowSeconds = 60)
    @PostMapping("/initiate")
    @Operation(summary = "Initiate an audio or video call")
    public ResponseEntity<ApiResponse<CallSessionResponse>> initiateCall(
            @Valid @RequestBody InitiateCallRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.initiateCall(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Call initiated", response));
    }

    @RateLimit(category = "call-initiate", limit = 15, windowSeconds = 60)
    @PostMapping("/group/initiate")
    @Operation(summary = "Initiate an audio or video group call")
    public ResponseEntity<ApiResponse<CallSessionResponse>> initiateGroupCall(
            @Valid @RequestBody com.instagramclone.call.dto.request.InitiateGroupCallRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.initiateGroupCall(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group call initiated", response));
    }

    @PostMapping("/{callId}/answer")
    @Operation(summary = "Answer an incoming call")
    public ResponseEntity<ApiResponse<CallSessionResponse>> answerCall(
            @PathVariable UUID callId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.answerCall(currentUserId, callId);
        return ResponseEntity.ok(ApiResponse.success("Call answered", response));
    }

    @PostMapping("/{callId}/reject")
    @Operation(summary = "Reject or decline an incoming call")
    public ResponseEntity<ApiResponse<CallSessionResponse>> rejectCall(
            @PathVariable UUID callId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.rejectCall(currentUserId, callId);
        return ResponseEntity.ok(ApiResponse.success("Call rejected", response));
    }

    @PostMapping("/{callId}/end")
    @Operation(summary = "End an ongoing call")
    public ResponseEntity<ApiResponse<CallSessionResponse>> endCall(
            @PathVariable UUID callId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.endCall(currentUserId, callId);
        return ResponseEntity.ok(ApiResponse.success("Call ended", response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get user call history")
    public ResponseEntity<ApiResponse<Page<CallSessionResponse>>> getCallHistory(
            @PageableDefault(size = 20, sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Page<CallSessionResponse> response = callService.getUserCallHistory(currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Call history retrieved", response));
    }

    @GetMapping("/active")
    @Operation(summary = "Get current active call for user if any")
    public ResponseEntity<ApiResponse<CallSessionResponse>> getActiveCall() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Optional<CallSessionResponse> active = callService.getActiveCall(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Active call retrieved", active.orElse(null)));
    }

    @GetMapping("/{callId}")
    @Operation(summary = "Get call session details by ID")
    public ResponseEntity<ApiResponse<CallSessionResponse>> getCallById(
            @PathVariable UUID callId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.getCallById(callId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Call details retrieved", response));
    }

    @PostMapping("/{callId}/join")
    @Operation(summary = "Join an ongoing group call")
    public ResponseEntity<ApiResponse<CallSessionResponse>> joinGroupCall(
            @PathVariable UUID callId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.joinGroupCall(currentUserId, callId);
        return ResponseEntity.ok(ApiResponse.success("Joined group call", response));
    }

    @PostMapping("/{callId}/leave")
    @Operation(summary = "Leave an ongoing group call")
    public ResponseEntity<ApiResponse<CallSessionResponse>> leaveGroupCall(
            @PathVariable UUID callId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        CallSessionResponse response = callService.leaveGroupCall(currentUserId, callId);
        return ResponseEntity.ok(ApiResponse.success("Left group call", response));
    }

    @GetMapping("/group/{conversationId}/active")
    @Operation(summary = "Get active group call for a conversation")
    public ResponseEntity<ApiResponse<CallSessionResponse>> getActiveGroupCall(
            @PathVariable UUID conversationId) {
        Optional<CallSessionResponse> active = callService.getActiveGroupCall(conversationId);
        return ResponseEntity.ok(ApiResponse.success("Active group call retrieved", active.orElse(null)));
    }
}

