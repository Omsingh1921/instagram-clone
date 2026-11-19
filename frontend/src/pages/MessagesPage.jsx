import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import stompClient from '../services/websocket';
import {
  ThemePickerModal,
  ViewOnceModal,
  StoryPreviewModal,
  DeleteChatModal,
  GroupDetailsModal,
  NewChatModal,
  ConversationSidebar,
  MessageThread,
  useChatConversations,
  useChatMessages,
  useChatMedia,
} from '../components/chat';
import ForwardMessageModal from '../components/modals/ForwardMessageModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCall } from '../context/CallContext';
import './MessagesPage.css';
import '../components/modals/BlockUserModal.css';

export const MessagesPage = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { startCall, startGroupCall } = useCall();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUserId = currentUser?.id || currentUser?.userId;
  const currentUsername = currentUser?.username;

  // Modals state
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [groupDetailsModalOpen, setGroupDetailsModalOpen] = useState(false);
  const [forwardMessageTarget, setForwardMessageTarget] = useState(null);

  // Hook 1: Conversations management
  const {
    conversations,
    setConversations,
    requestConversations,
    activeConversation,
    setActiveConversation,
    loadingConvs,
    activeInboxTab,
    setActiveInboxTab,
    convSearchTerm,
    setConvSearchTerm,
    convMenuOpenId,
    setConvMenuOpenId,
    mutedConvs,
    handlingRequestAction,
    deleteChatModalTarget,
    setDeleteChatModalTarget,
    deletingChat,
    loadConversations,
    promoteConversationToPrimary,
    handleTogglePin,
    handleToggleUnread,
    handleMoveConversationFolder,
    handleToggleMute,
    handleDeleteConversation,
    handleConfirmDeleteChat,
    handleStartChatWithUser,
    handleCreateGroupChat,
    handleAcceptMessageRequest,
    handleDeclineMessageRequest,
    filteredConversations,
    filteredRequestConversations,
    getOtherMember,
    isMyMessage,
  } = useChatConversations({
    currentUserId,
    currentUsername,
    showError,
    showSuccess,
    locationStateConvId: location.state?.conversationId,
  });

  // Hook 2: Messages streaming and scroll management
  const {
    messages,
    setMessages,
    messagesPage,
    hasMoreMessages,
    loadingOlderMessages,
    loadingMsgs,
    inputText,
    setInputText,
    pinnedMessages,
    editingMessage,
    setEditingMessage,
    sending,
    setSending,
    activeGroupCallBanner,
    messagesEndRef,
    messagesContainerRef,
    inputRef,
    convCacheRef,
    handleMessagesScroll,
    handleSendMessage,
    handleSendQuickHeart,
    handleTogglePinMessage,
    handleSelectTheme,
    handleStartEditMessage,
    scrollToMessage,
    handleUnsendMessage,
    handleToggleReaction,
    isDoubleRight,
    formatDateDivider,
    shouldShowDivider,
  } = useChatMessages({
    activeConversation,
    currentUserId,
    currentUsername,
    showError,
    showSuccess,
    promoteConversationToPrimary,
    setConversations,
    isMyMessage,
  });

  // Hook 3: Media upload & Voice notes
  const {
    selectedMediaFile,
    mediaPreviewUrl,
    isViewOnceMedia,
    setIsViewOnceMedia,
    viewOnceModalData,
    viewOnceCountdown,
    storyPreviewModalUrl,
    setStoryPreviewModalUrl,
    sharedMentionStories,
    sharingMentionStoryId,
    mediaFileInputRef,
    handleSelectMedia,
    handleClearSelectedMedia,
    handleSendMediaMessage,
    handleOpenViewOnce,
    handleCloseViewOnce,
    isRecording,
    recordingTime,
    handleStartRecording,
    handleCancelRecording,
    handleSendVoiceNote,
    handleShareMentionedStory,
  } = useChatMedia({
    activeConversation,
    currentUser,
    inputText,
    setInputText,
    showError,
    showSuccess,
    setMessages,
    setSending,
    promoteConversationToPrimary,
    convCacheRef,
    messagesPage,
    hasMoreMessages,
  });

  // Active chat mobile body class
  useEffect(() => {
    if (activeConversation) {
      document.body.classList.add('in-active-chat');
    } else {
      document.body.classList.remove('in-active-chat');
    }
    return () => {
      document.body.classList.remove('in-active-chat');
    };
  }, [activeConversation]);

  // Connect STOMP WebSocket on mount
  useEffect(() => {
    stompClient.connect();
  }, []);

  const otherMember = activeConversation ? getOtherMember(activeConversation) : null;
  const isGroup = activeConversation?.type === 'GROUP';
  const isInRequests =
    activeConversation?.folder === 'REQUESTS' ||
    requestConversations.some((c) => c.id === activeConversation?.id);
  const groupDisplayName = isGroup
    ? activeConversation.name ||
      (activeConversation.members || []).map((m) => m.username).join(', ') ||
      'Group Chat'
    : otherMember?.displayName &&
      otherMember.displayName.toLowerCase() !== currentUsername?.toLowerCase()
    ? otherMember.displayName
    : otherMember?.username || otherMember?.displayName || 'User';

  return (
    <div className="messages-page-layout">
      {/* Conversations Sidebar Column */}
      <ConversationSidebar
        activeConversation={activeConversation}
        currentUser={currentUser}
        currentUsername={currentUsername}
        loadingConvs={loadingConvs}
        activeInboxTab={activeInboxTab}
        setActiveInboxTab={setActiveInboxTab}
        convSearchTerm={convSearchTerm}
        setConvSearchTerm={setConvSearchTerm}
        requestConversations={requestConversations}
        filteredConversations={filteredConversations}
        filteredRequestConversations={filteredRequestConversations}
        onSelectConversation={setActiveConversation}
        onOpenNewChat={() => setNewChatModalOpen(true)}
        onSelectUserForChat={handleStartChatWithUser}
        convMenuOpenId={convMenuOpenId}
        setConvMenuOpenId={setConvMenuOpenId}
        mutedConvs={mutedConvs}
        onToggleUnread={handleToggleUnread}
        onTogglePin={handleTogglePin}
        onMoveFolder={handleMoveConversationFolder}
        onToggleMute={handleToggleMute}
        onDeleteConversation={handleDeleteConversation}
        getOtherMember={getOtherMember}
        isMyMessage={isMyMessage}
        navigate={navigate}
      />

      {/* Chat Thread Viewport Column */}
      <MessageThread
        activeConversation={activeConversation}
        loadingConvs={loadingConvs}
        conversationRouteId={location.state?.conversationId}
        onOpenNewChat={() => setNewChatModalOpen(true)}
        isGroup={isGroup}
        groupDisplayName={groupDisplayName}
        otherMember={otherMember}
        isInRequests={isInRequests}
        onBack={() => setActiveConversation(null)}
        onOpenDetails={() => {
          if (isGroup) {
            setGroupDetailsModalOpen(true);
          } else {
            const targetId = otherMember?.id || otherMember?.userId;
            if (targetId) navigate(`/profile/${targetId}`);
          }
        }}
        onOpenThemePicker={() => setThemeModalOpen(true)}
        onTogglePin={handleTogglePin}
        onMoveFolder={handleMoveConversationFolder}
        onVoiceCall={() => {
          if (isInRequests) {
            showError(
              isGroup
                ? 'Please accept the group invitation first'
                : 'Please accept the message request first'
            );
            return;
          }
          if (isGroup) {
            startGroupCall(activeConversation, 'AUDIO');
          } else if (otherMember) {
            startCall(otherMember, 'AUDIO', activeConversation?.id);
          }
        }}
        onVideoCall={() => {
          if (isInRequests) {
            showError(
              isGroup
                ? 'Please accept the group invitation first'
                : 'Please accept the message request first'
            );
            return;
          }
          if (isGroup) {
            startGroupCall(activeConversation, 'VIDEO');
          } else if (otherMember) {
            startCall(otherMember, 'VIDEO', activeConversation?.id);
          }
        }}
        messages={messages}
        pinnedMessages={pinnedMessages}
        activeGroupCallBanner={activeGroupCallBanner}
        loadingMsgs={loadingMsgs}
        loadingOlderMessages={loadingOlderMessages}
        hasMoreMessages={hasMoreMessages}
        currentUserId={currentUserId}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        onScroll={handleMessagesScroll}
        onStartGroupCall={startGroupCall}
        onTogglePinMessage={handleTogglePinMessage}
        scrollToMessage={scrollToMessage}
        isMyMessage={isMyMessage}
        isDoubleRight={isDoubleRight}
        shouldShowDivider={shouldShowDivider}
        formatDateDivider={formatDateDivider}
        onToggleReaction={handleToggleReaction}
        onStartEditMessage={handleStartEditMessage}
        onOpenForwardModal={(msg) => setForwardMessageTarget(msg)}
        onUnsendMessage={handleUnsendMessage}
        onOpenViewOnce={handleOpenViewOnce}
        onOpenStoryPreview={(url) => setStoryPreviewModalUrl(url)}
        sharedMentionStories={sharedMentionStories}
        sharingMentionStoryId={sharingMentionStoryId}
        onShareMentionedStory={handleShareMentionedStory}
        onCallBack={(isVideo) => {
          if (otherMember) {
            startCall(otherMember, isVideo ? 'VIDEO' : 'AUDIO', activeConversation?.id);
          }
        }}
        handlingRequestAction={handlingRequestAction}
        onDeclineMessageRequest={handleDeclineMessageRequest}
        onAcceptMessageRequest={handleAcceptMessageRequest}
        inputText={inputText}
        setInputText={setInputText}
        inputRef={inputRef}
        onSendMessage={(e) => handleSendMessage(e, selectedMediaFile ? handleSendMediaMessage : null)}
        onSendQuickHeart={handleSendQuickHeart}
        isRecording={isRecording}
        recordingTime={recordingTime}
        onStartRecording={handleStartRecording}
        onCancelRecording={handleCancelRecording}
        onSendVoiceNote={handleSendVoiceNote}
        selectedMediaFile={selectedMediaFile}
        mediaPreviewUrl={mediaPreviewUrl}
        onSelectMedia={handleSelectMedia}
        onClearMedia={handleClearSelectedMedia}
        isViewOnceMedia={isViewOnceMedia}
        setIsViewOnceMedia={setIsViewOnceMedia}
        mediaFileInputRef={mediaFileInputRef}
        editingMessage={editingMessage}
        onCancelEdit={() => {
          setEditingMessage(null);
          setInputText('');
        }}
        sending={sending}
        navigate={navigate}
      />

      {/* New Chat & Group Chat Modal */}
      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        currentUserId={currentUserId}
        onStartDirectChat={async (user) => {
          await handleStartChatWithUser(user);
          setNewChatModalOpen(false);
        }}
        onCreateGroupChat={async (groupData) => {
          await handleCreateGroupChat(groupData);
          setNewChatModalOpen(false);
        }}
      />

      {/* Fullscreen View-Once Media Modal */}
      <ViewOnceModal
        mediaData={viewOnceModalData}
        countdown={viewOnceCountdown}
        onClose={handleCloseViewOnce}
      />

      {/* Chat Theme Picker Modal */}
      <ThemePickerModal
        isOpen={themeModalOpen}
        onClose={() => {
          setThemeModalOpen(false);
        }}
        currentTheme={activeConversation?.theme || 'DEFAULT'}
        onSelectTheme={async (themeId) => {
          await handleSelectTheme(themeId);
          setActiveConversation((prev) => ({ ...prev, theme: themeId }));
          setThemeModalOpen(false);
        }}
      />

      {/* Group Details Modal */}
      {isGroup && (
        <GroupDetailsModal
          isOpen={groupDetailsModalOpen}
          onClose={() => setGroupDetailsModalOpen(false)}
          conversation={activeConversation}
          currentUser={currentUser}
          onConversationUpdated={(updatedConv) => {
            setActiveConversation(updatedConv);
            setConversations((prev) =>
              prev.map((c) => (c.id === updatedConv.id ? { ...c, ...updatedConv } : c))
            );
          }}
          onLeaveSuccess={(convId) => {
            setConversations((prev) => prev.filter((c) => c.id !== convId));
            setActiveConversation(null);
          }}
          onOpenThemePicker={() => setThemeModalOpen(true)}
        />
      )}

      {/* Fullscreen Story Preview Modal */}
      <StoryPreviewModal
        url={storyPreviewModalUrl}
        onClose={() => setStoryPreviewModalUrl(null)}
      />

      {/* Delete Chat Confirmation Modal */}
      <DeleteChatModal
        isOpen={Boolean(deleteChatModalTarget)}
        onClose={() => setDeleteChatModalTarget(null)}
        onConfirmDelete={handleConfirmDeleteChat}
        isDeleting={deletingChat}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={Boolean(forwardMessageTarget)}
        onClose={() => setForwardMessageTarget(null)}
        message={forwardMessageTarget}
        currentConversationId={activeConversation?.id}
        onForwardSuccess={() => {
          setForwardMessageTarget(null);
        }}
      />
    </div>
  );
};

export default MessagesPage;
