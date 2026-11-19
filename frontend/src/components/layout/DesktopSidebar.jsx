import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { InstagramLogo, InstagramGlyph } from '../common/InstagramLogo';

export const loadMoreMenuPopup = () => import('../navigation/MoreMenuPopup');
const MoreMenuPopup = lazy(loadMoreMenuPopup);
const MORE_MENU_CLOSE_DELAY_MS = 180;

// Authentic Instagram Reels Icon matching real web
export const ReelsNavIcon = ({ size = 25, isActive = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={isActive ? 2.5 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Reels"
  >
    <rect width="18" height="18" x="3" y="3" rx="5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8.5" y1="3" x2="11.5" y2="9" />
    <line x1="14.5" y1="3" x2="17.5" y2="9" />
    <polygon points="10 12 15 15 10 18" fill="currentColor" stroke="none" />
  </svg>
);

// Authentic Instagram Also from Meta / App Switcher Icon
export const AppSwitcherIcon = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Also from Meta"
  >
    <rect width="7.5" height="7.5" x="8.25" y="2.5" rx="1.8" />
    <rect width="7.5" height="7.5" x="2.5" y="14" rx="1.8" />
    <rect width="7.5" height="7.5" x="14" y="14" rx="1.8" />
  </svg>
);

export const isTouchCapableDevice = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
};

/**
 * Fixed 72px Instagram-style navigation rail that expands on hover (240px overlay)
 * on desktop and toggles on tap/click for touch devices. Memoized so hover state
 * transitions do not re-render AppLayout or active route outlets.
 */
export const DesktopSidebar = React.memo(({
  isAdmin,
  isMessagesRoute,
  routeKey,
  userId,
  username,
  avatarUrl,
  unreadChatCount,
  unreadNotifications,
  theme,
  onToggleTheme,
  onOpenCreate,
  onOpenReportProblem,
  onOpenSwitchAccounts,
  onLogout,
}) => {
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [touchExpanded, setTouchExpanded] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isTouchMode, setIsTouchMode] = useState(() => isTouchCapableDevice());
  const sidebarRef = useRef(null);
  const lastTouchTimeRef = useRef(0);
  const moreWrapperRef = useRef(null);
  const moreTriggerRef = useRef(null);
  const moreCloseTimerRef = useRef(null);
  const isMoreHoveredRef = useRef(false);
  const pendingMenuFocusRef = useRef(false);

  const clearMoreCloseTimer = useCallback(() => {
    if (moreCloseTimerRef.current) {
      clearTimeout(moreCloseTimerRef.current);
      moreCloseTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearMoreCloseTimer(), [clearMoreCloseTimer]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const syncTouchMode = () => setIsTouchMode(mq.matches);
    syncTouchMode();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', syncTouchMode);
      return () => mq.removeEventListener('change', syncTouchMode);
    }
    return undefined;
  }, []);

  useEffect(() => {
    clearMoreCloseTimer();
    isMoreHoveredRef.current = false;
    setMoreMenuOpen(false);
    setTouchExpanded(false);
  }, [routeKey, clearMoreCloseTimer]);

  useEffect(() => {
    if (!moreMenuOpen || !pendingMenuFocusRef.current) return undefined;
    const rafId = requestAnimationFrame(() => {
      const firstItem = moreWrapperRef.current?.querySelector('.more-menu-item');
      if (firstItem) {
        firstItem.focus();
        pendingMenuFocusRef.current = false;
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!touchExpanded) return undefined;

    const handleOutsideTap = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setTouchExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideTap);
    document.addEventListener('mousedown', handleOutsideTap);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideTap);
      document.removeEventListener('mousedown', handleOutsideTap);
    };
  }, [touchExpanded]);

  const isExpanded = sidebarHovered || (isTouchMode && touchExpanded) || moreMenuOpen;

  const handleTouchStart = () => {
    lastTouchTimeRef.current = Date.now();
    setIsTouchMode(true);
  };

  const handleMouseEnter = () => {
    if (isTouchMode || isTouchCapableDevice()) return;
    if (Date.now() - lastTouchTimeRef.current < 800) return;
    loadMoreMenuPopup().catch(() => {});
    setSidebarHovered(true);
  };

  const handleMouseLeave = () => {
    if (isTouchMode || isTouchCapableDevice()) return;
    setSidebarHovered(false);
  };

  const handleSidebarClick = (e) => {
    if (!(isTouchMode || isTouchCapableDevice())) return;
    if (e.target.closest('a, button, .more-popup-menu-container')) return;
    setTouchExpanded((prev) => !prev);
  };

  const handleMoreMouseEnter = useCallback(() => {
    if (isTouchMode || isTouchCapableDevice() || Date.now() - lastTouchTimeRef.current < 800) {
      return;
    }
    isMoreHoveredRef.current = true;
    clearMoreCloseTimer();
    loadMoreMenuPopup().catch(() => {});
    setMoreMenuOpen(true);
  }, [clearMoreCloseTimer, isTouchMode]);

  const handleMoreMouseLeave = useCallback(() => {
    if (isTouchMode || isTouchCapableDevice()) {
      return;
    }
    isMoreHoveredRef.current = false;
    clearMoreCloseTimer();
    moreCloseTimerRef.current = setTimeout(() => {
      moreCloseTimerRef.current = null;
      setMoreMenuOpen(false);
    }, MORE_MENU_CLOSE_DELAY_MS);
  }, [clearMoreCloseTimer, isTouchMode]);

  const handleMoreClose = useCallback(() => {
    isMoreHoveredRef.current = false;
    clearMoreCloseTimer();
    setMoreMenuOpen(false);
  }, [clearMoreCloseTimer]);

  const handleMoreClick = useCallback(() => {
    clearMoreCloseTimer();
    setMoreMenuOpen((prev) => !prev);
  }, [clearMoreCloseTimer]);

  const handleMoreTriggerKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      clearMoreCloseTimer();
      pendingMenuFocusRef.current = true;
      setMoreMenuOpen(true);
    } else if (e.key === 'Escape') {
      handleMoreClose();
    }
  }, [clearMoreCloseTimer, handleMoreClose]);

  const handleMoreBlur = useCallback((e) => {
    const nextTarget = e.relatedTarget;
    if (moreWrapperRef.current && nextTarget && moreWrapperRef.current.contains(nextTarget)) {
      return;
    }
    if (!isMoreHoveredRef.current) {
      clearMoreCloseTimer();
      setMoreMenuOpen(false);
    }
  }, [clearMoreCloseTimer]);

  return (
    <aside
      ref={sidebarRef}
      className={`desktop-sidebar ${isMessagesRoute ? 'is-condensed' : ''} ${
        isExpanded ? 'is-expanded' : ''
      } ${isTouchMode ? 'is-touch-mode' : ''}`}
      data-expanded={isExpanded ? 'true' : 'false'}
      onTouchStart={handleTouchStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleSidebarClick}
    >
      <div className="sidebar-brand-zone">
        <NavLink to={isAdmin ? "/admin" : "/"} className="brand-link" aria-label="Instagram Home" title="Instagram">
          <div className="sidebar-brand-box">
            <InstagramGlyph size={26} />
          </div>
          <span className="sidebar-brand-wordmark">
            <InstagramLogo width={104} height={30} color="var(--text-primary)" />
          </span>
        </NavLink>
        {isTouchMode && (
          <button
            type="button"
            className="sidebar-touch-toggle"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={isExpanded}
            onClick={(e) => {
              e.stopPropagation();
              setTouchExpanded((prev) => !prev);
            }}
          >
            <ChevronRight size={16} className={isExpanded ? 'rotated' : ''} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav-list" aria-label="Main Navigation">
        {isAdmin ? (
          <>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title="Admin Dashboard"
            >
              <div className="nav-icon-wrapper">
                <BarChart3 size={24} style={{ color: 'var(--ig-primary-button, #0095f6)' }} />
              </div>
              <span className="sidebar-item-label">Dashboard</span>
            </NavLink>
          </>
        ) : (
          <>
            {/* 1. Home */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title="Home"
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrapper">
                    <Home size={23} fill={isActive ? 'currentColor' : 'none'} strokeWidth={isActive ? 2.4 : 1.9} />
                  </div>
                  <span className="sidebar-item-label">Home</span>
                </>
              )}
            </NavLink>

            {/* 2. Search */}
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title="Search"
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrapper">
                    <Search size={23} strokeWidth={isActive ? 2.6 : 1.9} />
                  </div>
                  <span className="sidebar-item-label">Search</span>
                </>
              )}
            </NavLink>

            {/* 3. Reels */}
            <NavLink
              to="/reels"
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title="Reels"
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrapper">
                    <ReelsNavIcon size={23} isActive={isActive} />
                  </div>
                  <span className="sidebar-item-label">Reels</span>
                </>
              )}
            </NavLink>

            {/* 4. Messages */}
            <NavLink
              to="/messages"
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title="Messages"
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrapper">
                    <MessageCircle size={23} strokeWidth={isActive ? 2.4 : 1.9} />
                    {unreadChatCount > 0 && (
                      <span
                        className="nav-badge-count"
                        title={`${unreadChatCount} unseen ${unreadChatCount === 1 ? 'chat' : 'chats'}`}
                      >
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                    )}
                  </div>
                  <span className="sidebar-item-label">Messages</span>
                  {unreadChatCount > 0 && (
                    <span className="sidebar-inline-badge">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>

            {/* 5. Notifications */}
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title="Notifications"
            >
              {({ isActive }) => (
                <>
                  <div className="nav-icon-wrapper">
                    <Heart size={23} fill={isActive ? 'currentColor' : 'none'} strokeWidth={isActive ? 2.4 : 1.9} />
                    {unreadNotifications > 0 && <span className="nav-badge-dot" />}
                  </div>
                  <span className="sidebar-item-label">Notifications</span>
                </>
              )}
            </NavLink>

            {/* 6. Create */}
            <button
              type="button"
              className="sidebar-nav-item"
              onClick={onOpenCreate}
              title="Create"
            >
              <div className="nav-icon-wrapper">
                <PlusSquare size={23} strokeWidth={1.9} />
              </div>
              <span className="sidebar-item-label">Create</span>
            </button>

            {/* 7. Profile */}
            <NavLink
              to={`/profile/${userId || ''}`}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title="Profile"
            >
              {({ isActive }) => (
                <>
                  <div className={`nav-icon-wrapper nav-avatar-wrapper ${isActive ? 'avatar-active' : ''}`}>
                    <Avatar
                      src={avatarUrl}
                      alt={username || 'Profile'}
                      size="xs"
                      className="sidebar-avatar-img"
                    />
                  </div>
                  <span className="sidebar-item-label">Profile</span>
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Sidebar Footer: More Menu */}
      <div className="sidebar-footer">
        <div
          ref={moreWrapperRef}
          className="sidebar-more-hover-zone"
          onMouseEnter={handleMoreMouseEnter}
          onMouseLeave={handleMoreMouseLeave}
          onBlur={handleMoreBlur}
        >
          {moreMenuOpen && (
            <Suspense fallback={null}>
              <MoreMenuPopup
                isOpen={moreMenuOpen}
                onClose={handleMoreClose}
                theme={theme}
                onToggleTheme={onToggleTheme}
                onOpenReportProblem={onOpenReportProblem}
                onLogout={onLogout}
                isAdmin={isAdmin}
                triggerRef={moreTriggerRef}
                onMouseEnter={handleMoreMouseEnter}
                onMouseLeave={handleMoreMouseLeave}
              />
            </Suspense>
          )}

          <button
            ref={moreTriggerRef}
            type="button"
            className={`sidebar-nav-item ${moreMenuOpen ? 'active' : ''}`}
            onClick={handleMoreClick}
            onKeyDown={handleMoreTriggerKeyDown}
            aria-haspopup="menu"
            aria-expanded={moreMenuOpen}
            title="More"
          >
            <div className="nav-icon-wrapper">
              <Menu size={23} strokeWidth={1.9} />
            </div>
            <span className="sidebar-item-label">More</span>
          </button>
        </div>
      </div>
    </aside>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';
export default DesktopSidebar;
