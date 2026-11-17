import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Film,
  Image as ImageIcon,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MessageSquare,
  Clock,
  RefreshCw,
  Sliders,
  Trash2,
  BadgeCheck,
  Bell,
  HelpCircle,
  Calendar,
  Flag,
  Heart,
  Share2,
  Bookmark,
  Zap,
  FileText,
  Gavel,
  PlusCircle,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  PieChart,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Skeleton,
  SkeletonAdminContentGrid,
  SkeletonUserRows,
} from '../../components/ui/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { InstagramGlyph } from '../../components/common/InstagramLogo';
import { PlatformGrowthChart, ContentDistributionDonut } from '../../components/admin/AdminCharts';
import { AuthContext } from '../../context/AuthContext';
import adminService from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils';
import './AdminDashboardPage.css';

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const formatDelta = (pct) => {
  const num = Number(pct ?? 0);
  if (Number.isNaN(num) || num === 0) return { label: '0.0%', direction: 'flat' };
  const abs = Math.abs(num).toFixed(1);
  return {
    label: `${num > 0 ? '+' : '-'}${abs}%`,
    direction: num > 0 ? 'up' : 'down',
  };
};

export const AdminDashboardPage = () => {
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.user || readStoredUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  // Derive active view from ?tab= param
  const urlTab = (searchParams.get('tab') || 'overview').toUpperCase();
  const resolvedInitialTab = ['OVERVIEW', 'USERS', 'CONTENT'].includes(urlTab) ? urlTab : 'OVERVIEW';
  const [currentTab, setCurrentTab] = useState(resolvedInitialTab);

  // Dashboard stats & filters
  const [periodDays, setPeriodDays] = useState(7);
  const [chartMode, setChartMode] = useState('USERS'); // 'USERS' | 'CONTENT' | 'ENGAGEMENT'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [themeMode, setThemeMode] = useState(
    () =>
      document.documentElement.getAttribute('data-theme') ||
      localStorage.getItem('app_theme') ||
      'dark'
  );

  const handleToggleDashboardTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('app_theme', next);
    window.dispatchEvent(new CustomEvent('app:theme-change', { detail: next }));
  };

  // Live Activity State
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [allActivities, setAllActivities] = useState([]);

  // Global Command Search State
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ users: [], content: [], reports: [] });
  const globalSearchRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Users Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [processingUserId, setProcessingUserId] = useState(null);

  // Content Explorer State
  const urlContentType = (searchParams.get('type') || 'POSTS').toUpperCase();
  const [contentType, setContentType] = useState(
    ['POSTS', 'REELS', 'STORIES'].includes(urlContentType) ? urlContentType : 'POSTS'
  );
  const [contentItems, setContentItems] = useState([]);
  const [contentQuery, setContentQuery] = useState('');
  const [contentPage, setContentPage] = useState(0);
  const [contentTotalPages, setContentTotalPages] = useState(1);
  const [loadingContent, setLoadingContent] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  // Sync URL query params into component tabs
  useEffect(() => {
    const paramTab = (searchParams.get('tab') || 'overview').toUpperCase();
    const resolvedParamTab = ['OVERVIEW', 'USERS', 'CONTENT'].includes(paramTab) ? paramTab : 'OVERVIEW';
    if (resolvedParamTab !== currentTab) {
      setCurrentTab(resolvedParamTab);
    }
    const paramType = (searchParams.get('type') || 'POSTS').toUpperCase();
    if (['POSTS', 'REELS', 'STORIES'].includes(paramType) && paramType !== contentType) {
      setContentType(paramType);
    }
  }, [searchParams]);

  const switchTab = (nextTab, extraType = null) => {
    setCurrentTab(nextTab);
    const nextParams = new URLSearchParams();
    if (nextTab !== 'OVERVIEW') nextParams.set('tab', nextTab.toLowerCase());
    if (nextTab === 'CONTENT') nextParams.set('type', extraType || contentType);
    setSearchParams(nextParams, { replace: true });
    if (extraType) setContentType(extraType);
  };

  // Keyboard Ctrl+K / Cmd+K shortcut for global search + outside-click close
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        globalSearchRef.current?.focus();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    const onMouseDown = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const loadStats = useCallback(async (days = periodDays) => {
    try {
      setLoadingStats(true);
      const res = await adminService.getStats(days);
      const data = res?.data || res;
      setStats(data);
      window.dispatchEvent(
        new CustomEvent('admin:stats-updated', { detail: { openReports: data?.openReports ?? 0 } })
      );
    } catch (err) {
      showError(err.message || 'Failed to load system statistics');
    } finally {
      setLoadingStats(false);
    }
  }, [periodDays, showError]);

  const loadActivity = useCallback(async (limit = 10) => {
    if (typeof adminService.getActivity !== 'function') return [];
    try {
      setLoadingActivity(true);
      const res = await adminService.getActivity(limit);
      const list = res?.data || res || [];
      const arr = Array.isArray(list) ? list : [];
      if (limit <= 12) setActivities(arr);
      else setAllActivities(arr);
      return arr;
    } catch {
      return [];
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 0) => {
    try {
      setLoadingUsers(true);
      const params = { page, size: 15, sort: 'createdAt,desc' };
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;

      const res = await adminService.getUsers(params);
      const pageData = res?.data || res;
      setUsers(pageData?.content || []);
      setTotalPages(pageData?.totalPages || 1);
      setTotalElements(pageData?.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      showError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [searchQuery, statusFilter, roleFilter, showError]);

  const loadContent = useCallback(async (type = contentType, page = 0) => {
    if (typeof adminService.getContent !== 'function') return;
    try {
      setLoadingContent(true);
      const res = await adminService.getContent(type, contentQuery, page, 18);
      const pageData = res?.data || res;
      setContentItems(pageData?.content || []);
      setContentTotalPages(pageData?.totalPages || 1);
      setContentPage(page);
    } catch (err) {
      showError(err.message || 'Failed to load platform content');
      setContentItems([]);
    } finally {
      setLoadingContent(false);
    }
  }, [contentType, contentQuery, showError]);

  useEffect(() => {
    if (currentTab === 'OVERVIEW') {
      loadStats(periodDays);
      loadActivity(8);
    } else if (currentTab === 'USERS') {
      loadUsers(0);
    } else if (currentTab === 'CONTENT') {
      loadContent(contentType, 0);
    }
  }, [currentTab, periodDays, contentType]);

  useEffect(() => {
    if (currentTab !== 'USERS') return undefined;
    const t = setTimeout(() => loadUsers(0), 350);
    return () => clearTimeout(t);
  }, [searchQuery, statusFilter, roleFilter]);

  useEffect(() => {
    if (currentTab !== 'CONTENT') return undefined;
    const t = setTimeout(() => loadContent(contentType, 0), 350);
    return () => clearTimeout(t);
  }, [contentQuery]);

  // Debounced Global Search Palette Query
  useEffect(() => {
    const q = globalQuery.trim();
    if (q.length < 2) {
      setSearchResults({ users: [], content: [], reports: [] });
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const [usersRes, postsRes, reportsRes] = await Promise.allSettled([
          adminService.getUsers({ query: q, page: 0, size: 4 }),
          typeof adminService.getContent === 'function'
            ? adminService.getContent('POSTS', q, 0, 3)
            : Promise.resolve(null),
          typeof adminService.getReports === 'function'
            ? adminService.getReports(null, null, 0, 15)
            : Promise.resolve(null),
        ]);

        const matchedUsers =
          usersRes.status === 'fulfilled'
            ? (usersRes.value?.data?.content || usersRes.value?.content || [])
            : [];
        const matchedContent =
          postsRes.status === 'fulfilled' && postsRes.value
            ? (postsRes.value?.data?.content || postsRes.value?.content || [])
            : [];
        const rawReports =
          reportsRes.status === 'fulfilled' && reportsRes.value
            ? (reportsRes.value?.data?.content || reportsRes.value?.content || [])
            : [];
        const qLower = q.toLowerCase();
        const matchedReports = rawReports
          .filter(
            (r) =>
              r.reasonCode?.toLowerCase().includes(qLower) ||
              r.description?.toLowerCase().includes(qLower) ||
              r.reporter?.username?.toLowerCase().includes(qLower)
          )
          .slice(0, 3);

        setSearchResults({ users: matchedUsers, content: matchedContent, reports: matchedReports });
      } finally {
        setSearchLoading(false);
      }
    }, 260);
    return () => clearTimeout(timer);
  }, [globalQuery]);

  const executeConfirmDialog = async () => {
    if (!confirmDialog?.onConfirm || confirmProcessing) return;
    try {
      setConfirmProcessing(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } finally {
      setConfirmProcessing(false);
    }
  };

  const handleToggleUserStatus = (user) => {
    if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN' || user.username?.toLowerCase() === 'admin') {
      showError('Admin accounts cannot be deactivated or suspended');
      return;
    }
    const isCurrentlyActive = user.status === 'ACTIVE';
    const targetStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

    setConfirmDialog({
      title: isCurrentlyActive ? 'Suspend Account?' : 'Reactivate Account?',
      description: isCurrentlyActive
        ? `Are you sure you want to suspend @${user.username}? They will not be able to log in.`
        : `Restore active platform access for @${user.username}?`,
      confirmLabel: isCurrentlyActive ? 'Suspend' : 'Reactivate',
      loadingLabel: isCurrentlyActive ? 'Suspending...' : 'Reactivating...',
      variant: isCurrentlyActive ? 'warning' : 'primary',
      icon: isCurrentlyActive ? ShieldAlert : UserCheck,
      metaLabel: `@${user.username}`,
      thumbnailUrl: user.avatarUrl || null,
      onConfirm: async () => {
        try {
          setProcessingUserId(user.id);
          await adminService.updateUserStatus(user.id, {
            status: targetStatus,
            reason: isCurrentlyActive ? 'Admin moderation suspension' : 'Admin reactivation',
          });
          showSuccess(`User @${user.username} status updated to ${targetStatus}`);
          loadUsers(currentPage);
        } catch (err) {
          showError(err.message || 'Failed to update user status');
        } finally {
          setProcessingUserId(null);
        }
      },
    });
  };

  const handleToggleVerify = async (u) => {
    const isCurrentlyVerified = Boolean(u.isVerified || u.verified);
    const nextState = !isCurrentlyVerified;
    try {
      setProcessingUserId(u.id);
      await adminService.verifyUser(u.id, nextState);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === u.id
            ? { ...item, isVerified: nextState, verified: nextState }
            : item
        )
      );
      showSuccess(
        nextState
          ? `@${u.username} verified badge activated!`
          : `@${u.username} verified badge removed`
      );
    } catch (err) {
      showError(err.message || 'Failed to update verified badge');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeleteUser = (user) => {
    if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN' || user.username?.toLowerCase() === 'admin') {
      showError('Admin accounts cannot be deleted');
      return;
    }
    setConfirmDialog({
      title: 'Delete User Account?',
      description: `Are you sure you want to delete @${user.username}? This will soft-delete their account and revoke active sessions.`,
      confirmLabel: 'Delete',
      loadingLabel: 'Deleting...',
      variant: 'danger',
      icon: UserX,
      metaLabel: `@${user.username}`,
      thumbnailUrl: user.avatarUrl || null,
      onConfirm: async () => {
        try {
          setProcessingUserId(user.id);
          await adminService.deleteUser(user.id);
          showSuccess(`User @${user.username} deleted successfully`);
          loadUsers(currentPage);
        } catch (err) {
          showError(err.message || 'Failed to delete user');
        } finally {
          setProcessingUserId(null);
        }
      },
    });
  };

  const handleDeleteContentItem = (item) => {
    if (typeof adminService.deleteContent !== 'function') return;
    const rawType = (item.contentType || 'content').toLowerCase();
    const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
    const authorName = item.author?.username || 'user';

    setConfirmDialog({
      title: `Remove ${formattedType}?`,
      description: `Remove this ${rawType} by @${authorName}? This will take the ${rawType} down from the platform.`,
      confirmLabel: 'Remove',
      loadingLabel: 'Removing...',
      variant: 'danger',
      icon: Trash2,
      metaLabel: item.caption ? `@${authorName} · ${item.caption}` : `@${authorName}`,
      thumbnailUrl: item.thumbnailUrl || null,
      onConfirm: async () => {
        try {
          setDeletingContentId(item.id);
          await adminService.deleteContent(item.contentType, item.id);
          showSuccess(`${item.contentType} removed successfully`);
          loadContent(contentType, contentPage);
        } catch (err) {
          showError(err.message || 'Failed to remove content');
        } finally {
          setDeletingContentId(null);
        }
      },
    });
  };

  const handleOpenAllActivity = async () => {
    setActivityModalOpen(true);
    await loadActivity(40);
  };

  const rawDisplayName = (currentUser?.displayName || currentUser?.fullName || '').trim();
  const adminFirstName =
    rawDisplayName === 'System Administrator'
      ? 'System Admin'
      : rawDisplayName.split(/\s+/)[0] || currentUser?.username || 'Admin';

  const usersDelta = formatDelta(stats?.usersGrowthPercent);
  const postsDelta = formatDelta(stats?.postsGrowthPercent);
  const reelsDelta = formatDelta(stats?.reelsGrowthPercent);
  const storiesDelta = formatDelta(stats?.storiesGrowthPercent);
  const likesDelta = formatDelta(stats?.likesGrowthPercent);
  const commentsDelta = formatDelta(stats?.commentsGrowthPercent);
  const sharesDelta = formatDelta(stats?.sharesGrowthPercent);
  const savesDelta = formatDelta(stats?.savesGrowthPercent);

  const isStatsLoading = loadingStats && !stats;
  const kpiMetricSlot = (value) =>
    isStatsLoading ? <Skeleton className="w-12 h-7 my-0.5 rounded-md" /> : (value ?? 0).toLocaleString();
  const renderKpiDelta = (delta, periodNote) => (
    <div className="kpi-delta-row">
      {isStatsLoading ? (
        <Skeleton className="w-16 h-4 rounded-full" />
      ) : (
        <span className={`kpi-delta ${delta.direction}`}>
          {delta.direction === 'down' ? (
            <ArrowDownRight size={13} />
          ) : (
            <ArrowUpRight size={13} />
          )}
          {delta.label}
        </span>
      )}
      <span className="kpi-period-note">{periodNote}</span>
    </div>
  );

  const renderActivityVisual = (act) => {
    if (act.previewUrl) {
      return <img src={act.previewUrl} alt="" className="activity-thumb" loading="lazy" />;
    }
    if (act.type === 'REPORT_SUBMITTED') {
      return (
        <div className="activity-type-badge report">
          <Flag size={16} />
        </div>
      );
    }
    if (act.type === 'USER_FOLLOWED') {
      return (
        <div className="activity-type-badge">
          <Users size={16} />
        </div>
      );
    }
    return (
      <div className="activity-type-badge">
        <Play size={16} />
      </div>
    );
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-inner">
        {/* Top Admin Greeting & Controls Header */}
        <header className="admin-topbar">
          <div className="admin-greeting-block">
            <button
              type="button"
              className="admin-mobile-sidebar-btn"
              onClick={() => window.dispatchEvent(new Event('admin:open-sidebar'))}
              aria-label="Open admin navigation"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="admin-greeting-title-row">
                <h1>
                  <span className="admin-greeting-title">
                    {getTimeGreeting()}, {adminFirstName} 👋
                  </span>
                </h1>
                <span className="admin-console-badge">
                  <ShieldCheck size={12} />
                  Admin Control Center
                </span>
              </div>
              <p className="admin-greeting-subtitle">
                Here&apos;s what&apos;s happening on your Instagram platform today.
              </p>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-topbar-controls">
              {/* Global Search Bar */}
              <div className="admin-global-search-wrap" ref={searchContainerRef}>
                <div className="admin-global-search-box">
                  <Search size={15} color="#8b82ad" />
                  <input
                    ref={globalSearchRef}
                    type="text"
                    placeholder="Search users, posts, reports..."
                    value={globalQuery}
                    onFocus={() => setSearchOpen(true)}
                    onChange={(e) => {
                      setGlobalQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    aria-label="Global admin search"
                  />
                  <kbd className="admin-kbd-hint">Ctrl + K</kbd>
                </div>

                {searchOpen && globalQuery.trim().length >= 2 && (
                  <div className="admin-search-dropdown">
                    {searchLoading ? (
                      <SkeletonUserRows count={3} compact />
                    ) : searchResults.users.length === 0 &&
                      searchResults.content.length === 0 &&
                      searchResults.reports.length === 0 ? (
                      <div style={{ padding: '14px', fontSize: '12.5px', color: 'var(--adc-text-muted)', textAlign: 'center' }}>
                        No matching users, posts, or reports found.
                      </div>
                    ) : (
                      <>
                        {searchResults.users.length > 0 && (
                          <>
                            <div className="admin-search-group-title">Users</div>
                            {searchResults.users.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                className="admin-search-hit"
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchQuery(u.username);
                                  switchTab('USERS');
                                }}
                              >
                                <span>@{u.username}</span>
                                <span style={{ fontSize: '11px', color: 'var(--adc-text-muted)' }}>
                                  {u.email}
                                </span>
                              </button>
                            ))}
                          </>
                        )}
                        {searchResults.content.length > 0 && (
                          <>
                            <div className="admin-search-group-title">Posts</div>
                            {searchResults.content.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="admin-search-hit"
                                onClick={() => {
                                  setSearchOpen(false);
                                  setContentQuery(globalQuery.trim());
                                  switchTab('CONTENT', 'POSTS');
                                }}
                              >
                                <span>{c.caption || 'Untitled post'}</span>
                                <span style={{ fontSize: '11px', color: 'var(--adc-text-muted)' }}>
                                  @{c.author?.username}
                                </span>
                              </button>
                            ))}
                          </>
                        )}
                        {searchResults.reports.length > 0 && (
                          <>
                            <div className="admin-search-group-title">Reports</div>
                            {searchResults.reports.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                className="admin-search-hit"
                                onClick={() => {
                                  setSearchOpen(false);
                                  navigate(`/admin/reports?status=${r.status}`);
                                }}
                              >
                                <span>{r.reasonCode}</span>
                                <span style={{ fontSize: '11px', color: '#f87171' }}>
                                  {r.status}
                                </span>
                              </button>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="admin-icon-circle-btn"
                onClick={handleToggleDashboardTheme}
                title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle dashboard theme"
              >
                {themeMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <NavLink
                to="/admin/reports?status=OPEN"
                className="admin-icon-circle-btn"
                title="Open moderation alerts"
                aria-label="Moderation Alerts"
              >
                <Bell size={17} />
                {(stats?.openReports ?? 0) > 0 && <span className="admin-bell-dot" />}
              </NavLink>

              <NavLink
                to="/health"
                className="admin-icon-circle-btn"
                title="Platform Health Status"
                aria-label="Platform Health"
              >
                <HelpCircle size={17} />
              </NavLink>

              <NavLink
                to="/admin/configs"
                className="admin-brand-pill-btn"
                title="System Configurations"
                aria-label="System Configurations"
              >
                <InstagramGlyph size={18} color="#ffffff" />
              </NavLink>
            </div>
          </div>
        </header>

        {/* Sub-Toolbar: Mode Switch Tabs + Period Filter + Refresh */}
        <div className="admin-topbar-subrow">
          <div className="admin-mode-tabs">
            <button
              type="button"
              className={`admin-nav-tab ${currentTab === 'OVERVIEW' ? 'active' : ''}`}
              onClick={() => switchTab('OVERVIEW')}
            >
              <BarChart3 size={15} />
              <span>Overview & Analytics</span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${currentTab === 'USERS' ? 'active' : ''}`}
              onClick={() => switchTab('USERS')}
            >
              <Users size={15} />
              <span>User Management</span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${currentTab === 'CONTENT' ? 'active' : ''}`}
              onClick={() => switchTab('CONTENT', contentType)}
            >
              <ImageIcon size={15} />
              <span>Content Explorer</span>
            </button>
          </div>

          {currentTab === 'OVERVIEW' && (
            <div className="admin-toolbar-right">
              <div className="admin-date-select-wrap">
                <Calendar size={14} />
                <select
                  className="admin-date-select"
                  value={periodDays}
                  onChange={(e) => setPeriodDays(Number(e.target.value))}
                  aria-label="Analytics time range"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                </select>
              </div>

              <button
                type="button"
                className="table-action-btn"
                onClick={() => {
                  loadStats(periodDays);
                  loadActivity(8);
                }}
                disabled={loadingStats}
              >
                <RefreshCw size={13} className={!isStatsLoading && loadingStats ? 'spinning' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            TAB 1: OVERVIEW / ANALYTICS BENTO DASHBOARD
           ============================================================ */}
        {currentTab === 'OVERVIEW' && (
          <>
            {!loadingStats && !stats ? (
              <EmptyState
                icon={Activity}
                title="No Statistics Available"
                description="Could not load platform metrics."
                actionLabel="Retry"
                onAction={() => loadStats(periodDays)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* ROW 1: 4 Glassmorphism KPI Cards */}
                <div className="admin-kpi-grid">
                  {/* Card 1: Total Users */}
                  <button
                    type="button"
                    className="kpi-card kpi-users"
                    onClick={() => switchTab('USERS')}
                  >
                    <div className="kpi-icon-badge kpi-badge-users">
                      <Users size={22} />
                    </div>
                    <div className="kpi-body">
                      <span className="kpi-label">Total Users</span>
                      <span className="kpi-value">{kpiMetricSlot(stats?.totalUsers)}</span>
                      {renderKpiDelta(usersDelta, `vs. previous ${stats?.periodDays ?? periodDays} days`)}
                    </div>
                    <Users size={38} className="kpi-watermark" />
                  </button>

                  {/* Card 2: Feed Posts */}
                  <button
                    type="button"
                    className="kpi-card kpi-posts"
                    onClick={() => switchTab('CONTENT', 'POSTS')}
                  >
                    <div className="kpi-icon-badge kpi-badge-posts">
                      <Mail size={21} />
                    </div>
                    <div className="kpi-body">
                      <span className="kpi-label">Feed Posts</span>
                      <span className="kpi-value">{kpiMetricSlot(stats?.totalPosts)}</span>
                      {renderKpiDelta(postsDelta, `vs. previous ${stats?.periodDays ?? periodDays} days`)}
                    </div>
                    <ImageIcon size={38} className="kpi-watermark" />
                  </button>

                  {/* Card 3: Reels */}
                  <button
                    type="button"
                    className="kpi-card kpi-reels"
                    onClick={() => switchTab('CONTENT', 'REELS')}
                  >
                    <div className="kpi-icon-badge kpi-badge-reels">
                      <Play size={20} fill="currentColor" />
                    </div>
                    <div className="kpi-body">
                      <span className="kpi-label">Reels</span>
                      <span className="kpi-value">{kpiMetricSlot(stats?.totalReels)}</span>
                      {renderKpiDelta(reelsDelta, `vs. previous ${stats?.periodDays ?? periodDays} days`)}
                    </div>
                    <Film size={38} className="kpi-watermark" />
                  </button>

                  {/* Card 4: Stories */}
                  <button
                    type="button"
                    className="kpi-card kpi-stories"
                    onClick={() => switchTab('CONTENT', 'STORIES')}
                  >
                    <div className="kpi-icon-badge kpi-badge-stories">
                      <PlusCircle size={22} />
                    </div>
                    <div className="kpi-body">
                      <span className="kpi-label">Stories</span>
                      <span className="kpi-value">
                        {kpiMetricSlot(stats?.totalStories ?? stats?.activeStories)}
                      </span>
                      {renderKpiDelta(
                        storiesDelta,
                        <>
                          {isStatsLoading ? (
                            <Skeleton className="w-5 h-3.5 inline-block align-middle rounded" />
                          ) : (
                            stats?.activeStories ?? 0
                          )}{' '}
                          live now
                        </>
                      )}
                    </div>
                    <PlusCircle size={38} className="kpi-watermark" />
                  </button>
                </div>

                {/* ROW 2: Platform Growth + Content Distribution + Moderation Overview */}
                <div className="admin-analytics-grid">
                  {/* Platform Growth Card */}
                  <section className="adc-card">
                    <div className="adc-card-header">
                      <div className="adc-card-title-group">
                        <div className="adc-title-icon">
                          <BarChart3 size={16} />
                        </div>
                        <div>
                          <h2 className="adc-card-title">Platform Growth</h2>
                          <p className="adc-card-subtitle">
                            User registrations and content activity over time.
                          </p>
                        </div>
                      </div>

                      <div className="chart-mode-pills" role="tablist" aria-label="Growth metric selector">
                        {['USERS', 'CONTENT', 'ENGAGEMENT'].map((modeKey) => (
                          <button
                            key={modeKey}
                            type="button"
                            className={`chart-mode-btn ${chartMode === modeKey ? 'active' : ''}`}
                            onClick={() => setChartMode(modeKey)}
                          >
                            {modeKey === 'USERS'
                              ? 'Users'
                              : modeKey === 'CONTENT'
                                ? 'Content'
                                : 'Engagement'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isStatsLoading ? (
                      <div className="flex flex-col gap-3 pt-2">
                        <Skeleton className="w-full h-[155px] rounded-xl" />
                        <div className="flex justify-between px-2">
                          {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className="w-7 h-2.5 rounded" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <PlatformGrowthChart series={stats?.growthSeries || []} mode={chartMode} />
                    )}
                  </section>

                  {/* Content Distribution Card */}
                  <section className="adc-card">
                    <div className="adc-card-header">
                      <div className="adc-card-title-group">
                        <div className="adc-title-icon pink">
                          <PieChart size={16} />
                        </div>
                        <div>
                          <h2 className="adc-card-title">Content Distribution</h2>
                        </div>
                      </div>
                    </div>

                    {isStatsLoading ? (
                      <div className="flex items-center gap-5 px-1 py-4">
                        <Skeleton className="w-[108px] h-[108px] rounded-full flex-shrink-0 !bg-transparent border-[16px] border-[var(--bg-hover)]" />
                        <div className="flex-1 flex flex-col gap-2.5">
                          {[
                            { label: 'Feed Posts', color: '#8b5cf6' },
                            { label: 'Stories', color: '#ec4899' },
                            { label: 'Reels', color: '#f59e0b' },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex justify-between items-center text-[13px]"
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span>{item.label}</span>
                              </span>
                              <Skeleton className="w-10 h-3.5 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ContentDistributionDonut
                        posts={stats?.totalPosts ?? 0}
                        stories={stats?.totalStories ?? stats?.activeStories ?? 0}
                        reels={stats?.totalReels ?? 0}
                      />
                    )}
                  </section>

                  {/* Moderation Overview Card */}
                  <section className="adc-card">
                    <div className="adc-card-header">
                      <div className="adc-card-title-group">
                        <div className="adc-title-icon amber">
                          <ShieldAlert size={16} />
                        </div>
                        <div>
                          <h2 className="adc-card-title">Moderation Overview</h2>
                        </div>
                      </div>
                      {isStatsLoading ? (
                        <Skeleton className="w-6 h-6 rounded-full" />
                      ) : (
                        <span className="mod-total-pill" title="Total Filed Reports">
                          {stats?.totalReports ?? 0}
                        </span>
                      )}
                    </div>

                    <div className="mod-overview-list">
                      <NavLink to="/admin/reports?status=OPEN" className="mod-status-row">
                        <span className="mod-status-left">
                          <Flag size={15} color="#f87171" />
                          <span>Reports (Open)</span>
                        </span>
                        {isStatsLoading ? (
                          <Skeleton className="w-7 h-6 rounded-full" />
                        ) : (
                          <span className="mod-count-pill red">{stats?.openReports ?? 0}</span>
                        )}
                      </NavLink>

                      <NavLink to="/admin/reports?status=REVIEWED" className="mod-status-row">
                        <span className="mod-status-left">
                          <Clock size={15} color="#fbbf24" />
                          <span>Under Review</span>
                        </span>
                        {isStatsLoading ? (
                          <Skeleton className="w-7 h-6 rounded-full" />
                        ) : (
                          <span className="mod-count-pill amber">{stats?.reviewedReports ?? 0}</span>
                        )}
                      </NavLink>

                      <NavLink to="/admin/reports?status=RESOLVED" className="mod-status-row">
                        <span className="mod-status-left">
                          <CheckCircle2 size={15} color="#34d399" />
                          <span>Actioned (This Week)</span>
                        </span>
                        {isStatsLoading ? (
                          <Skeleton className="w-7 h-6 rounded-full" />
                        ) : (
                          <span className="mod-count-pill green">
                            {stats?.actionedThisWeek ?? stats?.resolvedReports ?? 0}
                          </span>
                        )}
                      </NavLink>
                    </div>
                  </section>
                </div>

                {/* ROW 3 (Shown in Overview): Recent Activity + Engagement + Quick Actions */}
                {currentTab === 'OVERVIEW' && (
                  <div className="admin-bottom-grid">
                    {/* Recent User Activity */}
                    <section className="adc-card">
                      <div className="adc-card-header">
                        <div className="adc-card-title-group">
                          <div className="adc-title-icon">
                            <Activity size={16} />
                          </div>
                          <div>
                            <h2 className="adc-card-title">Recent User Activity</h2>
                            <p className="adc-card-subtitle">Live platform activity in real time.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="view-all-link-btn"
                          onClick={handleOpenAllActivity}
                        >
                          View All
                        </button>
                      </div>

                      {loadingActivity && activities.length === 0 ? (
                        <SkeletonUserRows count={4} compact />
                      ) : activities.length === 0 ? (
                        <div style={{ padding: '28px 12px', textAlign: 'center', fontSize: '13px', color: 'var(--adc-text-muted)' }}>
                          No recent platform activity recorded yet.
                        </div>
                      ) : (
                        <div className="activity-feed-list">
                          {activities.slice(0, 4).map((act) => (
                            <div key={act.id} className="activity-feed-item">
                              <div className="activity-item-left">
                                <Avatar
                                  src={act.actor?.avatarUrl}
                                  alt={act.actor?.username || 'user'}
                                  size="sm"
                                />
                                <div className="activity-item-copy">
                                  <span className="activity-item-text">
                                    <strong>{act.actor?.username || 'user'}</strong> {act.actionText}
                                  </span>
                                  <span className="activity-item-time">
                                    {act.createdAt ? timeAgo(act.createdAt) : 'Just now'}
                                  </span>
                                </div>
                              </div>
                              {renderActivityVisual(act)}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Engagement Metrics */}
                    <section className="adc-card">
                      <div className="adc-card-header">
                        <div className="adc-card-title-group">
                          <div className="adc-title-icon pink">
                            <Heart size={16} />
                          </div>
                          <div>
                            <h2 className="adc-card-title">Engagement Metrics</h2>
                            <p className="adc-card-subtitle">User interaction on your platform.</p>
                          </div>
                        </div>
                      </div>

                      <div className="engagement-metrics-list">
                        {[
                          {
                            label: 'Likes',
                            icon: <Heart size={16} color="#f43f5e" />,
                            value: stats?.totalLikes,
                            delta: likesDelta,
                          },
                          {
                            label: 'Comments',
                            icon: <MessageSquare size={16} color="#60a5fa" />,
                            value: stats?.totalEngagementComments ?? stats?.totalComments,
                            delta: commentsDelta,
                          },
                          {
                            label: 'Shares',
                            icon: <Share2 size={16} color="#c084fc" />,
                            value: stats?.totalShares,
                            delta: sharesDelta,
                          },
                          {
                            label: 'Saves',
                            icon: <Bookmark size={16} color="#f472b6" />,
                            value: stats?.totalSaves,
                            delta: savesDelta,
                          },
                        ].map((metric) => (
                          <div key={metric.label} className="engagement-metric-row">
                            <span className="engagement-metric-left">
                              {metric.icon}
                              <span>{metric.label}</span>
                            </span>
                            <div className="engagement-metric-right">
                              {isStatsLoading ? (
                                <>
                                  <Skeleton className="w-8 h-4 rounded" />
                                  <Skeleton className="w-12 h-4 rounded-full" />
                                </>
                              ) : (
                                <>
                                  <span className="engagement-metric-value">
                                    {(metric.value ?? 0).toLocaleString()}
                                  </span>
                                  <span
                                    className={`kpi-delta ${metric.delta.direction}`}
                                    style={{ fontSize: '11.5px' }}
                                  >
                                    {metric.delta.label}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Quick Actions */}
                    <section className="adc-card">
                      <div className="adc-card-header">
                        <div className="adc-card-title-group">
                          <div className="adc-title-icon amber">
                            <Zap size={16} />
                          </div>
                          <div>
                            <h2 className="adc-card-title">Quick Actions</h2>
                            <p className="adc-card-subtitle">Frequently used admin actions.</p>
                          </div>
                        </div>
                      </div>

                      <div className="quick-actions-grid">
                        <button
                          type="button"
                          className="quick-action-tile qa-blue"
                          onClick={() => switchTab('USERS')}
                        >
                          <Users size={19} />
                          <span>Manage Users</span>
                        </button>

                        <NavLink to="/admin/reports" className="quick-action-tile qa-crimson">
                          <Flag size={19} />
                          <span>Review Reports</span>
                        </NavLink>

                        <NavLink to="/admin/reports?status=OPEN" className="quick-action-tile qa-amber">
                          <Gavel size={19} />
                          <span>Take Action</span>
                        </NavLink>

                        <NavLink to="/admin/email" className="quick-action-tile qa-violet">
                          <Mail size={19} />
                          <span>Send Email</span>
                        </NavLink>

                        <NavLink to="/admin/email?tab=templates" className="quick-action-tile qa-emerald">
                          <FileText size={19} />
                          <span>Create Template</span>
                        </NavLink>

                        <NavLink to="/admin/configs" className="quick-action-tile qa-sky">
                          <Sliders size={19} />
                          <span>System Config</span>
                        </NavLink>
                      </div>
                    </section>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ============================================================
            TAB 2: USER MANAGEMENT
           ============================================================ */}
        {currentTab === 'USERS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="users-filter-bar">
              <div className="users-search-box">
                <Search size={16} color="var(--adc-text-muted)" />
                <input
                  type="text"
                  placeholder="Search by username, email, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-selects-group">
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>

                <select
                  className="filter-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="ROLE_USER">User (ROLE_USER)</option>
                  <option value="ROLE_ADMIN">Admin (ROLE_ADMIN)</option>
                </select>

                <button
                  type="button"
                  className="table-action-btn"
                  onClick={() => loadUsers(0)}
                  disabled={loadingUsers}
                >
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="users-table-container">
              {!loadingUsers && users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Users Found"
                  description="No users matched your search or filter parameters."
                />
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      [...Array(6)].map((_, idx) => (
                        <tr key={`user-sk-${idx}`}>
                          <td>
                            <div className="user-cell">
                              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                              <div className="flex flex-col gap-1.5">
                                <Skeleton className="w-24 h-3.5" />
                                <Skeleton className="w-16 h-2.5" />
                              </div>
                            </div>
                          </td>
                          <td><Skeleton className="w-40 h-3.5" /></td>
                          <td><Skeleton className="w-14 h-6 rounded-full" /></td>
                          <td><Skeleton className="w-16 h-6 rounded-full" /></td>
                          <td><Skeleton className="w-10 h-3" /></td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                              <Skeleton className="w-20 h-7 rounded-lg" />
                              <Skeleton className="w-16 h-7 rounded-lg" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : users.map((u) => {
                      const isAdmin =
                        u.role === 'ROLE_ADMIN' ||
                        u.role === 'ADMIN' ||
                        u.username?.toLowerCase() === 'admin';
                      const isActive = u.status === 'ACTIVE';

                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="user-cell">
                              <Avatar
                                src={u.avatarUrl || u.profilePictureUrl}
                                alt={u.username}
                                size="sm"
                              />
                              <div className="user-cell-meta">
                                <span className="user-cell-username" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  @{u.username}
                                  {(u.isVerified || u.verified) && (
                                    <BadgeCheck size={14} fill="#0095f6" color="#ffffff" title="Verified Account" />
                                  )}
                                </span>
                                <span className="user-cell-displayname">{u.displayName || u.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{u.email}</span>
                              {u.emailVerified ? (
                                <CheckCircle2 size={13} color="#34d399" title="Verified Email" />
                              ) : (
                                <AlertTriangle size={13} color="var(--adc-text-muted)" title="Unverified Email" />
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
                              {isAdmin ? 'ADMIN' : 'USER'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${u.status?.toLowerCase() || 'active'}`}>
                              {u.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--adc-text-muted)', fontSize: '12px' }}>
                            {u.createdAt ? timeAgo(u.createdAt) : 'Recently'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className={`table-action-btn ${isActive ? 'danger' : 'success'}`}
                                disabled={processingUserId === u.id || isAdmin}
                                onClick={() => handleToggleUserStatus(u)}
                                title={
                                  isAdmin
                                    ? 'Admin accounts cannot be deactivated'
                                    : isActive
                                      ? 'Suspend User'
                                      : 'Reactivate User'
                                }
                              >
                                {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                <span>{isAdmin ? 'Protected' : isActive ? 'Suspend' : 'Reactivate'}</span>
                              </button>

                              <button
                                type="button"
                                className={`table-action-btn ${(u.isVerified || u.verified) ? 'verified-active' : 'verify-btn'}`}
                                disabled={processingUserId === u.id}
                                onClick={() => handleToggleVerify(u)}
                                title={(u.isVerified || u.verified) ? 'Remove Blue Badge' : 'Grant Blue Verified Badge'}
                              >
                                <BadgeCheck size={14} />
                                <span>{(u.isVerified || u.verified) ? 'Verified' : 'Verify'}</span>
                              </button>

                              <button
                                type="button"
                                className="table-action-btn danger"
                                disabled={processingUserId === u.id || isAdmin}
                                onClick={() => handleDeleteUser(u)}
                                title={isAdmin ? 'Admin accounts cannot be deleted' : 'Delete User'}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {totalPages > 1 && (
                <div className="table-pagination">
                  <span>
                    Showing page {currentPage + 1} of {totalPages} ({totalElements} users)
                  </span>
                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="table-action-btn"
                      disabled={currentPage === 0 || loadingUsers}
                      onClick={() => loadUsers(currentPage - 1)}
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      className="table-action-btn"
                      disabled={currentPage >= totalPages - 1 || loadingUsers}
                      onClick={() => loadUsers(currentPage + 1)}
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: CONTENT EXPLORER (POSTS / REELS / STORIES)
           ============================================================ */}
        {currentTab === 'CONTENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="users-filter-bar">
              <div className="chart-mode-pills">
                {['POSTS', 'REELS', 'STORIES'].map((typeKey) => (
                  <button
                    key={typeKey}
                    type="button"
                    className={`chart-mode-btn ${contentType === typeKey ? 'active' : ''}`}
                    onClick={() => switchTab('CONTENT', typeKey)}
                  >
                    {typeKey === 'POSTS' ? 'Posts' : typeKey === 'REELS' ? 'Reels' : 'Stories'}
                  </button>
                ))}
              </div>

              <div className="users-search-box">
                <Search size={16} color="var(--adc-text-muted)" />
                <input
                  type="text"
                  placeholder={`Search ${contentType.toLowerCase()} by caption or @username...`}
                  value={contentQuery}
                  onChange={(e) => setContentQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="table-action-btn"
                onClick={() => loadContent(contentType, 0)}
                disabled={loadingContent}
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingContent ? (
              <SkeletonAdminContentGrid count={6} />
            ) : contentItems.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title={`No ${contentType.toLowerCase()} found`}
                description="No platform media matched your current filter."
              />
            ) : (
              <>
                <div className="content-explorer-grid">
                  {contentItems.map((item) => (
                    <div key={item.id} className="content-explorer-card">
                      <div className="content-explorer-media">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.caption || item.contentType} loading="lazy" />
                        ) : (
                          <Film size={32} color="var(--adc-text-muted)" />
                        )}
                        <span className="content-type-chip">{item.contentType}</span>
                      </div>

                      <div className="content-explorer-body">
                        <div className="user-cell">
                          <Avatar
                            src={item.author?.avatarUrl}
                            alt={item.author?.username || 'user'}
                            size="xs"
                          />
                          <div className="user-cell-meta">
                            <span className="user-cell-username">@{item.author?.username}</span>
                            <span className="user-cell-displayname">
                              {item.createdAt ? timeAgo(item.createdAt) : ''}
                            </span>
                          </div>
                        </div>

                        <p className="content-explorer-caption">
                          {item.caption || 'No caption provided.'}
                        </p>

                        <div className="content-explorer-footer">
                          <span>
                            {item.likesCount ?? 0} likes · {item.commentsCount ?? 0} comments
                          </span>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            disabled={deletingContentId === item.id}
                            onClick={() => handleDeleteContentItem(item)}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {contentTotalPages > 1 && (
                  <div className="users-table-container">
                    <div className="table-pagination">
                      <span>
                        Showing page {contentPage + 1} of {contentTotalPages}
                      </span>
                      <div className="pagination-buttons">
                        <button
                          type="button"
                          className="table-action-btn"
                          disabled={contentPage === 0}
                          onClick={() => loadContent(contentType, contentPage - 1)}
                        >
                          <ChevronLeft size={14} />
                          <span>Previous</span>
                        </button>
                        <button
                          type="button"
                          className="table-action-btn"
                          disabled={contentPage >= contentTotalPages - 1}
                          onClick={() => loadContent(contentType, contentPage + 1)}
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Live Activity Full Modal */}
      {activityModalOpen && (
        <Modal
          isOpen={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          title="Recent Platform Activity"
          size="md"
        >
          {loadingActivity && allActivities.length === 0 ? (
            <SkeletonUserRows count={5} compact />
          ) : allActivities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              No recent activity available.
            </p>
          ) : (
            <div className="activity-feed-list">
              {allActivities.map((act) => (
                <div key={act.id} className="activity-feed-item">
                  <div className="activity-item-left">
                    <Avatar src={act.actor?.avatarUrl} alt={act.actor?.username || 'user'} size="sm" />
                    <div className="activity-item-copy">
                      <span className="activity-item-text">
                        <strong>{act.actor?.username || 'user'}</strong> {act.actionText}
                      </span>
                      <span className="activity-item-time">
                        {act.createdAt ? timeAgo(act.createdAt) : 'Just now'}
                      </span>
                    </div>
                  </div>
                  {renderActivityVisual(act)}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmDialog)}
        onClose={() => !confirmProcessing && setConfirmDialog(null)}
        onConfirm={executeConfirmDialog}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmLabel={confirmDialog?.confirmLabel}
        loadingLabel={confirmDialog?.loadingLabel}
        variant={confirmDialog?.variant}
        icon={confirmDialog?.icon}
        metaLabel={confirmDialog?.metaLabel}
        thumbnailUrl={confirmDialog?.thumbnailUrl}
        isProcessing={confirmProcessing}
      />
    </div>
  );
};

export default AdminDashboardPage;
