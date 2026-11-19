import React from 'react';
import { Send } from 'lucide-react';
import { SkeletonChatThreadPane } from '../ui/Skeleton';
import ChatHeader from './ChatHeader';
import MessageStream from './MessageStream';
import MessageInputBar from './MessageInputBar';

export const MessageThread = ({
  activeConversation,
  loadingConvs,
  conversationRouteId,
  onOpenNewChat,
  // Header props
  isGroup,
  groupDisplayName,
  otherMember,
  isInRequests,
  onBack,
  onOpenDetails,
  onOpenThemePicker,
  onTogglePin,
  onMoveFolder,
  onVoiceCall,
  onVideoCall,
  // Stream props
  messages,
  pinnedMessages,
  activeGroupCallBanner,
  loadingMsgs,
  loadingOlderMessages,
  hasMoreMessages,
  currentUserId,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
  onStartGroupCall,
  onTogglePinMessage,
  scrollToMessage,
  isMyMessage,
  isDoubleRight,
  shouldShowDivider,
  formatDateDivider,
  onToggleReaction,
  onStartEditMessage,
  onOpenForwardModal,
  onUnsendMessage,
  onOpenViewOnce,
  onOpenStoryPreview,
  sharedMentionStories,
  sharingMentionStoryId,
  onShareMentionedStory,
  onCallBack,
  // Request actions
  handlingRequestAction,
  onDeclineMessageRequest,
  onAcceptMessageRequest,
  // Input props
  inputText,
  setInputText,
  inputRef,
  onSendMessage,
  onSendQuickHeart,
  isRecording,
  recordingTime,
  onStartRecording,
  onCancelRecording,
  onSendVoiceNote,
  selectedMediaFile,
  mediaPreviewUrl,
  onSelectMedia,
  onClearMedia,
  isViewOnceMedia,
  setIsViewOnceMedia,
  mediaFileInputRef,
  editingMessage,
  onCancelEdit,
  sending,
  navigate,
}) => {
  return (
    <section className={`chat-window ${!activeConversation ? 'hidden-mobile' : ''}`}>
      {!activeConversation && loadingConvs && conversationRouteId ? (
        <SkeletonChatThreadPane />
      ) : !activeConversation ? (
        <div className="chat-empty-selection">
          <div className="chat-empty-icon-circle">
            <Send size={40} strokeWidth={1.6} className="chat-empty-send-icon" />
          </div>
          <h2>Your Messages</h2>
          <p>Send private photos and messages to a friend or group.</p>
          <button
            type="button"
            className="send-msg-cta-btn"
            onClick={onOpenNewChat}
          >
            <Send size={15} />
            <span>Send Message</span>
          </button>
        </div>
      ) : (
        <>
          {/* Chat Header */}
          <ChatHeader
            activeConversation={activeConversation}
            isGroup={isGroup}
            groupDisplayName={groupDisplayName}
            otherMember={otherMember}
            isInRequests={isInRequests}
            onBack={onBack}
            onOpenDetails={onOpenDetails}
            onOpenThemePicker={onOpenThemePicker}
            onTogglePin={onTogglePin}
            onMoveFolder={onMoveFolder}
            onVoiceCall={onVoiceCall}
            onVideoCall={onVideoCall}
          />

          {/* Messages Stream */}
          <MessageStream
            messages={messages}
            activeConversation={activeConversation}
            pinnedMessages={pinnedMessages}
            activeGroupCallBanner={activeGroupCallBanner}
            loadingMsgs={loadingMsgs}
            loadingOlderMessages={loadingOlderMessages}
            hasMoreMessages={hasMoreMessages}
            otherMember={otherMember}
            groupDisplayName={groupDisplayName}
            isGroup={isGroup}
            currentUserId={currentUserId}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            onScroll={onScroll}
            onStartGroupCall={onStartGroupCall}
            onTogglePinMessage={onTogglePinMessage}
            scrollToMessage={scrollToMessage}
            isMyMessage={isMyMessage}
            isDoubleRight={isDoubleRight}
            shouldShowDivider={shouldShowDivider}
            formatDateDivider={formatDateDivider}
            onToggleReaction={onToggleReaction}
            onStartEditMessage={onStartEditMessage}
            onOpenForwardModal={onOpenForwardModal}
            onUnsendMessage={onUnsendMessage}
            onOpenViewOnce={onOpenViewOnce}
            onOpenStoryPreview={onOpenStoryPreview}
            sharedMentionStories={sharedMentionStories}
            sharingMentionStoryId={sharingMentionStoryId}
            onShareMentionedStory={onShareMentionedStory}
            onCallBack={onCallBack}
            navigate={navigate}
          />

          {/* Message Request Accept / Decline Banner */}
          {isInRequests && (
            <div className="message-request-banner" role="region" aria-label="Message request actions">
              <div className="message-request-banner-copy">
                <span className="message-request-banner-title">
                  {isGroup
                    ? `Accept group invitation to join "${activeConversation?.name || 'this group'}"?`
                    : `Accept message request from ${otherMember?.displayName || otherMember?.username || 'this user'}?`}
                </span>
                <span className="message-request-banner-subtitle">
                  {isGroup
                    ? 'You must accept this invitation before you can send messages or receive calls.'
                    : 'Replying will also accept the request and move this chat to Messages.'}
                </span>
              </div>
              <div className="message-request-banner-actions">
                <button
                  type="button"
                  className="message-request-btn decline"
                  disabled={handlingRequestAction}
                  onClick={onDeclineMessageRequest}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="message-request-btn accept"
                  disabled={handlingRequestAction}
                  onClick={onAcceptMessageRequest}
                >
                  Accept
                </button>
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <MessageInputBar
            inputText={inputText}
            setInputText={setInputText}
            inputRef={inputRef}
            onSendMessage={onSendMessage}
            onSendQuickHeart={onSendQuickHeart}
            isRecording={isRecording}
            recordingTime={recordingTime}
            onStartRecording={onStartRecording}
            onCancelRecording={onCancelRecording}
            onSendVoiceNote={onSendVoiceNote}
            selectedMediaFile={selectedMediaFile}
            mediaPreviewUrl={mediaPreviewUrl}
            onSelectMedia={onSelectMedia}
            onClearMedia={onClearMedia}
            isViewOnceMedia={isViewOnceMedia}
            setIsViewOnceMedia={setIsViewOnceMedia}
            mediaFileInputRef={mediaFileInputRef}
            editingMessage={editingMessage}
            onCancelEdit={onCancelEdit}
            isInRequests={isInRequests}
            isGroup={isGroup}
            onAcceptRequest={onAcceptMessageRequest}
            handlingRequestAction={handlingRequestAction}
            sending={sending}
          />
        </>
      )}
    </section>
  );
};

export default MessageThread;
