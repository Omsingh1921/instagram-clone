import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import reelService from '../services/reel.service';
import { getAdaptiveVideoUrl, shouldPrefetchMedia } from '../utils/mediaUrl';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';
import {
  ReelFeedTabs,
  ReelPreviewCard,
  ReelVideoCard,
  ReelActionRail,
  ReelOptionsMenu,
  ReelModals,
} from '../components/reels';
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
  const [saveToCollReelId, setSaveToCollReelId] = useState(null);
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

  const effectiveReels = useMemo(() => {
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

  const recordCurrentReelView = useCallback((currentId) => {
    if (currentId && !viewedReelsRef.current.has(currentId)) {
      viewedReelsRef.current.add(currentId);
      reelService.recordView(currentId).catch(() => {});
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
      if (commentsModalOpen || shareModalReel || insightsReel || reportModalOpen) return;
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

  const handleLikeToggle = async (targetReelId) => {
    const cur = likesMap[targetReelId] || { count: 0, liked: false };
    const nextLiked = !cur.liked;

    setLikesMap((prev) => ({
      ...prev,
      [targetReelId]: {
        liked: nextLiked,
        count: nextLiked ? cur.count + 1 : Math.max(0, cur.count - 1),
      },
    }));

    try {
      await reelService.toggleLike(targetReelId);
    } catch {
      // Revert if failed
      setLikesMap((prev) => ({
        ...prev,
        [targetReelId]: cur,
      }));
    }
  };

  const handleDoubleTap = (targetReelId) => {
    setShowHeartAnim(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([20, 40]);
      } catch {
        // ignore
      }
    }
    setTimeout(() => setShowHeartAnim(false), 850);
    if (!likesMap[targetReelId]?.liked) {
      handleLikeToggle(targetReelId);
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

  const handleSaveToggle = async (targetReelId) => {
    const curSaved = !!savedMap[targetReelId];
    setSavedMap((prev) => ({ ...prev, [targetReelId]: !curSaved }));

    try {
      await reelService.toggleSaveReel(targetReelId);
      showSuccess(!curSaved ? 'Reel saved' : 'Reel removed from saved');
    } catch {
      setSavedMap((prev) => ({ ...prev, [targetReelId]: curSaved }));
    }
  };

  const handleDeleteReel = async (targetReelId) => {
    if (!window.confirm('Delete this reel? It will be moved to Recently Deleted for 30 days.')) return;
    try {
      await reelService.deleteReel(targetReelId);
      showSuccess('Reel moved to Recently Deleted');
      setMenuState(null);
      window.dispatchEvent(new CustomEvent('reel:refresh'));
      setReels((prev) => prev.filter((r) => r.id !== targetReelId));
    } catch (err) {
      showError(err.message || 'Failed to delete reel');
    }
  };

  const handleArchiveReel = async (targetReelId) => {
    try {
      const res = await reelService.toggleArchiveReel(targetReelId);
      const isArchived = Boolean(res?.data?.isArchived ?? res?.isArchived);
      showSuccess(isArchived ? 'Reel archived. Hidden from your profile.' : 'Reel unarchived');
      setMenuState(null);
      setReels((prev) => prev.filter((r) => r.id !== targetReelId));
    } catch (err) {
      showError(err.message || 'Failed to archive reel');
    }
  };

  const handleCopyLink = (targetReelId) => {
    const reelUrl = `${window.location.origin}/reels/${targetReelId}`;
    navigator.clipboard.writeText(reelUrl);
    showSuccess('Reel link copied to clipboard');
    setMenuState(null);
  };

  const handleNotInterested = async (targetReelId) => {
    try {
      await reelService.markNotInterested(targetReelId);
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
      <ReelFeedTabs
        feedType={feedType}
        onSwitchFeed={handleSwitchFeed}
        currentReel={currentReel}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        topMenuBtnRef={topMenuBtnRef}
        isMenuOpen={isMenuOpenForCurrent}
        menuAnchor={menuState?.anchor}
        onToggleMenu={toggleReelMenu}
      />

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
            {prevReel && <ReelPreviewCard reel={prevReel} type="prev" />}

            {/* Active Reel Card (One by One) */}
            <ReelVideoCard
              currentReel={currentReel}
              activeIndex={activeIndex}
              videoRef={videoRef}
              isMuted={isMuted}
              isPlaying={isPlaying}
              showHeartAnim={showHeartAnim}
              videoProgress={videoProgress}
              slideDirection={slideDirection}
              isDraggingReel={isDraggingReel}
              onTogglePlay={toggleVideoPlay}
              onDoubleTap={handleDoubleTap}
              onTouchStart={handleVideoTouchStart}
              onTimeUpdate={handleTimeUpdate}
              onSeekProgress={handleSeekProgress}
              currentUser={currentUser}
              isFollowing={isFollowing}
              onFollowToggle={handleFollowToggle}
              navigate={navigate}
            >
              {/* Right Action Bar */}
              <ReelActionRail
                currentReel={currentReel}
                likesMap={likesMap}
                savedMap={savedMap}
                sharesMap={sharesMap}
                isMenuOpen={isMenuOpenForCurrent}
                menuAnchor={menuState?.anchor}
                bottomMenuBtnRef={bottomMenuBtnRef}
                onLikeToggle={handleLikeToggle}
                onOpenLikesModal={(id) => setLikesModalReelId(id)}
                onOpenComments={(id) => {
                  setSelectedPostId(id);
                  setCommentsModalOpen(true);
                }}
                onOpenShare={(reel) => setShareModalReel(reel)}
                onSaveToggle={handleSaveToggle}
                onOpenInsights={(reel) => setInsightsReel(reel)}
                onToggleMenu={toggleReelMenu}
                isAuthor={isReelAuthor}
              />
            </ReelVideoCard>

            {/* Next Preview Card with Next Video Preloading */}
            {nextReel && <ReelPreviewCard reel={nextReel} type="next" />}
          </div>
        </div>
      ) : null}

      {/* Reel Options Anchored Popover (Desktop Floating Menu / Mobile Bottom Sheet) */}
      <ReelOptionsMenu
        isOpen={isMenuOpenForCurrent}
        currentReel={currentReel}
        menuState={menuState}
        menuPosition={menuPosition}
        isMobileViewport={isMobileViewport}
        menuRef={menuRef}
        canDeleteReel={canDeleteReel}
        isReelAuthor={isReelAuthor}
        isSaved={Boolean(savedMap[menuState?.reelId])}
        onDeleteReel={handleDeleteReel}
        onArchiveReel={handleArchiveReel}
        onReportReel={(id) => {
          setMenuState(null);
          setReportReelId(id);
          setReportModalOpen(true);
        }}
        onNotInterested={handleNotInterested}
        onSaveToggle={(id) => {
          handleSaveToggle(id);
          setMenuState(null);
        }}
        onSaveToCollection={(id) => {
          setMenuState(null);
          setSaveToCollReelId(id);
        }}
        onCopyLink={handleCopyLink}
        onClose={() => setMenuState(null)}
      />

      {/* Reel Modals (Comments, Share, Insights, Likes, Report, SaveToCollection) */}
      <ReelModals
        commentsModalOpen={commentsModalOpen}
        selectedPostId={selectedPostId}
        onCloseComments={() => {
          setCommentsModalOpen(false);
          setSelectedPostId(null);
        }}
        shareModalReel={shareModalReel}
        onCloseShare={() => setShareModalReel(null)}
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
        insightsReel={insightsReel}
        onCloseInsights={() => setInsightsReel(null)}
        likesModalReelId={likesModalReelId}
        onCloseLikes={() => setLikesModalReelId(null)}
        reportModalOpen={reportModalOpen}
        reportReelId={reportReelId}
        onCloseReport={() => {
          setReportModalOpen(false);
          setReportReelId(null);
        }}
        onReportSuccess={() => {
          const reportedReel = reels.find((r) => r.id === reportReelId);
          const authorId = reportedReel?.author?.id;
          setReels((prev) =>
            prev.filter(
              (r) => r.id !== reportReelId && (!authorId || r.author?.id !== authorId)
            )
          );
        }}
        saveToCollReelId={saveToCollReelId}
        onCloseSaveToColl={() => setSaveToCollReelId(null)}
        onSavedToCollection={() => {
          setSavedMap((prev) => ({ ...prev, [saveToCollReelId]: true }));
        }}
      />
    </div>
  );
};

export default ReelsPage;
