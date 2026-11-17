import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, EyeOff, UserX, Check, Plus, X } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import storyService from '../../services/story.service';
import userService from '../../services/user.service';
import followService from '../../services/follow.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './HideStoryModal.css';

const getEntityId = (user) => user?.id || user?.userId || user?.friendId;

export const StoryPrivacyPanel = ({ isModal = false, isOpen = true }) => {
  const [activeSubTab, setActiveSubTab] = useState('hidden'); // 'hidden' | 'add'
  const [hiddenUsers, setHiddenUsers] = useState([]);
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
      const [hRes, fRes] = await Promise.allSettled([
        typeof storyService.getHiddenStoryUsers === 'function'
          ? storyService.getHiddenStoryUsers()
          : Promise.resolve({ data: [] }),
        currentUserId && typeof followService?.getFollowing === 'function'
          ? followService.getFollowing(currentUserId, 0, 30)
          : Promise.resolve({ data: [] }),
      ]);

      if (hRes?.status === 'fulfilled') {
        const res = hRes.value;
        const list = res?.data?.content || res?.content || res?.data || res || [];
        setHiddenUsers(Array.isArray(list) ? list : []);
      }

      if (fRes?.status === 'fulfilled') {
        const res = fRes.value;
        const list = res?.data?.content || res?.content || res?.data || res || [];
        setFollowingUsers(Array.isArray(list) ? list : []);
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

  const hiddenUserIds = useMemo(
    () => new Set(hiddenUsers.map((u) => String(getEntityId(u)))),
    [hiddenUsers]
  );

  const isHidden = useCallback(
    (userId) => hiddenUserIds.has(String(userId)),
    [hiddenUserIds]
  );

  const handleHideUser = async (targetUser) => {
    const userId = getEntityId(targetUser);
    if (!userId || busyId === userId) return;
    try {
      setBusyId(userId);
      await storyService.hideStoryFromUser(userId);
      setHiddenUsers((prev) =>
        prev.some((u) => String(getEntityId(u)) === String(userId))
          ? prev
          : [...prev, targetUser]
      );
      showSuccess(`Story hidden from @${targetUser.username}`);
    } catch (err) {
      showError(err.message || 'Failed to hide story from user');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnhideUser = async (targetUser) => {
    const userId = getEntityId(targetUser);
    if (!userId || busyId === userId) return;
    try {
      setBusyId(userId);
      await storyService.unhideStoryFromUser(userId);
      setHiddenUsers((prev) =>
        prev.filter((u) => String(getEntityId(u)) !== String(userId))
      );
      showSuccess(`Story unhidden from @${targetUser.username}`);
    } catch (err) {
      showError(err.message || 'Failed to unhide story from user');
    } finally {
      setBusyId(null);
    }
  };

  const filteredHiddenUsers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return hiddenUsers;
    return hiddenUsers.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(term) ||
        (u.displayName || u.fullName || '').toLowerCase().includes(term)
    );
  }, [hiddenUsers, searchQuery]);

  const addCandidates = useMemo(() => {
    if (searchQuery.trim()) return searchResults;
    return followingUsers.filter(
      (u) => String(getEntityId(u)) !== String(currentUserId)
    );
  }, [searchQuery, searchResults, followingUsers, currentUserId]);

  const displayedList =
    activeSubTab === 'hidden' ? filteredHiddenUsers : addCandidates;

  const handleTabSwitch = (nextTab) => {
    setActiveSubTab(nextTab);
    setSearchQuery('');
  };

  return (
    <div className={`hide-story-panel ${isModal ? 'is-modal' : 'is-section'}`}>
      {!isModal && (
        <div className="hs-section-header">
          <div className="hs-section-title-row">
            <EyeOff size={22} className="hs-section-title-icon" />
            <h2 className="hs-section-title">Hide Story and Live</h2>
          </div>
          <p className="hs-section-subtitle">
            Choose who can't see your stories and live videos. They won't be notified that you've hidden your story.
          </p>
        </div>
      )}

      {isModal && (
        <div className="hide-story-header-desc">
          Choose who can't see your stories and live videos. They won't be notified that you've hidden your story.
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="hs-tabs-bar" role="tablist" aria-label="Story privacy sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'hidden'}
          className={`hs-tab-btn ${activeSubTab === 'hidden' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('hidden')}
        >
          <EyeOff size={15} />
          <span>Hidden ({hiddenUsers.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'add'}
          className={`hs-tab-btn ${activeSubTab === 'add' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('add')}
        >
          <UserX size={15} />
          <span>Hide from People</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="hs-search-wrap">
        <Search size={16} className="hs-search-icon" />
        <input
          type="text"
          className="hs-search-input"
          placeholder={
            activeSubTab === 'hidden'
              ? 'Search hidden accounts...'
              : 'Search people to hide story from...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="hs-search-clear-btn"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* List Stream */}
      <div className="hs-cards-list">
        {loading || (activeSubTab === 'add' && searching) ? (
          <SkeletonUserRows count={4} showAction />
        ) : displayedList.length > 0 ? (
          displayedList.map((u) => {
            const uId = getEntityId(u);
            const userHidden = isHidden(uId);

            return (
              <div key={uId} className="hs-user-card">
                <div className="hs-user-info">
                  <Avatar
                    src={u.avatarUrl || u.profilePictureUrl}
                    alt={u.username}
                    size="md"
                  />
                  <div className="hs-user-names">
                    <span className="hs-username">{u.username}</span>
                    <span className="hs-displayname">
                      {u.displayName || u.fullName || ''}
                    </span>
                  </div>
                </div>

                {activeSubTab === 'hidden' ? (
                  <button
                    type="button"
                    className="hs-action-btn unhide"
                    disabled={busyId === uId}
                    onClick={() => handleUnhideUser(u)}
                  >
                    Unhide
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`hs-action-btn ${userHidden ? 'already-hidden' : 'hide-action'}`}
                    disabled={busyId === uId}
                    onClick={() =>
                      userHidden ? handleUnhideUser(u) : handleHideUser(u)
                    }
                  >
                    {userHidden ? (
                      <>
                        <Check size={14} />
                        <span>Hidden</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Hide</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="hs-empty-box">
            <p className="hs-empty-text">
              {activeSubTab === 'hidden'
                ? searchQuery.trim()
                  ? 'No hidden accounts match your search.'
                  : 'You haven\'t hidden your story from anyone.'
                : searchQuery.trim()
                ? 'No accounts found matching that search.'
                : 'Search accounts above to hide your stories and live videos from them.'}
            </p>
            {activeSubTab === 'hidden' && !searchQuery.trim() && (
              <button
                type="button"
                className="hs-action-btn hide-action"
                onClick={() => handleTabSwitch('add')}
              >
                <UserX size={14} />
                <span>Hide from people</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const HideStoryModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hide Story and Live" size="md">
      <StoryPrivacyPanel isModal={true} isOpen={isOpen} />
    </Modal>
  );
};

export default HideStoryModal;
