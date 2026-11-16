import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Film,
  Grid,
  Archive,
  Trash2,
  Clock,
  History,
  RotateCcw,
  CheckCircle2,
  Shield,
  Bell,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SkeletonMediaGrid } from '../../components/ui/Skeleton';
import postService from '../../services/post.service';
import reelService from '../../services/reel.service';
import storyService from '../../services/story.service';
import settingsService from '../../services/settings.service';
import { getLocalIsoDate } from '../../hooks/useScreenTimeTracker';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCount, formatDate } from '../../utils';
import './YourActivityPage.css';

const TABS = [
  { id: 'interactions', label: 'Interactions', icon: Heart, description: 'Review and manage likes, comments, and other interactions' },
  { id: 'media', label: 'Photos and videos', icon: Grid, description: 'View and manage posts and reels you have shared' },
  { id: 'archived', label: 'Archived', icon: Archive, description: 'View and manage stories, posts, and reels you have archived' },
  { id: 'deleted', label: 'Recently deleted', icon: Trash2, description: 'Restore content you deleted in the last 30 days' },
  { id: 'time', label: 'Time spent', icon: Clock, description: 'See how much time you usually spend on Instagram' },
  { id: 'history', label: 'Account history', icon: History, description: 'Review changes you have made to your account since you created it' },
];

const buildEmptyWeekBreakdown = () => {
  const days = [];
  const base = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    days.push({
      date: getLocalIsoDate(d),
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: 0,
      seconds: 0,
    });
  }
  return days;
};

const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

export const YourActivityPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TAB_IDS.has(initialTab) ? initialTab : 'interactions'
  );
  const [subTab, setSubTab] = useState('likes'); // interactions: 'likes' | 'comments'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && VALID_TAB_IDS.has(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Data states
  const [likedPosts, setLikedPosts] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(false);

  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const [archivedStories, setArchivedStories] = useState([]);
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [archivedReels, setArchivedReels] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const [deletedPosts, setDeletedPosts] = useState([]);
  const [deletedReels, setDeletedReels] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

  // Time management state
  const [breakReminder, setBreakReminder] = useState(
    () => localStorage.getItem('break_reminder_mins') || '0'
  );
  const [screenTimeSummary, setScreenTimeSummary] = useState(() => ({
    dailyAverageMinutes: 0,
    todayMinutes: 0,
    dailyBreakdown: buildEmptyWeekBreakdown(),
  }));
  const [loadingScreenTime, setLoadingScreenTime] = useState(false);

  // Account history state (2 minimal independent endpoints)
  const [accountCreatedAt, setAccountCreatedAt] = useState(() => user?.createdAt || null);
  const [passwordHistory, setPasswordHistory] = useState({ lastChangedAt: null, changeCount: 0 });
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadAccountHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [createdResult, passwordResult] = await Promise.allSettled([
        settingsService.getAccountCreated(),
        settingsService.getPasswordHistory(),
      ]);

      if (createdResult.status === 'fulfilled') {
        const createdData = createdResult.value?.data || createdResult.value;
        setAccountCreatedAt(createdData?.accountCreatedAt || user?.createdAt || null);
      } else if (user?.createdAt) {
        setAccountCreatedAt(user.createdAt);
      }

      if (passwordResult.status === 'fulfilled') {
        const pwData = passwordResult.value?.data || passwordResult.value;
        setPasswordHistory({
          lastChangedAt: pwData?.lastChangedAt || null,
          changeCount: Number(pwData?.changeCount) || 0,
        });
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.createdAt]);

  const loadScreenTime = useCallback(async () => {
    try {
      setLoadingScreenTime(true);
      const res = await settingsService.getScreenTime(7, getLocalIsoDate());
      const data = res?.data || res;
      if (data) {
        setScreenTimeSummary({
          dailyAverageMinutes: Number(data.dailyAverageMinutes) || 0,
          todayMinutes: Number(data.todayMinutes) || 0,
          dailyBreakdown:
            Array.isArray(data.dailyBreakdown) && data.dailyBreakdown.length > 0
              ? data.dailyBreakdown
              : buildEmptyWeekBreakdown(),
        });
        if (typeof data.breakReminderMinutes === 'number') {
          const minsStr = String(data.breakReminderMinutes);
          setBreakReminder(minsStr);
          localStorage.setItem('break_reminder_mins', minsStr);
        }
      }
    } catch {
      // Keep fallback breakdown when offline/unavailable
    } finally {
      setLoadingScreenTime(false);
    }
  }, []);

  // Load Liked Content
  const loadLikedPosts = useCallback(async () => {
    try {
      setLoadingLiked(true);
      const res = await postService.getLikedPosts(0, 30);
      const items = res?.data?.content || res?.content || res?.data || [];
      setLikedPosts(Array.isArray(items) ? items : []);
    } catch {
      setLikedPosts([]);
    } finally {
      setLoadingLiked(false);
    }
  }, []);

  // Load User Media
  const loadUserMedia = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingMedia(true);
      const [postsRes, reelsRes] = await Promise.all([
        postService.getUserPosts(user.id, 0, 30).catch(() => ({ data: { content: [] } })),
        reelService.getUserReels(user.id, 0, 30).catch(() => ({ data: { content: [] } })),
      ]);
      const pItems = postsRes?.data?.content || postsRes?.content || postsRes?.data || [];
      const rItems = reelsRes?.data?.content || reelsRes?.content || reelsRes?.data || [];
      setUserPosts(Array.isArray(pItems) ? pItems : []);
      setUserReels(Array.isArray(rItems) ? rItems : []);
    } finally {
      setLoadingMedia(false);
    }
  }, [user?.id]);

  // Load Archived Content
  const loadArchived = useCallback(async () => {
    try {
      setLoadingArchived(true);
      const [storiesRes, postsRes, reelsRes] = await Promise.all([
        storyService.getStoryArchive(0, 30).catch(() => ({ data: { content: [] } })),
        postService.getArchivedPosts(0, 30).catch(() => ({ data: { content: [] } })),
        reelService.getArchivedReels(0, 30).catch(() => ({ data: { content: [] } })),
      ]);
      const sItems = storiesRes?.data?.content || storiesRes?.content || storiesRes?.data || [];
      const pItems = postsRes?.data?.content || postsRes?.content || postsRes?.data || [];
      const rItems = reelsRes?.data?.content || reelsRes?.content || reelsRes?.data || [];
      setArchivedStories(Array.isArray(sItems) ? sItems : []);
      setArchivedPosts(Array.isArray(pItems) ? pItems : []);
      setArchivedReels(Array.isArray(rItems) ? rItems : []);
    } finally {
      setLoadingArchived(false);
    }
  }, []);

  // Load Recently Deleted Content
  const loadDeleted = useCallback(async () => {
    try {
      setLoadingDeleted(true);
      const [postsRes, reelsRes] = await Promise.all([
        postService.getRecentlyDeletedPosts(0, 30).catch(() => ({ data: { content: [] } })),
        reelService.getRecentlyDeletedReels(0, 30).catch(() => ({ data: { content: [] } })),
      ]);
      const pItems = postsRes?.data?.content || postsRes?.content || postsRes?.data || [];
      const rItems = reelsRes?.data?.content || reelsRes?.content || reelsRes?.data || [];
      setDeletedPosts(Array.isArray(pItems) ? pItems : []);
      setDeletedReels(Array.isArray(rItems) ? rItems : []);
    } finally {
      setLoadingDeleted(false);
    }
  }, []);

  // Sync on tab change
  useEffect(() => {
    if (activeTab === 'interactions') {
      loadLikedPosts();
    } else if (activeTab === 'media') {
      loadUserMedia();
    } else if (activeTab === 'archived') {
      loadArchived();
    } else if (activeTab === 'deleted') {
      loadDeleted();
    } else if (activeTab === 'time') {
      loadScreenTime();
    } else if (activeTab === 'history') {
      loadAccountHistory();
    }
  }, [activeTab, loadLikedPosts, loadUserMedia, loadArchived, loadDeleted, loadScreenTime, loadAccountHistory]);

  // Refresh time-spent chart live when a background heartbeat flushes
  useEffect(() => {
    if (activeTab !== 'time') return undefined;
    const handleFlushed = () => loadScreenTime();
    window.addEventListener('app:screen-time-flushed', handleFlushed);
    return () => window.removeEventListener('app:screen-time-flushed', handleFlushed);
  }, [activeTab, loadScreenTime]);

  // Actions for Deleted Posts
  const handleRestorePost = async (postId) => {
    try {
      await postService.restorePost(postId);
      showSuccess('Post restored to your profile');
      setDeletedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      showError('Failed to restore post');
    }
  };

  const handlePermanentDeletePost = async (postId) => {
    if (!window.confirm('Permanently delete this post? This cannot be undone.')) return;
    try {
      await postService.permanentlyDeletePost(postId);
      showSuccess('Post permanently deleted');
      setDeletedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      showError('Failed to delete post permanently');
    }
  };

  // Actions for Deleted Reels
  const handleRestoreReel = async (reelId) => {
    try {
      await reelService.restoreReel(reelId);
      showSuccess('Reel restored to your profile');
      setDeletedReels((prev) => prev.filter((r) => r.id !== reelId));
    } catch {
      showError('Failed to restore reel');
    }
  };

  const handlePermanentDeleteReel = async (reelId) => {
    if (!window.confirm('Permanently delete this reel? This cannot be undone.')) return;
    try {
      await reelService.permanentlyDeleteReel(reelId);
      showSuccess('Reel permanently deleted');
      setDeletedReels((prev) => prev.filter((r) => r.id !== reelId));
    } catch {
      showError('Failed to delete reel permanently');
    }
  };

  // Actions for Archived Posts
  const handleUnarchivePost = async (postId) => {
    try {
      await postService.toggleArchivePost(postId);
      showSuccess('Post unarchived and visible on your profile');
      setArchivedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      showError('Failed to unarchive post');
    }
  };

  const handleUnarchiveReel = async (reelId) => {
    try {
      await reelService.unarchiveReel(reelId);
      showSuccess('Reel unarchived and visible on your profile');
      setArchivedReels((prev) => prev.filter((r) => r.id !== reelId));
    } catch {
      showError('Failed to unarchive reel');
    }
  };

  // Break Reminder Handler
  const handleBreakReminderChange = async (mins) => {
    const previous = breakReminder;
    const numericMins = Number(mins);
    setBreakReminder(mins);
    localStorage.setItem('break_reminder_mins', mins);
    window.dispatchEvent(
      new CustomEvent('app:break-reminder-updated', { detail: { minutes: numericMins } })
    );

    try {
      await settingsService.updateSettings({ breakReminderMinutes: numericMins });
      if (mins === '0') {
        showSuccess('Break reminder turned off');
      } else {
        showSuccess(`Break reminder set for every ${mins} minutes`);
      }
    } catch {
      setBreakReminder(previous);
      localStorage.setItem('break_reminder_mins', previous);
      window.dispatchEvent(
        new CustomEvent('app:break-reminder-updated', { detail: { minutes: Number(previous) } })
      );
      showError('Failed to save break reminder preference');
    }
  };

  return (
    <div className="your-activity-container">
      {/* Sidebar Navigation */}
      <aside className="activity-sidebar">
        <div className="activity-sidebar-header">
          <h2>Your activity</h2>
        </div>
        <nav className="activity-nav-list" aria-label="Your Activity Navigation">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`activity-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSubTab(tab.id === 'interactions' ? 'likes' : 'posts');
                  setSearchParams({ tab: tab.id }, { replace: true });
                }}
              >
                <Icon size={20} className="activity-nav-icon" />
                <div className="activity-nav-text">
                  <span className="activity-nav-label">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="activity-main-content">
        {/* TAB 1: INTERACTIONS */}
        {activeTab === 'interactions' && (
          <section className="activity-section">
            <div className="activity-header">
              <h1>Interactions</h1>
              <p>Review and manage likes, comments, and other interactions you have made.</p>
            </div>

            <div className="activity-subtab-bar">
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'likes' ? 'active' : ''}`}
                onClick={() => setSubTab('likes')}
              >
                Likes ({likedPosts.length})
              </button>
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'comments' ? 'active' : ''}`}
                onClick={() => setSubTab('comments')}
              >
                Comments
              </button>
            </div>

            {subTab === 'likes' && (
              <div className="activity-grid-wrapper">
                {loadingLiked ? (
                  <div className="activity-loading-center">
                    <SkeletonMediaGrid count={6} />
                  </div>
                ) : likedPosts.length === 0 ? (
                  <div className="activity-empty-state">
                    <Heart size={44} />
                    <h3>No liked posts yet</h3>
                    <p>When you like posts or reels, they will appear here.</p>
                  </div>
                ) : (
                  <div className="activity-media-grid">
                    {likedPosts.map((post) => {
                      const mediaItem = post.media?.[0];
                      const mediaUrl = mediaItem?.url || post.mediaUrl || post.thumbnailUrl;
                      const isVideo = mediaItem?.mediaType === 'VIDEO' || post.videoUrl;

                      return (
                        <div
                          key={post.id}
                          className="activity-grid-item"
                          onClick={() => navigate(`/profile/${post.user?.id || user?.id}`)}
                        >
                          {isVideo ? (
                            <div className="activity-video-thumb">
                              <video src={mediaUrl} muted preload="metadata" />
                              <Film size={18} className="media-badge-icon" />
                            </div>
                          ) : (
                            <img src={mediaUrl} alt={post.caption || 'Liked post'} />
                          )}
                          <div className="activity-item-overlay">
                            <span className="overlay-stat">
                              <Heart size={16} fill="#fff" /> {formatCount(post.likeCount || 1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {subTab === 'comments' && (
              <div className="activity-empty-state">
                <MessageCircle size={44} />
                <h3>No recent comments</h3>
                <p>Comments you leave on posts and reels will be collected here.</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PHOTOS AND VIDEOS */}
        {activeTab === 'media' && (
          <section className="activity-section">
            <div className="activity-header">
              <h1>Photos and videos</h1>
              <p>Posts and reels you have shared to Instagram.</p>
            </div>

            <div className="activity-subtab-bar">
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'posts' ? 'active' : ''}`}
                onClick={() => setSubTab('posts')}
              >
                Posts ({userPosts.length})
              </button>
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'reels' ? 'active' : ''}`}
                onClick={() => setSubTab('reels')}
              >
                Reels ({userReels.length})
              </button>
            </div>

            {loadingMedia ? (
              <div className="activity-loading-center">
                <SkeletonMediaGrid count={6} />
              </div>
            ) : subTab === 'posts' ? (
              userPosts.length === 0 ? (
                <div className="activity-empty-state">
                  <Grid size={44} />
                  <h3>No posts shared yet</h3>
                  <p>When you share photos, they will appear here.</p>
                </div>
              ) : (
                <div className="activity-media-grid">
                  {userPosts.map((post) => {
                    const mediaUrl = post.media?.[0]?.url || post.mediaUrl;
                    return (
                      <div
                        key={post.id}
                        className="activity-grid-item"
                        onClick={() => navigate('/profile/me')}
                      >
                        <img src={mediaUrl} alt={post.caption || 'Post'} />
                        <div className="activity-item-overlay">
                          <span className="overlay-stat">
                            <Heart size={16} fill="#fff" /> {formatCount(post.likeCount || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : userReels.length === 0 ? (
              <div className="activity-empty-state">
                <Film size={44} />
                <h3>No reels shared yet</h3>
                <p>Reels you create will be available here.</p>
              </div>
            ) : (
              <div className="activity-media-grid">
                {userReels.map((reel) => (
                  <div
                    key={reel.id}
                    className="activity-grid-item reel-grid-item"
                    onClick={() => navigate(`/reels/${reel.id}`)}
                  >
                    <video src={reel.videoUrl} muted preload="metadata" />
                    <div className="activity-item-overlay">
                      <span className="overlay-stat">
                        <Heart size={16} fill="#fff" /> {formatCount(reel.likeCount || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: ARCHIVED */}
        {activeTab === 'archived' && (
          <section className="activity-section">
            <div className="activity-header">
              <h1>Archived</h1>
              <p>Only you can see the photos, reels, and stories you have archived.</p>
            </div>

            <div className="activity-subtab-bar">
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'stories' ? 'active' : ''}`}
                onClick={() => setSubTab('stories')}
              >
                Stories archive ({archivedStories.length})
              </button>
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'posts' ? 'active' : ''}`}
                onClick={() => setSubTab('posts')}
              >
                Posts archive ({archivedPosts.length})
              </button>
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'reels' ? 'active' : ''}`}
                onClick={() => setSubTab('reels')}
              >
                Reels archive ({archivedReels.length})
              </button>
            </div>

            {loadingArchived ? (
              <div className="activity-loading-center">
                <SkeletonMediaGrid count={6} />
              </div>
            ) : subTab === 'stories' ? (
              archivedStories.length === 0 ? (
                <div className="activity-empty-state">
                  <Archive size={44} />
                  <h3>No archived stories</h3>
                  <p>When you enable "Save story to archive", expired stories appear here.</p>
                </div>
              ) : (
                <div className="activity-media-grid story-archive-grid">
                  {archivedStories.map((story) => (
                    <div key={story.id} className="activity-grid-item story-item">
                      <img src={story.mediaUrl} alt="Archived story" />
                      <div className="story-date-badge">
                        {new Date(story.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : subTab === 'posts' ? (
              archivedPosts.length === 0 ? (
                <div className="activity-empty-state">
                  <Archive size={44} />
                  <h3>No archived posts</h3>
                  <p>Posts you archive will be stored here privately.</p>
                </div>
              ) : (
                <div className="activity-media-grid">
                  {archivedPosts.map((post) => (
                    <div key={post.id} className="activity-grid-item">
                      <img src={post.media?.[0]?.url || post.mediaUrl} alt="Archived post" />
                      <button
                        type="button"
                        className="activity-restore-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnarchivePost(post.id);
                        }}
                      >
                        Show on profile
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : archivedReels.length === 0 ? (
              <div className="activity-empty-state">
                <Archive size={44} />
                <h3>No archived reels</h3>
                <p>Reels you archive will be stored here privately.</p>
              </div>
            ) : (
              <div className="activity-media-grid">
                {archivedReels.map((reel) => (
                  <div key={reel.id} className="activity-grid-item reel-grid-item">
                    <video src={reel.videoUrl} muted preload="metadata" />
                    <button
                      type="button"
                      className="activity-restore-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnarchiveReel(reel.id);
                      }}
                    >
                      Show on profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: RECENTLY DELETED */}
        {activeTab === 'deleted' && (
          <section className="activity-section">
            <div className="activity-header">
              <h1>Recently deleted</h1>
              <p>
                Only you can see these items. They will be permanently deleted after 30 days. You can restore them before then.
              </p>
            </div>

            <div className="activity-subtab-bar">
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'posts' ? 'active' : ''}`}
                onClick={() => setSubTab('posts')}
              >
                Posts ({deletedPosts.length})
              </button>
              <button
                type="button"
                className={`activity-subtab-btn ${subTab === 'reels' ? 'active' : ''}`}
                onClick={() => setSubTab('reels')}
              >
                Reels ({deletedReels.length})
              </button>
            </div>

            {loadingDeleted ? (
              <div className="activity-loading-center">
                <SkeletonMediaGrid count={6} />
              </div>
            ) : subTab === 'posts' ? (
              deletedPosts.length === 0 ? (
                <div className="activity-empty-state">
                  <Trash2 size={44} />
                  <h3>No recently deleted posts</h3>
                  <p>When you delete posts, they will stay here for up to 30 days.</p>
                </div>
              ) : (
                <div className="activity-media-grid">
                  {deletedPosts.map((post) => (
                    <div key={post.id} className="activity-grid-item deleted-card">
                      <img src={post.media?.[0]?.url || post.mediaUrl} alt="Deleted post" />
                      <div className="deleted-tag">30 days left</div>
                      <div className="deleted-actions-overlay">
                        <button
                          type="button"
                          className="btn-activity-action restore"
                          onClick={() => handleRestorePost(post.id)}
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button
                          type="button"
                          className="btn-activity-action delete"
                          onClick={() => handlePermanentDeletePost(post.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : deletedReels.length === 0 ? (
              <div className="activity-empty-state">
                <Trash2 size={44} />
                <h3>No recently deleted reels</h3>
                <p>When you delete reels, they will stay here for up to 30 days.</p>
              </div>
            ) : (
              <div className="activity-media-grid">
                {deletedReels.map((reel) => (
                  <div key={reel.id} className="activity-grid-item reel-grid-item deleted-card">
                    <video src={reel.videoUrl} muted preload="metadata" />
                    <div className="deleted-tag">30 days left</div>
                    <div className="deleted-actions-overlay">
                      <button
                        type="button"
                        className="btn-activity-action restore"
                        onClick={() => handleRestoreReel(reel.id)}
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button
                        type="button"
                        className="btn-activity-action delete"
                        onClick={() => handlePermanentDeleteReel(reel.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 5: TIME SPENT */}
        {activeTab === 'time' && (() => {
          const breakdown = screenTimeSummary.dailyBreakdown || [];
          const maxMinutes = Math.max(60, ...breakdown.map((d) => Number(d.minutes) || 0));

          return (
            <section className="activity-section">
              <div className="activity-header">
                <h1>Time spent</h1>
                <p>See how much time you usually spend on Instagram.</p>
              </div>

              <div className="time-spent-summary-card">
                <div className="time-spent-metric-row">
                  <div className="time-spent-metric">
                    <span className="metric-number">
                      {loadingScreenTime ? '...' : `${screenTimeSummary.dailyAverageMinutes}m`}
                    </span>
                    <span className="metric-label">Daily average time spent</span>
                  </div>
                  <span className="time-spent-today-pill">
                    Today: {loadingScreenTime ? '...' : `${screenTimeSummary.todayMinutes}m`}
                  </span>
                </div>
                <p className="metric-subtext">
                  The average time you spent per day using Instagram in the last week.
                </p>

                {/* Live 7-Day Usage Chart */}
                <div className="usage-chart-container" aria-label="7-day time spent chart">
                  {breakdown.map((item) => {
                    const mins = Number(item.minutes) || 0;
                    const secs = Number(item.seconds) || 0;
                    const rawPct = Math.round((mins / maxMinutes) * 100);
                    const barHeight = secs > 0 ? Math.max(8, Math.min(100, rawPct)) : 0;
                    const durationLabel = mins > 0 ? `${mins}m` : `${secs}s`;

                    return (
                      <div key={item.date || item.dayLabel} className="chart-bar-column">
                        <div className="chart-bar-track">
                          <div
                            className="chart-bar-fill"
                            style={{ height: `${barHeight}%` }}
                            title={`${item.dayLabel} (${item.date}): ${durationLabel}`}
                          />
                        </div>
                        <span className="chart-day-label">{item.dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="activity-card-group">
                <h3>Manage your time</h3>

                <div className="time-management-row">
                  <div className="time-management-info">
                    <span className="row-title">Set reminder to take breaks</span>
                    <span className="row-subtitle">
                      Schedule a reminder to take a break when you spend this amount of time at once.
                    </span>
                  </div>
                  <select
                    aria-label="Set reminder to take breaks"
                    className="activity-select"
                    value={breakReminder}
                    onChange={(e) => handleBreakReminderChange(e.target.value)}
                  >
                    <option value="0">Off</option>
                    <option value="10">Every 10 minutes</option>
                    <option value="20">Every 20 minutes</option>
                    <option value="30">Every 30 minutes</option>
                  </select>
                </div>

                <div className="time-management-row clickable" onClick={() => navigate('/settings')}>
                  <div className="time-management-info">
                    <span className="row-title">Notification settings</span>
                    <span className="row-subtitle">
                      Choose which notifications you get from Instagram.
                    </span>
                  </div>
                  <ArrowRight size={18} className="row-chevron" />
                </div>
              </div>
            </section>
          );
        })()}

        {/* TAB 6: ACCOUNT HISTORY */}
        {activeTab === 'history' && (
          <section className="activity-section">
            <div className="activity-header">
              <h1>Account history</h1>
              <p>Review changes you have made to your account since you created it.</p>
            </div>

            <div className="account-history-timeline">
              <div className="timeline-item">
                <div className="timeline-icon-badge">
                  <Shield size={18} />
                </div>
                <div className="timeline-content">
                  <h4>Account created</h4>
                  <p>You created your Instagram Clone account as @{user?.username || 'user'}.</p>
                  <span className="timeline-timestamp">
                    {loadingHistory && !accountCreatedAt
                      ? 'Loading...'
                      : accountCreatedAt
                        ? formatDate(accountCreatedAt)
                        : 'Date unavailable'}
                  </span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-icon-badge">
                  <CheckCircle2 size={18} />
                </div>
                <div className="timeline-content">
                  <h4>Password last updated</h4>
                  <p>
                    {loadingHistory
                      ? 'Loading password history...'
                      : passwordHistory.changeCount > 0
                        ? `Changed ${passwordHistory.changeCount} ${passwordHistory.changeCount === 1 ? 'time' : 'times'}.`
                        : 'You have not changed your password yet.'}
                  </p>
                  <span className="timeline-timestamp">
                    {loadingHistory
                      ? 'Checking...'
                      : passwordHistory.lastChangedAt
                        ? `Last changed ${formatDate(passwordHistory.lastChangedAt)}`
                        : 'Never changed'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default YourActivityPage;
