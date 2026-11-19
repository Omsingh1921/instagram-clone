import { useState, useRef, useEffect, useCallback } from 'react';
import reelService from '../../services/reel.service';

export const useReelsInteractions = ({
  currentReel,
  wasDraggedRef,
  recordCurrentReelView,
  toggleFollow,
  showSuccess,
  showError,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likesMap, setLikesMap] = useState({});
  const [savedMap, setSavedMap] = useState({});
  const [sharesMap, setSharesMap] = useState({});
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const videoRef = useRef(null);
  const lastTouchTapRef = useRef(0);

  // Initialize likes and saved maps when new reels arrive
  const initializeReelsState = useCallback((incomingList) => {
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
  }, []);

  // When active reel changes, restart and autoplay video, record view
  useEffect(() => {
    if (currentReel?.id && !currentReel.isUploading) {
      recordCurrentReelView?.(currentReel.id);
    }

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (currentReel?.id && !currentReel.isUploading) {
              recordCurrentReelView?.(currentReel.id);
            }
          })
          .catch(() => setIsPlaying(false));
      }
    }
  }, [currentReel?.id, recordCurrentReelView]);

  const toggleVideoPlay = useCallback(() => {
    if (wasDraggedRef?.current) return;
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      if (currentReel?.id && !currentReel.isUploading) {
        recordCurrentReelView?.(currentReel.id);
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [wasDraggedRef, currentReel, recordCurrentReelView]);

  const handleLikeToggle = useCallback(
    async (targetReelId) => {
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
    },
    [likesMap]
  );

  const handleDoubleTap = useCallback(
    (targetReelId) => {
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
    },
    [likesMap, handleLikeToggle]
  );

  const handleVideoTouchStart = useCallback(() => {
    const now = Date.now();
    if (now - lastTouchTapRef.current < 320) {
      if (currentReel && !currentReel.isUploading) {
        handleDoubleTap(currentReel.id);
      }
      lastTouchTapRef.current = 0;
    } else {
      lastTouchTapRef.current = now;
    }
  }, [currentReel, handleDoubleTap]);

  const handleTimeUpdate = useCallback((e) => {
    const v = e.currentTarget;
    if (v && v.duration && !Number.isNaN(v.duration) && v.duration > 0) {
      setVideoProgress((v.currentTime / v.duration) * 100);
    }
  }, []);

  const handleSeekProgress = useCallback((e) => {
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
  }, []);

  const handleSaveToggle = useCallback(
    async (targetReelId) => {
      const curSaved = !!savedMap[targetReelId];
      setSavedMap((prev) => ({ ...prev, [targetReelId]: !curSaved }));

      try {
        await reelService.toggleSaveReel(targetReelId);
        showSuccess?.(!curSaved ? 'Reel saved' : 'Reel removed from saved');
      } catch {
        setSavedMap((prev) => ({ ...prev, [targetReelId]: curSaved }));
      }
    },
    [savedMap, showSuccess]
  );

  const handleFollowToggle = useCallback(
    async (authorId) => {
      try {
        const nextState = await toggleFollow?.(authorId);
        if (nextState) {
          showSuccess?.('Following creator');
        }
      } catch (err) {
        showError?.(err.message || 'Action failed');
      }
    },
    [toggleFollow, showSuccess, showError]
  );

  return {
    videoRef,
    isMuted,
    setIsMuted,
    isPlaying,
    setIsPlaying,
    likesMap,
    setLikesMap,
    savedMap,
    setSavedMap,
    sharesMap,
    setSharesMap,
    showHeartAnim,
    videoProgress,
    setVideoProgress,
    initializeReelsState,
    toggleVideoPlay,
    handleLikeToggle,
    handleDoubleTap,
    handleVideoTouchStart,
    handleTimeUpdate,
    handleSeekProgress,
    handleSaveToggle,
    handleFollowToggle,
  };
};

export default useReelsInteractions;
