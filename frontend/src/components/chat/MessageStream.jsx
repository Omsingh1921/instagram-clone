import React from 'react';
import { Pin, X, Phone, Users } from 'lucide-react';
import Avatar from '../common/Avatar';
import { SkeletonMessageThread } from '../ui/Skeleton';
import MessageItem from './MessageItem';

export const MessageStream = ({
  messages = [],
  activeConversation,
  pinnedMessages = [],
  activeGroupCallBanner,
  loadingMsgs,
  loadingOlderMessages,
  hasMoreMessages,
  otherMember,
  groupDisplayName,
  isGroup,
  currentUserId,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
  onStartGroupCall,
  onTogglePinMessage,
  scrollToMessage,
  // Message Item handlers
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
  navigate,
}) => {
  return (
    <>
      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="chat-pinned-banner">
          <div className="chat-pinned-icon-wrap">
            <Pin size={14} fill="#a855f7" color="#a855f7" />
          </div>
          <div
            className="chat-pinned-body"
            onClick={() => scrollToMessage?.(pinnedMessages[0].id)}
            title="Jump to pinned message"
          >
            <span className="chat-pinned-label">Pinned:</span>
            <span className="chat-pinned-text">{pinnedMessages[0].content}</span>
          </div>
          <button
            type="button"
            className="chat-pinned-unpin-btn"
            onClick={() => onTogglePinMessage?.(pinnedMessages[0].id)}
            title="Unpin message"
            aria-label="Unpin message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Live Active Group Call Banner */}
      {isGroup && activeGroupCallBanner && activeGroupCallBanner.id && (
        <div className="active-group-call-banner">
          <div className="active-group-call-banner-left">
            <span className="live-call-pulse-dot" />
            <span className="live-call-label">
              Group {activeGroupCallBanner.callType === 'AUDIO' ? 'Audio' : 'Video'} Call in progress
            </span>
            {activeGroupCallBanner.participants && activeGroupCallBanner.participants.length > 0 && (
              <span className="live-call-participants-pill">
                {activeGroupCallBanner.participants.length} in call
              </span>
            )}
          </div>
          <button
            type="button"
            className="join-group-call-banner-btn"
            onClick={() => onStartGroupCall?.(activeConversation, activeGroupCallBanner.callType || 'VIDEO')}
          >
            <Phone size={14} />
            <span>Join Call</span>
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div
        className={`chat-messages-container chat-theme-${(activeConversation?.theme || 'DEFAULT').toLowerCase()}`}
        ref={messagesContainerRef}
        onScroll={onScroll}
      >
        {!loadingMsgs && loadingOlderMessages && <SkeletonMessageThread count={3} compact />}
        {loadingMsgs ? (
          <SkeletonMessageThread count={6} />
        ) : messages.length === 0 ? (
          <div className="chat-empty-thread">
            {isGroup ? (
              activeConversation?.avatarUrl || activeConversation?.groupAvatarUrl ? (
                <Avatar
                  src={activeConversation.avatarUrl || activeConversation.groupAvatarUrl}
                  alt={groupDisplayName}
                  size="lg"
                />
              ) : (
                <div className="group-avatar-icon-bubble large" aria-label={groupDisplayName}>
                  <Users size={32} color="#fff" />
                </div>
              )
            ) : (
              <Avatar
                src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
                alt={groupDisplayName}
                size="lg"
              />
            )}
            <h3>{groupDisplayName}</h3>
            <p>Send a message to start the conversation.</p>
          </div>
        ) : (
          <>
            {!hasMoreMessages && messages.length > 0 && (
              <div className="chat-thread-profile-banner">
                {isGroup ? (
                  activeConversation?.avatarUrl || activeConversation?.groupAvatarUrl ? (
                    <Avatar
                      src={activeConversation.avatarUrl || activeConversation.groupAvatarUrl}
                      alt={groupDisplayName}
                      size="xl"
                      className="chat-thread-profile-avatar"
                    />
                  ) : (
                    <div className="group-avatar-icon-bubble large" aria-label={groupDisplayName}>
                      <Users size={38} color="#fff" />
                    </div>
                  )
                ) : (
                  <Avatar
                    src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
                    alt={groupDisplayName}
                    size="xl"
                    className="chat-thread-profile-avatar"
                  />
                )}
                <h4 className="chat-thread-profile-name">{groupDisplayName}</h4>
                <p className="chat-thread-profile-username">
                  {isGroup ? `${(activeConversation.members || []).length} members` : `${otherMember?.username || 'user'} · Instagram`}
                </p>
                {!isGroup && (
                  <button
                    type="button"
                    className="chat-view-profile-pill-btn"
                    onClick={() => {
                      const uid = otherMember?.id || otherMember?.userId;
                      if (uid && navigate) navigate(`/profile/${uid}`);
                    }}
                  >
                    View Profile
                  </button>
                )}
                {!isGroup && (
                  <div className="chat-thread-context-note">
                    <span>{otherMember?.username || 'user'} messaged you about a post. </span>
                    <span className="chat-thread-context-link">See post</span>
                  </div>
                )}
              </div>
            )}
            {messages
              .filter((msg, idx, arr) => arr.findIndex((m) => m.id === msg.id) === idx)
              .map((msg, index, filteredMessages) => {
                const mine = isMyMessage(msg);
                const doubleRight = mine && isDoubleRight(msg, index);
                const isSending = mine && msg.status === 'sending';

                const nextMsg = filteredMessages[index + 1];
                const isLastInSenderSequence =
                  !nextMsg ||
                  isMyMessage(nextMsg) !== mine ||
                  (nextMsg.sender?.id || nextMsg.sender?.userId) !== (msg.sender?.id || msg.sender?.userId);
                const showDateDivider = shouldShowDivider(msg, filteredMessages[index - 1]);

                return (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    mine={mine}
                    isLastInSenderSequence={isLastInSenderSequence}
                    doubleRight={doubleRight}
                    isSending={isSending}
                    isGroup={isGroup}
                    currentUserId={currentUserId}
                    otherMember={otherMember}
                    groupDisplayName={groupDisplayName}
                    onToggleReaction={onToggleReaction}
                    onTogglePinMessage={onTogglePinMessage}
                    onStartEditMessage={onStartEditMessage}
                    onOpenForwardModal={onOpenForwardModal}
                    onUnsendMessage={onUnsendMessage}
                    onOpenViewOnce={onOpenViewOnce}
                    onOpenStoryPreview={onOpenStoryPreview}
                    sharedMentionStories={sharedMentionStories}
                    sharingMentionStoryId={sharingMentionStoryId}
                    onShareMentionedStory={onShareMentionedStory}
                    onCallBack={onCallBack}
                    showDateDivider={showDateDivider}
                    dateDividerText={formatDateDivider(msg.createdAt)}
                  />
                );
              })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
};

export default MessageStream;
