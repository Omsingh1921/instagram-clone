import { useState, useRef, useEffect, useCallback } from 'react';

const isInteractiveReelTarget = (target) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [role="tab"], [role="menu"], [role="dialog"], .reel-options-popover, .reel-author-username, .reel-audio-track, .modal-overlay'
    )
  );

export const useReelsGestures = ({
  activeIndex,
  totalReels,
  setActiveIndex,
  onIndexChange,
  isModalOpen = false,
  isMenuOpen = false,
  getIsModalOpen,
  getIsMenuOpen,
  onCloseMenu,
}) => {
  const [slideDirection, setSlideDirection] = useState(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingReel, setIsDraggingReel] = useState(false);

  const containerRef = useRef(null);
  const isWheelingRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelIdleTimerRef = useRef(null);
  const wheelCooldownTimerRef = useRef(null);
  const touchDragRef = useRef({ active: false, startY: 0, startX: 0, moved: false });
  const mouseDragRef = useRef({ active: false, startY: 0, startX: 0, moved: false });
  const wasDraggedRef = useRef(false);
  const dragClickResetTimerRef = useRef(null);
  const interactionCtxRef = useRef({ handleNextReel: () => {}, handlePrevReel: () => {}, modalOpen: false });

  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const onCloseMenuRef = useRef(onCloseMenu);
  onCloseMenuRef.current = onCloseMenu;

  const checkModalOpen = useCallback(() => {
    if (typeof getIsModalOpen === 'function') return getIsModalOpen();
    return Boolean(isModalOpen);
  }, [getIsModalOpen, isModalOpen]);

  const checkMenuOpen = useCallback(() => {
    if (typeof getIsMenuOpen === 'function') return getIsMenuOpen();
    return Boolean(isMenuOpen);
  }, [getIsMenuOpen, isMenuOpen]);

  const handleNextReel = useCallback(() => {
    if (activeIndex < totalReels - 1) {
      setSlideDirection('next');
      onIndexChangeRef.current?.();
      setActiveIndex((prev) => prev + 1);
    }
  }, [activeIndex, totalReels, setActiveIndex]);

  const handlePrevReel = useCallback(() => {
    if (activeIndex > 0) {
      setSlideDirection('prev');
      onIndexChangeRef.current?.();
      setActiveIndex((prev) => prev - 1);
    }
  }, [activeIndex, setActiveIndex]);

  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), 360);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  interactionCtxRef.current = {
    handleNextReel,
    handlePrevReel,
    modalOpen: Boolean(checkModalOpen() || checkMenuOpen()),
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const menuOpen = checkMenuOpen();
      const modalOpen = checkModalOpen();
      if (e.key === 'Escape' && menuOpen) {
        e.preventDefault();
        onCloseMenuRef.current?.();
        return;
      }
      if (modalOpen) return;
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
  }, [handleNextReel, handlePrevReel, checkMenuOpen, checkModalOpen]);

  // Non-passive wheel listener for touchpads and mouse wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e) => {
      const ctx = interactionCtxRef.current;
      if (ctx.modalOpen || checkModalOpen()) return;
      if (
        e.target instanceof Element &&
        e.target.closest('.reel-options-popover, [role="dialog"], .modal-overlay')
      ) {
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
  }, [checkModalOpen]);

  // Desktop mouse drag
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
    if (e.button !== 0 || interactionCtxRef.current.modalOpen || checkModalOpen()) return;
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
    if (interactionCtxRef.current.modalOpen || checkModalOpen()) return;
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

  return {
    containerRef,
    slideDirection,
    dragOffsetY,
    isDraggingReel,
    wasDraggedRef,
    handleNextReel,
    handlePrevReel,
    handleMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
};

export default useReelsGestures;
