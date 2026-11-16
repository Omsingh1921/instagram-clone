package com.instagramclone.chat.service.interfaces;

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
import com.instagramclone.chat.dto.response.MessageResponse;
import com.instagramclone.chat.enums.InboxFolder;
import com.instagramclone.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface IChatService {

    ConversationResponse getOrCreateDirectConversation(UUID recipientId);

    ConversationResponse createGroupConversation(CreateGroupConversationRequest request);

    ConversationResponse updateGroupConversation(UUID conversationId, UpdateGroupConversationRequest request);

    ConversationResponse addGroupMembers(UUID conversationId, AddGroupMembersRequest request);

    void removeGroupMember(UUID conversationId, UUID memberId);

    void leaveGroup(UUID conversationId);

    void deleteConversation(UUID conversationId);

    PageResponse<ConversationResponse> getConversations(Pageable pageable);

    PageResponse<ConversationResponse> getConversations(InboxFolder folder, Pageable pageable);

    ConversationResponse getConversationById(UUID conversationId);

    PageResponse<MessageResponse> getMessages(UUID conversationId, Pageable pageable);

    MessageResponse sendMessage(UUID conversationId, SendMessageRequest request);

    MessageResponse editMessage(UUID conversationId, UUID messageId, EditMessageRequest request);

    void unsendMessage(UUID conversationId, UUID messageId);

    MessageReactionResponse reactToMessage(UUID conversationId, UUID messageId, AddMessageReactionRequest request);

    void removeReaction(UUID conversationId, UUID messageId);

    void markConversationAsRead(UUID conversationId);

    MessageResponse openViewOnceMessage(UUID conversationId, UUID messageId);

    ConversationResponse togglePinConversation(UUID conversationId);

    MessageResponse togglePinMessageInChat(UUID conversationId, UUID messageId);

    List<MessageResponse> getPinnedMessagesInChat(UUID conversationId);

    List<MessageResponse> forwardMessage(UUID conversationId, UUID messageId, ForwardMessageRequest request);

    void updateConversationFolder(UUID conversationId, UpdateFolderRequest request);

    void acceptMessageRequest(UUID conversationId);

    void declineMessageRequest(UUID conversationId);

    ConversationResponse updateConversationTheme(UUID conversationId, UpdateChatThemeRequest request);

    long getPendingRequestsCount();

    void validateTypingPermission(UUID conversationId, UUID userId);
}
