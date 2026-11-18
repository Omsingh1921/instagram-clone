package com.instagramclone.chat.service.impl;

import com.instagramclone.chat.constants.ChatConstants;
import com.instagramclone.chat.dto.request.AddGroupMembersRequest;
import com.instagramclone.chat.dto.request.AddMessageReactionRequest;
import com.instagramclone.chat.dto.request.CreateGroupConversationRequest;
import com.instagramclone.chat.dto.request.EditMessageRequest;
import com.instagramclone.chat.dto.request.ForwardMessageRequest;
import com.instagramclone.chat.dto.request.SendMessageRequest;
import com.instagramclone.chat.dto.request.UpdateChatThemeRequest;
import com.instagramclone.chat.dto.request.UpdateFolderRequest;
import com.instagramclone.chat.dto.request.UpdateGroupConversationRequest;
import com.instagramclone.chat.dto.response.ConversationResponse;
import com.instagramclone.chat.dto.response.MessageReactionResponse;
import com.instagramclone.chat.dto.response.MessageReplySummaryResponse;
import com.instagramclone.chat.dto.response.MessageResponse;
import com.instagramclone.chat.entity.Conversation;
import com.instagramclone.chat.entity.ConversationMember;
import com.instagramclone.chat.entity.Message;
import com.instagramclone.chat.entity.MessageReaction;
import com.instagramclone.chat.enums.ConversationRole;
import com.instagramclone.chat.enums.ConversationType;
import com.instagramclone.chat.enums.InboxFolder;
import com.instagramclone.chat.enums.MessageType;
import com.instagramclone.chat.repository.ConversationMemberRepository;
import com.instagramclone.chat.repository.ConversationRepository;
import com.instagramclone.chat.repository.MessageReactionRepository;
import com.instagramclone.chat.repository.MessageRepository;
import com.instagramclone.chat.service.interfaces.IChatService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.exception.ForbiddenException;
import com.instagramclone.common.exception.ResourceNotFoundException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.common.util.SecurityUtils;
import com.instagramclone.follow.repository.FollowRepository;
import com.instagramclone.post.dto.response.PostAuthorResponse;
import com.instagramclone.user.dto.response.UserSummaryResponse;
import com.instagramclone.user.entity.User;
import com.instagramclone.user.repository.UserBlockRepository;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.device.service.interfaces.IFcmPushService;
import com.instagramclone.media.service.interfaces.IMediaUrlService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements IChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final MessageRepository messageRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final FollowRepository followRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final IFcmPushService fcmPushService;
    private final IMediaUrlService mediaUrlService;

    @Override
    @Transactional
    public ConversationResponse getOrCreateDirectConversation(UUID recipientId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        if (currentUserId.equals(recipientId)) {
            throw new BadRequestException(ChatConstants.ERR_CANNOT_CHAT_SELF);
        }

        if (userBlockRepository.existsByBlockerIdAndBlockedId(recipientId, currentUserId)) {
            throw new BadRequestException(ChatConstants.ERR_CANNOT_CHAT_USER);
        }
        if (userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, recipientId)) {
            throw new BadRequestException(ChatConstants.ERR_BLOCKED_USER);
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_RECIPIENT_NOT_FOUND + recipientId));
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_CURRENT_USER_NOT_FOUND));

        Optional<Conversation> existing = conversationRepository.findDirectConversationBetweenUsers(
                ConversationType.DIRECT, currentUserId, recipientId);

        if (existing.isPresent()) {
            return toConversationResponse(existing.get(), currentUserId);
        }

        // Create new direct conversation
        Conversation conversation = Conversation.builder()
                .type(ConversationType.DIRECT)
                .build();
        Conversation savedConversation = conversationRepository.save(conversation);

        // Routing: If recipient does NOT follow sender, put conversation into REQUESTS
        // folder for recipient
        boolean recipientFollowsSender = followRepository.existsByFollowerIdAndFollowingId(recipientId, currentUserId);
        InboxFolder recipientFolder = recipientFollowsSender ? InboxFolder.PRIMARY : InboxFolder.REQUESTS;

        ConversationMember m1 = ConversationMember.builder()
                .conversation(savedConversation)
                .user(currentUser)
                .role(ConversationRole.MEMBER)
                .folder(InboxFolder.PRIMARY)
                .build();

        ConversationMember m2 = ConversationMember.builder()
                .conversation(savedConversation)
                .user(recipient)
                .role(ConversationRole.MEMBER)
                .folder(recipientFolder)
                .build();

        conversationMemberRepository.save(m1);
        conversationMemberRepository.save(m2);

        return toConversationResponse(savedConversation, currentUserId);
    }

    @Override
    @Transactional
    public ConversationResponse createGroupConversation(CreateGroupConversationRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_CURRENT_USER_NOT_FOUND));

        List<UUID> validMemberIds = request.getMemberIds().stream()
                .filter(id -> id != null && !id.equals(currentUserId))
                .distinct()
                .toList();

        if (validMemberIds.isEmpty()) {
            throw new BadRequestException(ChatConstants.VALIDATION_GROUP_MEMBERS_REQUIRED);
        }

        for (UUID memberId : validMemberIds) {
            if (userBlockRepository.existsByBlockerIdAndBlockedId(memberId, currentUserId) ||
                    userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, memberId)) {
                throw new BadRequestException("Cannot create group with a blocked user: " + memberId);
            }
        }

        Conversation conversation = Conversation.builder()
                .type(ConversationType.GROUP)
                .name(request.getName().trim())
                .avatarUrl(request.getAvatarUrl() != null ? request.getAvatarUrl().trim() : null)
                .creator(currentUser)
                .build();
        Conversation savedConversation = conversationRepository.save(conversation);

        ConversationMember adminMember = ConversationMember.builder()
                .conversation(savedConversation)
                .user(currentUser)
                .role(ConversationRole.ADMIN)
                .folder(InboxFolder.PRIMARY)
                .build();
        conversationMemberRepository.save(adminMember);

        for (UUID memberId : validMemberIds) {
            User memberUser = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + memberId));
            ConversationMember member = ConversationMember.builder()
                    .conversation(savedConversation)
                    .user(memberUser)
                    .role(ConversationRole.MEMBER)
                    .folder(InboxFolder.REQUESTS)
                    .build();
            conversationMemberRepository.save(member);
        }

        return toConversationResponse(savedConversation, currentUserId);
    }

    @Override
    @Transactional
    public ConversationResponse updateGroupConversation(UUID conversationId, UpdateGroupConversationRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException(ChatConstants.ERR_NOT_GROUP);
        }

        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT));

        if (member.getRole() != ConversationRole.ADMIN) {
            throw new ForbiddenException(ChatConstants.ERR_ONLY_GROUP_ADMIN);
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            conversation.setName(request.getName().trim());
        }
        if (request.getAvatarUrl() != null) {
            conversation.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }

        conversation.setUpdatedAt(LocalDateTime.now());
        Conversation updated = conversationRepository.save(conversation);

        ConversationResponse response = toConversationResponse(updated, currentUserId);
        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, Map.of(
                    "eventType", "GROUP_UPDATED",
                    "conversationId", conversationId,
                    "name", updated.getName(),
                    "avatarUrl", updated.getAvatarUrl() != null ? updated.getAvatarUrl() : ""));
        } catch (Exception ex) {
            log.error("Failed to broadcast group update", ex);
        }

        return response;
    }

    @Override
    @Transactional
    public ConversationResponse addGroupMembers(UUID conversationId, AddGroupMembersRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException(ChatConstants.ERR_NOT_GROUP);
        }

        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        List<UUID> toAdd = request.getMemberIds().stream()
                .filter(id -> id != null
                        && !conversationMemberRepository.existsByConversationIdAndUserId(conversationId, id))
                .distinct()
                .toList();

        for (UUID newMemberId : toAdd) {
            if (userBlockRepository.existsByBlockerIdAndBlockedId(newMemberId, currentUserId) ||
                    userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, newMemberId)) {
                continue;
            }
            User newMemberUser = userRepository.findById(newMemberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + newMemberId));

            ConversationMember cm = ConversationMember.builder()
                    .conversation(conversation)
                    .user(newMemberUser)
                    .role(ConversationRole.MEMBER)
                    .folder(InboxFolder.REQUESTS)
                    .build();
            conversationMemberRepository.save(cm);
        }

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        ConversationResponse response = toConversationResponse(conversation, currentUserId);
        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, Map.of(
                    "eventType", "MEMBERS_ADDED",
                    "conversationId", conversationId,
                    "addedCount", toAdd.size()));
        } catch (Exception ex) {
            log.error("Failed to broadcast members added", ex);
        }

        return response;
    }

    @Override
    @Transactional
    public void removeGroupMember(UUID conversationId, UUID memberId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException(ChatConstants.ERR_NOT_GROUP);
        }

        ConversationMember requester = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT));

        if (requester.getRole() != ConversationRole.ADMIN && !currentUserId.equals(memberId)) {
            throw new ForbiddenException(ChatConstants.ERR_ONLY_GROUP_ADMIN);
        }

        ConversationMember targetMember = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));

        conversationMemberRepository.delete(targetMember);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, Map.of(
                    "eventType", "MEMBER_REMOVED",
                    "conversationId", conversationId,
                    "memberId", memberId));
        } catch (Exception ex) {
            log.error("Failed to broadcast member removed", ex);
        }
    }

    @Override
    @Transactional
    public void leaveGroup(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        removeGroupMember(conversationId, currentUserId);
    }

    @Override
    @Transactional
    public void deleteConversation(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        conversationMemberRepository.deleteByConversationIdAndUserId(conversationId, currentUserId);

        long remainingMembers = conversationMemberRepository.countByConversationId(conversationId);
        if (remainingMembers == 0) {
            conversationRepository.delete(conversation);
        }

        log.info("User {} deleted conversation {}", currentUserId, conversationId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getConversations(Pageable pageable) {
        return getConversations(null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> getConversations(InboxFolder folder, Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Pageable sortSafe = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Conversation> page;
        if (folder != null) {
            page = conversationRepository.findConversationsByUserIdAndFolder(currentUserId, folder, sortSafe);
        } else {
            page = conversationRepository.findActiveConversationsByUserId(currentUserId, sortSafe);
        }
        return PageResponse.from(page.map(c -> toConversationResponse(c, currentUserId)));
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        return toConversationResponse(conversation, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> getMessages(UUID conversationId, Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);
        return PageResponse.from(messages.map(this::toMessageResponse));
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(UUID conversationId, SendMessageRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        ConversationMember senderMember = conversationMemberRepository.findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_UNAUTHORIZED_SEND));

        if (conversation.getType() == ConversationType.GROUP && senderMember.getFolder() == InboxFolder.REQUESTS) {
            throw new ForbiddenException("You must accept the group invitation before sending messages");
        }

        if (conversation.getType() == ConversationType.DIRECT) {
            List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversationId);
            for (ConversationMember member : members) {
                UUID memberId = member.getUser().getId();
                if (!memberId.equals(currentUserId)) {
                    if (userBlockRepository.existsByBlockerIdAndBlockedId(memberId, currentUserId) ||
                            userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, memberId)) {
                        throw new ForbiddenException(ChatConstants.ERR_BLOCKED_CONVERSATION);
                    }
                }
            }
        }

        boolean hasContent = request.getContent() != null && !request.getContent().trim().isEmpty();
        boolean hasMedia = request.getMediaUrl() != null && !request.getMediaUrl().trim().isEmpty();

        if (!hasContent && !hasMedia) {
            throw new BadRequestException(ChatConstants.ERR_EMPTY_MESSAGE);
        }

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_SENDER_NOT_FOUND));

        Message replyToMessage = null;
        if (request.getReplyToMessageId() != null) {
            replyToMessage = messageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_REPLY_MESSAGE_NOT_FOUND));
            if (!replyToMessage.getConversation().getId().equals(conversationId)) {
                throw new BadRequestException(ChatConstants.ERR_REPLY_MESSAGE_NOT_FOUND);
            }
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(hasContent ? request.getContent().trim() : null)
                .messageType(request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT)
                .mediaUrl(hasMedia ? request.getMediaUrl().trim() : null)
                .isViewOnce(Boolean.TRUE.equals(request.getIsViewOnce()))
                .replyToMessage(replyToMessage)
                .durationMs(request.getDurationMs())
                .waveform(request.getWaveform())
                .createdAt(LocalDateTime.now())
                .build();

        Message savedMessage = messageRepository.saveAndFlush(message);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageResponse response = toMessageResponse(savedMessage);

        try {
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversationId, response);
            log.info("Broadcasted message {} to /topic/conversations/{}", savedMessage.getId(), conversationId);

            // Broadcast to private inbox channels & auto-promote REQUESTS -> PRIMARY when replying
            List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversationId);
            List<UUID> recipientIds = new java.util.ArrayList<>();
            for (ConversationMember cm : members) {
                if (cm.getUser() != null && cm.getUser().getId() != null) {
                    if (conversation.getType() == ConversationType.DIRECT && cm.getUser().getId().equals(currentUserId) && cm.getFolder() == InboxFolder.REQUESTS) {
                        cm.setFolder(InboxFolder.PRIMARY);
                        conversationMemberRepository.save(cm);
                    }
                    messagingTemplate.convertAndSend("/topic/users/" + cm.getUser().getId() + "/messages", response);
                    if (!cm.getUser().getId().equals(currentUserId)) {
                        recipientIds.add(cm.getUser().getId());
                    }
                }
            }

            // Dispatch FCM background push notification
            if (fcmPushService != null && !recipientIds.isEmpty()) {
                String pushTitle = (sender != null && sender.getUsername() != null) ? sender.getUsername()
                        : "New message";
                String pushBody = getPushBodyForMessage(savedMessage);
                java.util.Map<String, String> data = new java.util.HashMap<>();
                data.put("type", "CHAT_MESSAGE");
                data.put("conversationId", conversationId.toString());
                data.put("messageId", savedMessage.getId().toString());
                if (sender != null && sender.getProfile() != null && sender.getProfile().getAvatarUrl() != null) {
                    data.put("avatarUrl", sender.getProfile().getAvatarUrl());
                }
                fcmPushService.sendPushToUsers(recipientIds, pushTitle, pushBody, data);
            }
        } catch (Exception ex) {
            log.error("Failed to broadcast WebSocket or FCM message", ex);
        }

        return response;
    }

    @Override
    @Transactional
    public MessageResponse editMessage(UUID conversationId, UUID messageId, EditMessageRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_MESSAGE_NOT_FOUND + messageId));

        if (!message.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Message does not belong to this conversation");
        }

        if (!message.getSender().getId().equals(currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_MESSAGE_SENDER_EDIT);
        }

        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            throw new BadRequestException(ChatConstants.ERR_MESSAGE_DELETED);
        }

        if (message.getMessageType() != MessageType.TEXT) {
            throw new BadRequestException(ChatConstants.ERR_EDIT_NON_TEXT);
        }

        LocalDateTime createdAt = message.getCreatedAt() != null ? message.getCreatedAt() : LocalDateTime.now();
        if (Duration.between(createdAt, LocalDateTime.now()).toMinutes() > ChatConstants.MAX_EDIT_WINDOW_MINUTES) {
            throw new BadRequestException(ChatConstants.ERR_EDIT_WINDOW_EXPIRED);
        }

        message.setContent(request.getContent().trim());
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());
        Message saved = messageRepository.save(message);

        MessageResponse response = toMessageResponse(saved);
        try {
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversationId, Map.of(
                    "eventType", "MESSAGE_EDITED",
                    "conversationId", conversationId,
                    "messageId", messageId,
                    "message", response));
        } catch (Exception ex) {
            log.error("Failed to broadcast message edit", ex);
        }

        return response;
    }

    @Override
    @Transactional
    public void unsendMessage(UUID conversationId, UUID messageId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_MESSAGE_NOT_FOUND + messageId));

        if (!message.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Message does not belong to this conversation");
        }

        if (!message.getSender().getId().equals(currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_MESSAGE_SENDER);
        }

        message.softDelete();
        messageReactionRepository.deleteByMessageId(messageId);
        messageRepository.save(message);

        try {
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversationId, Map.of(
                    "eventType", "MESSAGE_DELETED",
                    "conversationId", conversationId,
                    "messageId", messageId));
        } catch (Exception ex) {
            log.error("Failed to broadcast message unsend", ex);
        }
    }

    @Override
    @Transactional
    public MessageReactionResponse reactToMessage(UUID conversationId, UUID messageId,
            AddMessageReactionRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_MESSAGE_NOT_FOUND + messageId));

        if (!message.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Message does not belong to this conversation");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_CURRENT_USER_NOT_FOUND));

        Optional<MessageReaction> existingReaction = messageReactionRepository.findByMessageIdAndUserId(messageId,
                currentUserId);
        MessageReaction saved;
        if (existingReaction.isPresent()) {
            MessageReaction r = existingReaction.get();
            r.setEmoji(request.getEmoji().trim());
            saved = messageReactionRepository.save(r);
        } else {
            MessageReaction r = MessageReaction.builder()
                    .message(message)
                    .user(currentUser)
                    .emoji(request.getEmoji().trim())
                    .build();
            saved = messageReactionRepository.save(r);
        }

        MessageReactionResponse response = MessageReactionResponse.builder()
                .userId(currentUser.getId())
                .username(currentUser.getUsername())
                .displayName(currentUser.getProfile() != null ? currentUser.getProfile().getDisplayName() : null)
                .emoji(saved.getEmoji())
                .createdAt(saved.getCreatedAt())
                .build();

        try {
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversationId, Map.of(
                    "eventType", "MESSAGE_REACTION",
                    "conversationId", conversationId,
                    "messageId", messageId,
                    "userId", currentUserId,
                    "emoji", saved.getEmoji()));
        } catch (Exception ex) {
            log.error("Failed to broadcast reaction", ex);
        }

        return response;
    }

    @Override
    @Transactional
    public void removeReaction(UUID conversationId, UUID messageId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        messageReactionRepository.deleteByMessageIdAndUserId(messageId, currentUserId);

        try {
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversationId, Map.of(
                    "eventType", "MESSAGE_REACTION_REMOVED",
                    "conversationId", conversationId,
                    "messageId", messageId,
                    "userId", currentUserId));
        } catch (Exception ex) {
            log.error("Failed to broadcast reaction removed", ex);
        }
    }

    @Override
    @Transactional
    public void markConversationAsRead(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_NOT_MEMBER));

        LocalDateTime readTime = LocalDateTime.now();
        member.setLastReadAt(readTime);
        conversationMemberRepository.save(member);
        log.info("User {} marked conversation {} as read", currentUserId, conversationId);

        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, Map.of(
                    "eventType", "READ_RECEIPT",
                    "conversationId", conversationId,
                    "userId", currentUserId,
                    "readAt", readTime.toString()));
        } catch (Exception ex) {
            log.error("Failed to broadcast read receipt", ex);
        }
    }

    @Override
    @Transactional
    public MessageResponse openViewOnceMessage(UUID conversationId, UUID messageId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        if (!Boolean.TRUE.equals(message.getIsViewOnce())) {
            throw new BadRequestException(ChatConstants.ERR_NOT_VIEW_ONCE);
        }

        if (message.getViewedAt() == null) {
            message.setViewedAt(LocalDateTime.now());
            message = messageRepository.saveAndFlush(message);

            MessageResponse response = toMessageResponse(message);
            try {
                messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
                log.info("Broadcasted view-once opened status for message {} in conversation {}", messageId,
                        conversationId);
            } catch (Exception ex) {
                log.error("Failed to broadcast view-once opened receipt", ex);
            }
            return response;
        }

        return toMessageResponse(message);
    }

    @Override
    @Transactional
    public ConversationResponse togglePinConversation(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_NOT_MEMBER));

        boolean newPinned = !Boolean.TRUE.equals(member.getIsPinned());
        if (newPinned) {
            long pinnedCount = conversationMemberRepository.countByUserIdAndIsPinnedTrue(currentUserId);
            if (pinnedCount >= ChatConstants.MAX_PINNED_CONVERSATIONS) {
                throw new BadRequestException(ChatConstants.ERR_MAX_PINNED_CONVERSATIONS);
            }
        }

        member.setIsPinned(newPinned);
        conversationMemberRepository.save(member);

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        return toConversationResponse(conv, currentUserId);
    }

    @Override
    @Transactional
    public MessageResponse togglePinMessageInChat(UUID conversationId, UUID messageId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_MESSAGE_NOT_FOUND + messageId));

        if (!message.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Message does not belong to this conversation");
        }

        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            throw new BadRequestException(ChatConstants.ERR_MESSAGE_DELETED);
        }

        boolean willPin = !Boolean.TRUE.equals(message.getIsPinnedInChat());
        if (willPin) {
            long currentPinned = messageRepository
                    .countByConversationIdAndIsPinnedInChatTrueAndIsDeletedFalse(conversationId);
            if (currentPinned >= ChatConstants.MAX_PINNED_MESSAGES_IN_CHAT) {
                throw new BadRequestException(ChatConstants.ERR_PIN_LIMIT_REACHED);
            }
            message.setIsPinnedInChat(true);
            message.setPinnedAt(LocalDateTime.now());
        } else {
            message.setIsPinnedInChat(false);
            message.setPinnedAt(null);
        }

        Message saved = messageRepository.save(message);
        MessageResponse response = toMessageResponse(saved);

        try {
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversationId, Map.of(
                    "eventType", willPin ? "MESSAGE_PINNED" : "MESSAGE_UNPINNED",
                    "conversationId", conversationId,
                    "messageId", messageId,
                    "isPinnedInChat", willPin));
        } catch (Exception ex) {
            log.error("Failed to broadcast pin toggle", ex);
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getPinnedMessagesInChat(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        List<Message> pinned = messageRepository
                .findByConversationIdAndIsPinnedInChatTrueAndIsDeletedFalseOrderByPinnedAtDesc(conversationId);
        return pinned.stream().map(this::toMessageResponse).toList();
    }

    @Override
    @Transactional
    public List<MessageResponse> forwardMessage(UUID conversationId, UUID messageId, ForwardMessageRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Message originalMessage = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_MESSAGE_NOT_FOUND + messageId));

        if (!originalMessage.getConversation().getId().equals(conversationId)) {
            throw new BadRequestException("Message does not belong to source conversation");
        }

        if (Boolean.TRUE.equals(originalMessage.getIsDeleted())) {
            throw new BadRequestException(ChatConstants.ERR_MESSAGE_DELETED);
        }

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ChatConstants.ERR_SENDER_NOT_FOUND));

        List<MessageResponse> forwardedResponses = new ArrayList<>();

        for (UUID targetConvId : request.getTargetConversationIds()) {
            if (!conversationMemberRepository.existsByConversationIdAndUserId(targetConvId, currentUserId)) {
                continue;
            }

            Conversation targetConv = conversationRepository.findById(targetConvId).orElse(null);
            if (targetConv == null) {
                continue;
            }

            if (targetConv.getType() == ConversationType.DIRECT) {
                List<ConversationMember> members = conversationMemberRepository.findByConversationId(targetConvId);
                boolean blocked = false;
                for (ConversationMember member : members) {
                    UUID memberId = member.getUser().getId();
                    if (!memberId.equals(currentUserId)) {
                        if (userBlockRepository.existsByBlockerIdAndBlockedId(memberId, currentUserId) ||
                                userBlockRepository.existsByBlockerIdAndBlockedId(currentUserId, memberId)) {
                            blocked = true;
                            break;
                        }
                    }
                }
                if (blocked) {
                    continue;
                }
            }

            Message forwardedMsg = Message.builder()
                    .conversation(targetConv)
                    .sender(sender)
                    .content(originalMessage.getContent())
                    .messageType(originalMessage.getMessageType())
                    .mediaUrl(originalMessage.getMediaUrl())
                    .durationMs(originalMessage.getDurationMs())
                    .waveform(originalMessage.getWaveform())
                    .isForwarded(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            Message saved = messageRepository.save(forwardedMsg);
            targetConv.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(targetConv);

            MessageResponse response = toMessageResponse(saved);
            forwardedResponses.add(response);

            try {
                messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + targetConvId, response);
                List<ConversationMember> members = conversationMemberRepository.findByConversationId(targetConvId);
                for (ConversationMember cm : members) {
                    if (cm.getUser() != null && cm.getUser().getId() != null) {
                        messagingTemplate.convertAndSend("/topic/users/" + cm.getUser().getId() + "/messages",
                                response);
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to broadcast forwarded message", ex);
            }
        }

        return forwardedResponses;
    }

    @Override
    @Transactional
    public void updateConversationFolder(UUID conversationId, UpdateFolderRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_NOT_MEMBER));

        member.setFolder(request.getFolder());
        conversationMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void acceptMessageRequest(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_NOT_MEMBER));

        member.setFolder(InboxFolder.PRIMARY);
        conversationMemberRepository.save(member);

        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, Map.of(
                    "eventType", "MEMBER_ACCEPTED_INVITE",
                    "conversationId", conversationId,
                    "userId", currentUserId
            ));
        } catch (Exception ex) {
            log.error("Failed to broadcast member accepted invite", ex);
        }
    }

    @Override
    @Transactional
    public void declineMessageRequest(UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ConversationMember member = conversationMemberRepository
                .findByConversationIdAndUserId(conversationId, currentUserId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_NOT_MEMBER));

        conversationMemberRepository.delete(member);

        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, Map.of(
                    "eventType", "MEMBER_DECLINED_INVITE",
                    "conversationId", conversationId,
                    "userId", currentUserId
            ));
        } catch (Exception ex) {
            log.error("Failed to broadcast member declined invite", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getPendingRequestsCount() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        return conversationMemberRepository.countByUserIdAndFolder(currentUserId, InboxFolder.REQUESTS);
    }

    @Override
    @Transactional
    public ConversationResponse updateConversationTheme(UUID conversationId, UpdateChatThemeRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, currentUserId)) {
            throw new ForbiddenException(ChatConstants.ERR_NOT_PARTICIPANT);
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(ChatConstants.ERR_CONVERSATION_NOT_FOUND + conversationId));

        conversation.setTheme(request.getTheme().trim().toUpperCase());
        conversation.setUpdatedAt(LocalDateTime.now());
        Conversation saved = conversationRepository.save(conversation);

        ConversationResponse response = toConversationResponse(saved, currentUserId);
        try {
            messagingTemplate.convertAndSend(ChatConstants.WEBSOCKET_TOPIC_CONVER + conversationId, Map.of(
                    "eventType", "CHAT_THEME_CHANGED",
                    "conversationId", conversationId,
                    "theme", saved.getTheme()));
        } catch (Exception ex) {
            log.error("Failed to broadcast theme change", ex);
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public void validateTypingPermission(UUID conversationId, UUID userId) {
        if (conversationId == null || userId == null) {
            throw new BadRequestException(ChatConstants.ERR_CONVERSATION_AND_USER_ID_NULL);
        }

        if (!conversationMemberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new ForbiddenException(ChatConstants.ERR_UNAUTHORIZED_TYPING);
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ForbiddenException(ChatConstants.ERR_UNAUTHORIZED_TYPING));

        if (conversation.getType() == ConversationType.DIRECT) {
            List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversationId);
            for (ConversationMember member : members) {
                UUID memberId = member.getUser().getId();
                if (!memberId.equals(userId)) {
                    if (userBlockRepository.existsByBlockerIdAndBlockedId(memberId, userId) ||
                            userBlockRepository.existsByBlockerIdAndBlockedId(userId, memberId)) {
                        throw new ForbiddenException(ChatConstants.ERR_BLOCKED_TYPING);
                    }
                }
            }
        }
    }

    private ConversationResponse toConversationResponse(Conversation c, UUID currentUserId) {
        List<UserSummaryResponse> members = new ArrayList<>();
        LocalDateTime lastReadAt = null;
        boolean isPinned = false;
        InboxFolder userFolder = InboxFolder.PRIMARY;

        List<ConversationMember> memberList = conversationMemberRepository.findByConversationId(c.getId());
        for (ConversationMember cm : memberList) {
            User u = cm.getUser();
            members.add(UserSummaryResponse.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .displayName(u.getProfile() != null ? u.getProfile().getDisplayName() : null)
                    .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                    .build());

            if (u.getId().equals(currentUserId)) {
                lastReadAt = cm.getLastReadAt();
                isPinned = Boolean.TRUE.equals(cm.getIsPinned());
                userFolder = cm.getFolder() != null ? cm.getFolder() : InboxFolder.PRIMARY;
            }
        }

        MessageResponse lastMessage = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(c.getId())
                .map(this::toMessageResponse)
                .orElse(null);

        long unreadCount = 0;
        if (lastReadAt != null) {
            unreadCount = messageRepository.countByConversationIdAndCreatedAtAfter(c.getId(), lastReadAt);
        } else if (lastMessage != null) {
            unreadCount = messageRepository.countByConversationIdAndCreatedAtAfter(c.getId(), c.getCreatedAt());
        }

        return ConversationResponse.builder()
                .id(c.getId())
                .type(c.getType())
                .name(c.getName())
                .avatarUrl(c.getAvatarUrl())
                .theme(c.getTheme() != null ? c.getTheme() : "DEFAULT")
                .folder(userFolder)
                .creatorId(c.getCreator() != null ? c.getCreator().getId() : null)
                .members(members)
                .lastMessage(lastMessage)
                .unreadCount(unreadCount)
                .isPinned(isPinned)
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private MessageResponse toMessageResponse(Message m) {
        User s = m.getSender();
        List<MessageReaction> reactions = messageReactionRepository.findByMessageId(m.getId());
        List<MessageReactionResponse> reactionResponses = reactions.stream()
                .map(r -> MessageReactionResponse.builder()
                        .userId(r.getUser().getId())
                        .username(r.getUser().getUsername())
                        .displayName(
                                r.getUser().getProfile() != null ? r.getUser().getProfile().getDisplayName() : null)
                        .emoji(r.getEmoji())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();

        boolean isDeleted = Boolean.TRUE.equals(m.getIsDeleted());
        boolean isViewOnce = Boolean.TRUE.equals(m.getIsViewOnce());
        boolean isOpened = isViewOnce && m.getViewedAt() != null;

        MessageReplySummaryResponse replySummary = null;
        if (m.getReplyToMessage() != null) {
            Message r = m.getReplyToMessage();
            boolean rDeleted = Boolean.TRUE.equals(r.getIsDeleted());
            String snippet;
            if (rDeleted) {
                snippet = "Original message was unsent";
            } else if (r.getContent() != null && !r.getContent().isBlank()) {
                snippet = r.getContent().length() > 100 ? r.getContent().substring(0, 97) + "..." : r.getContent();
            } else if (r.getMessageType() == MessageType.IMAGE) {
                snippet = "[Photo]";
            } else if (r.getMessageType() == MessageType.VIDEO) {
                snippet = "[Video]";
            } else if (r.getMessageType() == MessageType.AUDIO) {
                snippet = "[Voice note]";
            } else if (r.getMessageType() == MessageType.STORY_REPLY || r.getMessageType() == MessageType.STORY_SHARE) {
                snippet = "[Story reply] " + (r.getContent() != null ? r.getContent() : "");
            } else {
                snippet = "[Attachment]";
            }

            replySummary = MessageReplySummaryResponse.builder()
                    .messageId(r.getId())
                    .senderId(r.getSender() != null ? r.getSender().getId() : null)
                    .senderUsername(r.getSender() != null ? r.getSender().getUsername() : null)
                    .contentSnippet(snippet)
                    .messageType(r.getMessageType())
                    .mediaUrl(rDeleted ? null : mediaUrlService.maskUrl(r.getMediaUrl()))
                    .isDeleted(rDeleted)
                    .build();
        }

        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .sender(PostAuthorResponse.builder()
                        .id(s.getId())
                        .username(s.getUsername())
                        .displayName(s.getProfile() != null ? s.getProfile().getDisplayName() : null)
                        .avatarUrl(s.getProfile() != null ? mediaUrlService.maskUrl(s.getProfile().getAvatarUrl()) : null)
                        .build())
                .content(isDeleted ? "This message was unsent" : m.getContent())
                .messageType(m.getMessageType())
                .mediaUrl(isDeleted ? null : mediaUrlService.maskUrl(m.getMediaUrl()))
                .isDeleted(isDeleted)
                .isViewOnce(isViewOnce)
                .isOpened(isOpened)
                .replyTo(replySummary)
                .isEdited(Boolean.TRUE.equals(m.getIsEdited()))
                .editedAt(m.getEditedAt())
                .isPinnedInChat(Boolean.TRUE.equals(m.getIsPinnedInChat()))
                .pinnedAt(m.getPinnedAt())
                .isForwarded(Boolean.TRUE.equals(m.getIsForwarded()))
                .durationMs(m.getDurationMs())
                .waveform(m.getWaveform())
                .reactions(reactionResponses)
                .createdAt(m.getCreatedAt() != null ? m.getCreatedAt() : LocalDateTime.now())
                .build();
    }

    private String getPushBodyForMessage(Message msg) {
        if (msg == null)
            return "Sent a message";
        if (msg.getMessageType() == MessageType.IMAGE)
            return "Sent a photo";
        if (msg.getMessageType() == MessageType.VIDEO)
            return "Sent a video";
        if (msg.getMessageType() == MessageType.AUDIO)
            return "Sent a voice note";
        if (msg.getMessageType() == MessageType.POST_SHARE)
            return "Shared a post";
        if (msg.getMessageType() == MessageType.STORY_REPLY || msg.getMessageType() == MessageType.STORY_SHARE) {
            String c = msg.getContent() != null ? msg.getContent() : "";
            return "Replied to your story" + (c.isBlank() ? "" : ": " + (c.length() > 50 ? c.substring(0, 47) + "..." : c));
        }
        if (msg.getMessageType() == MessageType.CALL)
            return msg.getContent() != null ? msg.getContent() : "Call";
        if (msg.getContent() != null && !msg.getContent().isBlank()) {
            return msg.getContent().length() > 100 ? msg.getContent().substring(0, 97) + "..." : msg.getContent();
        }
        return "Sent a message";
    }
}
