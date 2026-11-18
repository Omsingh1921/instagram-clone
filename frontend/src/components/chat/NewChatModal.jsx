import React, { useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import userService from '../../services/user.service';
import followService from '../../services/follow.service';

export const NewChatModal = ({
  isOpen,
  onClose,
  currentUserId,
  onStartDirectChat,
  onCreateGroupChat,
}) => {
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset state on close or when opened
  const handleClose = () => {
    setUserSearchTerm('');
    setSelectedUsers([]);
    setGroupName('');
    setSearchResults([]);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setUserSearchTerm('');
      setSelectedUsers([]);
      setGroupName('');
      setSearchResults([]);
      return;
    }

    if (!userSearchTerm.trim()) {
      let isSubscribed = true;
      (async () => {
        try {
          setSearchingUsers(true);
          const res = await followService.getFollowing(currentUserId, 0, 20);
          const list = res?.data?.content || res?.content || res?.data || [];
          if (isSubscribed) {
            setSearchResults(
              list
                .map((item) => ({
                  id: item.userId || item.id,
                  userId: item.userId || item.id,
                  username: item.username,
                  displayName: item.displayName || item.fullName,
                  avatarUrl: item.avatarUrl || item.profilePictureUrl,
                }))
                .filter((u) => u.userId !== currentUserId)
            );
          }
        } catch {
          if (isSubscribed) setSearchResults([]);
        } finally {
          if (isSubscribed) setSearchingUsers(false);
        }
      })();
      return () => {
        isSubscribed = false;
      };
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const res = await userService.searchUsers(userSearchTerm.trim(), 0, 15);
        const list = res?.data?.content || res?.content || res?.data || [];
        setSearchResults(
          list.filter((u) => {
            const uid = u.id || u.userId;
            return uid !== currentUserId;
          })
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(searchTimeout);
  }, [userSearchTerm, isOpen, currentUserId]);

  const handleToggleSelectUser = (user) => {
    const uid = user.id || user.userId;
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => (u.id || u.userId) === uid);
      if (exists) {
        return prev.filter((u) => (u.id || u.userId) !== uid);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return;

    if (selectedUsers.length === 1) {
      try {
        setSubmitting(true);
        await onStartDirectChat?.(selectedUsers[0]);
        handleClose();
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      const memberIds = selectedUsers.map((u) => u.id || u.userId);
      await onCreateGroupChat?.({
        name: groupName.trim() || undefined,
        memberIds,
      });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New message"
      size="md"
    >
      <div className="new-chat-dialog-content">
        {/* Selected Users Chips */}
        {selectedUsers.length > 0 && (
          <div className="new-chat-selected-chips">
            {selectedUsers.map((u) => (
              <div key={u.id || u.userId} className="new-chat-user-chip">
                <span>@{u.username}</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => handleToggleSelectUser(u)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Group Name Input if 2+ users selected */}
        {selectedUsers.length >= 2 && (
          <div className="new-chat-group-name-row">
            <input
              type="text"
              className="input new-chat-group-input"
              placeholder="Group name (optional)..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>
        )}

        <div className="new-chat-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search people to add..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            className="new-chat-search-input"
            autoFocus
          />
        </div>

        <div className="new-chat-results-list">
          {!userSearchTerm.trim() && searchResults.length > 0 && (
            <div
              style={{
                padding: '10px 16px 4px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Suggested
            </div>
          )}
          {searchingUsers ? (
            <SkeletonUserRows count={4} compact />
          ) : searchResults.length === 0 ? (
            <div className="new-chat-no-results">
              {userSearchTerm ? 'No account found.' : 'Search for users to message.'}
            </div>
          ) : (
            searchResults.map((target) => {
              const isSelected = selectedUsers.some(
                (u) => (u.id || u.userId) === (target.id || target.userId)
              );
              return (
                <div
                  key={target.id || target.userId}
                  className={`new-chat-user-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleSelectUser(target)}
                >
                  <Avatar
                    src={target.avatarUrl || target.profilePictureUrl}
                    alt={target.username}
                    size="md"
                  />
                  <div className="new-chat-user-meta">
                    <span className="new-chat-username">{target.username}</span>
                    {target.displayName && (
                      <span className="new-chat-display-name">{target.displayName}</span>
                    )}
                  </div>
                  <div className={`new-chat-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div className="new-chat-footer-actions">
            <button
              type="button"
              className="btn btn-primary new-chat-confirm-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                'Starting chat...'
              ) : selectedUsers.length >= 2 ? (
                `Create Group Chat (${selectedUsers.length})`
              ) : (
                'Chat'
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NewChatModal;
