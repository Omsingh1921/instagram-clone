package com.instagramclone.call.service.impl;

import com.instagramclone.call.constants.CallConstants;
import com.instagramclone.call.dto.request.CallSignalRequest;
import com.instagramclone.call.dto.request.InitiateCallRequest;
import com.instagramclone.call.dto.response.CallEventMessage;
import com.instagramclone.call.dto.response.CallSessionResponse;
import com.instagramclone.call.entity.CallSession;
import com.instagramclone.call.enums.CallStatus;
import com.instagramclone.call.enums.CallType;
import com.instagramclone.call.mapper.CallMapper;
import com.instagramclone.call.repository.CallSessionRepository;
import com.instagramclone.call.service.interfaces.ICallService;
import com.instagramclone.chat.constants.ChatConstants;
import com.instagramclone.chat.dto.response.MessageResponse;
import com.instagramclone.chat.entity.Conversation;
import com.instagramclone.chat.entity.ConversationMember;
import com.instagramclone.chat.entity.Message;
import com.instagramclone.chat.enums.ConversationRole;
import com.instagramclone.chat.enums.ConversationType;
import com.instagramclone.chat.enums.MessageType;
import com.instagramclone.chat.repository.ConversationMemberRepository;
import com.instagramclone.chat.repository.ConversationRepository;
import com.instagramclone.chat.repository.MessageRepository;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.exception.UnauthorizedException;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.mapper.UserMapper;
import com.instagramclone.user.repository.UserBlockRepository;
import com.instagramclone.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CallServiceImpl implements ICallService {

    private final CallSessionRepository callSessionRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CallMapper callMapper;
    private final UserMapper userMapper;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;

    @Override
    @Transactional
    public CallSessionResponse initiateCall(UUID callerId, InitiateCallRequest request) {
        if (callerId.equals(request.getRecipientId())) {
            throw new BadRequestException(CallConstants.ERR_CANNOT_CALL_SELF);
        }

        // Verify users exist
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("Caller not found"));
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        // Check blocking policy
        if (userBlockRepository.existsBlockBetween(callerId, request.getRecipientId())) {
            throw new BadRequestException("Cannot initiate call due to user privacy settings / block");
        }

        LocalDateTime ringingThreshold = LocalDateTime.now().minusSeconds(60);
        LocalDateTime connectedThreshold = LocalDateTime.now().minusHours(2);

        // Check if recipient is busy in another active call with a third-party user
        List<CallSession> activeRecipientCalls = callSessionRepository.findActiveCallsByUserId(
                recipient.getId(), List.of(CallStatus.RINGING, CallStatus.CONNECTED));

        boolean isRecipientBusyWithOther = activeRecipientCalls.stream()
                .anyMatch(c -> {
                    // Prior calls between caller and recipient do NOT block new calls
                    boolean isBetweenSameUsers = (c.getCaller().getId().equals(callerId) || c.getRecipient().getId().equals(callerId));
                    if (isBetweenSameUsers) {
                        return false;
                    }
                    if (c.getStatus() == CallStatus.RINGING && c.getStartedAt() != null && c.getStartedAt().isBefore(ringingThreshold)) {
                        return false;
                    }
                    if (c.getStatus() == CallStatus.CONNECTED && c.getConnectedAt() != null && c.getConnectedAt().isBefore(connectedThreshold)) {
                        return false;
                    }
                    return true;
                });

        if (isRecipientBusyWithOther) {
            CallSession busyRecord = CallSession.builder()
                    .conversationId(request.getConversationId())
                    .caller(caller)
                    .recipient(recipient)
                    .callType(request.getCallType())
                    .status(CallStatus.BUSY)
                    .startedAt(LocalDateTime.now())
                    .endedAt(LocalDateTime.now())
                    .durationSeconds(0)
                    .build();
            busyRecord = callSessionRepository.save(busyRecord);

            // Record missed call (busy) in conversation history
            recordCallInChat(busyRecord);

            // Notify caller that recipient is busy
            sendCallEvent(caller.getId(), CallEventMessage.builder()
                    .eventType(CallConstants.EVENT_CALL_BUSY)
                    .callId(busyRecord.getId())
                    .conversationId(request.getConversationId())
                    .caller(userMapper.toUserSummaryResponse(caller))
                    .recipient(userMapper.toUserSummaryResponse(recipient))
                    .callType(request.getCallType())
                    .reason(CallConstants.ERR_USER_BUSY)
                    .build());

            return callMapper.toResponse(busyRecord);
        }

        // Auto-close any previous active calls between caller and recipient
        List<CallSession> allPriorCalls = new java.util.ArrayList<>(activeRecipientCalls);
        allPriorCalls.addAll(callSessionRepository.findActiveCallsByUserId(
                callerId, List.of(CallStatus.RINGING, CallStatus.CONNECTED)));
        for (CallSession c : allPriorCalls) {
            boolean isBetweenSameUsers = (c.getCaller().getId().equals(callerId) || c.getRecipient().getId().equals(callerId))
                    && (c.getCaller().getId().equals(recipient.getId()) || c.getRecipient().getId().equals(recipient.getId()));
            if (isBetweenSameUsers && c.getStatus() != CallStatus.ENDED && c.getStatus() != CallStatus.MISSED) {
                c.setStatus(c.getStatus() == CallStatus.CONNECTED ? CallStatus.ENDED : CallStatus.MISSED);
                c.setEndedAt(LocalDateTime.now());
                callSessionRepository.save(c);
            }
        }

        // Create new active call session in RINGING state
        CallSession session = CallSession.builder()
                .conversationId(request.getConversationId())
                .caller(caller)
                .recipient(recipient)
                .callType(request.getCallType())
                .status(CallStatus.RINGING)
                .startedAt(LocalDateTime.now())
                .durationSeconds(0)
                .build();
        session = callSessionRepository.save(session);

        // Broadcast incoming call event to recipient
        sendCallEvent(recipient.getId(), CallEventMessage.builder()
                .eventType(CallConstants.EVENT_INCOMING_CALL)
                .callId(session.getId())
                .conversationId(request.getConversationId())
                .caller(userMapper.toUserSummaryResponse(caller))
                .recipient(userMapper.toUserSummaryResponse(recipient))
                .callType(request.getCallType())
                .build());

        log.info("Call initiated: ID={}, Type={}, Caller={}, Recipient={}",
                session.getId(), session.getCallType(), caller.getUsername(), recipient.getUsername());

        return callMapper.toResponse(session);
    }

    @Override
    @Transactional
    public CallSessionResponse answerCall(UUID userId, UUID callId) {
        CallSession session = callSessionRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException(CallConstants.ERR_CALL_NOT_FOUND));

        if (!session.getRecipient().getId().equals(userId)) {
            throw new UnauthorizedException("Only the recipient can answer this call");
        }

        if (session.getStatus() != CallStatus.RINGING) {
            log.warn("Cannot answer call {} with status {}", callId, session.getStatus());
            return callMapper.toResponse(session);
        }

        session.setStatus(CallStatus.CONNECTED);
        session.setConnectedAt(LocalDateTime.now());
        session = callSessionRepository.save(session);

        // Notify caller that call is accepted
        sendCallEvent(session.getCaller().getId(), CallEventMessage.builder()
                .eventType(CallConstants.EVENT_CALL_ACCEPTED)
                .callId(session.getId())
                .conversationId(session.getConversationId())
                .caller(userMapper.toUserSummaryResponse(session.getCaller()))
                .recipient(userMapper.toUserSummaryResponse(session.getRecipient()))
                .callType(session.getCallType())
                .build());

        log.info("Call connected: ID={}", session.getId());
        return callMapper.toResponse(session);
    }

    @Override
    @Transactional
    public CallSessionResponse rejectCall(UUID userId, UUID callId) {
        CallSession session = callSessionRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException(CallConstants.ERR_CALL_NOT_FOUND));

        boolean isCaller = session.getCaller().getId().equals(userId);
        boolean isRecipient = session.getRecipient().getId().equals(userId);

        if (!isCaller && !isRecipient) {
            throw new UnauthorizedException(CallConstants.ERR_UNAUTHORIZED_CALL);
        }

        if (session.getStatus() == CallStatus.ENDED || session.getStatus() == CallStatus.REJECTED) {
            return callMapper.toResponse(session);
        }

        session.setStatus(isRecipient ? CallStatus.REJECTED : CallStatus.MISSED);
        session.setEndedAt(LocalDateTime.now());
        session.setDurationSeconds(0);
        session = callSessionRepository.save(session);

        // Record call in chat thread
        recordCallInChat(session);

        // Notify other party
        UUID notifyTarget = isCaller ? session.getRecipient().getId() : session.getCaller().getId();
        sendCallEvent(notifyTarget, CallEventMessage.builder()
                .eventType(CallConstants.EVENT_CALL_REJECTED)
                .callId(session.getId())
                .conversationId(session.getConversationId())
                .caller(userMapper.toUserSummaryResponse(session.getCaller()))
                .recipient(userMapper.toUserSummaryResponse(session.getRecipient()))
                .callType(session.getCallType())
                .reason(isRecipient ? "Call declined" : "Call cancelled by caller")
                .build());

        log.info("Call rejected/cancelled: ID={}, by={}", session.getId(), userId);
        return callMapper.toResponse(session);
    }

    @Override
    @Transactional
    public CallSessionResponse endCall(UUID userId, UUID callId) {
        CallSession session = callSessionRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException(CallConstants.ERR_CALL_NOT_FOUND));

        boolean isCaller = session.getCaller().getId().equals(userId);
        boolean isRecipient = session.getRecipient().getId().equals(userId);

        if (!isCaller && !isRecipient) {
            throw new UnauthorizedException(CallConstants.ERR_UNAUTHORIZED_CALL);
        }

        if (session.getStatus() == CallStatus.ENDED || session.getStatus() == CallStatus.MISSED) {
            return callMapper.toResponse(session);
        }

        LocalDateTime now = LocalDateTime.now();
        if (session.getConnectedAt() != null) {
            session.setStatus(CallStatus.ENDED);
            long seconds = Duration.between(session.getConnectedAt(), now).getSeconds();
            session.setDurationSeconds((int) Math.max(0, seconds));
        } else {
            session.setStatus(CallStatus.MISSED);
            session.setDurationSeconds(0);
        }
        session.setEndedAt(now);
        session = callSessionRepository.save(session);

        // Record call in chat thread
        recordCallInChat(session);

        CallEventMessage endEvent = CallEventMessage.builder()
                .eventType(CallConstants.EVENT_CALL_ENDED)
                .callId(session.getId())
                .conversationId(session.getConversationId())
                .caller(userMapper.toUserSummaryResponse(session.getCaller()))
                .recipient(userMapper.toUserSummaryResponse(session.getRecipient()))
                .callType(session.getCallType())
                .durationSeconds(session.getDurationSeconds())
                .build();

        // Broadcast to both parties so UI resets immediately
        sendCallEvent(session.getCaller().getId(), endEvent);
        sendCallEvent(session.getRecipient().getId(), endEvent);

        log.info("Call ended: ID={}, Duration={}s", session.getId(), session.getDurationSeconds());
        return callMapper.toResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public void relaySignal(UUID senderId, CallSignalRequest signalRequest) {
        CallSession session = callSessionRepository.findById(signalRequest.getCallId())
                .orElseThrow(() -> new ResourceNotFoundException(CallConstants.ERR_CALL_NOT_FOUND));

        boolean isCaller = session.getCaller().getId().equals(senderId);
        boolean isRecipient = session.getRecipient().getId().equals(senderId);

        if (!isCaller && !isRecipient) {
            throw new UnauthorizedException(CallConstants.ERR_UNAUTHORIZED_CALL);
        }

        UserSummaryResponse callerSummary = UserSummaryResponse.builder()
                .id(session.getCaller().getId())
                .username(session.getCaller().getUsername())
                .displayName(session.getCaller().getUsername())
                .build();

        UserSummaryResponse recipientSummary = UserSummaryResponse.builder()
                .id(session.getRecipient().getId())
                .username(session.getRecipient().getUsername())
                .displayName(session.getRecipient().getUsername())
                .build();

        try {
            if (session.getCaller().getProfile() != null) {
                callerSummary.setDisplayName(session.getCaller().getProfile().getDisplayName());
                callerSummary.setAvatarUrl(session.getCaller().getProfile().getAvatarUrl());
            }
            if (session.getRecipient().getProfile() != null) {
                recipientSummary.setDisplayName(session.getRecipient().getProfile().getDisplayName());
                recipientSummary.setAvatarUrl(session.getRecipient().getProfile().getAvatarUrl());
            }
        } catch (Exception ex) {
            log.debug("Proxy profile resolution bypassed during signal relay: {}", ex.getMessage());
        }

        log.info("Relaying call signal: type={} for callId={} from={} to={}",
                signalRequest.getSignalType(), session.getId(), senderId, signalRequest.getRecipientId());

        // Relay signaling packet to recipient's private call topic
        sendCallEvent(signalRequest.getRecipientId(), CallEventMessage.builder()
                .eventType(CallConstants.EVENT_SIGNAL)
                .callId(session.getId())
                .conversationId(session.getConversationId())
                .caller(callerSummary)
                .recipient(recipientSummary)
                .callType(session.getCallType())
                .signalType(signalRequest.getSignalType())
                .signalData(signalRequest.getData())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CallSessionResponse> getUserCallHistory(UUID userId, Pageable pageable) {
        return callSessionRepository.findAllUserCalls(userId, pageable)
                .map(callMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CallSessionResponse> getActiveCall(UUID userId) {
        LocalDateTime ringingThreshold = LocalDateTime.now().minusSeconds(60);
        List<CallSession> active = callSessionRepository.findActiveCallsByUserId(
                userId, List.of(CallStatus.RINGING, CallStatus.CONNECTED));
        
        return active.stream()
                .filter(c -> !(c.getStatus() == CallStatus.RINGING && c.getStartedAt() != null && c.getStartedAt().isBefore(ringingThreshold)))
                .findFirst()
                .map(callMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CallSessionResponse getCallById(UUID callId, UUID requestingUserId) {
        CallSession session = callSessionRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException(CallConstants.ERR_CALL_NOT_FOUND));

        boolean isCaller = session.getCaller().getId().equals(requestingUserId);
        boolean isRecipient = session.getRecipient().getId().equals(requestingUserId);

        if (!isCaller && !isRecipient) {
            throw new UnauthorizedException(CallConstants.ERR_UNAUTHORIZED_CALL);
        }

        return callMapper.toResponse(session);
    }

    private void recordCallInChat(CallSession session) {
        try {
            UUID conversationId = session.getConversationId();
            Conversation conversation = null;
            if (conversationId != null) {
                conversation = conversationRepository.findById(conversationId).orElse(null);
            }
            if (conversation == null) {
                // Find direct 1-to-1 conversation between caller and recipient
                conversation = conversationRepository.findDirectConversationBetweenUsers(
                        ConversationType.DIRECT, session.getCaller().getId(), session.getRecipient().getId())
                        .orElse(null);
            }

            if (conversation == null) {
                // Auto-create direct conversation so history is preserved
                conversation = Conversation.builder()
                        .type(ConversationType.DIRECT)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                conversation = conversationRepository.save(conversation);

                ConversationMember m1 = ConversationMember.builder()
                        .conversation(conversation)
                        .user(session.getCaller())
                        .role(ConversationRole.MEMBER)
                        .joinedAt(LocalDateTime.now())
                        .build();
                ConversationMember m2 = ConversationMember.builder()
                        .conversation(conversation)
                        .user(session.getRecipient())
                        .role(ConversationRole.MEMBER)
                        .joinedAt(LocalDateTime.now())
                        .build();
                conversationMemberRepository.saveAll(List.of(m1, m2));
            }

            session.setConversationId(conversation.getId());
            callSessionRepository.save(session);

            String callTypeLabel = session.getCallType() == CallType.VIDEO ? "Video call" : "Audio call";
            String content;
            int duration = session.getDurationSeconds() != null ? session.getDurationSeconds() : 0;

            if (session.getStatus() == CallStatus.ENDED) {
                if (duration > 0) {
                    int mins = duration / 60;
                    int secs = duration % 60;
                    String formattedDur = mins > 0 ? String.format("%d:%02d", mins, secs) : String.format("0:%02d", secs);
                    content = callTypeLabel + " · " + formattedDur;
                } else {
                    content = callTypeLabel + " ended";
                }
            } else if (session.getStatus() == CallStatus.REJECTED) {
                content = "Declined " + callTypeLabel.toLowerCase();
            } else if (session.getStatus() == CallStatus.BUSY) {
                content = "Missed " + callTypeLabel.toLowerCase() + " (Line busy)";
            } else {
                content = "Missed " + callTypeLabel.toLowerCase();
            }

            String mediaUrl = "call:" + session.getCallType().name() + ":" + session.getStatus().name() + ":" + duration;

            Message callMessage = Message.builder()
                    .conversation(conversation)
                    .sender(session.getCaller())
                    .content(content)
                    .messageType(MessageType.CALL)
                    .mediaUrl(mediaUrl)
                    .durationMs(duration * 1000)
                    .isViewOnce(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            Message savedMessage = messageRepository.saveAndFlush(callMessage);
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);

            // Construct MessageResponse for WebSocket broadcast
            User caller = session.getCaller();
            MessageResponse response = MessageResponse.builder()
                    .id(savedMessage.getId())
                    .conversationId(conversation.getId())
                    .sender(PostAuthorResponse.builder()
                            .id(caller.getId())
                            .username(caller.getUsername())
                            .displayName(caller.getProfile() != null ? caller.getProfile().getDisplayName() : null)
                            .avatarUrl(caller.getProfile() != null ? caller.getProfile().getAvatarUrl() : null)
                            .build())
                    .content(savedMessage.getContent())
                    .messageType(MessageType.CALL)
                    .mediaUrl(savedMessage.getMediaUrl())
                    .isDeleted(false)
                    .isViewOnce(false)
                    .isOpened(true)
                    .isEdited(false)
                    .isPinnedInChat(false)
                    .isForwarded(false)
                    .durationMs(savedMessage.getDurationMs())
                    .createdAt(savedMessage.getCreatedAt())
                    .build();

            // Broadcast to conversation topic
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversation.getId(), response);

            // Broadcast to both users' private message feeds
            messagingTemplate.convertAndSend("/topic/users/" + session.getCaller().getId() + "/messages", response);
            messagingTemplate.convertAndSend("/topic/users/" + session.getRecipient().getId() + "/messages", response);

            log.info("Recorded call in chat: conversation={}, messageId={}, content='{}'",
                    conversation.getId(), savedMessage.getId(), content);
        } catch (Exception ex) {
            log.error("Failed to record call in chat conversation", ex);
        }
    }

    private void sendCallEvent(UUID userId, CallEventMessage message) {
        String destination = CallConstants.CALL_TOPIC_PREFIX + userId + CallConstants.CALL_TOPIC_SUFFIX;
        messagingTemplate.convertAndSend(destination, message);
    }
}
