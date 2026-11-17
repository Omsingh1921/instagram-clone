import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Check,
  UserCheck,
  UserPlus,
  AtSign,
  MessageCircle,
  Shield,
  ShieldCheck,
  Settings,
  Send,
  Trash2,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import CommentsModal from '../components/modals/CommentsModal';
import EmptyState from '../components/common/EmptyState';
import { SkeletonNotificationSections } from '../components/ui/Skeleton';
import notificationService from '../services/notification.service';
import followService from '../services/follow.service';
import chatService from '../services/chat.service';
import useNotificationStore from '../store/useNotificationStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils';
import './NotificationsPage.css';

const NOTIFICATION_FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'follows', label: 'Follows', icon: UserPlus },
  { id: 'mentions', label: 'Mentions', icon: AtSign },
  { id: 'comments', label: 'Comments', icon: MessageCircle },
  { id: 'likes', label: 'Likes', icon: Heart },
  { id: 'system', label: 'System', icon: Shield },
];

const FILTER_TYPES_MAP = {
  follows: ['FOLLOW', 'FOLLOW_REQUEST', 'FOLLOW_REQUEST_ACCEPTED'],
  mentions: ['MENTION', 'USER_MENTIONED', 'USER_TAGGED'],
  comments: ['COMMENT', 'POST_COMMENTED', 'COMMENT_REPLIED', 'REEL_COMMENTED'],
  likes: ['LIKE', 'POST_LIKED', 'REEL_LIKED', 'STORY_LIKED'],
  system: ['SYSTEM', 'CONTENT_REMOVED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_UNSUSPENDED'],
};

const SYSTEM_TYPES = new Set(FILTER_TYPES_MAP.system);
const KNOWN_NON_SYSTEM_TYPES = new Set([
  ...FILTER_TYPES_MAP.follows,
  ...FILTER_TYPES_MAP.mentions,
  ...FILTER_TYPES_MAP.comments,
  ...FILTER_TYPES_MAP.likes,
]);

const matchesNotificationFilter = (notif, filterId) => {
  if (filterId === 'all') return true;
  const type = notif?.type;
  if (filterId === 'system') {
    return SYSTEM_TYPES.has(type) || (type && !KNOWN_NON_SYSTEM_TYPES.has(type));
  }
  return Boolean(FILTER_TYPES_MAP[filterId]?.includes(type));
};

const renderNotifText = (n) => {
  switch (n.type) {
    case 'LIKE':
    case 'POST_LIKED':
      return 'liked your post.';
    case 'REEL_LIKED':
      return 'liked your reel.';
    case 'STORY_LIKED':
      return 'liked your story.';
    case 'COMMENT':
    case 'POST_COMMENTED':
      return 'commented on your post.';
    case 'COMMENT_REPLIED':
      return 'replied to your comment.';
    case 'REEL_COMMENTED':
      return 'commented on your reel.';
    case 'FOLLOW':
      return 'started following you.';
    case 'FOLLOW_REQUEST':
      return 'sent you a follow request.';
    case 'FOLLOW_REQUEST_ACCEPTED':
      return 'accepted your follow request.';
    case 'MENTION':
    case 'USER_MENTIONED':
      return 'mentioned you in a post.';
    case 'USER_TAGGED':
      return 'tagged you in a post.';
    case 'CONTENT_REMOVED':
      return 'Notice: Your content was removed due to a copyright or policy violation.';
    case 'ACCOUNT_SUSPENDED':
      return 'Important: Your account has been suspended by an administrator.';
    case 'ACCOUNT_UNSUSPENDED':
      return 'Your account has been reinstated by an administrator.';
    case 'SYSTEM':
      return n.message || 'sent a system update.';
    default:
      return 'interacted with your profile.';
  }
};

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [clearingRead, setClearingRead] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [activePostId, setActivePostId] = useState(null);

  const { isFollowing, toggleFollow } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const loadNotificationsAndRequests = async () => {
    try {
      setLoading(true);
      const [notifRes, reqRes] = await Promise.allSettled([
        notificationService.getNotifications(0, 40),
        followService.getPendingFollowRequests(0, 20),
      ]);

      if (notifRes.status === 'fulfilled') {
        const res = notifRes.value;
        const list = res?.data?.content || res?.content || res?.data || [];
        const normalized = Array.isArray(list) ? list : [];
        setNotifications(normalized);
        useNotificationStore.getState().setNotifications(normalized);
      } else {
        setNotifications([]);
      }

      if (reqRes.status === 'fulfilled') {
        const res = reqRes.value;
        const reqList = res?.data?.content || res?.content || res?.data || [];
        setFollowRequests(Array.isArray(reqList) ? reqList : []);
      } else {
        setFollowRequests([]);
      }
    } catch {
      setNotifications([]);
      setFollowRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsAndRequests();

    const handleRealtimeNotif = (e) => {
      const incoming = e.detail;
      if (incoming && incoming.id) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === incoming.id)) return prev;
          return [incoming, ...prev];
        });
      }
    };

    window.addEventListener('app:notification', handleRealtimeNotif);
    return () => window.removeEventListener('app:notification', handleRealtimeNotif);
  }, []);

  const totalUnreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const hasReadNotifications = useMemo(
    () => notifications.some((n) => n.read),
    [notifications]
  );

  const handleMarkAllRead = async () => {
    if (totalUnreadCount === 0 || markingAllRead) return;
    try {
      setMarkingAllRead(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      useNotificationStore.getState().markAllAsRead();
      showSuccess('All notifications marked as read');
    } catch (err) {
      showError(err.message || 'Failed to mark all as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleClearRead = async () => {
    if (!hasReadNotifications || clearingRead) return;
    try {
      setClearingRead(true);
      await notificationService.clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
      useNotificationStore.getState().clearRead();
      showSuccess('Read notifications cleared');
    } catch (err) {
      showError(err.message || 'Failed to clear read notifications');
    } finally {
      setClearingRead(false);
    }
  };

  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    if (!notifId || deletingId === notifId) return;
    try {
      setDeletingId(notifId);
      await notificationService.deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      useNotificationStore.getState().removeNotification(notifId);
      showSuccess('Notification deleted');
    } catch (err) {
      showError(err.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        useNotificationStore.getState().markAsRead(notif.id);
      } catch {
        // Ignore error
      }
    }

    if (notif.postId && notif.type !== 'CONTENT_REMOVED') {
      setActivePostId(notif.postId);
    } else if (
      notif.actor?.id &&
      !SYSTEM_TYPES.has(notif.type) &&
      notif.actor?.username?.toLowerCase() !== 'admin'
    ) {
      navigate(`/profile/${notif.actor.id}`);
    }
  };

  const handleFollowToggle = async (e, actorId) => {
    e.stopPropagation();
    try {
      const nextState = await toggleFollow(actorId);
      if (nextState) {
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const handleAcceptRequest = async (e, requestId, notifId = null) => {
    e.stopPropagation();
    try {
      setProcessingRequestId(requestId);
      await followService.acceptFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (notifId) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, read: true, type: 'FOLLOW' } : n))
        );
        notificationService.markAsRead(notifId).catch(() => {});
        useNotificationStore.getState().markAsRead(notifId);
      }
      showSuccess('Follow request approved');
    } catch (err) {
      showError(err.message || 'Failed to accept follow request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (e, requestId, notifId = null) => {
    e.stopPropagation();
    try {
      setProcessingRequestId(requestId);
      await followService.rejectFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (notifId) {
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        notificationService.markAsRead(notifId).catch(() => {});
        useNotificationStore.getState().markAsRead(notifId);
      }
      showSuccess('Follow request removed');
    } catch (err) {
      showError(err.message || 'Failed to reject follow request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleMessageUser = async (e, targetUserId) => {
    e.stopPropagation();
    if (!targetUserId) return;
    try {
      const res = await chatService.getOrCreateDirectConversation(targetUserId);
      const conv = res?.data || res;
      navigate('/messages', { state: { conversationId: conv.id } });
    } catch (err) {
      showError(err.message || 'Failed to start message');
    }
  };

  const filteredNotifications = useMemo(
    () => notifications.filter((n) => matchesNotificationFilter(n, activeFilter)),
    [notifications, activeFilter]
  );

  const unreadList = useMemo(
    () => filteredNotifications.filter((n) => !n.read),
    [filteredNotifications]
  );

  const readList = useMemo(
    () => filteredNotifications.filter((n) => n.read),
    [filteredNotifications]
  );

  const unmatchedFollowRequests = useMemo(() => {
    if (followRequests.length === 0) return [];
    return followRequests.filter((req) => {
      const reqUserId = req.requesterId || req.requester?.id || req.user?.id;
      const reqUsername = req.username || req.requester?.username || req.user?.username;
      const shownInList = filteredNotifications.some(
        (n) =>
          n.type === 'FOLLOW_REQUEST' &&
          ((reqUserId && n.actor?.id === reqUserId) ||
            (reqUsername && n.actor?.username === reqUsername))
      );
      return !shownInList;
    });
  }, [followRequests, filteredNotifications]);

  const showPendingRequests =
    unmatchedFollowRequests.length > 0 &&
    (activeFilter === 'all' || activeFilter === 'follows');

  const findPendingRequestForNotif = (notif) => {
    if (notif?.type !== 'FOLLOW_REQUEST' || followRequests.length === 0) return null;
    const actorId = notif.actor?.id;
    const actorUsername = notif.actor?.username;
    return followRequests.find((req) => {
      const reqUserId = req.requesterId || req.requester?.id || req.user?.id;
      const reqUsername = req.username || req.requester?.username || req.user?.username;
      return (actorId && reqUserId === actorId) || (actorUsername && reqUsername === actorUsername);
    });
  };

  const renderNotificationCard = (notif) => {
    const isUnread = !notif.read;
    const isSystemNotif =
      SYSTEM_TYPES.has(notif.type) || notif.actor?.username?.toLowerCase() === 'admin';
    const actorName = notif.actor?.username || (isSystemNotif ? 'admin' : 'user');
    const isActorFollowing = notif.actor?.id ? isFollowing(notif.actor.id) : false;
    const matchedRequest = findPendingRequestForNotif(notif);
    const hasActiveStory = Boolean(notif.actor?.hasActiveStory || notif.actor?.hasStory);

    return (
      <div
        key={notif.id}
        className={`notification-item-card ${isUnread ? 'unread' : 'read'}`}
        onClick={() => handleNotificationClick(notif)}
      >
        <div className="notification-main-content">
          <div className={`notification-avatar-shell ${hasActiveStory ? 'has-story' : ''}`}>
            <Avatar
              src={notif.actor?.avatarUrl || notif.actor?.profilePictureUrl}
              alt={actorName}
              size="md"
              hasStory={hasActiveStory}
            />
          </div>

          <div className="notification-text-box">
            <span className="actor-username-wrap">
              <span className="actor-username">{actorName}</span>
              {(isSystemNotif || notif.actor?.verified || notif.actor?.isVerified) && (
                <span
                  className="notif-verified-badge"
                  title={isSystemNotif ? 'System Administrator' : 'Verified'}
                  aria-label="Verified badge"
                >
                  <ShieldCheck size={14} />
                </span>
              )}
            </span>
            <span className="notification-message-text">{renderNotifText(notif)}</span>
            {notif.createdAt && (
              <span className="notification-time">{timeAgo(notif.createdAt)}</span>
            )}
          </div>
        </div>

        <div className="notification-side-action">
          {notif.type === 'FOLLOW' || notif.type === 'FOLLOW_REQUEST_ACCEPTED' ? (
            <>
              <button
                type="button"
                className={`notif-action-btn notif-follow-btn ${
                  isActorFollowing ? 'secondary' : 'primary'
                }`}
                onClick={(e) => handleFollowToggle(e, notif.actor?.id)}
              >
                {isActorFollowing ? 'Following' : 'Follow Back'}
              </button>
              <button
                type="button"
                className="notif-action-btn secondary notif-msg-btn"
                onClick={(e) => handleMessageUser(e, notif.actor?.id)}
                title="Message"
                aria-label={`Message ${actorName}`}
              >
                <Send size={13} />
                <span>Message</span>
              </button>
            </>
          ) : matchedRequest ? (
            <>
              <button
                type="button"
                className="notif-action-btn primary"
                disabled={processingRequestId === matchedRequest.id}
                onClick={(e) => handleAcceptRequest(e, matchedRequest.id, notif.id)}
              >
                {processingRequestId === matchedRequest.id ? (
                  '...'
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                type="button"
                className="notif-action-btn secondary"
                disabled={processingRequestId === matchedRequest.id}
                onClick={(e) => handleRejectRequest(e, matchedRequest.id, notif.id)}
              >
                Delete
              </button>
            </>
          ) : notif.mediaPreviewUrl ? (
            <img
              src={notif.mediaPreviewUrl}
              alt="Media preview"
              className="notification-post-thumb"
            />
          ) : null}

          <button
            type="button"
            className="notif-delete-icon-btn"
            disabled={deletingId === notif.id}
            onClick={(e) => handleDeleteNotification(e, notif.id)}
            title="Delete notification"
            aria-label={`Delete notification from ${actorName}`}
          >
            <Trash2 size={13} />
          </button>

          {isUnread && <span className="notification-unread-dot" aria-label="Unread" />}
        </div>
      </div>
    );
  };

  return (
    <div className="notifications-page-wrapper">
      <div className="notifications-page-container">
        {/* Header Bar */}
        <div className="notifications-header-row">
          <h1 className="notifications-page-title">Notifications</h1>

          <div className="notifications-header-actions">
            {totalUnreadCount > 0 && (
              <button
                type="button"
                className="mark-all-read-btn"
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
              >
                <Check size={15} strokeWidth={2.5} />
                <span>Mark all as read</span>
              </button>
            )}

            {hasReadNotifications && (
              <button
                type="button"
                className="clear-read-btn"
                onClick={handleClearRead}
                disabled={clearingRead}
                title="Clear all read notifications"
                aria-label="Clear read notifications"
              >
                <Trash2 size={14} />
                <span>Clear read</span>
              </button>
            )}

            <button
              type="button"
              className="notifications-settings-btn"
              onClick={() => navigate('/settings?tab=notifications')}
              title="Notification settings"
              aria-label="Notification settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          className="notifications-filter-bar"
          role="tablist"
          aria-label="Notification filters"
        >
          {NOTIFICATION_FILTERS.map((filter) => {
            const IconComp = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`notifications-filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {IconComp && <IconComp size={15} strokeWidth={2} />}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <SkeletonNotificationSections />
        ) : (
          <>
            {/* Pending Follow Requests */}
            {showPendingRequests && (
              <div className="follow-requests-panel">
                <div className="follow-requests-header">
                  <UserCheck size={17} className="follow-requests-icon" />
                  <span className="follow-requests-title">
                    Follow Requests ({unmatchedFollowRequests.length})
                  </span>
                </div>

                <div className="follow-requests-list">
                  {unmatchedFollowRequests.map((req) => {
                    const username =
                      req.username || req.requester?.username || req.user?.username || 'user';
                    const displayName =
                      req.displayName ||
                      req.requester?.displayName ||
                      req.user?.displayName ||
                      req.requester?.fullName ||
                      '';
                    const avatarUrl =
                      req.avatarUrl ||
                      req.requester?.avatarUrl ||
                      req.user?.avatarUrl ||
                      req.requester?.profilePictureUrl;
                    const personId = req.requesterId || req.requester?.id || req.user?.id;

                    return (
                      <div key={req.id} className="notification-item-card unread follow-request-row">
                        <div
                          className="notification-main-content"
                          onClick={() => personId && navigate(`/profile/${personId}`)}
                        >
                          <div className="notification-avatar-shell">
                            <Avatar src={avatarUrl} alt={username} size="md" />
                          </div>
                          <div className="notification-text-box follow-request-text">
                            <span className="actor-username">@{username}</span>
                            <span className="notification-message-text">
                              {displayName
                                ? `${displayName} · sent you a follow request.`
                                : 'sent you a follow request.'}
                            </span>
                          </div>
                        </div>

                        <div className="notification-side-action">
                          <button
                            type="button"
                            className="notif-action-btn primary"
                            disabled={processingRequestId === req.id}
                            onClick={(e) => handleAcceptRequest(e, req.id)}
                          >
                            {processingRequestId === req.id ? (
                              '...'
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            type="button"
                            className="notif-action-btn secondary"
                            disabled={processingRequestId === req.id}
                            onClick={(e) => handleRejectRequest(e, req.id)}
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            className="notif-action-btn secondary notif-msg-btn"
                            title="Message user"
                            aria-label={`Message ${username}`}
                            onClick={(e) => handleMessageUser(e, personId)}
                          >
                            <Send size={13} />
                            <span>Message</span>
                          </button>
                          <span className="notification-unread-dot" aria-hidden="true" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredNotifications.length === 0 && !showPendingRequests ? (
              <div className="notifications-empty-glass">
                <EmptyState
                  icon={Heart}
                  title={
                    activeFilter === 'all'
                      ? 'No notifications yet'
                      : `No ${activeFilter} notifications`
                  }
                  description={
                    activeFilter === 'all'
                      ? "When someone likes or comments on your posts, or follows you, you'll see it here."
                      : 'Try switching categories above to see other activity.'
                  }
                />
                {activeFilter !== 'all' && notifications.length > 0 && (
                  <button
                    type="button"
                    className="notif-action-btn secondary reset-filter-btn"
                    onClick={() => setActiveFilter('all')}
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              <div className="notifications-sections-stack">
                {unreadList.length > 0 && (
                  <section className="notifications-section-group">
                    <h2 className="notifications-section-heading">New</h2>
                    <div className="notifications-items-list">
                      {unreadList.map((notif) => renderNotificationCard(notif))}
                    </div>
                  </section>
                )}

                {readList.length > 0 && (
                  <section className="notifications-section-group">
                    <h2 className="notifications-section-heading">Earlier</h2>
                    <div className="notifications-items-list">
                      {readList.map((notif) => renderNotificationCard(notif))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* Post Modal when clicking on post-related notification */}
        {activePostId && (
          <CommentsModal
            isOpen={!!activePostId}
            onClose={() => setActivePostId(null)}
            postId={activePostId}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
