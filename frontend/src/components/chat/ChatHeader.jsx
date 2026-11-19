import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Phone, Video, Palette, Info, Pin, FolderInput } from 'lucide-react';
import Avatar from '../common/Avatar';
import chatService from '../../services/chat.service';
import { timeAgo } from '../../utils';

export const ChatHeader = ({
  activeConversation,
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
}) => {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    if (isGroup || !otherMember) {
      setPresence(null);
      return;
    }
    const targetId = otherMember?.id || otherMember?.userId;
    if (!targetId || typeof chatService?.getUserPresence !== 'function') return;

    let isMounted = true;
    chatService.getUserPresence(targetId)
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res;
        if (data) setPresence(data);
      })
      .catch(() => {
        // Fallback gracefully on network/mock
      });

    return () => {
      isMounted = false;
    };
  }, [isGroup, otherMember?.id, otherMember?.userId]);

  if (!activeConversation) return null;

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <button
          type="button"
          className="mobile-back-btn"
          onClick={onBack}
          aria-label="Back to conversations"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div
          className="chat-recipient-info"
          onClick={onOpenDetails}
        >
          {isGroup ? (
            activeConversation?.avatarUrl || activeConversation?.groupAvatarUrl ? (
              <Avatar
                src={activeConversation.avatarUrl || activeConversation.groupAvatarUrl}
                alt={groupDisplayName}
                size="md"
                className="chat-header-avatar"
              />
            ) : (
              <div className="group-avatar-icon-bubble small" aria-label={groupDisplayName}>
                <Users size={22} color="#fff" />
              </div>
            )
          ) : (
            <Avatar
              src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
              alt={groupDisplayName}
              size="md"
              className="chat-header-avatar"
            />
          )}
          <div className="chat-recipient-names">
            <div className="chat-header-name-row">
              <span className="chat-recipient-username">
                {groupDisplayName}
              </span>
            </div>
            <span className="chat-recipient-subtext">
              {isGroup ? (
                `${(activeConversation.members || []).length} members`
              ) : presence && presence.online === false && presence.lastSeen ? (
                <span className="chat-active-status offline">
                  {`Active ${timeAgo(presence.lastSeen)} ago`}
                </span>
              ) : (
                <span className="chat-active-status">
                  <span className="chat-active-dot" aria-hidden="true" />
                  Active now
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-header-right-actions">
        <button
          type="button"
          className="chat-header-action-btn"
          onClick={onVoiceCall}
          title={isGroup ? 'Start group audio call' : 'Start audio call'}
          aria-label="Audio call"
        >
          <Phone size={20} />
        </button>
        <button
          type="button"
          className="chat-header-action-btn"
          onClick={onVideoCall}
          title={isGroup ? 'Start group video call' : 'Start video call'}
          aria-label="Video call"
        >
          <Video size={22} />
        </button>
        <button
          type="button"
          className="chat-header-action-btn chat-header-desktop-only"
          onClick={onOpenThemePicker}
          title="Change chat theme"
          aria-label="Change chat theme"
        >
          <Palette size={20} />
        </button>
        <button
          type="button"
          className="chat-header-action-btn"
          onClick={onOpenDetails}
          title="Conversation details"
          aria-label="Conversation details"
        >
          <Info size={22} />
        </button>
        <button
          type="button"
          className={`chat-header-pin-btn chat-header-desktop-only ${activeConversation?.isPinned ? 'pinned' : ''}`}
          onClick={(e) => onTogglePin?.(e, activeConversation.id)}
          title={activeConversation?.isPinned ? 'Unpin chat' : 'Pin chat to top'}
        >
          <Pin
            size={18}
            fill={activeConversation?.isPinned ? '#0095f6' : 'none'}
            color={activeConversation?.isPinned ? '#0095f6' : 'currentColor'}
          />
        </button>
        {activeConversation?.folder !== 'REQUESTS' && (
          <button
            type="button"
            className="chat-header-action-btn chat-header-desktop-only chat-header-folder-btn"
            onClick={(e) =>
              onMoveFolder?.(
                e,
                activeConversation.id,
                activeConversation?.folder === 'GENERAL' ? 'PRIMARY' : 'GENERAL'
              )
            }
            title={
              activeConversation?.folder === 'GENERAL'
                ? 'Move to Primary'
                : 'Move to General'
            }
            aria-label={
              activeConversation?.folder === 'GENERAL'
                ? 'Move to Primary'
                : 'Move to General'
            }
          >
            <FolderInput size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
