import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Flag,
  Copy,
  Film,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Layers,
  Music,
  User,
  BarChart2,
  Pin,
  MapPin,
  MessageSquareOff,
  BellOff,
  Edit3,
  Archive,
  Eye,
  EyeOff,
  BadgeCheck,
  Smile,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import CommentsModal from '../modals/CommentsModal';
import ReportModal from '../modals/ReportModal';
import ShareModal from '../modals/ShareModal';
import InsightsModal from '../modals/InsightsModal';
import EditPostModal from '../modals/EditPostModal';
import LikesModal from '../modals/LikesModal';
import { getFilterStyle } from '../../utils/instagramFilters';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl, getAdaptiveVideoUrl } from '../../utils/mediaUrl';
import engagementService from '../../services/engagement.service';
import postService from '../../services/post.service';
import settingsService from '../../services/settings.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo, formatCount } from '../../utils';
import './PostCard.css';

// In-memory cache for author mute statuses to eliminate redundant network requests across feed posts
const authorMuteCache = new Map();

export const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(post.savedByCurrentUser || false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [isPinned, setIsPinned] = useState(Boolean(post.isPinned));
  const [commentsDisabled, setCommentsDisabled] = useState(Boolean(post.commentsDisabled));
  const [hideLikeCount, setHideLikeCount] = useState(Boolean(post.hideLikeCount));
  const [isArchived, setIsArchived] = useState(Boolean(post.isArchived));
  const [isAuthorMuted, setIsAuthorMuted] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [quickComment, setQuickComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showQuickEmojis, setShowQuickEmojis] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const { user: currentUser, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const optionsMenuRef = useRef(null);

  const myId = String(currentUser?.id || currentUser?.userId || '').trim().toLowerCase();
  const postAuthorId = String(
    post?.author?.id ||
    post?.author?.userId ||
    post?.userId ||
    post?.user?.id ||
    post?.authorId ||
    ''
  ).trim().toLowerCase();
  const isViewerAdmin = Boolean(
    isAdmin ||
    currentUser?.role === 'ROLE_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.username?.toLowerCase() === 'admin'
  );
  const isAuthor = Boolean(myId && postAuthorId && myId === postAuthorId);
  const canDeletePost = isAuthor || isViewerAdmin;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);
  const mediaList = post.media || [];
  const currentMedia = mediaList[currentMediaIdx] || mediaList[0];
  const isReel = Boolean(post.isReel) || post.contentType === 'REEL';
  const isVideo = currentMedia?.mediaType === 'VIDEO' || isReel;
  const activeTags = (currentMedia?.tags && currentMedia.tags.length > 0)
    ? currentMedia.tags
    : (post.taggedUsers && post.taggedUsers.length > 0)
      ? post.taggedUsers.map((t) => ({
        id: t.id,
        taggedUserId: t.user?.id || t.userId,
        taggedUsername: t.user?.username || t.username,
        xPercent: t.xPercent,
        yPercent: t.yPercent,
      }))
      : [];
  const hasTags = activeTags.length > 0;

  // Direct video autoplay & pause on scroll out of view
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    video.muted = isMuted;
    video.play().catch(() => {
      // Browser blocked unmuted autoplay -> fallback to muted
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => { });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => { });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [currentMedia?.mediaUrl, isVideo, isMuted]);

  const handleToggleSound = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handleTogglePlay = (e) => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => { });
    } else {
      videoRef.current.pause();
    }
  };

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await engagementService.toggleLike(post.id);
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsLiked(!nextState);
      setLikeCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleDoubleTap = () => {
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    if (!isLiked) {
      handleLike();
    }
  };

  const handleSave = async () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      await engagementService.toggleSave(post.id);
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsSaved(!nextState);
    }
  };

  // Lazy load mute status only when user opens options menu (0 background requests on feed load)
  useEffect(() => {
    if (menuOpen && !isAuthor && post.author?.id) {
      if (authorMuteCache.has(post.author.id)) {
        setIsAuthorMuted(authorMuteCache.get(post.author.id));
        return;
      }
      settingsService.isUserMuted(post.author.id)
        .then((res) => {
          const muted = Boolean(res?.data ?? res);
          authorMuteCache.set(post.author.id, muted);
          setIsAuthorMuted(muted);
        })
        .catch(() => { });
    }
  }, [menuOpen, isAuthor, post.author?.id]);

  const handleTogglePin = async () => {
    try {
      setMenuOpen(false);
      const res = await postService.togglePinPost(post.id);
      const pinned = Boolean(res?.data?.isPinned ?? res?.isPinned ?? !isPinned);
      setIsPinned(pinned);
      showSuccess(pinned ? 'Post pinned to your profile' : 'Post unpinned from your profile');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to update pin status');
    }
  };

  const handleToggleComments = async () => {
    try {
      setMenuOpen(false);
      const res = await postService.toggleComments(post.id);
      const disabled = Boolean(res?.data?.commentsDisabled ?? res?.commentsDisabled ?? !commentsDisabled);
      setCommentsDisabled(disabled);
      showSuccess(disabled ? 'Commenting has been turned off' : 'Commenting has been turned on');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to update comments setting');
    }
  };

  const handleToggleArchive = async () => {
    try {
      setMenuOpen(false);
      const res = await postService.toggleArchivePost(post.id);
      const archived = Boolean(res?.data?.isArchived ?? res?.isArchived ?? !isArchived);
      setIsArchived(archived);
      showSuccess(archived ? 'Post archived. Hidden from your profile grid.' : 'Post unarchived and visible on your profile.');
      if (onPostUpdated) onPostUpdated();
      if (archived && onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      showError(err.message || 'Failed to update archive status');
    }
  };

  const handleToggleHideLikes = async () => {
    try {
      setMenuOpen(false);
      const res = await postService.toggleHideLikeCount(post.id);
      const hidden = Boolean(res?.data?.hideLikeCount ?? res?.hideLikeCount ?? !hideLikeCount);
      setHideLikeCount(hidden);
      showSuccess(hidden ? 'Like and view counts are now hidden from others.' : 'Like and view counts are now visible.');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to update like count visibility');
    }
  };

  const handleToggleMute = async () => {
    if (!post.author?.id) return;
    try {
      setMenuOpen(false);
      if (isAuthorMuted) {
        await settingsService.unmuteUser(post.author.id);
        setIsAuthorMuted(false);
        authorMuteCache.set(post.author.id, false);
        showSuccess(`Unmuted @${post.author.username}`);
      } else {
        await settingsService.muteUser(post.author.id, true, true);
        setIsAuthorMuted(true);
        authorMuteCache.set(post.author.id, true);
        showSuccess(`Muted @${post.author.username}. Their posts won't appear in your feed.`);
      }
    } catch (err) {
      showError(err.message || 'Failed to update mute status');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(post.id);
      showSuccess('Post deleted successfully');
      setMenuOpen(false);
      window.dispatchEvent(new CustomEvent('post:refresh'));
      window.dispatchEvent(new CustomEvent('feed:refresh'));
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      showError(err.message || 'Failed to delete post');
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    showSuccess('Link copied to clipboard!');
    setMenuOpen(false);
  };

  const handleQuickCommentSubmit = async (e) => {
    e.preventDefault();
    if (!quickComment.trim()) return;

    try {
      setSubmittingComment(true);
      await engagementService.addComment(post.id, { text: quickComment.trim() });
      setCommentCount((prev) => prev + 1);
      setQuickComment('');
      showSuccess('Comment posted');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCollabResponse = async (accept) => {
    try {
      await postService.respondToCollabInvite(post.id, accept);
      showSuccess(accept ? 'You accepted the collaboration' : 'Collaboration declined');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to respond to collaboration invite');
    }
  };

  const renderFormattedCaption = (text) => {
    if (!text) return null;
    const parts = text.split(/(#[A-Za-z0-9_]+|@[A-Za-z0-9_.]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={idx}
            type="button"
            className="caption-token-link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/explore?tag=${encodeURIComponent(part.slice(1))}`);
            }}
          >
            {part}
          </button>
        );
      }
      if (part.startsWith('@')) {
        return (
          <button
            key={idx}
            type="button"
            className="caption-token-link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/search?q=${encodeURIComponent(part.slice(1))}`);
            }}
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <>
      <article className="post-card">
        {/* Collaboration Invitation Banner */}
        {post.collaborator?.id === currentUser?.id && post.collabStatus === 'PENDING' && (
          <div className="collab-invite-banner">
            <div className="collab-invite-text">
              <strong>@{post.author?.username}</strong> invited you to be a collaborator on this post.
            </div>
            <div className="collab-invite-actions">
              <button
                type="button"
                className="collab-btn accept"
                onClick={() => handleCollabResponse(true)}
              >
                Accept
              </button>
              <button
                type="button"
                className="collab-btn decline"
                onClick={() => handleCollabResponse(false)}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="post-card-header">
          <div
            className="post-author-link"
            onClick={() => navigate(`/profile/${post.author?.id}`)}
          >
            <Avatar
              src={(post.author?.avatarUrl || post.author?.profilePictureUrl)}
              alt={post.author?.username}
              size="sm"
            />
            <div className="post-author-meta">
              <div className="post-author-title-row">
                <span className="post-author-username">
                  {post.author?.username}
                  {post.collaborator && post.collabStatus === 'ACCEPTED' && (
                    <>
                      <span style={{ fontWeight: 400, color: 'var(--text-secondary)', margin: '0 4px' }}>and</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${post.collaborator?.id}`);
                        }}
                        style={{ fontWeight: 600 }}
                      >
                        {post.collaborator?.username}
                      </span>
                    </>
                  )}
                </span>
                {(post.author?.isVerified || post.author?.verified) && (
                  <BadgeCheck size={14} fill="#0095f6" color="#ffffff" className="verified-badge-icon" style={{ marginLeft: '4px' }} />
                )}
                <span className="post-header-dot">•</span>
                <span className="post-time-ago">{timeAgo(post.createdAt)}</span>
                {isPinned && (
                  <span className="post-pinned-pill" title="Pinned to profile">
                    <Pin size={10} />
                    Pinned
                  </span>
                )}
              </div>
              {post.location && (
                <div className="post-location-tag" title={post.location}>
                  <MapPin size={10} className="post-location-icon" />
                  <span>{post.location}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="post-options-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Post options"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="post-options-menu" ref={optionsMenuRef}>
              <button type="button" className="post-menu-item" onClick={handleCopyLink}>
                <Copy size={14} />
                <span>Copy link</span>
              </button>
              {isAuthor ? (
                <>
                  <button
                    type="button"
                    className="post-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditModalOpen(true);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit post</span>
                  </button>
                  <button type="button" className="post-menu-item" onClick={handleTogglePin}>
                    <Pin size={14} />
                    <span>{isPinned ? 'Unpin from your profile' : 'Pin to your profile'}</span>
                  </button>
                  <button type="button" className="post-menu-item" onClick={handleToggleArchive}>
                    <Archive size={14} />
                    <span>{isArchived ? 'Show on profile' : 'Archive post'}</span>
                  </button>
                  <button type="button" className="post-menu-item" onClick={handleToggleHideLikes}>
                    {hideLikeCount ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{hideLikeCount ? 'Unhide like count' : 'Hide like count'}</span>
                  </button>
                  <button type="button" className="post-menu-item" onClick={handleToggleComments}>
                    <MessageSquareOff size={14} />
                    <span>{commentsDisabled ? 'Turn on commenting' : 'Turn off commenting'}</span>
                  </button>
                  <button
                    type="button"
                    className="post-menu-item danger"
                    onClick={handleDeletePost}
                  >
                    <Trash2 size={14} />
                    <span>Delete post</span>
                  </button>
                </>
              ) : (
                <>
                  {canDeletePost && (
                    <button
                      type="button"
                      className="post-menu-item danger"
                      onClick={handleDeletePost}
                    >
                      <Trash2 size={14} />
                      <span>Delete post</span>
                    </button>
                  )}
                  <button type="button" className="post-menu-item" onClick={handleToggleMute}>
                    <BellOff size={14} />
                    <span>{isAuthorMuted ? `Unmute @${post.author?.username}` : `Mute @${post.author?.username}`}</span>
                  </button>
                  <button
                    type="button"
                    className="post-menu-item danger"
                    onClick={() => {
                      setMenuOpen(false);
                      setReportModalOpen(true);
                    }}
                  >
                    <Flag size={14} />
                    <span>Report post</span>
                  </button>
                </>
              )}
            </div>
          )}
        </header>

        {/* Media Container */}
        <div
          className={`post-media-container ${isVideo ? 'is-reel' : ''}`}
          onDoubleClick={handleDoubleTap}
          onClick={isVideo ? handleTogglePlay : (hasTags ? () => setShowTags((prev) => !prev) : undefined)}
          style={{ position: 'relative' }}
        >
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                src={getAdaptiveVideoUrl(currentMedia?.mediaUrl)}
                poster={getVideoPosterUrl(currentMedia?.mediaUrl, post.thumbnailUrl)}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="post-media-item video"
                style={{
                  objectFit: 'contain',
                  background: '#000',
                  maxHeight: '580px',
                  width: '100%',
                  ...getFilterStyle(currentMedia?.filterName),
                }}
              />
              <button
                type="button"
                className="video-sound-toggle-btn"
                onClick={handleToggleSound}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </>
          ) : currentMedia?.mediaUrl ? (
            <ProgressiveImage
              src={currentMedia.mediaUrl}
              alt={currentMedia.altText || post.caption || 'Post'}
              className="post-media-item"
              loading="lazy"
              filterStyle={getFilterStyle(currentMedia.filterName)}
            />
          ) : (
            <div className="dialog-media-empty">No media</div>
          )}

          {/* Double-click Heart Animation */}
          {showHeartAnim && (
            <Heart size={80} className="double-click-heart" fill="#fff" />
          )}

          {/* User Tag Indicator Pill (Instagram-style) */}
          {hasTags && (
            <button
              type="button"
              className={`post-tag-indicator-btn ${showTags ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowTags((prev) => !prev);
              }}
              aria-label={showTags ? 'Hide tagged accounts' : 'Show tagged accounts'}
              title={showTags ? 'Hide tagged accounts' : 'Show tagged accounts'}
            >
              <User size={12} fill="#fff" color="#fff" />
            </button>
          )}

          {/* User Tag Bubbles Floating on Photo */}
          {hasTags && showTags && (
            <div className="post-tags-container" onClick={(e) => e.stopPropagation()}>
              {activeTags.map((tag) => (
                <div
                  key={tag.id || tag.taggedUserId}
                  className="post-tag-bubble"
                  style={{
                    left: `${Math.min(88, Math.max(12, tag.xPercent ?? 50))}%`,
                    top: `${Math.min(88, Math.max(12, tag.yPercent ?? 50))}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${tag.taggedUsername || tag.taggedUserId}`);
                  }}
                  title={`View @${tag.taggedUsername}'s profile`}
                >
                  <div className="post-tag-pointer" />
                  <span className="post-tag-username">@{tag.taggedUsername}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reel Audio Indicator Pill (Instagram-style) */}
          {isReel && (
            <div className="post-audio-pill">
              <Music size={11} className="spin-music-icon" />
              <span>Original audio • {post.author?.username || 'Creator'}</span>
            </div>
          )}

          {/* Carousel Counter Badge (1/3) */}
          {mediaList.length > 1 && (
            <div className="carousel-counter-badge">
              {currentMediaIdx + 1}/{mediaList.length}
            </div>
          )}

          {/* Carousel Arrows */}
          {mediaList.length > 1 && (
            <>
              {currentMediaIdx > 0 && (
                <button
                  type="button"
                  className="carousel-btn prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIdx((prev) => prev - 1);
                  }}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {currentMediaIdx < mediaList.length - 1 && (
                <button
                  type="button"
                  className="carousel-btn next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIdx((prev) => prev + 1);
                  }}
                  aria-label="Next photo"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              <div className="carousel-dots">
                {mediaList.map((_, idx) => (
                  <div
                    key={idx}
                    className={`carousel-dot ${idx === currentMediaIdx ? 'active' : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* View Insights Banner (Instagram Author Tool) */}
        {isAuthor && (
          <button
            type="button"
            className="post-view-insights-bar"
            onClick={() => setInsightsModalOpen(true)}
          >
            <BarChart2 size={14} />
            <span>View insights</span>
          </button>
        )}

        {/* Action Bar */}
        <div className="post-card-actions">
          <div className="post-actions-left">
            <button
              type="button"
              className={`post-action-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={24} fill={isLiked ? 'var(--color-error)' : 'none'} />
            </button>
            <button
              type="button"
              className="post-action-btn"
              onClick={() => setCommentsModalOpen(true)}
              aria-label="Comment"
            >
              <MessageCircle size={24} />
            </button>
            <button
              type="button"
              className="post-action-btn post-share-btn"
              onClick={() => setShareModalOpen(true)}
              aria-label="Share"
            >
              <Send size={22} />
              {shareCount > 0 && (
                <span className="post-share-count-pill">{formatCount(shareCount)}</span>
              )}
            </button>
          </div>

          <button
            type="button"
            className="post-action-btn"
            onClick={handleSave}
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <Bookmark size={24} fill={isSaved ? 'var(--text-primary)' : 'none'} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="post-likes-section">
          {hideLikeCount ? (
            isAuthor ? (
              <span
                className={`post-likes-count ${likeCount > 0 ? 'clickable-likes' : ''}`}
                onClick={() => likeCount > 0 && setLikesModalOpen(true)}
                role={likeCount > 0 ? 'button' : undefined}
                tabIndex={likeCount > 0 ? 0 : undefined}
                title={likeCount > 0 ? 'View likes' : undefined}
              >
                {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}{' '}
                <span className="post-hide-likes-note">(Hidden to others)</span>
              </span>
            ) : (
              <span className="post-liked-by-text">
                Liked by <strong>others</strong>
              </span>
            )
          ) : (
            <span
              className={`post-likes-count ${likeCount > 0 ? 'clickable-likes' : ''}`}
              onClick={() => likeCount > 0 && setLikesModalOpen(true)}
              role={likeCount > 0 ? 'button' : undefined}
              tabIndex={likeCount > 0 ? 0 : undefined}
              title={likeCount > 0 ? 'View likes' : undefined}
            >
              {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
            </span>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="post-caption-section">
            <span
              className="caption-author"
              onClick={() => navigate(`/profile/${post.author?.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {post.author?.username}
            </span>
            <span>
              {renderFormattedCaption(
                isExpanded || post.caption.length <= 90
                  ? post.caption
                  : `${post.caption.slice(0, 90)}...`
              )}
            </span>
            {post.caption.length > 90 && !isExpanded && (
              <button
                type="button"
                className="caption-more-btn"
                onClick={() => setIsExpanded(true)}
              >
                more
              </button>
            )}
          </div>
        )}

        {/* Comments Link */}
        {commentCount > 0 && (
          <div className="post-comments-summary">
            <button
              type="button"
              className="view-all-comments-btn"
              onClick={() => setCommentsModalOpen(true)}
            >
              View all {formatCount(commentCount)} comments
            </button>
          </div>
        )}

        {/* Quick Comment Field */}
        {commentsDisabled ? (
          <div className="post-comments-disabled-banner">
            <MessageSquareOff size={14} className="comments-disabled-icon" />
            <span>Comments on this post have been limited.</span>
          </div>
        ) : (
          <div className="post-quick-comment-wrap">
            {showQuickEmojis && (
              <div className="post-quick-emoji-tray" role="toolbar" aria-label="Quick emojis">
                {['❤️', '🙌', '🔥', '👏', '😍', '😊'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="post-quick-emoji-chip"
                    onClick={() => {
                      setQuickComment((prev) => prev + em);
                      setShowQuickEmojis(false);
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleQuickCommentSubmit} className="post-quick-comment-form">
              <button
                type="button"
                className="quick-comment-emoji-btn"
                onClick={() => setShowQuickEmojis((prev) => !prev)}
                aria-label="Add emoji"
                tabIndex={-1}
              >
                <Smile size={18} />
              </button>
              <input
                type="text"
                className="quick-comment-input"
                placeholder="Add a comment..."
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                maxLength={500}
              />
              <button
                type="submit"
                className="quick-comment-submit"
                disabled={!quickComment.trim() || submittingComment}
              >
                Post
              </button>
            </form>
          </div>
        )}
      </article>

      {/* Modals */}
      {commentsModalOpen && (
        <CommentsModal
          isOpen={commentsModalOpen}
          onClose={() => setCommentsModalOpen(false)}
          postId={post.id}
          onPostUpdated={onPostUpdated}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="POST"
          targetId={post.id}
          onReportSuccess={() => {
            if (onPostDeleted) onPostDeleted(post.id);
          }}
        />
      )}

      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          post={post}
          onShareComplete={(newCount) => {
            if (newCount !== undefined) {
              setShareCount(newCount);
            } else {
              setShareCount((prev) => prev + 1);
            }
          }}
        />
      )}

      {insightsModalOpen && (
        <InsightsModal
          isOpen={insightsModalOpen}
          onClose={() => setInsightsModalOpen(false)}
          post={post}
          isReel={isReel}
        />
      )}

      {editModalOpen && (
        <EditPostModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          post={{ ...post, hideLikeCount }}
          onPostUpdated={(updatedPost) => {
            if (updatedPost?.hideLikeCount !== undefined) {
              setHideLikeCount(updatedPost.hideLikeCount);
            }
            if (onPostUpdated) onPostUpdated();
          }}
        />
      )}

      {likesModalOpen && (
        <LikesModal
          isOpen={likesModalOpen}
          onClose={() => setLikesModalOpen(false)}
          targetId={post.id}
          targetType="post"
        />
      )}
    </>
  );
};

export default React.memo(PostCard);
