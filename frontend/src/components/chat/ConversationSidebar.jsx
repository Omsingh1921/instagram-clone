import React from 'react';
import { Edit, Search, X, ChevronDown } from 'lucide-react';
import NotesTray from '../notes/NotesTray';
import ConversationsList from './ConversationsList';

export const ConversationSidebar = ({
  activeConversation,
  currentUser,
  currentUsername,
  loadingConvs,
  activeInboxTab,
  setActiveInboxTab,
  convSearchTerm,
  setConvSearchTerm,
  requestConversations = [],
  filteredConversations = [],
  filteredRequestConversations = [],
  onSelectConversation,
  onOpenNewChat,
  onSelectUserForChat,
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
  navigate,
}) => {
  return (
    <aside
      className={`conversations-sidebar ${activeConversation ? 'hidden-mobile' : ''}`}
    >
      <div className="conversations-header">
        <button
          type="button"
          className="conversations-username-btn"
          onClick={() => {
            const uid = currentUser?.id || currentUser?.userId;
            if (uid && navigate) navigate(`/profile/${uid}`);
          }}
          title="View profile"
        >
          <span className="conversations-username">
            {currentUser?.username || currentUsername || 'messages'}
          </span>
          <ChevronDown size={16} />
        </button>

        <button
          type="button"
          className="new-chat-btn"
          onClick={onOpenNewChat}
          title="New Message"
          aria-label="New Message"
        >
          <Edit size={20} />
        </button>
      </div>

      {/* Search Bar matching Instagram Web Search Pill */}
      <div className="conversations-search-container">
        <div className="conversations-search-bar">
          <Search size={16} className="conversations-search-icon" />
          <input
            type="text"
            placeholder="Search messages"
            value={convSearchTerm}
            onChange={(e) => setConvSearchTerm(e.target.value)}
          />
          {convSearchTerm && (
            <button
              type="button"
              className="conversations-search-clear"
              onClick={() => setConvSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Instagram Notes Tray */}
      <NotesTray onSelectUserForChat={onSelectUserForChat} />

      {/* Conversations Stream & Filter Tabs */}
      <ConversationsList
        activeInboxTab={activeInboxTab}
        setActiveInboxTab={setActiveInboxTab}
        requestConversations={requestConversations}
        filteredConversations={filteredConversations}
        filteredRequestConversations={filteredRequestConversations}
        loadingConvs={loadingConvs}
        convSearchTerm={convSearchTerm}
        activeConversation={activeConversation}
        currentUsername={currentUsername}
        onSelectConversation={onSelectConversation}
        convMenuOpenId={convMenuOpenId}
        setConvMenuOpenId={setConvMenuOpenId}
        mutedConvs={mutedConvs}
        onToggleUnread={onToggleUnread}
        onTogglePin={onTogglePin}
        onMoveFolder={onMoveFolder}
        onToggleMute={onToggleMute}
        onDeleteConversation={onDeleteConversation}
        getOtherMember={getOtherMember}
        isMyMessage={isMyMessage}
      />
    </aside>
  );
};

export default ConversationSidebar;
