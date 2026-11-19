import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  ShieldCheck,
  Search,
  Sun,
  Moon,
  Bell,
  HelpCircle,
  BarChart3,
  Users,
  Image as ImageIcon,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { InstagramGlyph } from '../../common/InstagramLogo';
import { SkeletonUserRows } from '../../ui/Skeleton';

export const AdminHeader = ({
  timeGreeting,
  adminFirstName,
  searchContainerRef,
  globalSearchRef,
  globalQuery,
  setGlobalQuery,
  searchOpen,
  setSearchOpen,
  searchLoading,
  searchResults,
  themeMode,
  handleToggleDashboardTheme,
  stats,
  currentTab,
  switchTab,
  contentType,
  periodDays,
  setPeriodDays,
  loadStats,
  loadActivity,
  loadingStats,
  isStatsLoading,
  setSearchQuery,
  setContentQuery,
  navigate,
}) => {
  return (
    <>
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
                  {timeGreeting}, {adminFirstName} 👋
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
    </>
  );
};

export default AdminHeader;
