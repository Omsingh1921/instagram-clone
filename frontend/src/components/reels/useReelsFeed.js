import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import reelService from '../../services/reel.service';
import { getAdaptiveVideoUrl, shouldPrefetchMedia } from '../../utils/mediaUrl';

const REELS_PAGE_SIZE = 5;

export const useReelsFeed = ({
  reelId,
  currentUser,
  uploadCtx,
  onReelsLoaded,
}) => {
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState('for-you'); // 'for-you' | 'following'

  const viewedReelsRef = useRef(new Set());
  const sessionSeedRef = useRef(Date.now());
  const isFetchingMoreRef = useRef(false);
  const onReelsLoadedRef = useRef(onReelsLoaded);
  onReelsLoadedRef.current = onReelsLoaded;

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

  const loadReels = useCallback(
    async (pageNum = 0, currentFeedType = feedType, seed = sessionSeedRef.current) => {
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
        onReelsLoadedRef.current?.(incomingList);
        setPage(pageNum);
      } catch {
        if (pageNum === 0) setReels([]);
      } finally {
        setLoading(false);
      }
    },
    [reelId, feedType]
  );

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
  }, [reelId, feedType, loadReels]);

  // Listen for background reel upload completion
  useEffect(() => {
    const handleRefresh = () => {
      loadReels(0, feedType, sessionSeedRef.current);
    };
    window.addEventListener('reel:refresh', handleRefresh);
    return () => window.removeEventListener('reel:refresh', handleRefresh);
  }, [feedType, loadReels]);

  // Infinite pagination fetch
  useEffect(() => {
    if (
      hasMore &&
      !isFetchingMoreRef.current &&
      activeIndex >= effectiveReels.length - 2 &&
      effectiveReels.length > 0
    ) {
      isFetchingMoreRef.current = true;
      loadReels(page + 1, feedType, sessionSeedRef.current).finally(() => {
        isFetchingMoreRef.current = false;
      });
    }
  }, [activeIndex, effectiveReels.length, hasMore, page, feedType, loadReels]);

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

  const handleSwitchFeed = useCallback((nextFeed) => {
    if (nextFeed === feedType) return;
    sessionSeedRef.current = Date.now();
    setFeedType(nextFeed);
    setActiveIndex(0);
    setPage(0);
    setHasMore(true);
  }, [feedType]);

  const currentReel = effectiveReels[activeIndex];
  const prevReel = activeIndex > 0 ? effectiveReels[activeIndex - 1] : null;
  const nextReel = activeIndex < effectiveReels.length - 1 ? effectiveReels[activeIndex + 1] : null;

  return {
    feedType,
    setFeedType,
    reels,
    setReels,
    activeIndex,
    setActiveIndex,
    page,
    hasMore,
    loading,
    effectiveReels,
    currentReel,
    prevReel,
    nextReel,
    loadReels,
    handleSwitchFeed,
    recordCurrentReelView,
    sessionSeedRef,
  };
};

export default useReelsFeed;
