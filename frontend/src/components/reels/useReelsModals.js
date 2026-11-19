import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import reelService from '../../services/reel.service';

export const useReelsModals = ({
  currentReel,
  feedType,
  currentUser,
  isAdmin,
  setReels,
  handleNextReel,
  handleSaveToggle,
  setSharesMap,
  setSavedMap,
  showSuccess,
  showError,
}) => {
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [shareModalReel, setShareModalReel] = useState(null);
  const [insightsReel, setInsightsReel] = useState(null);
  const [menuState, setMenuState] = useState(null); // { reelId, anchor: 'top' | 'bottom' }
  const [menuPosition, setMenuPosition] = useState({ placement: 'beside-right', style: {} });
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReelId, setReportReelId] = useState(null);
  const [likesModalReelId, setLikesModalReelId] = useState(null);
  const [saveToCollReelId, setSaveToCollReelId] = useState(null);

  const menuRef = useRef(null);
  const topMenuBtnRef = useRef(null);
  const bottomMenuBtnRef = useRef(null);

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

  const toggleReelMenu = useCallback((targetReelId, anchor) => {
    setMenuState((prev) =>
      prev && prev.reelId === targetReelId && prev.anchor === anchor
        ? null
        : { reelId: targetReelId, anchor }
    );
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState(null);
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

  const handleDeleteReel = useCallback(
    async (targetReelId) => {
      if (!window.confirm('Delete this reel? It will be moved to Recently Deleted for 30 days.')) return;
      try {
        await reelService.deleteReel(targetReelId);
        showSuccess?.('Reel moved to Recently Deleted');
        setMenuState(null);
        window.dispatchEvent(new CustomEvent('reel:refresh'));
        setReels?.((prev) => prev.filter((r) => r.id !== targetReelId));
      } catch (err) {
        showError?.(err.message || 'Failed to delete reel');
      }
    },
    [showSuccess, showError, setReels]
  );

  const handleArchiveReel = useCallback(
    async (targetReelId) => {
      try {
        const res = await reelService.toggleArchiveReel(targetReelId);
        const isArchived = Boolean(res?.data?.isArchived ?? res?.isArchived);
        showSuccess?.(isArchived ? 'Reel archived. Hidden from your profile.' : 'Reel unarchived');
        setMenuState(null);
        setReels?.((prev) => prev.filter((r) => r.id !== targetReelId));
      } catch (err) {
        showError?.(err.message || 'Failed to archive reel');
      }
    },
    [showSuccess, showError, setReels]
  );

  const handleCopyLink = useCallback(
    (targetReelId) => {
      const reelUrl = `${window.location.origin}/reels/${targetReelId}`;
      navigator.clipboard.writeText(reelUrl);
      showSuccess?.('Reel link copied to clipboard');
      setMenuState(null);
    },
    [showSuccess]
  );

  const handleNotInterested = useCallback(
    async (targetReelId) => {
      try {
        await reelService.markNotInterested(targetReelId);
        showSuccess?.("We'll show fewer reels like this");
      } catch {
        showSuccess?.("We'll show fewer reels like this");
      } finally {
        setMenuState(null);
        handleNextReel?.();
      }
    },
    [showSuccess, handleNextReel]
  );

  const handleShareComplete = useCallback(
    (newCount) => {
      if (!shareModalReel) return;
      if (newCount !== undefined) {
        setSharesMap?.((prev) => ({
          ...prev,
          [shareModalReel.id]: newCount,
        }));
      } else {
        setSharesMap?.((prev) => ({
          ...prev,
          [shareModalReel.id]:
            (prev[shareModalReel.id] ?? shareModalReel.shareCount ?? 0) + 1,
        }));
      }
    },
    [shareModalReel, setSharesMap]
  );

  const handleReportSuccess = useCallback(
    (reelsList) => {
      const reportedReel = reelsList?.find((r) => r.id === reportReelId);
      const authorId = reportedReel?.author?.id;
      setReels?.((prev) =>
        prev.filter(
          (r) => r.id !== reportReelId && (!authorId || r.author?.id !== authorId)
        )
      );
    },
    [reportReelId, setReels]
  );

  const handleSavedToCollection = useCallback(() => {
    if (saveToCollReelId) {
      setSavedMap?.((prev) => ({ ...prev, [saveToCollReelId]: true }));
    }
  }, [saveToCollReelId, setSavedMap]);

  // Modal dialogs (comments, share, insights, report, likes, collection) that block keyboard scrolling
  const isModalOpen = Boolean(
    commentsModalOpen ||
    shareModalReel ||
    insightsReel ||
    reportModalOpen ||
    likesModalReelId ||
    saveToCollReelId
  );

  return {
    commentsModalOpen,
    setCommentsModalOpen,
    selectedPostId,
    setSelectedPostId,
    shareModalReel,
    setShareModalReel,
    insightsReel,
    setInsightsReel,
    likesModalReelId,
    setLikesModalReelId,
    reportModalOpen,
    setReportModalOpen,
    reportReelId,
    setReportReelId,
    saveToCollReelId,
    setSaveToCollReelId,
    menuState,
    setMenuState,
    menuPosition,
    isMobileViewport,
    menuRef,
    topMenuBtnRef,
    bottomMenuBtnRef,
    isReelAuthor,
    canDeleteReel,
    isMenuOpenForCurrent,
    isModalOpen,
    toggleReelMenu,
    closeMenu,
    updateMenuPosition,
    handleDeleteReel,
    handleArchiveReel,
    handleCopyLink,
    handleNotInterested,
    handleShareComplete,
    handleReportSuccess,
    handleSavedToCollection,
  };
};

export default useReelsModals;
