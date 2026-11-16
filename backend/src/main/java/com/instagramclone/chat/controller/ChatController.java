package com.instagramclone.chat.controller;

import com.instagramclone.chat.constants.ChatConstants;
import com.instagramclone.chat.dto.request.AddGroupMembersRequest;
import com.instagramclone.chat.dto.request.AddMessageReactionRequest;
import com.instagramclone.chat.dto.request.CreateConversationRequest;
import com.instagramclone.chat.dto.request.CreateGroupConversationRequest;
import com.instagramclone.chat.dto.request.EditMessageRequest;
import com.instagramclone.chat.dto.request.ForwardMessageRequest;
import com.instagramclone.chat.dto.request.SendMessageRequest;
import com.instagramclone.chat.dto.request.UpdateChatThemeRequest;
import com.instagramclone.chat.dto.request.UpdateFolderRequest;
import com.instagramclone.chat.dto.request.UpdateGroupConversationRequest;
import com.instagramclone.chat.dto.response.ConversationResponse;
import com.instagramclone.chat.dto.response.MessageReactionResponse;
import com.instagramclone.chat.dto.response.MessageResponse;
import com.instagramclone.chat.enums.InboxFolder;
import com.instagramclone.chat.service.interfaces.IChatService;
import com.instagramclone.common.response.ApiResponse;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.ratelimit.RateLimit;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ChatConstants.BASE_PATH)
@RequiredArgsConstructor
public class ChatController {
    private final IChatService chatService;

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> getOrCreateConversation(
            @Valid @RequestBody CreateConversationRequest request) {
        ConversationResponse response = chatService.getOrCreateDirectConversation(request.getRecipientId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ChatConstants.MSG_CONVERSATION_READY, response));
    }

    @PostMapping(ChatConstants.CONVERSATION_GROUP_PATH)
    public ResponseEntity<ApiResponse<ConversationResponse>> createGroupConversation(
            @Valid @RequestBody CreateGroupConversationRequest request) {
        ConversationResponse response = chatService.createGroupConversation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ChatConstants.MSG_GROUP_CREATED, response));
    }

    @PutMapping(ChatConstants.CONVERSATION_GROUP_DETAILS_PATH)
    public ResponseEntity<ApiResponse<ConversationResponse>> updateGroupConversation(
            @PathVariable UUID conversationId,
            @Valid @RequestBody UpdateGroupConversationRequest request) {
        ConversationResponse response = chatService.updateGroupConversation(conversationId, request);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_GROUP_UPDATED, response));
    }

    @PostMapping(ChatConstants.CONVERSATION_MEMBERS_PATH)
    public ResponseEntity<ApiResponse<ConversationResponse>> addGroupMembers(
            @PathVariable UUID conversationId,
            @Valid @RequestBody AddGroupMembersRequest request) {
        ConversationResponse response = chatService.addGroupMembers(conversationId, request);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_MEMBERS_ADDED, response));
    }

    @DeleteMapping(ChatConstants.CONVERSATION_MEMBER_BY_ID_PATH)
    public ResponseEntity<ApiResponse<Void>> removeGroupMember(
            @PathVariable UUID conversationId,
            @PathVariable UUID memberId) {
        chatService.removeGroupMember(conversationId, memberId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_MEMBER_REMOVED, null));
    }

    @PostMapping(ChatConstants.CONVERSATION_LEAVE_PATH)
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable UUID conversationId) {
        chatService.leaveGroup(conversationId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_LEFT_GROUP, null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ConversationResponse>>> getConversations(
            @RequestParam(required = false) InboxFolder folder,
            @PageableDefault(size = ChatConstants.DEFAULT_CONVERSATIONS_PAGE_SIZE, sort = ChatConstants.SORT_BY_UPDATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ConversationResponse> response = chatService.getConversations(folder, pageable);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_CONVERSATIONS_RETRIEVED, response));
    }

    @GetMapping(ChatConstants.CONVERSATION_BY_ID_PATH)
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationById(
            @PathVariable UUID conversationId) {
        ConversationResponse response = chatService.getConversationById(conversationId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_CONVERSATION_RETRIEVED, response));
    }

    @DeleteMapping(ChatConstants.CONVERSATION_BY_ID_PATH)
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable UUID conversationId) {
        chatService.deleteConversation(conversationId);
        return ResponseEntity.ok(ApiResponse.success("Chat deleted successfully", null));
    }

    @PostMapping(ChatConstants.CONVERSATION_PIN_PATH)
    public ResponseEntity<ApiResponse<ConversationResponse>> togglePinConversation(
            @PathVariable UUID conversationId) {
        ConversationResponse response = chatService.togglePinConversation(conversationId);
        return ResponseEntity.ok(ApiResponse.success(
                Boolean.TRUE.equals(response.getIsPinned()) ? "Conversation pinned" : "Conversation unpinned",
                response));
    }

    @PutMapping(ChatConstants.CONVERSATION_FOLDER_PATH)
    public ResponseEntity<ApiResponse<Void>> updateConversationFolder(
            @PathVariable UUID conversationId,
            @Valid @RequestBody UpdateFolderRequest request) {
        chatService.updateConversationFolder(conversationId, request);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_CONVERSATION_FOLDER_UPDATED, null));
    }

    @PostMapping(ChatConstants.CONVERSATION_ACCEPT_REQUEST_PATH)
    public ResponseEntity<ApiResponse<Void>> acceptMessageRequest(
            @PathVariable UUID conversationId) {
        chatService.acceptMessageRequest(conversationId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_CONVERSATION_REQUEST_ACCEPTED, null));
    }

    @PostMapping(ChatConstants.CONVERSATION_DECLINE_REQUEST_PATH)
    public ResponseEntity<ApiResponse<Void>> declineMessageRequest(
            @PathVariable UUID conversationId) {
        chatService.declineMessageRequest(conversationId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_CONVERSATION_REQUEST_DECLINED, null));
    }

    @GetMapping(ChatConstants.CONVERSATION_REQUESTS_COUNT_PATH)
    public ResponseEntity<ApiResponse<Long>> getPendingRequestsCount() {
        long count = chatService.getPendingRequestsCount();
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_REQUESTS_COUNT_RETRIEVED, count));
    }

    @PutMapping(ChatConstants.CONVERSATION_THEME_PATH)
    public ResponseEntity<ApiResponse<ConversationResponse>> updateConversationTheme(
            @PathVariable UUID conversationId,
            @Valid @RequestBody UpdateChatThemeRequest request) {
        ConversationResponse response = chatService.updateConversationTheme(conversationId, request);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_CONVERSATION_THEME_UPDATED, response));
    }

    @GetMapping(ChatConstants.CONVERSATION_MESSAGES_PATH)
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> getMessages(
            @PathVariable UUID conversationId,
            @PageableDefault(size = ChatConstants.DEFAULT_MESSAGES_PAGE_SIZE, sort = ChatConstants.SORT_BY_CREATED_AT, direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<MessageResponse> response = chatService.getMessages(conversationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_MESSAGES_RETRIEVED, response));
    }

    @RateLimit(category = ChatConstants.RATE_LIMIT_MESSAGING, limit = 60, windowSeconds = 60)
    @PostMapping(ChatConstants.CONVERSATION_MESSAGES_PATH)
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = chatService.sendMessage(conversationId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ChatConstants.MSG_MESSAGE_SENT, response));
    }

    @PutMapping(ChatConstants.CONVERSATION_MESSAGE_BY_ID_PATH)
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId,
            @Valid @RequestBody EditMessageRequest request) {
        MessageResponse response = chatService.editMessage(conversationId, messageId, request);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_MESSAGE_EDITED, response));
    }

    @DeleteMapping(ChatConstants.CONVERSATION_MESSAGE_BY_ID_PATH)
    public ResponseEntity<ApiResponse<Void>> unsendMessage(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId) {
        chatService.unsendMessage(conversationId, messageId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_MESSAGE_UNSENT, null));
    }

    @PostMapping(ChatConstants.CONVERSATION_MESSAGE_PIN_PATH)
    public ResponseEntity<ApiResponse<MessageResponse>> togglePinMessageInChat(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId) {
        MessageResponse response = chatService.togglePinMessageInChat(conversationId, messageId);
        return ResponseEntity.ok(ApiResponse.success(
                Boolean.TRUE.equals(response.getIsPinnedInChat()) ? ChatConstants.MSG_MESSAGE_PINNED
                        : ChatConstants.MSG_MESSAGE_UNPINNED,
                response));
    }

    @GetMapping(ChatConstants.CONVERSATION_PINNED_MESSAGES_PATH)
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getPinnedMessagesInChat(
            @PathVariable UUID conversationId) {
        List<MessageResponse> response = chatService.getPinnedMessagesInChat(conversationId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_PINNED_MESSAGES_RETRIEVED, response));
    }

    @PostMapping(ChatConstants.CONVERSATION_MESSAGE_FORWARD_PATH)
    public ResponseEntity<ApiResponse<List<MessageResponse>>> forwardMessage(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId,
            @Valid @RequestBody ForwardMessageRequest request) {
        List<MessageResponse> response = chatService.forwardMessage(conversationId, messageId, request);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_MESSAGE_FORWARDED, response));
    }

    @PostMapping(ChatConstants.CONVERSATION_MESSAGE_REACTIONS_PATH)
    public ResponseEntity<ApiResponse<MessageReactionResponse>> reactToMessage(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId,
            @Valid @RequestBody AddMessageReactionRequest request) {
        MessageReactionResponse response = chatService.reactToMessage(conversationId, messageId, request);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_REACTION_ADDED, response));
    }

    @DeleteMapping(ChatConstants.CONVERSATION_MESSAGE_REACTIONS_PATH)
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId) {
        chatService.removeReaction(conversationId, messageId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_REACTION_REMOVED, null));
    }

    @PostMapping(ChatConstants.CONVERSATION_READ_PATH)
    public ResponseEntity<ApiResponse<Void>> markConversationAsRead(
            @PathVariable UUID conversationId) {
        chatService.markConversationAsRead(conversationId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_CONVERSATION_MARKED_READ, null));
    }

    @PostMapping(ChatConstants.CONVERSATION_MESSAGE_OPEN_VIEW_ONCE_PATH)
    public ResponseEntity<ApiResponse<MessageResponse>> openViewOnceMessage(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId) {
        MessageResponse response = chatService.openViewOnceMessage(conversationId, messageId);
        return ResponseEntity.ok(ApiResponse.success(ChatConstants.MSG_VIEW_ONCE_OPENED, response));
    }
}
