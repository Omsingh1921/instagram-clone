import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, UserPlus, UserCheck, Heart } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import engagementService from '../../services/engagement.service';
import reelService from '../../services/reel.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './LikesModal.css';

export const LikesModal = ({
  isOpen,
  onClose,
  targetId,
  targetType = 'post', // 'post' or 'reel'
  title = 'Likes',
}) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [followingOverrides, setFollowingOverrides] = useState({});

  const { user: currentUser, isFollowing: checkIsFollowing, toggleFollow } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const fetchLikes = useCallback(async (pageNum = 0, append = false) => {
    if (!targetId) return;
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = targetType === 'reel'
        ? await reelService.getLikes(targetId, pageNum, 20)
        : await engagementService.getPostLikes(targetId, pageNum, 20);

      const pageData = res?.data || res;
      const list = pageData?.content || (Array.isArray(pageData) ? pageData : []);
      const isLast = pageData?.last ?? (list.length < 20);

      setUsers((prev) => (append ? [...prev, ...list] : list));
      setHasMore(!isLast && list.length > 0);
      setPage(pageNum);
    } catch (err) {
      showError(err.message || 'Failed to load likes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [targetId, targetType, showError]);

  useEffect(() => {
    if (isOpen && targetId) {
      setSearch('');
      setPage(0);
      setFollowingOverrides({});
      fetchLikes(0, false);
    } else {
      setUsers([]);
    }
  }, [isOpen, targetId, fetchLikes]);

  const handleToggleFollow = async (u) => {
    const userId = u.id;
    if (!userId) return;

    const currentFollowState = followingOverrides[userId] !== undefined
      ? followingOverrides[userId]
      : (checkIsFollowing ? checkIsFollowing(userId) : Boolean(u.following || u.followedByCurrentUser));

    const nextState = !currentFollowState;
    setFollowingOverrides((prev) => ({ ...prev, [userId]: nextState }));

    try {
      if (toggleFollow) {
        await toggleFollow(userId);
      }
    } catch (err) {
      // Revert on error
      setFollowingOverrides((prev) => ({ ...prev, [userId]: currentFollowState }));
      showError(err.message || 'Failed to update follow status');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="likes-modal-container">
        <div className="likes-search-box">
          <SearchIcon size={16} className="likes-search-icon" />
          <input
            type="text"
            className="likes-search-input"
            placeholder="Search likes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="likes-users-list">
          {loading ? (
            <SkeletonUserRows count={5} showAction />
          ) : filteredUsers.length === 0 ? (
            <div className="likes-empty-state">
              <Heart size={36} className="likes-empty-icon" />
              <span>{search ? 'No users found matching your search' : 'No likes yet'}</span>
            </div>
          ) : (
            <>
              {filteredUsers.map((u) => {
                const isMe = currentUser?.id && String(currentUser.id) === String(u.id);
                const isUserFollowing = followingOverrides[u.id] !== undefined
                  ? followingOverrides[u.id]
                  : (checkIsFollowing ? checkIsFollowing(u.id) : Boolean(u.following || u.followedByCurrentUser));

                return (
                  <div key={u.id} className="likes-user-item">
                    <div
                      className="likes-user-info"
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${u.id || u.username}`);
                      }}
                    >
                      <Avatar
                        src={u.avatarUrl || u.profilePictureUrl}
                        alt={u.username}
                        size="sm"
                      />
                      <div className="likes-user-names">
                        <span className="likes-username">@{u.username}</span>
                        <span className="likes-fullname">{u.displayName || u.fullName || u.username}</span>
                      </div>
                    </div>

                    {!isMe && (
                      <button
                        type="button"
                        className={`btn likes-follow-btn ${isUserFollowing ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleFollow(u)}
                      >
                        {isUserFollowing ? (
                          <>
                            <UserCheck size={14} />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {hasMore && !search && (
                <div className="likes-load-more-wrapper">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={loadingMore}
                    onClick={() => fetchLikes(page + 1, true)}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LikesModal;
