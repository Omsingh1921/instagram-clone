import React from 'react';
import {
  Search,
  Pin,
  Bell,
  BellOff,
  MoreHorizontal,
  Mail,
  FolderInput,
  Trash2,
  Users,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { SkeletonConversationRows } from '../ui/Skeleton';
import { timeAgo } from '../../utils';

export const ConversationsList = ({
  activeInboxTab,
  setActiveInboxTab,
  requestConversations = [],
  filteredConversations = [],
  filteredRequestConversations = [],
  loadingConvs,
  convSearchTerm,
  activeConversation,
  currentUsername,
  onSelectConversation,
  convMenuOpenId,
  setConvMenuOpenId,
  mutedConvs = new Set(),
  onToggleUnread,
  onTogglePin,
  onMoveFolder,
  onToggleMute,
  onDeleteConversation,
  getOtherMember,
  isMyMessage,
}) => {
  const isRequestsTab = activeInboxTab === 'requests';
  const isGeneralTab = activeInboxTab === 'general';
  const hasSearchQuery = Boolean(convSearchTerm?.trim());

  const visibleConversations = isRequestsTab
    ? filteredRequestConversations
    : hasSearchQuery
    ? filteredConversations
    : isGeneralTab
    ? filteredConversations.filter((c) => c.folder === 'GENERAL')
    : filteredConversations.filter((c) => !c.folder || c.folder === 'PRIMARY');

  return (
    <>
      {/* Inbox Folder Filter Tabs (Primary / General / Requests) */}
      <div className="conversations-subheader" role="tablist" aria-label="Messages filter">
        <button
          type="button"
          role="tab"
          aria-label="Primary"
          aria-selected={activeInboxTab === 'primary' || activeInboxTab === 'messages'}
          className={`conversations-tab-btn ${
            activeInboxTab === 'primary' || activeInboxTab === 'messages' ? 'active' : ''
          }`}
          onClick={() => setActiveInboxTab('primary')}
        >
          Primary
        </button>
        <button
          type="button"
          role="tab"
          aria-label="General"
          aria-selected={activeInboxTab === 'general'}
          className={`conversations-tab-btn ${activeInboxTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveInboxTab('general')}
        >
          General
        </button>
        <button
          type="button"
          role="tab"
          aria-label="Requests"
          aria-selected={activeInboxTab === 'requests'}
          className={`conversations-tab-btn ${activeInboxTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveInboxTab('requests')}
        >
          <span>Requests</span>
          {requestConversations.length > 0 && (
            <span className="conversations-tab-badge" aria-hidden="true">
              {requestConversations.length}
            </span>
          )}
        </button>
      </div>

      <div className="conversations-list-stream">
        {(() => {
          if (loadingConvs) {
            return <SkeletonConversationRows count={6} />;
          }

          if (visibleConversations.length === 0) {
            if (hasSearchQuery) {
              return (
                <div
                  className="conversations-empty-msg"
                  style={{ padding: '40px 20px', textAlign: 'center' }}
                >
                  <Search
                    size={36}
                    color="var(--text-secondary)"
                    style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }}
                  />
                  <h3 className="conversations-empty-title">No results found</h3>
                  <p className="conversations-empty-desc">
                    No chat found for "{convSearchTerm}".
                  </p>
                </div>
              );
            }

            const gradId = isRequestsTab
              ? 'msgEmptyGradReq'
              : isGeneralTab
              ? 'msgEmptyGradGen'
              : 'msgEmptyGrad';

            return (
              <div className="conversations-empty-msg">
                <div className="conversations-empty-icon" aria-hidden="true">
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"
                      stroke={`url(#${gradId})`}
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"
                      stroke={`url(#${gradId})`}
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="conversations-empty-title">
                  {isRequestsTab
                    ? 'No message requests'
                    : isGeneralTab
                    ? 'No general messages'
                    : 'No messages yet'}
                </h3>
                <p className="conversations-empty-desc">
                  {isRequestsTab
                    ? "Messages from people you don't follow will appear here."
                    : isGeneralTab
                    ? 'Move messages you want to get back to later into General.'
                    : 'Send a direct message to a friend or start a group chat.'}
                </p>
              </div>
            );
          }

          return visibleConversations.map((conv) => {
            const other = getOtherMember?.(conv) || {};
            const isActive = activeConversation?.id === conv.id;
            const isConvGroup = conv.type === 'GROUP';
            const title = isConvGroup
              ? conv.name ||
                (conv.members || []).map((m) => m.username).join(', ') ||
                'Group Chat'
              : other.displayName &&
                other.displayName.toLowerCase() !== currentUsername?.toLowerCase()
              ? other.displayName
              : other.username || other.displayName || 'User';

            return (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                className={`conversation-item ${isActive ? 'active' : ''} ${
                  conv.unreadCount > 0 ? 'unread' : ''
                }`}
                onClick={() => onSelectConversation?.(conv)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConvMenuOpenId?.((prev) => (prev === conv.id ? null : conv.id));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectConversation?.(conv);
                  }
                }}
              >
                {isConvGroup ? (
                  <div className="group-avatar-icon-bubble">
                    <Users size={22} color="#fff" />
                  </div>
                ) : (
                  <Avatar
                    src={other.avatarUrl || other.profilePictureUrl}
                    alt={title}
                    size="lg"
                  />
                )}
                <div className="conversation-meta-box">
                  <div className="conversation-item-header-row">
                    <span className="conversation-recipient-name">{title}</span>
                    {conv.isPinned && (
                      <span className="conversation-pinned-badge" title="Pinned chat">
                        <Pin size={11} fill="currentColor" />
                      </span>
                    )}
                  </div>

                  <div className="conversation-item-snippet-row">
                    <span
                      className={`conversation-last-message ${
                        conv.unreadCount > 0 ? 'unread' : ''
                      }`}
                    >
                      {(() => {
                        const last = conv.lastMessage;
                        if (!last) return 'No messages yet';
                        let text = '';
                        if (last.messageType === 'CALL') {
                          text = last.content || 'Call';
                        } else if (last.messageType === 'IMAGE') {
                          text = 'Sent a photo';
                        } else if (last.messageType === 'VIDEO') {
                          text = 'Sent a video';
                        } else if (
                          last.messageType === 'SHARED_POST' ||
                          last.messageType === 'POST'
                        ) {
                          const isReel =
                            last.sharedPost?.mediaType === 'VIDEO' ||
                            last.content?.toLowerCase()?.includes('reel');
                          text = isReel ? 'Sent a reel' : 'Sent a post';
                        } else if (last.messageType === 'AUDIO') {
                          text = 'Voice message';
                        } else {
                          text = last.content || 'Started a conversation';
                        }
                        const time = last.createdAt ? ` · ${timeAgo(last.createdAt)}` : '';
                        return `${text}${time}`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* 3-dots Conversation Actions Menu (Instagram Web Parity) */}
                <div
                  className="conv-item-actions-wrapper"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`conv-options-btn ${
                      convMenuOpenId === conv.id ? 'active' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConvMenuOpenId?.((prev) => (prev === conv.id ? null : conv.id));
                    }}
                    title="More options"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {convMenuOpenId === conv.id && (
                    <div className="conv-context-menu" role="menu">
                      <button
                        type="button"
                        className="conv-context-menu-item"
                        onClick={(e) => onToggleUnread?.(e, conv.id)}
                      >
                        <span>
                          {conv.unreadCount > 0 ? 'Mark as read' : 'Mark as unread'}
                        </span>
                        <Mail size={18} />
                      </button>

                      <button
                        type="button"
                        className="conv-context-menu-item"
                        onClick={(e) => onTogglePin?.(e, conv.id)}
                      >
                        <span>{conv.isPinned ? 'Unpin' : 'Pin'}</span>
                        <Pin size={18} />
                      </button>

                      <button
                        type="button"
                        className="conv-context-menu-item"
                        onClick={(e) =>
                          onMoveFolder?.(
                            e,
                            conv.id,
                            conv.folder === 'GENERAL' ? 'PRIMARY' : 'GENERAL'
                          )
                        }
                        title={
                          conv.folder === 'GENERAL'
                            ? 'Move to Primary'
                            : 'Move to General'
                        }
                      >
                        <span>
                          {conv.folder === 'GENERAL'
                            ? 'Move to Primary'
                            : 'Move to General'}
                        </span>
                        <FolderInput size={18} />
                      </button>

                      <button
                        type="button"
                        className="conv-context-menu-item"
                        onClick={(e) => onToggleMute?.(e, conv.id)}
                      >
                        <span>
                          {mutedConvs.has(conv.id) ? 'Unmute' : 'Mute'}
                        </span>
                        {mutedConvs.has(conv.id) ? (
                          <Bell size={18} />
                        ) : (
                          <BellOff size={18} />
                        )}
                      </button>

                      <button
                        type="button"
                        className="conv-context-menu-item danger"
                        onClick={(e) => onDeleteConversation?.(e, conv)}
                      >
                        <span>Delete</span>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {conv.unreadCount > 0 && <div className="conversation-unread-dot" />}
              </div>
            );
          });
        })()}
      </div>
    </>
  );
};

export default ConversationsList;
