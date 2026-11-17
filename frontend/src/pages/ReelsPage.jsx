import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Music,
  Film,
  Play,
  BarChart2,
  MoreHorizontal,
  Archive,
  Trash2,
  Flag,
  Copy,
  EyeOff,
  RotateCw,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import CommentsModal from '../components/modals/CommentsModal';
import ShareModal from '../components/modals/ShareModal';
import InsightsModal from '../components/modals/InsightsModal';
import ReportModal from '../components/modals/ReportModal';
import LikesModal from '../components/modals/LikesModal';
import EmptyState from '../components/common/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import reelService from '../services/reel.service';
import { getVideoPosterUrl, getAdaptiveVideoUrl, shouldPrefetchMedia } from '../utils/mediaUrl';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';
import { formatCount } from '../utils';
import './ReelsPage.css';

const REELS_PAGE_SIZE = 5;

export const ReelsPage = () => {
  const { reelId } = useParams();
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState('for-you'); // 'for-you' | 'following'
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likesMap, setLikesMap] = useState({});
  const [savedMap, setSavedMap] = useState({});
  const [sharesMap, setSharesMap] = useState({});
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [shareModalReel, setShareModalReel] = useState(null);
  const [insightsReel, setInsightsReel] = useState(null);
  const [menuState, setMenuState] = useState(null); // { reelId, anchor: 'top' | 'bottom' }
  const [menuPosition, setMenuPosition] = useState({ placement: 'beside-right', style: {} });
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingReel, setIsDraggingReel] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReelId, setReportReelId] = useState(null);
  const [likesModalReelId, setLikesModalReelId] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [slideDirection, setSlideDirection] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const lastTouchTapRef = useRef(0);
  const menuRef = useRef(null);
  const topMenuBtnRef = useRef(null);
  const bottomMenuBtnRef = useRef(null);
  const isWheelingRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelIdleTimerRef = useRef(null);
  const wheelCooldownTimerRef = useRef(null);
  const touchDragRef = useRef({ active: false, startY: 0, startX: 0, moved: false });
  const mouseDragRef = useRef({ active: false, startY: 0, startX: 0, moved: false });
  const wasDraggedRef = useRef(false);
  const dragClickResetTimerRef = useRef(null);
  const interactionCtxRef = useRef({ handleNextReel: () => {}, handlePrevReel: () => {}, modalOpen: false });
  const viewedReelsRef = useRef(new Set());
  const sessionSeedRef = useRef(Date.now());
  const isFetchingMoreRef = useRef(false);

  const { user: currentUser, isFollowing, toggleFollow, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const uploadCtx = useUpload();

  const reelUpload = uploadCtx?.uploads?.find(
    (u) => u.type === 'reel' && u.status === 'uploading'
  );

  const effectiveReels = React.useMemo(() => {
    if (!reelUpload) return reels;

    const uploadingItem = {
      id: `uploading-reel-${reelUpload.id}`,
      videoUrl: reelUpload.videoUrl || reelUpload.thumbnail,
      thumbnailUrl: reelUpload.thumbnail,
      caption: reelUpload.caption,
      location: reelUpload.location,
      audioTitle: reelUpload.audioTitle || 'Original Audio',
      audioArtist: reelUpload.audioArtist || currentUser?.username || 'You',
      author: {
        id: currentUser?.id || 'current-user',
        username: currentUser?.username || 'You',
        displayName: currentUser?.displayName || currentUser?.fullName || 'You',
        avatarUrl: currentUser?.avatarUrl || currentUser?.profilePictureUrl,
      },
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      isUploading: true,
      uploadProgress: reelUpload.progress || 10,
      statusMessage: reelUpload.statusMessage,
    };

    return [uploadingItem, ...reels.filter((r) => !r.isUploading)];
  }, [reels, reelUpload, currentUser]);

  const loadReels = async (pageNum = 0, currentFeedType = feedType, seed = sessionSeedRef.current) => {
    try {
      if (pageNum === 0) setLoading(true);
      
      let list = [];
      // If direct deep-link reelId is requested and this is page 0, load that specific reel first
      if (pageNum === 0 && reelId) {
        try {
          const singleRes = await reelService.getReelById(reelId);
          const singleItem = singleRes?.data || singleRes;
          if (singleItem?.id) {
            list.push(singleItem);
          }
        } catch {
          // If specific reel not found or deleted, continue loading general feed
        }
      }

      const res = currentFeedType === 'following'
        ? await reelService.getFollowingReels(pageNum, REELS_PAGE_SIZE, seed)
        : await reelService.getReels(pageNum, REELS_PAGE_SIZE, seed);
      const fetchedList = res?.data?.content || res?.content || res?.data || [];
      
      // Filter out duplicate if deep-linked reel was already added
      const existingIds = new Set(list.map((r) => r.id));
      for (const item of fetchedList) {
        if (!existingIds.has(item.id)) {
          list.push(item);
          existingIds.add(item.id);
        }
      }
      
      setReels((prev) => {
        if (pageNum === 0) return list;
        return [...prev, ...fetchedList];
      });
      if (fetchedList.length === 0) {
        setHasMore(false);
      }

      const incomingList = pageNum === 0 ? list : fetchedList;
      const initialLikes = {};
      const initialSaved = {};
      incomingList.forEach((r) => {
        if (r?.id) {
          initialLikes[r.id] = {
            count: r.likeCount ?? 0,
            liked: !!r.likedByCurrentUser,
          };
          initialSaved[r.id] = !!r.savedByCurrentUser;
        }
      });

      setLikesMap((prev) => ({ ...initialLikes, ...prev }));
      setSavedMap((prev) => ({ ...initialSaved, ...prev }));
      setPage(pageNum);
    } catch {
      if (pageNum === 0) setReels([]);
    } finally {
      setLoading(false);
    }
  };

  const recordCurrentReelView = useCallback((reelId) => {
    if (reelId && !viewedReelsRef.current.has(reelId)) {
      viewedReelsRef.current.add(reelId);
      reelService.recordView(reelId).catch(() => {});
    }
  }, []);

  useEffect(() => {
    viewedReelsRef.current = new Set();
    sessionSeedRef.current = Date.now();
    loadReels(0, feedType, sessionSeedRef.current);
  }, [reelId, feedType]);

  // Listen for background reel upload completion
  useEffect(() => {
    const handleRefresh = () => {
      loadReels(0, feedType, sessionSeedRef.current);
    };
    window.addEventListener('reel:refresh', handleRefresh);
    return () => window.removeEventListener('reel:refresh', handleRefresh);
  }, [feedType]);

  // When activeIndex changes or reel changes, autoplay the video & record view
  useEffect(() => {
    const curReel = effectiveReels[activeIndex];
    if (curReel?.id && !curReel.isUploading) {
      recordCurrentReelView(curReel.id);
    }

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (curReel?.id && !curReel.isUploading) {
              recordCurrentReelView(curReel.id);
            }
          })
          .catch(() => setIsPlaying(false));
      }
    }

    // Check if we need to load more reels
    if (hasMore && !isFetchingMoreRef.current && activeIndex >= effectiveReels.length - 2 && effectiveReels.length > 0) {
      isFetchingMoreRef.current = true;
      loadReels(page + 1, feedType, sessionSeedRef.current).finally(() => {
        isFetchingMoreRef.current = false;
      });
    }
  }, [activeIndex, effectiveReels, hasMore, page, feedType, recordCurrentReelView]);

  // Network-Adaptive Advance Prefetching: Preload next reel ONLY if network latency allows
  useEffect(() => {
    if (!shouldPrefetchMedia() || activeIndex >= effectiveReels.length - 1) return;
    const nextReel = effectiveReels[activeIndex + 1];
    if (nextReel?.videoUrl && !nextReel.isUploading) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = getAdaptiveVideoUrl(nextReel.videoUrl);
      document.head.appendChild(link);
      return () => {
        if (document.head.contains(link)) document.head.removeChild(link);
      };
    }
  }, [activeIndex, effectiveReels]);

  const handleSwitchFeed = (nextFeed) => {
    if (nextFeed === feedType) return;
    sessionSeedRef.current = Date.now();
    setFeedType(nextFeed);
    setActiveIndex(0);
    setPage(0);
    setHasMore(true);
  };

  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), 360);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  const handleNextReel = useCallback(() => {
    if (activeIndex < effectiveReels.length - 1) {
      setSlideDirection('next');
      setVideoProgress(0);
      setActiveIndex((prev) => prev + 1);
    }
  }, [activeIndex, effectiveReels.length]);

  const handlePrevReel = useCallback(() => {
    if (activeIndex > 0) {
      setSlideDirection('prev');
      setVideoProgress(0);
      setActiveIndex((prev) => prev - 1);
    }
  }, [activeIndex]);

  // Keyboard navigation (Escape to close popover, ArrowDown / ArrowUp to browse)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuState) {
        e.preventDefault();
        setMenuState(null);
        return;
      }
      if (commentsModalOpen || shareModalReel || insightsReel || reportModalOpen) return; // Don't intercept when modal is open
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevReel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextReel, handlePrevReel, commentsModalOpen, shareModalReel, insightsReel, reportModalOpen, menuState]);

  const isInteractiveReelTarget = (target) =>
    target instanceof Element &&
    Boolean(
      target.closest(
        'button, a, input, textarea, select, [role="button"], [role="tab"], [role="menu"], [role="dialog"], .reel-options-popover, .reel-author-username, .reel-audio-track, .modal-overlay'
      )
    );

  // Non-passive wheel listener supporting mouse wheels (pixel/line) and precision touchpads
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e) => {
      const ctx = interactionCtxRef.current;
      if (ctx.modalOpen) return;
      if (e.target instanceof Element && e.target.closest('.reel-options-popover, [role="dialog"], .modal-overlay')) {
        return;
      }

      const scale =
        e.deltaMode === 1
          ? 32
          : e.deltaMode === 2
            ? window.innerHeight || 600
            : 1;
      const dy = (e.deltaY || 0) * scale;
      const dx = (e.deltaX || 0) * scale;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dy) < 12) return;
      if (Math.abs(dy) < 0.5) return;

      e.preventDefault();

      if (isWheelingRef.current) return;

      if (wheelAccumRef.current !== 0 && Math.sign(dy) !== Math.sign(wheelAccumRef.current)) {
        wheelAccumRef.current = 0;
      }

      wheelAccumRef.current += dy;
      clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 160);

      if (Math.abs(wheelAccumRef.current) >= 42) {
        const direction = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        isWheelingRef.current = true;
        if (direction > 0) {
          ctx.handleNextReel();
        } else {
          ctx.handlePrevReel();
        }
        clearTimeout(wheelCooldownTimerRef.current);
        wheelCooldownTimerRef.current = setTimeout(() => {
          isWheelingRef.current = false;
          wheelAccumRef.current = 0;
        }, 450);
      }
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
      clearTimeout(wheelIdleTimerRef.current);
      clearTimeout(wheelCooldownTimerRef.current);
    };
  }, []);

  // Mouse click-and-drag swipe support for desktop mouse users
  useEffect(() => {
    const handleMouseMove = (e) => {
      const drag = mouseDragRef.current;
      if (!drag.active) return;
      const curY = e.clientY ?? drag.startY;
      const curX = e.clientX ?? drag.startX;
      const dy = curY - drag.startY;
      const dx = curX - drag.startX;

      if (!drag.moved && Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
        drag.moved = true;
        wasDraggedRef.current = true;
        setIsDraggingReel(true);
      }
      if (drag.moved) {
        setDragOffsetY(Math.max(-96, Math.min(96, dy * 0.42)));
      }
    };

    const handleMouseUp = (e) => {
      const drag = mouseDragRef.current;
      if (!drag.active) return;
      drag.active = false;
      setIsDraggingReel(false);
      setDragOffsetY(0);

      const endY = e.clientY ?? drag.startY;
      const diff = drag.startY - endY;
      if (drag.moved || Math.abs(diff) > 45) {
        if (diff > 45) {
          interactionCtxRef.current.handleNextReel();
        } else if (diff < -45) {
          interactionCtxRef.current.handlePrevReel();
        }
      }

      if (drag.moved) {
        clearTimeout(dragClickResetTimerRef.current);
        dragClickResetTimerRef.current = setTimeout(() => {
          wasDraggedRef.current = false;
        }, 100);
      }
      drag.moved = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      clearTimeout(dragClickResetTimerRef.current);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || interactionCtxRef.current.modalOpen) return;
    if (isInteractiveReelTarget(e.target)) return;
    mouseDragRef.current = {
      active: true,
      startY: e.clientY ?? 0,
      startX: e.clientX ?? 0,
      moved: false,
    };
  };

  // Finger touch swipe support
  const handleTouchStart = (e) => {
    if (interactionCtxRef.current.modalOpen) return;
    if (e.touches.length !== 1 || isInteractiveReelTarget(e.target)) return;
    touchDragRef.current = {
      active: true,
      startY: e.touches[0]?.clientY ?? 0,
      startX: e.touches[0]?.clientX ?? 0,
      moved: false,
    };
  };

  const handleTouchMove = (e) => {
    const drag = touchDragRef.current;
    if (!drag.active || e.touches.length !== 1) return;
    const curY = e.touches[0]?.clientY ?? drag.startY;
    const curX = e.touches[0]?.clientX ?? drag.startX;
    const dy = curY - drag.startY;
    const dx = curX - drag.startX;

    if (!drag.moved && Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
      drag.moved = true;
      wasDraggedRef.current = true;
      setIsDraggingReel(true);
    }
    if (drag.moved) {
      setDragOffsetY(Math.max(-96, Math.min(96, dy * 0.42)));
    }
  };

  const finishTouchSwipe = (endY) => {
    const drag = touchDragRef.current;
    if (!drag.active) return;
    drag.active = false;
    setIsDraggingReel(false);
    setDragOffsetY(0);

    if (typeof endY === 'number') {
      const diff = drag.startY - endY;
      if (diff > 45) {
        handleNextReel();
      } else if (diff < -45) {
        handlePrevReel();
      }
    }

    if (drag.moved) {
      clearTimeout(dragClickResetTimerRef.current);
      dragClickResetTimerRef.current = setTimeout(() => {
        wasDraggedRef.current = false;
      }, 100);
    }
    drag.moved = false;
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches?.[0]?.clientY;
    finishTouchSwipe(endY);
  };

  const handleTouchCancel = () => {
    finishTouchSwipe(undefined);
  };

  const toggleVideoPlay = () => {
    if (wasDraggedRef.current) return;
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      const curReel = effectiveReels[activeIndex];
      if (curReel?.id && !curReel.isUploading) {
        recordCurrentReelView(curReel.id);
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleLikeToggle = async (reelId) => {
    const cur = likesMap[reelId] || { count: 0, liked: false };
    const nextLiked = !cur.liked;

    setLikesMap((prev) => ({
      ...prev,
      [reelId]: {
        liked: nextLiked,
        count: nextLiked ? cur.count + 1 : Math.max(0, cur.count - 1),
      },
    }));

    try {
      await reelService.toggleLike(reelId);
    } catch {
      // Revert if failed
      setLikesMap((prev) => ({
        ...prev,
        [reelId]: cur,
      }));
    }
  };

  const handleDoubleTap = (reelId) => {
    setShowHeartAnim(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([20, 40]);
      } catch {
        // ignore
      }
    }
    setTimeout(() => setShowHeartAnim(false), 850);
    if (!likesMap[reelId]?.liked) {
      handleLikeToggle(reelId);
    }
  };

  const handleVideoTouchStart = () => {
    const now = Date.now();
    if (now - lastTouchTapRef.current < 320) {
      if (currentReel && !currentReel.isUploading) {
        handleDoubleTap(currentReel.id);
      }
      lastTouchTapRef.current = 0;
    } else {
      lastTouchTapRef.current = now;
    }
  };

  const handleTimeUpdate = (e) => {
    const v = e.currentTarget;
    if (v && v.duration && !Number.isNaN(v.duration) && v.duration > 0) {
      setVideoProgress((v.currentTime / v.duration) * 100);
    }
  };

  const handleSeekProgress = (e) => {
    e.stopPropagation();
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = ratio * videoRef.current.duration;
      setVideoProgress(ratio * 100);
    }
  };

  const handleSaveToggle = async (reelId) => {
    const curSaved = !!savedMap[reelId];
    setSavedMap((prev) => ({ ...prev, [reelId]: !curSaved }));

    try {
      await reelService.toggleSaveReel(reelId);
      showSuccess(!curSaved ? 'Reel saved' : 'Reel removed from saved');
    } catch {
      setSavedMap((prev) => ({ ...prev, [reelId]: curSaved }));
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Delete this reel? It will be moved to Recently Deleted for 30 days.')) return;
    try {
      await reelService.deleteReel(reelId);
      showSuccess('Reel moved to Recently Deleted');
      setMenuState(null);
      window.dispatchEvent(new CustomEvent('reel:refresh'));
      setReels((prev) => prev.filter((r) => r.id !== reelId));
    } catch (err) {
      showError(err.message || 'Failed to delete reel');
    }
  };

  const handleArchiveReel = async (reelId) => {
    try {
      const res = await reelService.toggleArchiveReel(reelId);
      const isArchived = Boolean(res?.data?.isArchived ?? res?.isArchived);
      showSuccess(isArchived ? 'Reel archived. Hidden from your profile.' : 'Reel unarchived');
      setMenuState(null);
      setReels((prev) => prev.filter((r) => r.id !== reelId));
    } catch (err) {
      showError(err.message || 'Failed to archive reel');
    }
  };

  const handleCopyLink = (reelId) => {
    const reelUrl = `${window.location.origin}/reels/${reelId}`;
    navigator.clipboard.writeText(reelUrl);
    showSuccess('Reel link copied to clipboard');
    setMenuState(null);
  };

  const handleNotInterested = async (reelId) => {
    try {
      await reelService.markNotInterested(reelId);
      showSuccess("We'll show fewer reels like this");
    } catch {
      showSuccess("We'll show fewer reels like this");
    } finally {
      setMenuState(null);
      handleNextReel();
    }
  };

  const handleFollowToggle = async (authorId) => {
    try {
      const nextState = await toggleFollow(authorId);
      if (nextState) {
        showSuccess('Following creator');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const handleShare = async (reelId) => {
    const url = `${window.location.origin}/reels/${reelId}`;
    navigator.clipboard.writeText(url);
    showSuccess('Reel link copied to clipboard!');
    try {
      await reelService.recordShare(reelId, { shareType: 'COPY_LINK' });
    } catch {
      // Non-critical
    }
  };

  const currentReel = effectiveReels[activeIndex];
  const prevReel = activeIndex > 0 ? effectiveReels[activeIndex - 1] : null;
  const nextReel = activeIndex < effectiveReels.length - 1 ? effectiveReels[activeIndex + 1] : null;

  const myId = String(currentUser?.id || currentUser?.userId || '').trim().toLowerCase();
  const reelAuthorId = String(
    currentReel?.author?.id ||
    currentReel?.author?.userId ||
    currentReel?.userId ||
    currentReel?.user?.id ||
    currentReel?.authorId ||
    ''
  ).trim().toLowerCase();
  const isViewerAdmin = Boolean(
    isAdmin ||
    currentUser?.role === 'ROLE_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.username?.toLowerCase() === 'admin'
  );
  const isReelAuthor = Boolean(myId && reelAuthorId && myId === reelAuthorId);
  const canDeleteReel = isReelAuthor || isViewerAdmin;
  const isMenuOpenForCurrent = Boolean(menuState && currentReel && menuState.reelId === currentReel.id);

  interactionCtxRef.current = {
    handleNextReel,
    handlePrevReel,
    modalOpen: Boolean(commentsModalOpen || shareModalReel || insightsReel || reportModalOpen || isMenuOpenForCurrent),
  };

  const toggleReelMenu = useCallback((targetReelId, anchor) => {
    setMenuState((prev) =>
      prev && prev.reelId === targetReelId && prev.anchor === anchor
        ? null
        : { reelId: targetReelId, anchor }
    );
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!menuState || typeof window === 'undefined') return;
    const mobile = window.innerWidth <= 768;
    setIsMobileViewport(mobile);
    if (mobile) {
      setMenuPosition({ placement: 'mobile-sheet', style: {} });
      return;
    }

    const triggerEl = menuState.anchor === 'bottom' ? bottomMenuBtnRef.current : topMenuBtnRef.current;
    if (!triggerEl) {
      setMenuPosition({ placement: menuState.anchor === 'bottom' ? 'above' : 'below', style: {} });
      return;
    }

    const btnRect = triggerEl.getBoundingClientRect();
    if (btnRect.width === 0 && btnRect.height === 0) {
      setMenuPosition({
        placement: menuState.anchor === 'bottom' ? 'above' : 'below',
        style: menuState.anchor === 'bottom'
          ? { position: 'fixed', bottom: '72px', right: '24px' }
          : { position: 'fixed', top: '64px', right: '24px' },
      });
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuRect = menuRef.current?.getBoundingClientRect();
    const menuW = menuRect?.width > 0 ? menuRect.width : 220;
    const menuH = menuRect?.height > 0 ? menuRect.height : 188;
    const MARGIN = 12;
    const GAP = 10;

    let top;
    let left;
    let placement;
    let transformOrigin;

    const fitsRight = btnRect.right + GAP + menuW <= vw - MARGIN;
    const fitsLeft = btnRect.left - GAP - menuW >= MARGIN;
    const fitsAbove = btnRect.top - GAP - menuH >= MARGIN;
    const fitsBelow = btnRect.bottom + GAP + menuH <= vh - MARGIN;

    if (menuState.anchor === 'bottom') {
      if (fitsRight) {
        left = btnRect.right + GAP;
        top = Math.max(MARGIN, Math.min(btnRect.bottom - menuH, vh - menuH - MARGIN));
        placement = 'beside-right';
        transformOrigin = 'bottom left';
      } else if (fitsLeft) {
        left = btnRect.left - GAP - menuW;
        top = Math.max(MARGIN, Math.min(btnRect.bottom - menuH, vh - menuH - MARGIN));
        placement = 'beside-left';
        transformOrigin = 'bottom right';
      } else if (fitsAbove) {
        left = Math.max(MARGIN, Math.min(btnRect.right - menuW, vw - menuW - MARGIN));
        top = btnRect.top - GAP - menuH;
        placement = 'above';
        transformOrigin = 'bottom right';
      } else {
        left = Math.max(MARGIN, Math.min(btnRect.right - menuW, vw - menuW - MARGIN));
        top = Math.max(MARGIN, vh - menuH - MARGIN);
        placement = 'above';
        transformOrigin = 'bottom right';
      }
    } else if (fitsRight) {
      left = btnRect.right + GAP;
      top = Math.max(MARGIN, Math.min(btnRect.top, vh - menuH - MARGIN));
      placement = 'beside-right';
      transformOrigin = 'top left';
    } else if (fitsBelow) {
      left = Math.max(MARGIN, Math.min(btnRect.right - menuW, vw - menuW - MARGIN));
      top = btnRect.bottom + GAP;
      placement = 'below';
      transformOrigin = 'top right';
    } else if (fitsLeft) {
      left = btnRect.left - GAP - menuW;
      top = Math.max(MARGIN, Math.min(btnRect.top, vh - menuH - MARGIN));
      placement = 'beside-left';
      transformOrigin = 'top right';
    } else {
      left = Math.max(MARGIN, Math.min(btnRect.right - menuW, vw - menuW - MARGIN));
      top = Math.max(MARGIN, Math.min(btnRect.bottom + GAP, vh - menuH - MARGIN));
      placement = 'below';
      transformOrigin = 'top right';
    }

    setMenuPosition({
      placement,
      style: {
        position: 'fixed',
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
        transformOrigin,
      },
    });
  }, [menuState]);

  // Close popover when navigating between reels or switching feeds
  useEffect(() => {
    setMenuState(null);
  }, [currentReel?.id, feedType]);

  // Measure and anchor popover immediately before paint when opened
  useLayoutEffect(() => {
    if (!isMenuOpenForCurrent) return;
    updateMenuPosition();
  }, [isMenuOpenForCurrent, updateMenuPosition]);

  // Close on click outside without blocking interaction behind the menu, and keep anchored on resize/scroll
  useEffect(() => {
    if (!isMenuOpenForCurrent) return;

    const handleViewportChange = () => updateMenuPosition();
    const handleOutsideClick = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (topMenuBtnRef.current?.contains(e.target)) return;
      if (bottomMenuBtnRef.current?.contains(e.target)) return;
      setMenuState(null);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    document.addEventListener('click', handleOutsideClick, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      document.removeEventListener('click', handleOutsideClick, true);
    };
  }, [isMenuOpenForCurrent, updateMenuPosition]);

  return (
    <div
      className={`reels-page-container ${isDraggingReel ? 'is-dragging' : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Top Stage Header: Centered Feed Switcher + Right Mute/Options Controls */}
      <div className="reels-stage-topbar">
        <div className="reels-topbar-spacer" aria-hidden="true" />
        <div className="reels-top-feed-switcher" role="tablist" aria-label="Reels feed filter">
          <button
            type="button"
            role="tab"
            aria-selected={feedType === 'for-you'}
            className={`reels-feed-tab ${feedType === 'for-you' ? 'active' : ''}`}
            onClick={() => handleSwitchFeed('for-you')}
          >
            For You
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={feedType === 'following'}
            className={`reels-feed-tab ${feedType === 'following' ? 'active' : ''}`}
            onClick={() => handleSwitchFeed('following')}
          >
            Following
          </button>
        </div>
        {currentReel ? (
          <div className="reel-top-right-controls">
            <button
              type="button"
              className="reel-top-btn"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              ref={topMenuBtnRef}
              type="button"
              className={`reel-top-btn ${isMenuOpenForCurrent && menuState?.anchor === 'top' ? 'active' : ''}`}
              onClick={() => toggleReelMenu(currentReel.id, 'top')}
              aria-label="Reel options"
              aria-haspopup="menu"
              aria-expanded={isMenuOpenForCurrent && menuState?.anchor === 'top'}
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        ) : (
          <div className="reels-topbar-spacer" aria-hidden="true" />
        )}
      </div>
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <Skeleton className="w-[320px] sm:w-[360px] h-[540px] sm:h-[620px] rounded-2xl" />
        </div>
      ) : effectiveReels.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No Reels Available"
          description="Be the first creator to record and share a reel on the platform."
        />
      ) : currentReel ? (
        <div className="reels-carousel-wrapper">
              <div
                className={`reels-carousel-stage ${isDraggingReel ? 'is-dragging' : ''}`}
                style={
                  dragOffsetY
                    ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' }
                    : { transform: 'translateY(0px)', transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)' }
                }
              >
                {/* Prev Preview Card (if activeIndex > 0) */}
                {prevReel && (
                  <div className="reel-card-preview reel-card-prev" aria-hidden="true">
                    <video
                      src={prevReel.videoUrl?.startsWith('blob:') ? prevReel.videoUrl : getAdaptiveVideoUrl(prevReel.videoUrl)}
                      poster={prevReel.videoUrl?.startsWith('blob:') ? undefined : getVideoPosterUrl(prevReel.videoUrl, prevReel.thumbnailUrl)}
                      className="reel-video-element-preview"
                      preload="none"
                      muted
                      playsInline
                    />
                    <div className="reel-preview-overlay">
                      <span className="reel-preview-caption">@{prevReel.author?.username}</span>
                    </div>
                  </div>
                )}

                {/* Active Reel Card (One by One) */}
                <div
                  className={`reel-card-item ${isDraggingReel ? 'is-dragging' : ''} ${
                    slideDirection === 'next'
                      ? 'reel-slide-in-from-bottom'
                      : slideDirection === 'prev'
                      ? 'reel-slide-in-from-top'
                      : ''
                  }`}
                >
                  {/* Live Uploading Banner if reel is currently uploading */}
                  {currentReel.isUploading && (
                    <div className="reel-uploading-header-banner">
                      <div className="reel-uploading-banner-top">
                        <div className="reel-uploading-banner-title">
                          <RotateCw size={14} className="story-upload-spinning-icon" />
                          <span>Uploading Reel... {currentReel.uploadProgress || 10}%</span>
                        </div>
                        <span className="reel-uploading-status-pill">In Progress</span>
                      </div>
                      <div className="reel-uploading-progress-track">
                        <div
                          className="reel-uploading-progress-bar"
                          style={{ width: `${Math.max(8, currentReel.uploadProgress || 10)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    key={`${currentReel.id}-${activeIndex}`}
                    src={currentReel.videoUrl?.startsWith('blob:') ? currentReel.videoUrl : getAdaptiveVideoUrl(currentReel.videoUrl)}
                    poster={currentReel.videoUrl?.startsWith('blob:') ? undefined : getVideoPosterUrl(currentReel.videoUrl, currentReel.thumbnailUrl)}
                    className="reel-video-element"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    onClick={toggleVideoPlay}
                    onDoubleClick={() => !currentReel.isUploading && handleDoubleTap(currentReel.id)}
                    onTouchStart={handleVideoTouchStart}
                    onTimeUpdate={handleTimeUpdate}
                  />

                  {/* Play/Pause Indicator if paused */}
                  {!isPlaying && (
                    <div className="reel-play-indicator" onClick={toggleVideoPlay}>
                      <Play size={48} fill="#fff" />
                    </div>
                  )}

                  {/* Double Tap Instagram Heart Burst */}
                  {showHeartAnim && (
                    <div className="reel-heart-burst">
                      <div className="reel-heart-burst-glow" />
                      <div className="reel-heart-burst-main">
                        <Heart size={92} fill="#ff3040" color="#ff3040" />
                      </div>
                      <div className="reel-heart-particle p1">
                        <Heart size={26} fill="#ff3040" color="#ff3040" />
                      </div>
                      <div className="reel-heart-particle p2">
                        <Heart size={22} fill="#ff3040" color="#ff3040" />
                      </div>
                      <div className="reel-heart-particle p3">
                        <Heart size={24} fill="#ff3040" color="#ff3040" />
                      </div>
                    </div>
                  )}

                  <div className="reel-overlay-gradient" />

                  {/* Instagram Video Scrub Progress Bar */}
                  <div
                    className="reel-progress-track"
                    onClick={handleSeekProgress}
                    role="progressbar"
                    aria-valuenow={Math.round(videoProgress)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Reel video progress"
                  >
                    <div
                      className="reel-progress-bar"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>



            {/* Bottom Info: Creator, Caption, Audio */}
            <div className="reel-bottom-info">
              <div className="reel-author-row">
                <Avatar
                  src={
                    currentReel.author?.avatarUrl ||
                    currentReel.author?.profilePictureUrl
                  }
                  alt={currentReel.author?.username}
                  size="sm"
                  hasStory={Boolean(currentReel.author?.hasActiveStory || currentReel.author?.hasStory)}
                  isUploading={Boolean(currentReel.isUploading)}
                  onClick={() => !currentReel.isUploading && navigate(`/profile/${currentReel.author?.id}`)}
                />
                <span
                  className="reel-author-username"
                  onClick={() => navigate(`/profile/${currentReel.author?.id}`)}
                >
                  {currentReel.author?.username}
                </span>
                {currentUser?.id !== currentReel.author?.id && (
                  <button
                    type="button"
                    className="reel-follow-btn"
                    onClick={() => handleFollowToggle(currentReel.author?.id)}
                  >
                    {isFollowing(currentReel.author?.id)
                      ? 'Following'
                      : 'Follow'}
                  </button>
                )}
              </div>

              {currentReel.caption && (
                <p className="reel-caption-text">{currentReel.caption}</p>
              )}

              <div
                className="reel-audio-track"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const audioTitle = currentReel.audioTitle || 'Original Audio';
                  const audioArtist = currentReel.audioArtist || currentReel.author?.username || 'Artist';
                  navigate(`/audio?title=${encodeURIComponent(audioTitle)}&artist=${encodeURIComponent(audioArtist)}`);
                }}
              >
                <Music size={12} />
                <span>{currentReel.audioTitle || 'Original Audio'} · {currentReel.audioArtist || currentReel.author?.username || 'Artist'}</span>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="reel-actions-column">
              <div
                className={`reel-action-btn-item ${
                  likesMap[currentReel.id]?.liked ? 'liked' : ''
                }`}
              >
                <button
                  type="button"
                  className="reel-action-icon-btn"
                  onClick={() => handleLikeToggle(currentReel.id)}
                  aria-label="Like reel"
                >
                  <span className="reel-action-icon-circle">
                    <Heart size={22} />
                  </span>
                </button>
                <span
                  className="reel-action-count-label"
                  onClick={(e) => {
                    e.stopPropagation();
                    if ((likesMap[currentReel.id]?.count || 0) > 0) {
                      setLikesModalReelId(currentReel.id);
                    }
                  }}
                  style={{
                    cursor: (likesMap[currentReel.id]?.count || 0) > 0 ? 'pointer' : 'default',
                  }}
                  title={(likesMap[currentReel.id]?.count || 0) > 0 ? 'View likes' : undefined}
                >
                  {formatCount(likesMap[currentReel.id]?.count || 0)}
                </span>
              </div>

              <button
                type="button"
                className="reel-action-btn-item"
                onClick={() => {
                  setSelectedPostId(currentReel.id);
                  setCommentsModalOpen(true);
                }}
              >
                <span className="reel-action-icon-circle">
                  <MessageCircle size={22} />
                </span>
                <span>{formatCount(currentReel.commentCount || 0)}</span>
              </button>

              <button
                type="button"
                className="reel-action-btn-item"
                onClick={() => setShareModalReel(currentReel)}
                aria-label="Share reel"
              >
                <span className="reel-action-icon-circle">
                  <Send size={21} />
                </span>
                <span>
                  {formatCount(
                    sharesMap[currentReel.id] !== undefined
                      ? sharesMap[currentReel.id]
                      : currentReel.shareCount || 0
                  )}
                </span>
              </button>

              <button
                type="button"
                className={`reel-action-btn-item ${
                  savedMap[currentReel.id] ? 'saved' : ''
                }`}
                onClick={() => handleSaveToggle(currentReel.id)}
                aria-label={savedMap[currentReel.id] ? 'Remove from saved' : 'Save reel'}
                title={savedMap[currentReel.id] ? 'Saved' : 'Save'}
              >
                <span className="reel-action-icon-circle">
                  <Bookmark
                    size={21}
                    fill={savedMap[currentReel.id] ? 'currentColor' : 'none'}
                  />
                </span>
              </button>

              {currentUser?.id === currentReel.author?.id && (
                <button
                  type="button"
                  className="reel-action-btn-item"
                  onClick={() => setInsightsReel(currentReel)}
                  title="View Reel Insights"
                >
                  <span className="reel-action-icon-circle">
                    <BarChart2 size={21} />
                  </span>
                  <span>Insights</span>
                </button>
              )}

              {/* Three-Dot Options Button */}
              <button
                ref={bottomMenuBtnRef}
                type="button"
                className={`reel-action-btn-item ${isMenuOpenForCurrent && menuState?.anchor === 'bottom' ? 'menu-active' : ''}`}
                onClick={() => toggleReelMenu(currentReel.id, 'bottom')}
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={isMenuOpenForCurrent && menuState?.anchor === 'bottom'}
                title="More options"
              >
                <span className="reel-action-icon-circle">
                  <MoreHorizontal size={21} />
                </span>
              </button>
            </div>
          </div>

          {/* Next Preview Card with Next Video Preloading */}
          {nextReel && (
            <div className="reel-card-preview reel-card-next" aria-hidden="true">
              <video
                src={nextReel.videoUrl?.startsWith('blob:') ? nextReel.videoUrl : getAdaptiveVideoUrl(nextReel.videoUrl)}
                poster={nextReel.videoUrl?.startsWith('blob:') ? undefined : getVideoPosterUrl(nextReel.videoUrl, nextReel.thumbnailUrl)}
                className="reel-video-element-preview"
                preload="auto"
                muted
                playsInline
              />
              <div className="reel-preview-overlay">
                <span className="reel-preview-caption">@{nextReel.author?.username}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : null}

      {/* Reel Comments Modal if opened */}
      {commentsModalOpen && selectedPostId && (
        <CommentsModal
          isOpen={commentsModalOpen}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedPostId(null);
          }}
          postId={selectedPostId}
          isReel={true}
        />
      )}

      {/* Reel Share Modal */}
      {shareModalReel && (
        <ShareModal
          isOpen={!!shareModalReel}
          onClose={() => setShareModalReel(null)}
          post={{ ...shareModalReel, isReel: true }}
          onShareComplete={(newCount) => {
            if (newCount !== undefined) {
              setSharesMap((prev) => ({
                ...prev,
                [shareModalReel.id]: newCount,
              }));
            } else {
              setSharesMap((prev) => ({
                ...prev,
                [shareModalReel.id]:
                  (prev[shareModalReel.id] ?? shareModalReel.shareCount ?? 0) + 1,
              }));
            }
          }}
        />
      )}

      {/* Reel Insights Modal */}
      {insightsReel && (
        <InsightsModal
          isOpen={!!insightsReel}
          onClose={() => setInsightsReel(null)}
          post={insightsReel}
          isReel={true}
        />
      )}

      {/* Reel Options Anchored Popover (Desktop Floating Menu / Mobile Bottom Sheet) */}
      {isMenuOpenForCurrent && (
        <>
          {isMobileViewport && (
            <div
              className="reel-options-mobile-scrim"
              onClick={() => setMenuState(null)}
              aria-hidden="true"
            />
          )}
          <div
            ref={menuRef}
            role="menu"
            aria-label="Reel actions"
            data-reel-id={currentReel.id}
            data-anchor={menuState.anchor}
            data-placement={menuPosition.placement}
            className={`reel-options-popover ${isMobileViewport ? 'mobile-sheet' : ''}`}
            style={isMobileViewport ? undefined : menuPosition.style}
          >
            {canDeleteReel && (
              <button
                type="button"
                role="menuitem"
                className="reel-option-item danger"
                onClick={() => handleDeleteReel(menuState.reelId)}
              >
                <Trash2 size={16} />
                <span>Delete reel</span>
              </button>
            )}
            {isReelAuthor && (
              <button
                type="button"
                role="menuitem"
                className="reel-option-item"
                onClick={() => handleArchiveReel(menuState.reelId)}
              >
                <Archive size={16} />
                <span>{currentReel.isArchived ? 'Show on profile' : 'Archive reel'}</span>
              </button>
            )}
            {!isReelAuthor && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="reel-option-item danger"
                  onClick={() => {
                    const targetId = menuState.reelId;
                    setMenuState(null);
                    setReportReelId(targetId);
                    setReportModalOpen(true);
                  }}
                >
                  <Flag size={16} />
                  <span>Report reel</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="reel-option-item"
                  onClick={() => handleNotInterested(menuState.reelId)}
                >
                  <EyeOff size={16} />
                  <span>Not interested</span>
                </button>
              </>
            )}
            <button
              type="button"
              role="menuitem"
              className="reel-option-item"
              onClick={() => {
                handleSaveToggle(menuState.reelId);
                setMenuState(null);
              }}
            >
              <Bookmark
                size={16}
                fill={savedMap[menuState.reelId] ? 'currentColor' : 'none'}
              />
              <span>{savedMap[menuState.reelId] ? 'Remove from saved' : 'Save reel'}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="reel-option-item"
              onClick={() => handleCopyLink(menuState.reelId)}
            >
              <Copy size={16} />
              <span>Copy link</span>
            </button>
            <div className="reel-option-divider" aria-hidden="true" />
            <button
              type="button"
              role="menuitem"
              className="reel-option-item cancel"
              onClick={() => setMenuState(null)}
            >
              <span>Cancel</span>
            </button>
          </div>
        </>
      )}

      {/* Reel Likes Modal */}
      {likesModalReelId && (
        <LikesModal
          isOpen={Boolean(likesModalReelId)}
          onClose={() => setLikesModalReelId(null)}
          targetId={likesModalReelId}
          targetType="reel"
        />
      )}

      {/* Reel Report Modal */}
      {reportModalOpen && reportReelId && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportReelId(null);
          }}
          targetType="REEL"
          targetId={reportReelId}
          onReportSuccess={() => {
            const reportedReel = reels.find((r) => r.id === reportReelId);
            const authorId = reportedReel?.author?.id;
            setReels((prev) => prev.filter((r) => r.id !== reportReelId && (!authorId || r.author?.id !== authorId)));
          }}
        />
      )}
    </div>
  );
};

export default ReelsPage;
