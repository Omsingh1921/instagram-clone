import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Users, UserPlus, Check, Plus, X } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import storyService from '../../services/story.service';
import userService from '../../services/user.service';
import followService from '../../services/follow.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './CloseFriendsModal.css';

const getEntityId = (user) => user?.id || user?.friendId || user?.userId;

export const CloseFriendsPanel = ({ isModal = false, isOpen = true }) => {
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' | 'add'
  const [closeFriends, setCloseFriends] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const currentUserId = currentUser?.id || currentUser?.userId;

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const tasks = [storyService.getCloseFriends()];
      if (currentUserId && followService.getFollowing) {
        tasks.push(followService.getFollowing(currentUserId, 0, 30));
      }

      const results = await Promise.allSettled(tasks);
      if (results[0]?.status === 'fulfilled') {
        const res = results[0].value;
        const list = res?.data?.content || res?.content || res?.data || res || [];
        setCloseFriends(Array.isArray(list) ? list : []);
      }

      if (results[1]?.status === 'fulfilled') {
        const fRes = results[1].value;
        const fList = fRes?.data?.content || fRes?.content || fRes?.data || fRes || [];
        setFollowingUsers(Array.isArray(fList) ? fList : []);
      }
    } catch {
      // Non-critical fallback
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, fetchInitialData]);

  // Search accounts dynamically when on the 'add' tab
  useEffect(() => {
    if (activeSubTab !== 'add' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await userService.searchUsers(searchQuery, 0, 20);
        const list = res?.data?.content || res?.content || res?.data || [];
        const normalized = Array.isArray(list) ? list : [];
        setSearchResults(
          normalized.filter(
            (u) =>
              String(getEntityId(u)) !== String(currentUserId) &&
              u.username !== currentUser?.username &&
              u.role !== 'ROLE_ADMIN' &&
              u.role !== 'ADMIN' &&
              u.username?.toLowerCase() !== 'admin'
          )
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [activeSubTab, searchQuery, currentUserId, currentUser?.username]);

  const closeFriendIds = useMemo(
    () => new Set(closeFriends.map((f) => String(getEntityId(f)))),
    [closeFriends]
  );

  const isFriend = useCallback(
    (userId) => closeFriendIds.has(String(userId)),
    [closeFriendIds]
  );

  const handleAddFriend = async (targetUser) => {
    const userId = getEntityId(targetUser);
    if (!userId || busyId === userId) return;
    try {
      setBusyId(userId);
      await storyService.addCloseFriend(userId);
      setCloseFriends((prev) =>
        prev.some((f) => String(getEntityId(f)) === String(userId))
          ? prev
          : [...prev, targetUser]
      );
      showSuccess(`Added @${targetUser.username} to Close Friends`);
    } catch (err) {
      showError(err.message || 'Failed to add Close Friend');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveFriend = async (targetUser) => {
    const userId = getEntityId(targetUser);
    if (!userId || busyId === userId) return;
    try {
      setBusyId(userId);
      await storyService.removeCloseFriend(userId);
      setCloseFriends((prev) =>
        prev.filter((f) => String(getEntityId(f)) !== String(userId))
      );
      showSuccess(`Removed @${targetUser.username} from Close Friends`);
    } catch (err) {
      showError(err.message || 'Failed to remove Close Friend');
    } finally {
      setBusyId(null);
    }
  };

  const filteredExistingFriends = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return closeFriends;
    return closeFriends.filter(
      (f) =>
        (f.username || '').toLowerCase().includes(term) ||
        (f.displayName || f.fullName || '').toLowerCase().includes(term)
    );
  }, [closeFriends, searchQuery]);

  const addCandidates = useMemo(() => {
    if (searchQuery.trim()) return searchResults;
    return followingUsers.filter(
      (u) => String(getEntityId(u)) !== String(currentUserId)
    );
  }, [searchQuery, searchResults, followingUsers, currentUserId]);

  const displayedList =
    activeSubTab === 'list' ? filteredExistingFriends : addCandidates;

  const handleTabSwitch = (nextTab) => {
    setActiveSubTab(nextTab);
    setSearchQuery('');
  };

  return (
    <div className={`close-friends-panel ${isModal ? 'is-modal' : 'is-section'}`}>
      {!isModal && (
        <div className="cf-section-header">
          <div className="cf-section-title-row">
            <Users size={22} className="cf-section-title-icon" />
            <h2 className="cf-section-title">Close Friends</h2>
          </div>
          <p className="cf-section-subtitle">
            Choose the people you want to share your stories with. Only people on your Close Friends list will see stories you share with the green badge.
          </p>
        </div>
      )}

      {isModal && (
        <div className="close-friends-header-desc">
          Choose the people you want to share your stories with. Only people on your Close Friends list will see stories you share with the green badge.
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="cf-tabs-bar" role="tablist" aria-label="Close Friends sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'list'}
          className={`cf-tab-btn ${activeSubTab === 'list' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('list')}
        >
          <Users size={15} />
          <span>All Close Friends ({closeFriends.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'add'}
          className={`cf-tab-btn ${activeSubTab === 'add' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('add')}
        >
          <UserPlus size={15} />
          <span>Add to Close Friends</span>
        </button>
      </div>

      {/* Search Pill */}
      <div className="cf-search-wrap">
        <Search size={16} className="cf-search-icon" />
        <input
          type="text"
          className="cf-search-input"
          placeholder={
            activeSubTab === 'list'
              ? 'Search your close friends...'
              : 'Search accounts to add...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="cf-search-clear-btn"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* List Stream */}
      <div className="cf-cards-list">
        {loading || (activeSubTab === 'add' && searching) ? (
          <SkeletonUserRows count={4} showAction />
        ) : displayedList.length > 0 ? (
          displayedList.map((u) => {
            const uId = getEntityId(u);
            const added = isFriend(uId);
            const hasStory = Boolean(u.hasActiveStory || u.hasStory);

            return (
              <div key={uId} className="cf-user-card">
                <div className="close-friends-user-info">
                  <Avatar
                    src={u.avatarUrl || u.profilePictureUrl}
                    alt={u.username}
                    size="md"
                    hasStory={hasStory}
                  />
                  <div className="close-friends-names">
                    <span className="close-friends-username">{u.username}</span>
                    <span className="close-friends-displayname">
                      {u.displayName || u.fullName || ''}
                    </span>
                  </div>
                </div>

                {activeSubTab === 'list' ? (
                  <button
                    type="button"
                    className="cf-action-btn remove"
                    disabled={busyId === uId}
                    onClick={() => handleRemoveFriend(u)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`cf-action-btn ${added ? 'added' : 'add'}`}
                    disabled={busyId === uId}
                    onClick={() =>
                      added ? handleRemoveFriend(u) : handleAddFriend(u)
                    }
                  >
                    {added ? (
                      <>
                        <Check size={14} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="cf-empty-box">
            <p className="cf-empty-text">
              {activeSubTab === 'list'
                ? searchQuery.trim()
                  ? 'No close friends match your search.'
                  : 'No close friends added yet.'
                : searchQuery.trim()
                ? 'No accounts found matching that search.'
                : 'Type a username above to find and add people to your Close Friends list.'}
            </p>
            {activeSubTab === 'list' && !searchQuery.trim() && (
              <button
                type="button"
                className="cf-action-btn add"
                onClick={() => handleTabSwitch('add')}
              >
                <UserPlus size={14} />
                <span>Add Close Friends</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const CloseFriendsModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Friends" size="md">
      <CloseFriendsPanel isModal={true} isOpen={isOpen} />
    </Modal>
  );
};

export default CloseFriendsModal;
