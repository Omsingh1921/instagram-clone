import { useState, useEffect, useRef, useCallback } from 'react';
import storyService from '../../../services/story.service';
import { shouldPrefetchMedia, getAdaptiveVideoUrl } from '../../../utils/mediaUrl';

export const STORY_DURATION = 5000; // 5 seconds per story

export const useStoryNavigation = ({
  storyGroups = [],
  initialGroupIdx = 0,
  initialStoryIdx = 0,
  isOpen = false,
  onClose,
  currentUser,
  isBlockedRef,
} = {}) => {
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(initialStoryIdx);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const viewedStoriesRef = useRef(new Set());
  const videoRef = useRef(null);
  const pressStartTimeRef = useRef(0);
  const isHoldTriggeredRef = useRef(false);
  const holdTimerRef = useRef(null);

  const safeGroupIdx = Math.min(Math.max(0, groupIdx), Math.max(0, storyGroups.length - 1));
  const currentGroup = storyGroups[safeGroupIdx];
  const safeStoryIdx = Math.min(
    Math.max(0, storyIdx),
    Math.max(0, (currentGroup?.stories?.length || 1) - 1)
  );
  const currentStory = currentGroup?.stories?.[safeStoryIdx];
  const isVideoStory = Boolean(
    currentStory?.mediaType === 'VIDEO' ||
      (currentStory?.mediaUrl &&
        /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(currentStory.mediaUrl)) ||
      (currentStory?.mediaUrl?.startsWith('blob:') && currentStory?.mediaType !== 'IMAGE')
  );
  const isMyStory =
    String(currentUser?.id || '') === String(currentGroup?.author?.id || '') ||
    currentGroup?.author?.id === 'current-user' ||
    Boolean(currentStory?.isUploading);
  const isHighlight = Boolean(currentGroup?.isHighlight);
  const highlightId = currentGroup?.highlightId;
  const highlightTitle = currentGroup?.highlightTitle;

  const isMentionedInCurrentStory = Boolean(
    !isMyStory &&
      currentUser &&
      (currentStory?.mentions || []).some((m) => {
        const myId = String(currentUser.id || currentUser.userId || '');
        const myUsername = (currentUser.username || '').toLowerCase();
        const mId = String(m.id || m.userId || m.user?.id || '');
        const mUsername = (m.username || m.user?.username || '').toLowerCase();
        return (
          (myId && mId && myId === mId) ||
          (myUsername && mUsername && myUsername === mUsername)
        );
      })
  );

  const isBlocked = () => Boolean(isBlockedRef?.current);

  const goToNextStory = useCallback(() => {
    if (isBlocked()) return;
    if (!currentGroup) return;
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      } catch {}
    }
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (groupIdx < storyGroups.length - 1) {
      setGroupIdx((prev) => prev + 1);
      setStoryIdx(0);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else {
      if (onClose) onClose();
    }
  }, [currentGroup, storyIdx, groupIdx, storyGroups.length, onClose, isBlockedRef]);

  const goToPrevStory = useCallback(() => {
    if (isBlocked()) return;
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      } catch {}
    }
    if (storyIdx > 0) {
      setStoryIdx((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (groupIdx > 0) {
      const prevGroup = storyGroups[groupIdx - 1];
      setGroupIdx((prev) => prev - 1);
      setStoryIdx((prevGroup?.stories?.length || 1) - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    }
  }, [storyIdx, groupIdx, storyGroups, isBlockedRef]);

  // Mark viewed on load (only once per story, never for story owner)
  useEffect(() => {
    if (currentStory?.id && !viewedStoriesRef.current.has(currentStory.id)) {
      if (currentStory.isUploading) return;
      if (isMyStory) return;
      viewedStoriesRef.current.add(currentStory.id);
      if (!currentStory.viewed) {
        currentStory.viewed = true;
        storyService.markStoryViewed(currentStory.id).catch(() => {});
      }
    }
  }, [currentStory?.id, currentStory?.isUploading, isMyStory, currentStory]);

  // Preload next story asset for instant snappy playback
  useEffect(() => {
    if (!currentGroup?.stories || !shouldPrefetchMedia()) return;
    const nextStory = currentGroup.stories[storyIdx + 1];
    if (nextStory?.mediaUrl) {
      if (nextStory.mediaType === 'VIDEO') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = getAdaptiveVideoUrl(nextStory.mediaUrl);
        document.head.appendChild(link);
        return () => {
          if (document.head.contains(link)) document.head.removeChild(link);
        };
      } else {
        const img = new Image();
        img.src = nextStory.mediaUrl;
      }
    }
  }, [storyIdx, currentGroup]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      } else if (e.key === 'ArrowRight' && !isBlocked()) {
        goToNextStory();
      } else if (e.key === 'ArrowLeft' && !isBlocked()) {
        goToPrevStory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNextStory, goToPrevStory, onClose, isBlockedRef]);

  // Timer loop for IMAGE stories
  useEffect(() => {
    if (
      !isOpen ||
      isPaused ||
      isHolding ||
      isBlocked() ||
      !currentStory ||
      currentStory.isUploading
    )
      return;
    if (isVideoStory) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= STORY_DURATION) {
        clearInterval(interval);
        goToNextStory();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isHolding, currentStory, isVideoStory, goToNextStory, isBlockedRef]);

  // Synchronize progress line directly with VIDEO playback (60fps requestAnimationFrame)
  useEffect(() => {
    if (!isOpen || !isVideoStory || !currentStory || currentStory.isUploading) return;

    let animId;
    const syncProgress = () => {
      const video = videoRef.current;
      if (video && video.duration && !video.paused && !video.ended) {
        const pct = (video.currentTime / video.duration) * 100;
        setProgress(Math.min(pct, 100));
      }
      animId = requestAnimationFrame(syncProgress);
    };

    animId = requestAnimationFrame(syncProgress);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isVideoStory, currentStory]);

  // Video playback & pause state synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoStory) return;

    const shouldPause = !isOpen || isPaused || isHolding || isBlocked();

    if (shouldPause) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isOpen, isPaused, isHolding, isVideoStory, storyIdx, groupIdx, isBlockedRef]);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(Math.min(pct, 100));
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (currentStory?.isUploading) return;
    setProgress(100);
    goToNextStory();
  }, [currentStory?.isUploading, goToNextStory]);

  const handleVideoLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (isPaused || isHolding || isBlocked()) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    }
  }, [isPaused, isHolding, isBlockedRef]);

  // Hold-to-pause & Quick-tap Gesture Handlers
  const handlePointerDown = useCallback(
    (e) => {
      if (isBlocked()) return;
      if (
        e.target.closest('.story-viewer-footer') ||
        e.target.closest('.story-viewer-controls') ||
        e.target.closest('.story-more-menu') ||
        e.target.closest('.story-sticker-interactive')
      ) {
        return;
      }

      pressStartTimeRef.current = Date.now();
      isHoldTriggeredRef.current = false;

      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        isHoldTriggeredRef.current = true;
        setIsHolding(true);
        setIsPaused(true);
        if (videoRef.current) {
          try {
            videoRef.current.pause();
          } catch {}
        }
        if (!isVideoStory) {
          elapsedBeforePauseRef.current = (progress / 100) * STORY_DURATION;
        }
      }, 160);
    },
    [isVideoStory, progress, isBlockedRef]
  );

  const handlePointerUp = useCallback(
    (e, side) => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      const pressDuration = Date.now() - pressStartTimeRef.current;

      if (isHoldTriggeredRef.current || pressDuration >= 200) {
        isHoldTriggeredRef.current = false;
        setIsHolding(false);
        setIsPaused(false);
        if (videoRef.current && isVideoStory) {
          videoRef.current.play().catch(() => {});
        }
        return;
      }

      setIsHolding(false);
      if (side === 'left') {
        goToPrevStory();
      } else {
        goToNextStory();
      }
    },
    [isVideoStory, goToPrevStory, goToNextStory]
  );

  const handlePointerCancel = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isHoldTriggeredRef.current) {
      isHoldTriggeredRef.current = false;
      setIsHolding(false);
      setIsPaused(false);
      if (videoRef.current && isVideoStory) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isVideoStory]);

  return {
    groupIdx,
    setGroupIdx,
    storyIdx,
    setStoryIdx,
    progress,
    setProgress,
    isPaused,
    setIsPaused,
    isHolding,
    setIsHolding,
    isMuted,
    setIsMuted,
    safeGroupIdx,
    currentGroup,
    safeStoryIdx,
    currentStory,
    isVideoStory,
    isMyStory,
    isHighlight,
    highlightId,
    highlightTitle,
    isMentionedInCurrentStory,
    videoRef,
    elapsedBeforePauseRef,
    goToNextStory,
    goToPrevStory,
    handleVideoTimeUpdate,
    handleVideoEnded,
    handleVideoLoadedMetadata,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
  };
};

export default useStoryNavigation;
