import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  BadgeCheck,
  PlusSquare,
  Bell,
  ChevronDown,
  X,
  User as UserIcon,
  Settings,
  LogOut,
} from 'lucide-react';
import StoryBar from '../components/story/StoryBar';
import PostCard from '../components/post/PostCard';
import UploadingPostCard from '../components/post/UploadingPostCard';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import { SkeletonPostCard, SkeletonUserRows } from '../components/ui/Skeleton';
import feedService from '../services/feed.service';
import userService from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import './HomePage.css';

const FEED_PAGE_SIZE = 5;

const FEED_TABS = [
  { id: 'ALGORITHMIC', label: 'For you' },
  { id: 'FOLLOWING', label: 'Following' },
];

export const HomePage = () => {
  const [feedMode, setFeedMode] = useState('ALGORITHMIC');
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const { user: currentUser, isFollowing, toggleFollow, isAdmin, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const uploadCtx = useUpload();

  const activePostUploads = (uploadCtx?.uploads || []).filter(
    (u) => (u.type === 'post' || u.type === 'reel') && u.status === 'uploading'
  );

  const isUserAdmin =
    isAdmin ||
    currentUser?.role === 'ROLE_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.username?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [profileMenuOpen]);

  const fetchFeed = useCallback(
    async (pageNum = 0, append = false, modeOverride = feedMode) => {
      try {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        const res = await feedService.getHomeFeed(pageNum, FEED_PAGE_SIZE, modeOverride);
        const postList = res?.data?.content || res?.content || res?.data || [];
        const isLast = res?.data?.last ?? res?.last ?? postList.length < FEED_PAGE_SIZE;

        if (append) {
          setPosts((prev) => [...prev, ...postList]);
        } else {
          setPosts(postList);
        }

        if (postList.length > 0) {
          const ids = postList.map((p) => p.id).filter(Boolean);
          if (ids.length > 0) {
            feedService.recordSeen(ids).catch(() => {});
          }
        }

        setHasMore(!isLast && postList.length > 0);
        setPage(pageNum);
      } catch {
        if (!append) setPosts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [feedMode]
  );

  const loadSuggestions = useCallback(async () => {
    try {
      setLoadingSuggestions(true);
      const res = await userService.getSuggestedUsers(8);
      const userList = res?.data || res?.content || [];
      setSuggestions(Array.isArray(userList) ? userList : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (isUserAdmin) return;
    fetchFeed(0, false, feedMode);
    loadSuggestions();

    const handleRefresh = () => {
      fetchFeed(0, false, feedMode);
      loadSuggestions();
    };
    window.addEventListener('feed:refresh', handleRefresh);
    return () => window.removeEventListener('feed:refresh', handleRefresh);
  }, [fetchFeed, loadSuggestions, isUserAdmin, feedMode]);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: () => fetchFeed(page + 1, true, feedMode),
  });

  const handleFollowToggle = async (userId) => {
    try {
      const nextState = await toggleFollow(userId);
      if (nextState) {
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const handleDismissSuggestion = (userId) => {
    setDismissedIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const handlePostDeleted = useCallback((deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  }, []);

  const handlePostUpdated = useCallback(() => {}, []);

  const handleQuickLogout = async () => {
    setProfileMenuOpen(false);
    try {
      await logout();
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      } else {
        navigate('/login');
      }
    } catch {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      } else {
        navigate('/login');
      }
    }
  };

  if (isUserAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const visibleSuggestions = suggestions
    .filter((u) => !dismissedIds.includes(u.id))
    .slice(0, 5);

  return (
    <div className="home-page-container">
      <div className="home-layout-grid">
        {/* Main Feed Column */}
        <section className="home-feed-column">
          {/* Feed Mode Tabs: For you | Following */}
          <div className="home-feed-tabs-bar" role="tablist" aria-label="Feed view">
            {FEED_TABS.map((tab) => {
              const active = feedMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`home-feed-tab-btn ${active ? 'active' : ''}`}
                  onClick={() => {
                    if (tab.id !== feedMode) {
                      setFeedMode(tab.id);
                    }
                  }}
                >
                  <span>{tab.label}</span>
                  {active && <span className="home-tab-indicator" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* Stories Bar */}
          <StoryBar />

          {/* Feed Posts */}
          {loading ? (
            <div className="w-full flex flex-col items-center">
              <SkeletonPostCard />
              <SkeletonPostCard />
            </div>
          ) : (
            <>
              {activePostUploads.map((upload) => (
                <UploadingPostCard
                  key={upload.id}
                  upload={upload}
                  currentUser={currentUser}
                />
              ))}

              {posts.length === 0 && activePostUploads.length === 0 ? (
                <EmptyState
                  icon={Compass}
                  title={feedMode === 'FOLLOWING' ? 'No posts from people you follow' : 'Welcome to Instagram!'}
                  description={
                    feedMode === 'FOLLOWING'
                      ? 'Follow more accounts or switch back to For you to discover popular creators and posts.'
                      : "When you follow people, you'll see the photos and videos they post here. Discover creators and connect with friends."
                  }
                  actionLabel={feedMode === 'FOLLOWING' ? 'Switch to For you' : 'Explore Posts'}
                  onAction={() => {
                    if (feedMode === 'FOLLOWING') {
                      setFeedMode('ALGORITHMIC');
                    } else {
                      navigate('/explore');
                    }
                  }}
                />
              ) : (
                posts.map((post, idx) => (
                  <PostCard
                    key={`${post.id || 'post'}-${idx}`}
                    post={post}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                  />
                ))
              )}

              {hasMore && (
                <div ref={sentinelRef} className="w-full flex flex-col items-center py-2">
                  {loadingMore ? (
                    <SkeletonPostCard />
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary feed-load-more-btn"
                      onClick={() => fetchFeed(page + 1, true, feedMode)}
                    >
                      Load more posts
                    </button>
                  )}
                </div>
              )}

              {!hasMore && (posts.length > 0 || activePostUploads.length > 0) && (
                <div className="feed-caught-up-banner">
                  <Sparkles size={20} style={{ margin: '0 auto 8px', color: '#a855f7' }} />
                  <p>You're all caught up!</p>
                  <span>You've seen all new posts from accounts you follow.</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* Right Sidebar Rail */}
        <aside className="home-sidebar-column">
          {/* Top-Right Quick Action Utility Strip */}
          <div className="home-top-utility-bar">
            <button
              type="button"
              className="home-utility-icon-btn"
              onClick={() => window.dispatchEvent(new Event('app:open-create'))}
              title="Create post or story"
              aria-label="Create"
            >
              <PlusSquare size={20} strokeWidth={1.9} />
            </button>

            <button
              type="button"
              className="home-utility-icon-btn"
              onClick={() => navigate('/notifications')}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.9} />
            </button>

            <div className="home-utility-profile-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="home-utility-avatar-btn"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="Account menu"
              >
                <Avatar
                  src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
                  alt={currentUser?.username || 'Account'}
                  size="sm"
                />
                <ChevronDown size={14} />
              </button>

              {profileMenuOpen && (
                <div className="home-utility-dropdown" role="menu">
                  <button
                    type="button"
                    className="home-utility-drop-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate(`/profile/${currentUser?.id || ''}`);
                    }}
                  >
                    <UserIcon size={15} />
                    <span>View Profile</span>
                  </button>
                  <button
                    type="button"
                    className="home-utility-drop-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings size={15} />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    className="home-utility-drop-item danger"
                    onClick={handleQuickLogout}
                  >
                    <LogOut size={15} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Current User Profile Glass Card */}
          <div className="home-user-glass-card">
            <div
              className="home-user-card-left"
              onClick={() => navigate(`/profile/${currentUser?.id || ''}`)}
            >
              <Avatar
                src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
                alt={currentUser?.username || 'You'}
                size="md"
              />
              <div className="sidebar-user-names">
                <span className="sidebar-username">{currentUser?.username || 'user'}</span>
                <span className="sidebar-fullname">
                  {currentUser?.displayName || currentUser?.fullName || currentUser?.username || ''}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="home-edit-profile-pill"
              onClick={() => navigate('/settings')}
            >
              Edit profile
            </button>
          </div>

          {/* Suggested For You Glass Card */}
          {(loadingSuggestions || visibleSuggestions.length > 0) && (
            <div className="home-suggestions-glass-card">
              <div className="suggestions-header">
                <span className="suggestions-title">Suggested for you</span>
                <button
                  type="button"
                  className="suggestions-see-all-btn"
                  onClick={() => navigate('/explore')}
                >
                  See All
                </button>
              </div>

              {loadingSuggestions && visibleSuggestions.length === 0 ? (
                <SkeletonUserRows count={4} compact showAction />
              ) : (
                <div className="suggestions-list">
                {visibleSuggestions.map((u, idx) => {
                  const isItemFollowing = isFollowing(u.id);
                  const mutualCount = u.mutualsCount || 0;
                  const mutualAvatars = u.mutualAvatars || [];

                  return (
                    <div key={u.id || idx} className="suggestion-item">
                      <div
                        className="suggestion-info"
                        onClick={() => {
                          if (u.id) {
                            navigate(`/profile/${u.id}`);
                          }
                        }}
                      >
                        <Avatar
                          src={u.avatarUrl || u.profilePictureUrl}
                          alt={u.username}
                          size="md"
                          hasStory={Boolean(u.hasActiveStory)}
                          className="suggestion-user-avatar"
                        />
                        <div className="sidebar-user-names">
                          <div className="sidebar-suggestion-name-row">
                            <span className="sidebar-username">{u.username || u.displayName}</span>
                            {(u.isVerified || u.verified) && (
                              <BadgeCheck
                                size={13}
                                fill="#0095f6"
                                color="#ffffff"
                                style={{ marginLeft: '3px', flexShrink: 0 }}
                              />
                            )}
                          </div>
                          {mutualCount > 0 && mutualAvatars.length > 0 ? (
                            <div className="sidebar-mutuals-row">
                              <div className="sidebar-mutual-stack">
                                {mutualAvatars.map((mUrl, mi) => (
                                  <img
                                    key={mi}
                                    src={mUrl}
                                    alt="mutual"
                                    className="sidebar-mutual-avatar-tiny"
                                    style={{ zIndex: 3 - mi }}
                                  />
                                ))}
                              </div>
                              <span className="sidebar-mutual-text">{mutualCount} mutuals</span>
                            </div>
                          ) : (
                            <span className="sidebar-fullname">Suggested for you</span>
                          )}
                        </div>
                      </div>

                      <div className="suggestion-actions-group">
                        <button
                          type="button"
                          className={`suggestion-follow-pill ${isItemFollowing ? 'following' : ''}`}
                          onClick={() => handleFollowToggle(u.id)}
                        >
                          {isItemFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button
                          type="button"
                          className="suggestion-dismiss-btn"
                          onClick={() => handleDismissSuggestion(u.id)}
                          aria-label={`Dismiss ${u.username}`}
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}

          {/* Footer Links */}
          <footer className="sidebar-footer-links">
            <div className="sidebar-footer-row">
              <a href="https://about.instagram.com" target="_blank" rel="noreferrer">About</a>
              <a href="https://help.instagram.com" target="_blank" rel="noreferrer">Help</a>
              <a href="https://about.instagram.com/blog" target="_blank" rel="noreferrer">Press</a>
              <a href="https://developers.facebook.com" target="_blank" rel="noreferrer">API</a>
              <a href="https://about.instagram.com/about-us/careers" target="_blank" rel="noreferrer">Jobs</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>
            <div className="copyright-text">© 2026 INSTAGRAM CLONE FROM META</div>
          </footer>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
