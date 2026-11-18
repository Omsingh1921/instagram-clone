import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Edit3, Palette, UserPlus, LogOut, Search, X, Check } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import chatService from '../../services/chat.service';
import userService from '../../services/user.service';
import { useToast } from '../../context/ToastContext';

export const GroupDetailsModal = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onConversationUpdated,
  onLeaveSuccess,
  onOpenThemePicker,
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);

  const [showAddMembersRow, setShowAddMembersRow] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberResults, setAddMemberResults] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [isSearchingAddMember, setIsSearchingAddMember] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);

  useEffect(() => {
    if (isOpen && conversation) {
      setGroupNameInput(conversation.name || '');
      setEditingGroupName(false);
      setShowAddMembersRow(false);
      setSelectedNewMembers([]);
      setAddMemberSearch('');
      setAddMemberResults([]);
    }
  }, [isOpen, conversation]);

  if (!isOpen || !conversation) return null;

  const currentUserId = currentUser?.id || currentUser?.userId;
  const isCurrentUserAdmin = currentUserId === conversation.creatorId;

  const handleSaveGroupName = async () => {
    if (!groupNameInput.trim() || !conversation?.id) return;
    try {
      setIsRenamingGroup(true);
      const res = await chatService.updateGroupConversation(conversation.id, {
        name: groupNameInput.trim(),
      });
      const updated = res?.data || res;
      const finalName = updated.name || groupNameInput.trim();
      onConversationUpdated?.({ ...conversation, name: finalName });
      setEditingGroupName(false);
      showSuccess('Group name updated');
    } catch (err) {
      showError(err.message || 'Failed to update group name');
    } finally {
      setIsRenamingGroup(false);
    }
  };

  const handleSearchNewMembers = async (term) => {
    setAddMemberSearch(term);
    const clean = term.replace(/^@/, '').trim();
    if (!clean) {
      setAddMemberResults([]);
      return;
    }
    try {
      setIsSearchingAddMember(true);
      const res = await userService.searchUsers(clean, 0, 6);
      const list = res?.data?.content || res?.data || res || [];
      const currentMemberIds = new Set(
        (conversation?.members || []).map((m) => m.id || m.userId)
      );
      setAddMemberResults(
        Array.isArray(list) ? list.filter((u) => !currentMemberIds.has(u.id || u.userId)) : []
      );
    } catch {
      setAddMemberResults([]);
    } finally {
      setIsSearchingAddMember(false);
    }
  };

  const handleToggleSelectNewMember = (u) => {
    const id = u.id || u.userId;
    setSelectedNewMembers((prev) =>
      prev.some((item) => (item.id || item.userId) === id)
        ? prev.filter((item) => (item.id || item.userId) !== id)
        : [...prev, u]
    );
  };

  const handleAddMembersToGroup = async () => {
    if (selectedNewMembers.length === 0 || !conversation?.id) return;
    try {
      setIsAddingMembers(true);
      const memberIds = selectedNewMembers.map((u) => u.id || u.userId);
      const res = await chatService.addGroupMembers(conversation.id, memberIds);
      const updated = res?.data || res;
      const updatedMembers = updated.members || [...(conversation.members || []), ...selectedNewMembers];
      onConversationUpdated?.({ ...conversation, members: updatedMembers });
      setSelectedNewMembers([]);
      setShowAddMembersRow(false);
      setAddMemberSearch('');
      setAddMemberResults([]);
      showSuccess('Members added to group');
    } catch (err) {
      showError(err.message || 'Failed to add members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!conversation?.id) return;
    try {
      await chatService.removeGroupMember(conversation.id, memberId);
      const updatedMembers = (conversation.members || []).filter(
        (m) => (m.id || m.userId) !== memberId
      );
      onConversationUpdated?.({ ...conversation, members: updatedMembers });
      showSuccess('Member removed from group');
    } catch (err) {
      showError(err.message || 'Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversation?.id) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      setIsLeavingGroup(true);
      await chatService.leaveGroup(conversation.id);
      showSuccess('You left the group');
      onClose();
      onLeaveSuccess?.(conversation.id);
    } catch (err) {
      showError(err.message || 'Failed to leave group');
    } finally {
      setIsLeavingGroup(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setEditingGroupName(false);
        setShowAddMembersRow(false);
      }}
      title="Details"
      size="md"
    >
      <div className="group-details-modal-content">
        {/* Group Header & Name */}
        <div className="group-details-hero">
          <div className="group-avatar-icon-bubble large">
            <Users size={32} color="#fff" />
          </div>
          {editingGroupName ? (
            <div className="group-name-edit-box">
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                className="input group-rename-input"
                placeholder="Enter group name..."
                maxLength={50}
                autoFocus
              />
              <div className="group-name-edit-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveGroupName}
                  disabled={isRenamingGroup || !groupNameInput.trim()}
                >
                  {isRenamingGroup ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingGroupName(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="group-name-display-row">
              <h3 className="group-details-title">{conversation.name || 'Group Chat'}</h3>
              <button
                type="button"
                className="group-rename-icon-btn"
                onClick={() => {
                  setGroupNameInput(conversation.name || '');
                  setEditingGroupName(true);
                }}
                title="Change group name"
              >
                <Edit3 size={14} />
                <span>Change name</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Bar */}
        <div className="group-details-quick-actions">
          <button
            type="button"
            className="group-quick-action-btn"
            onClick={() => {
              onClose();
              onOpenThemePicker?.();
            }}
          >
            <div className="group-action-icon-circle">
              <Palette size={18} />
            </div>
            <span>Theme</span>
          </button>

          <button
            type="button"
            className="group-quick-action-btn"
            onClick={() => setShowAddMembersRow((prev) => !prev)}
          >
            <div className="group-action-icon-circle">
              <UserPlus size={18} />
            </div>
            <span>Add people</span>
          </button>

          <button
            type="button"
            className="group-quick-action-btn danger"
            onClick={handleLeaveGroup}
            disabled={isLeavingGroup}
          >
            <div className="group-action-icon-circle danger">
              <LogOut size={18} />
            </div>
            <span>Leave</span>
          </button>
        </div>

        {/* Add People Search Row */}
        {showAddMembersRow && (
          <div className="group-add-people-section">
            <div className="new-chat-search-bar" style={{ margin: '0 0 10px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search people to add..."
                value={addMemberSearch}
                onChange={(e) => handleSearchNewMembers(e.target.value)}
                className="new-chat-search-input"
                autoFocus
              />
            </div>

            {selectedNewMembers.length > 0 && (
              <div className="new-chat-selected-chips" style={{ marginBottom: '10px' }}>
                {selectedNewMembers.map((u) => (
                  <div key={u.id || u.userId} className="new-chat-user-chip">
                    <span>@{u.username}</span>
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleToggleSelectNewMember(u)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {addMemberResults.length > 0 && (
              <div className="group-add-member-results">
                {addMemberResults.map((target) => {
                  const isSelected = selectedNewMembers.some(
                    (u) => (u.id || u.userId) === (target.id || target.userId)
                  );
                  return (
                    <div
                      key={target.id || target.userId}
                      className={`new-chat-user-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleSelectNewMember(target)}
                    >
                      <Avatar
                        src={target.avatarUrl || target.profilePictureUrl}
                        alt={target.username}
                        size="sm"
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
                })}
              </div>
            )}

            {selectedNewMembers.length > 0 && (
              <button
                type="button"
                className="btn btn-primary btn-block"
                style={{ marginTop: '10px' }}
                onClick={handleAddMembersToGroup}
                disabled={isAddingMembers}
              >
                {isAddingMembers ? 'Adding...' : `Add to Group (${selectedNewMembers.length})`}
              </button>
            )}
          </div>
        )}

        {/* Members Section */}
        <div className="group-members-list-section">
          <div className="group-members-header">
            <span className="group-members-title">
              Members <span className="group-members-count">({(conversation.members || []).length})</span>
            </span>
          </div>

          <div className="group-members-list">
            {(conversation.members || []).map((member) => {
              const mId = member.id || member.userId;
              const isCreator = mId === conversation.creatorId;
              const isMe = mId === currentUserId;

              return (
                <div key={mId} className="group-member-item">
                  <div
                    className="group-member-info"
                    onClick={() => {
                      onClose();
                      if (mId) navigate(`/profile/${mId}`);
                    }}
                  >
                    <Avatar
                      src={member.avatarUrl || member.profilePictureUrl}
                      alt={member.username}
                      size="md"
                    />
                    <div className="group-member-meta">
                      <div className="group-member-name-row">
                        <span className="group-member-username">{member.username}</span>
                        {isCreator && <span className="group-admin-pill">Admin</span>}
                        {isMe && <span className="group-you-pill">You</span>}
                      </div>
                      {member.displayName && (
                        <span className="group-member-display">{member.displayName}</span>
                      )}
                    </div>
                  </div>

                  {/* Admin can remove member (if not themselves) */}
                  {isCurrentUserAdmin && !isMe && (
                    <button
                      type="button"
                      className="group-remove-member-btn"
                      onClick={() => handleRemoveMember(mId)}
                      title="Remove from group"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GroupDetailsModal;
