import stompClient from '../services/websocket';
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SkeletonRouteContent } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notification.service';
import chatService from '../services/chat.service';
import useScreenTimeTracker from '../hooks/useScreenTimeTracker';
import {
  DesktopSidebar,
  ReelsNavIcon,
  AppSwitcherIcon,
  MobileHeader,
  MobileDrawerSheet,
  MobileBottomNav,
  AppModals,
} from '../components/layout';
import './AppLayout.css';

// Re-export icons and sidebar for compatibility
export { ReelsNavIcon, AppSwitcherIcon, DesktopSidebar };

const AdminConsoleSidebar = lazy(() => import('../components/admin/AdminConsoleSidebar'));

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
      <MobileHeader
        isAdmin={isAdmin}
        isAdminRoute={isAdminRoute}
        unreadNotifications={unreadNotifications}
        unreadChatCount={unreadChatCount}
        isMessagesRoute={isMessagesRoute}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onOpenAdminDrawer={() => setAdminDrawerOpen(true)}
      />

      {/* Mobile Drawer / Action Sheet */}
      <MobileDrawerSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        isAdmin={isAdmin}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

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
        className={`app-main-content ${isMessagesRoute ? 'messages-mode' : ''} ${
          isAdmin && isAdminRoute ? 'admin-console-mode' : ''
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
      <MobileBottomNav
        isAdmin={isAdmin}
        user={user}
        onOpenCreate={() => setCreateModalOpen(true)}
      />

      {/* Modals (lazy-loaded on demand when opened) */}
      <AppModals
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
        createPostOpen={createPostOpen}
        setCreatePostOpen={setCreatePostOpen}
        createStoryOpen={createStoryOpen}
        setCreateStoryOpen={setCreateStoryOpen}
        createReelOpen={createReelOpen}
        setCreateReelOpen={setCreateReelOpen}
        reportProblemOpen={reportProblemOpen}
        setReportProblemOpen={setReportProblemOpen}
        switchAccountsOpen={switchAccountsOpen}
        setSwitchAccountsOpen={setSwitchAccountsOpen}
        breakModalOpen={breakModalOpen}
        breakReminderMinutes={breakReminderMinutes}
        dismissBreakReminder={dismissBreakReminder}
        navigate={navigate}
      />
    </div>
  );
};

export default AppLayout;
