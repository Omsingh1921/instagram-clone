import stompClient from '../services/websocket';
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Send,
  Plus,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  Settings,
  ShieldAlert,
  Menu,
  Sun,
  Moon,
  LogOut,
  Instagram,
  X,
  Mail,
  FileText,
  ChevronRight,
  User as UserIcon,
  Sparkles,
  BarChart3,
  Sliders,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import { SkeletonRouteContent } from '../components/ui/Skeleton';
import { InstagramLogo, InstagramGlyph } from '../components/common/InstagramLogo';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notification.service';
import chatService from '../services/chat.service';
import useScreenTimeTracker from '../hooks/useScreenTimeTracker';
import './AppLayout.css';

const CreateModal = lazy(() => import('../components/modals/CreateModal'));
const CreatePostModal = lazy(() => import('../components/modals/CreatePostModal'));
const CreateStoryModal = lazy(() => import('../components/modals/CreateStoryModal'));
const CreateReelModal = lazy(() => import('../components/modals/CreateReelModal'));
const loadMoreMenuPopup = () => import('../components/navigation/MoreMenuPopup');
const MoreMenuPopup = lazy(loadMoreMenuPopup);
const MORE_MENU_CLOSE_DELAY_MS = 180;
const ReportProblemModal = lazy(() => import('../components/modals/ReportProblemModal'));
const SwitchAccountsModal = lazy(() => import('../components/modals/SwitchAccountsModal'));
const BreakReminderModal = lazy(() => import('../components/common/BreakReminderModal'));
const AdminConsoleSidebar = lazy(() => import('../components/admin/AdminConsoleSidebar'));


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

const isTouchCapableDevice = () => {
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
const DesktopSidebar = React.memo(({
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

export const AppLayout = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('app_theme') || 'dark'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [createReelOpen, setCreateReelOpen] = useState(false);
  const [reportProblemOpen, setReportProblemOpen] = useState(false);
  const [switchAccountsOpen, setSwitchAccountsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesRoute = location.pathname.startsWith('/messages');
  const isReelsRoute = location.pathname.startsWith('/reels');
  const mainDragRef = useRef({
    active: false,
    startY: 0,
    lastY: 0,
    dragged: false,
    scroller: null,
  });
  const suppressMainClickRef = useRef(false);

  // Desktop mouse drag-to-scroll on media/background across scrollable pages (Home, Explore, Profile, Settings)
  useEffect(() => {
    const handleMouseMove = (e) => {
      const drag = mainDragRef.current;
      if (!drag.active) return;
      const curY = e.clientY ?? drag.lastY;
      const totalDy = curY - drag.startY;
      const stepDy = curY - drag.lastY;
      drag.lastY = curY;

      if (!drag.dragged && Math.abs(totalDy) > 8) {
        drag.dragged = true;
        suppressMainClickRef.current = true;
      }
      if (drag.dragged && stepDy !== 0) {
        const scrollTarget = drag.scroller || document.scrollingElement || document.documentElement;
        if (scrollTarget) {
          scrollTarget.scrollTop -= stepDy;
        }
      }
    };

    const handleMouseUp = () => {
      const drag = mainDragRef.current;
      if (!drag.active) return;
      drag.active = false;
      drag.scroller = null;
      if (drag.dragged) {
        setTimeout(() => {
          suppressMainClickRef.current = false;
        }, 60);
      }
      drag.dragged = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMainMouseDown = (e) => {
    if (e.button !== 0 || isMessagesRoute || isReelsRoute) return;
    if (!(e.target instanceof Element)) return;
    if (
      e.target.closest(
        'button, a, input, textarea, select, [role="button"], [role="tab"], [role="menu"], [role="dialog"], .modal-overlay, .story-bar-container, [contenteditable="true"], p, span, h1, h2, h3, h4, h5, h6, strong, em, small, li, td, th, label'
      )
    ) {
      return;
    }

    let scroller = null;
    let node = e.target;
    while (node && node !== document.body && node !== document.documentElement) {
      const style = window.getComputedStyle(node);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      ) {
        scroller = node;
        break;
      }
      node = node.parentElement;
    }

    mainDragRef.current = {
      active: true,
      startY: e.clientY ?? 0,
      lastY: e.clientY ?? 0,
      dragged: false,
      scroller,
    };
  };
  const isAdminRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/health' ||
    location.pathname === '/settings';

  // Close mobile drawer & popups on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAdminDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const openAdminSidebar = () => setAdminDrawerOpen(true);
    const openCreate = () => setCreateModalOpen(true);
    window.addEventListener('admin:open-sidebar', openAdminSidebar);
    window.addEventListener('app:open-create', openCreate);
    return () => {
      window.removeEventListener('admin:open-sidebar', openAdminSidebar);
      window.removeEventListener('app:open-create', openCreate);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    const onThemeEvent = (e) => {
      const next = e?.detail;
      if (next === 'dark' || next === 'light') {
        setTheme(next);
      }
    };
    window.addEventListener('app:theme-change', onThemeEvent);
    return () => window.removeEventListener('app:theme-change', onThemeEvent);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleOpenReportProblem = useCallback(() => {
    setReportProblemOpen(true);
  }, []);

  const handleOpenSwitchAccounts = useCallback(() => {
    setSwitchAccountsOpen(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      } else {
        navigate('/login');
      }
    } catch {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      } else {
        navigate('/login');
      }
    }
  }, [logout, navigate]);

  const isAdmin = Boolean(
    user?.role === 'ADMIN' ||
    user?.role === 'ROLE_ADMIN' ||
    user?.username?.toLowerCase() === 'admin' ||
    user?.authorities?.some(
      (a) => a.authority === 'ROLE_ADMIN' || a === 'ROLE_ADMIN'
    )
  );

  const {
    breakReminderMinutes,
    breakModalOpen,
    dismissBreakReminder,
  } = useScreenTimeTracker({ enabled: Boolean(isAuthenticated && !isAdmin) });

  // Real-time unread notification count (skipped on admin-only console)
  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        const count = res?.data ?? res ?? 0;
        setUnreadNotifications(Number(count) || 0);
      } catch {
        // Ignore fallback
      }
    };

    fetchUnreadCount();

    // Subscribe to websocket for live notifications
    let unsubscribe;
    if (stompClient && stompClient.connected) {
      unsubscribe = stompClient.subscribe('/user/queue/notifications', () => {
        setUnreadNotifications((prev) => prev + 1);
      });
    }

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAuthenticated, isAdmin]);

  // Real-time unread chat count (ONLY FRONTEND, skipped for admin)
  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;

    const fetchUnreadChatCount = async () => {
      try {
        const res = await chatService.getConversations(0, 25);
        const list = res?.data?.content || res?.content || res?.data || [];
        // Count conversations that have unreadCount > 0
        const unseenChats = list.filter((c) => (Number(c.unreadCount) || 0) > 0).length;
        setUnreadChatCount(unseenChats);
      } catch {
        // Fallback silently
      }
    };

    fetchUnreadChatCount();

    // Listen to custom events dispatched by MessagesPage or other components
    const handleUnreadUpdate = (event) => {
      if (typeof event.detail === 'number') {
        setUnreadChatCount(event.detail);
      } else {
        fetchUnreadChatCount();
      }
    };

    window.addEventListener('chat:unread-count', handleUnreadUpdate);
    window.addEventListener('chat:refresh', fetchUnreadChatCount);

    // Stomp subscription for real-time messages when not on messages page
    let unsubscribe;
    if (stompClient && stompClient.connected && user?.id) {
      unsubscribe = stompClient.subscribe(`/topic/users/${user.id}/messages`, () => {
        fetchUnreadChatCount();
      });
    }

    const interval = setInterval(fetchUnreadChatCount, 20000);
    return () => {
      window.removeEventListener('chat:unread-count', handleUnreadUpdate);
      window.removeEventListener('chat:refresh', fetchUnreadChatCount);
      clearInterval(interval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAuthenticated, isAdmin, user?.id]);

  return (
    <div className="instagram-app-layout">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <NavLink to={isAdmin ? "/admin" : "/"} className="brand-link" aria-label="Instagram Home">
          <InstagramLogo width={103} height={29} color="var(--text-primary)" />
        </NavLink>

        <div className="mobile-header-actions">
          <NavLink
            to="/search"
            className="mobile-icon-btn"
            aria-label="Search"
            title="Search"
          >
            <Search size={22} />
          </NavLink>

          <NavLink
            to="/notifications"
            className="mobile-icon-btn"
            aria-label="Notifications"
            title="Notifications"
          >
            <Heart size={22} />
            {unreadNotifications > 0 && <span className="nav-badge-dot" />}
          </NavLink>

          <NavLink
            to="/messages"
            className="mobile-icon-btn"
            aria-label="Messages"
            title="Direct Messages"
          >
            <div className="nav-icon-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={22} />
              {unreadChatCount > 0 && (
                <span className="nav-badge-count">
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              )}
            </div>
          </NavLink>

          <button
            type="button"
            className="mobile-icon-btn mobile-menu-trigger"
            onClick={() => {
              if (isAdmin && isAdminRoute) {
                setAdminDrawerOpen(true);
              } else {
                setMobileMenuOpen(true);
              }
            }}
            aria-label="Open mobile menu"
            title="Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer / Action Sheet */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobile-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="sheet-drag-handle" />

            {/* Sheet Header with User Overview */}
            <div className="sheet-header">
              <div className="sheet-user-info">
                <Avatar
                  src={user?.avatarUrl || user?.profilePictureUrl}
                  alt={user?.username || 'Profile'}
                  size="sm"
                />
                <div className="sheet-user-meta">
                  <div className="sheet-username-row">
                    <span className="sheet-username">@{user?.username}</span>
                    {isAdmin && (
                      <span className="sheet-admin-badge">ADMIN</span>
                    )}
                  </div>
                  <span className="sheet-fullname">
                    {user?.displayName || user?.fullName || 'Instagram User'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Theme Switcher */}
            <div className="sheet-theme-row">
              <div className="sheet-theme-label">
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
              </div>
              <button
                type="button"
                className="sheet-theme-toggle-btn"
                onClick={toggleTheme}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Main Links */}
            <div className="sheet-links-list">
              {isAdmin ? (
                <>
                  <NavLink
                    to="/admin"
                    end
                    className="sheet-nav-item admin-link"
                  >
                    <BarChart3 size={20} />
                    <span>Dashboard</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>

                  <NavLink to="/settings" className="sheet-nav-item">
                    <Settings size={20} />
                    <span>Settings & Privacy</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to={`/profile/${user?.id || ''}`}
                    className="sheet-nav-item"
                  >
                    <UserIcon size={20} />
                    <span>My Profile</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>

                  <NavLink to="/explore" className="sheet-nav-item">
                    <Compass size={20} />
                    <span>Explore</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>

                  <NavLink to="/settings" className="sheet-nav-item">
                    <Settings size={20} />
                    <span>Settings & Privacy</span>
                    <ChevronRight size={16} className="sheet-arrow" />
                  </NavLink>
                </>
              )}
            </div>

            {/* Sheet Footer Logout */}
            <div className="sheet-footer">
              <button
                type="button"
                className="sheet-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation: Full Admin Console on /admin* routes, Instagram sidebar otherwise */}
      {isAdmin && isAdminRoute ? (
        <Suspense fallback={null}>
          <AdminConsoleSidebar
            user={user}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onOpenSwitchAccounts={() => setSwitchAccountsOpen(true)}
            mobileOpen={adminDrawerOpen}
            onCloseMobile={() => setAdminDrawerOpen(false)}
          />
        </Suspense>
      ) : (
        <DesktopSidebar
          isAdmin={isAdmin}
          isMessagesRoute={isMessagesRoute}
          routeKey={`${location.pathname}${location.search}`}
          userId={user?.id}
          username={user?.username}
          avatarUrl={user?.avatarUrl || user?.profilePictureUrl}
          unreadChatCount={unreadChatCount}
          unreadNotifications={unreadNotifications}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCreate={handleOpenCreate}
          onOpenReportProblem={handleOpenReportProblem}
          onOpenSwitchAccounts={handleOpenSwitchAccounts}
          onLogout={handleLogout}
        />
      )}

      {/* Main Outlet */}
      <main
        className={`app-main-content ${isMessagesRoute ? 'messages-mode' : ''} ${isAdmin && isAdminRoute ? 'admin-console-mode' : ''
          }`}
        onMouseDown={handleMainMouseDown}
        onClickCapture={(e) => {
          if (suppressMainClickRef.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {isAdmin && isAdminRoute && location.pathname !== '/admin' && (
          <button
            type="button"
            className="admin-tablet-menu-pill"
            onClick={() => setAdminDrawerOpen(true)}
            aria-label="Open admin navigation"
          >
            <Menu size={18} />
            <span>Admin Menu</span>
          </button>
        )}
        <Suspense fallback={<SkeletonRouteContent pathname={location.pathname} search={location.search} />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {isAdmin ? (
          <>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
              aria-label="Admin Dashboard"
            >
              <BarChart3 size={24} style={{ color: 'var(--ig-primary-button, #0095f6)' }} />
            </NavLink>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
              aria-label="Admin Settings"
            >
              <Settings size={24} />
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
              aria-label="Home"
            >
              <Home size={24} />
            </NavLink>

            <NavLink
              to="/search"
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
              aria-label="Search"
            >
              <Search size={24} />
            </NavLink>

            <button
              type="button"
              className="mobile-nav-item create-highlight-btn"
              onClick={() => setCreateModalOpen(true)}
              aria-label="Create Post"
            >
              <PlusSquare size={26} />
            </button>

            <NavLink
              to="/reels"
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
              aria-label="Reels"
            >
              <Film size={24} />
            </NavLink>

            <NavLink
              to={`/profile/${user?.id || ''}`}
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
              aria-label="My Profile"
            >
              <Avatar
                src={user?.avatarUrl || user?.profilePictureUrl}
                alt={user?.username || 'Profile'}
                size="xs"
              />
            </NavLink>
          </>
        )}
      </nav>

      {/* Modals (lazy-loaded on demand when opened) */}
      {(createModalOpen ||
        createPostOpen ||
        createStoryOpen ||
        createReelOpen ||
        reportProblemOpen ||
        switchAccountsOpen ||
        breakModalOpen) && (
        <Suspense fallback={null}>
          {createModalOpen && (
            <CreateModal
              isOpen={createModalOpen}
              onClose={() => setCreateModalOpen(false)}
              onSelectPost={() => setCreatePostOpen(true)}
              onSelectStory={() => setCreateStoryOpen(true)}
              onSelectReel={() => setCreateReelOpen(true)}
            />
          )}

          {createPostOpen && (
            <CreatePostModal
              isOpen={createPostOpen}
              onClose={() => setCreatePostOpen(false)}
              onPostCreated={() => {
                window.dispatchEvent(new Event('feed:refresh'));
              }}
            />
          )}

          {createStoryOpen && (
            <CreateStoryModal
              isOpen={createStoryOpen}
              onClose={() => setCreateStoryOpen(false)}
              onStoryCreated={() => {
                window.dispatchEvent(new Event('story:refresh'));
              }}
            />
          )}

          {createReelOpen && (
            <CreateReelModal
              isOpen={createReelOpen}
              onClose={() => setCreateReelOpen(false)}
              onReelCreated={() => {
                window.dispatchEvent(new Event('reel:refresh'));
              }}
            />
          )}

          {reportProblemOpen && (
            <ReportProblemModal
              isOpen={reportProblemOpen}
              onClose={() => setReportProblemOpen(false)}
            />
          )}

          {switchAccountsOpen && (
            <SwitchAccountsModal
              isOpen={switchAccountsOpen}
              onClose={() => setSwitchAccountsOpen(false)}
            />
          )}

          {breakModalOpen && (
            <BreakReminderModal
              isOpen={breakModalOpen}
              minutes={breakReminderMinutes}
              onContinue={dismissBreakReminder}
              onManageReminder={() => {
                dismissBreakReminder();
                navigate('/your-activity?tab=time');
              }}
            />
          )}
        </Suspense>
      )}
    </div>
  );
};

export default AppLayout;
