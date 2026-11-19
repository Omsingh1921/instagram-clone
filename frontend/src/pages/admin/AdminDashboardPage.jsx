import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { AuthContext } from '../../context/AuthContext';
import adminService from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import {
  AdminHeader,
  AdminOverviewTab,
  AdminUsersTab,
  AdminContentTab,
  AdminActivityModal,
} from '../../components/admin/dashboard';
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

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-inner">
        <AdminHeader
          timeGreeting={getTimeGreeting()}
          adminFirstName={adminFirstName}
          searchContainerRef={searchContainerRef}
          globalSearchRef={globalSearchRef}
          globalQuery={globalQuery}
          setGlobalQuery={setGlobalQuery}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchLoading={searchLoading}
          searchResults={searchResults}
          themeMode={themeMode}
          handleToggleDashboardTheme={handleToggleDashboardTheme}
          stats={stats}
          currentTab={currentTab}
          switchTab={switchTab}
          contentType={contentType}
          periodDays={periodDays}
          setPeriodDays={setPeriodDays}
          loadStats={loadStats}
          loadActivity={loadActivity}
          loadingStats={loadingStats}
          isStatsLoading={isStatsLoading}
          setSearchQuery={setSearchQuery}
          setContentQuery={setContentQuery}
          navigate={navigate}
        />

        {/* TAB 1: OVERVIEW / ANALYTICS BENTO DASHBOARD */}
        {currentTab === 'OVERVIEW' && (
          <AdminOverviewTab
            stats={stats}
            loadingStats={loadingStats}
            isStatsLoading={isStatsLoading}
            periodDays={periodDays}
            loadStats={loadStats}
            usersDelta={usersDelta}
            postsDelta={postsDelta}
            reelsDelta={reelsDelta}
            storiesDelta={storiesDelta}
            likesDelta={likesDelta}
            commentsDelta={commentsDelta}
            sharesDelta={sharesDelta}
            savesDelta={savesDelta}
            chartMode={chartMode}
            setChartMode={setChartMode}
            activities={activities}
            loadingActivity={loadingActivity}
            handleOpenAllActivity={handleOpenAllActivity}
            switchTab={switchTab}
          />
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {currentTab === 'USERS' && (
          <AdminUsersTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            loadUsers={loadUsers}
            loadingUsers={loadingUsers}
            users={users}
            processingUserId={processingUserId}
            handleToggleUserStatus={handleToggleUserStatus}
            handleToggleVerify={handleToggleVerify}
            handleDeleteUser={handleDeleteUser}
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
          />
        )}

        {/* TAB 3: CONTENT EXPLORER (POSTS / REELS / STORIES) */}
        {currentTab === 'CONTENT' && (
          <AdminContentTab
            contentType={contentType}
            switchTab={switchTab}
            contentQuery={contentQuery}
            setContentQuery={setContentQuery}
            loadContent={loadContent}
            loadingContent={loadingContent}
            contentItems={contentItems}
            deletingContentId={deletingContentId}
            handleDeleteContentItem={handleDeleteContentItem}
            contentPage={contentPage}
            contentTotalPages={contentTotalPages}
          />
        )}
      </div>

      {/* Live Activity Full Modal */}
      {activityModalOpen && (
        <AdminActivityModal
          isOpen={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          loadingActivity={loadingActivity}
          allActivities={allActivities}
        />
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
