import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Layers,
  Image as ImageIcon,
  Film,
  PlusCircle,
  Shield,
  Mail,
  Settings,
  Sliders,
  ChevronDown,
  Activity,
  LogOut,
  Moon,
  Sun,
  ArrowLeftRight,
  X,
  Sparkles,
} from 'lucide-react';
import { InstagramGlyph } from '../common/InstagramLogo';
import Avatar from '../common/Avatar';
import adminService from '../../services/admin.service';
import './AdminConsoleSidebar.css';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const AdminConsoleSidebar = ({
  user,
  theme,
  onToggleTheme,
  onLogout,
  onOpenSwitchAccounts,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [contentExpanded, setContentExpanded] = useState(true);
  const [commsExpanded, setCommsExpanded] = useState(false);
  const [systemExpanded, setSystemExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openReportsCount, setOpenReportsCount] = useState(0);

  const searchParams = new URLSearchParams(location.search);
  const activeTab = (searchParams.get('tab') || 'overview').toLowerCase();
  const activeContentType = (searchParams.get('type') || 'POSTS').toUpperCase();
  const isAdminHome = location.pathname === '/admin';

  useEffect(() => {
    let mounted = true;
    const fetchOpenCount = async () => {
      try {
        const res = await adminService.getStats(7);
        const data = res?.data || res;
        if (mounted && typeof data?.openReports === 'number') {
          setOpenReportsCount(data.openReports);
        }
      } catch {
        // Keep existing badge count
      }
    };

    fetchOpenCount();

    const handleStatsUpdate = (event) => {
      const nextCount = event?.detail?.openReports;
      if (typeof nextCount === 'number') {
        setOpenReportsCount(nextCount);
      } else {
        fetchOpenCount();
      }
    };

    window.addEventListener('admin:stats-updated', handleStatsUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('admin:stats-updated', handleStatsUpdate);
    };
  }, [location.pathname]);

  // Expand parent accordions automatically when visiting their sub-routes
  useEffect(() => {
    if (location.pathname.startsWith('/admin/email')) {
      setCommsExpanded(true);
    }
    if (location.pathname.startsWith('/admin/configs') || location.pathname === '/health') {
      setSystemExpanded(true);
    }
    if (isAdminHome && activeTab === 'content') {
      setContentExpanded(true);
    }
  }, [location.pathname, isAdminHome, activeTab]);

  const handleNav = (to) => {
    navigate(to);
    if (onCloseMobile) onCloseMobile();
  };

  const displayName = user?.displayName || user?.fullName || user?.username || 'Administrator';
  const avatarSrc = user?.avatarUrl || user?.profilePictureUrl;

  return (
    <>
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-console-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Admin Console Navigation"
      >
        <div className="admin-sidebar-brand">
          <NavLink
            to="/admin"
            className="admin-brand-link"
            onClick={() => onCloseMobile && onCloseMobile()}
          >
            <div className="admin-brand-glyph-wrap">
              <InstagramGlyph size={20} color="#ffffff" />
            </div>
            <div className="admin-brand-copy">
              <span className="admin-brand-title">Instagram</span>
              <span className="admin-brand-subtitle">Admin Console</span>
            </div>
          </NavLink>

          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close admin sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {/* Dashboard */}
          <button
            type="button"
            className={`admin-nav-btn ${isAdminHome && activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleNav('/admin')}
          >
            <span className="admin-nav-btn-left">
              <LayoutGrid size={17} />
              <span>Dashboard</span>
            </span>
          </button>

          {/* Users */}
          <button
            type="button"
            className={`admin-nav-btn ${isAdminHome && activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleNav('/admin?tab=users')}
          >
            <span className="admin-nav-btn-left">
              <Users size={17} />
              <span>Users</span>
            </span>
          </button>

          {/* Content Accordion */}
          <button
            type="button"
            className={`admin-nav-btn ${isAdminHome && activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setContentExpanded((prev) => !prev)}
            aria-expanded={contentExpanded}
          >
            <span className="admin-nav-btn-left">
              <Layers size={17} />
              <span>Content</span>
            </span>
            <ChevronDown
              size={15}
              className={`admin-nav-chevron ${contentExpanded ? 'open' : ''}`}
            />
          </button>

          {contentExpanded && (
            <div className="admin-subnav-list">
              <button
                type="button"
                className={`admin-subnav-item ${isAdminHome && activeTab === 'content' && activeContentType === 'POSTS' ? 'active' : ''}`}
                onClick={() => handleNav('/admin?tab=content&type=POSTS')}
              >
                <ImageIcon size={14} />
                <span>Posts</span>
              </button>
              <button
                type="button"
                className={`admin-subnav-item ${isAdminHome && activeTab === 'content' && activeContentType === 'REELS' ? 'active' : ''}`}
                onClick={() => handleNav('/admin?tab=content&type=REELS')}
              >
                <Film size={14} />
                <span>Reels</span>
              </button>
              <button
                type="button"
                className={`admin-subnav-item ${isAdminHome && activeTab === 'content' && activeContentType === 'STORIES' ? 'active' : ''}`}
                onClick={() => handleNav('/admin?tab=content&type=STORIES')}
              >
                <PlusCircle size={14} />
                <span>Stories</span>
              </button>
            </div>
          )}

          {/* Moderation */}
          <NavLink
            to="/admin/reports"
            className={() =>
              `admin-nav-btn ${location.pathname.startsWith('/admin/reports') || location.pathname.startsWith('/admin/moderation') ? 'active' : ''}`
            }
            onClick={() => onCloseMobile && onCloseMobile()}
          >
            <span className="admin-nav-btn-left">
              <Shield size={17} />
              <span>Moderation</span>
            </span>
            {openReportsCount > 0 && (
              <span className="admin-nav-badge" title={`${openReportsCount} open reports`}>
                {openReportsCount > 99 ? '99+' : openReportsCount}
              </span>
            )}
          </NavLink>

          {/* Communications Accordion */}
          <button
            type="button"
            className={`admin-nav-btn ${location.pathname.startsWith('/admin/email') ? 'active' : ''}`}
            onClick={() => setCommsExpanded((prev) => !prev)}
            aria-expanded={commsExpanded}
          >
            <span className="admin-nav-btn-left">
              <Mail size={17} />
              <span>Communications</span>
            </span>
            <ChevronDown
              size={15}
              className={`admin-nav-chevron ${commsExpanded ? 'open' : ''}`}
            />
          </button>

          {commsExpanded && (
            <div className="admin-subnav-list">
              <button
                type="button"
                className={`admin-subnav-item ${location.pathname === '/admin/email' && !location.search.includes('tab=templates') ? 'active' : ''}`}
                onClick={() => handleNav('/admin/email')}
              >
                <Mail size={14} />
                <span>Email Senders</span>
              </button>
              <button
                type="button"
                className={`admin-subnav-item ${location.pathname === '/admin/email' && location.search.includes('tab=templates') ? 'active' : ''}`}
                onClick={() => handleNav('/admin/email?tab=templates')}
              >
                <Layers size={14} />
                <span>Email Templates</span>
              </button>
            </div>
          )}

          {/* System Accordion */}
          <button
            type="button"
            className={`admin-nav-btn ${location.pathname.startsWith('/admin/configs') || location.pathname === '/health' ? 'active' : ''}`}
            onClick={() => setSystemExpanded((prev) => !prev)}
            aria-expanded={systemExpanded}
          >
            <span className="admin-nav-btn-left">
              <Sliders size={17} />
              <span>System</span>
            </span>
            <ChevronDown
              size={15}
              className={`admin-nav-chevron ${systemExpanded ? 'open' : ''}`}
            />
          </button>

          {systemExpanded && (
            <div className="admin-subnav-list">
              <button
                type="button"
                className={`admin-subnav-item ${location.pathname === '/admin/configs' && !location.search.includes('tab=FEED_ALGORITHM') ? 'active' : ''}`}
                onClick={() => handleNav('/admin/configs')}
              >
                <Sliders size={14} />
                <span>System Configs</span>
              </button>
              <button
                type="button"
                className={`admin-subnav-item ${location.pathname === '/admin/configs' && location.search.includes('tab=FEED_ALGORITHM') ? 'active' : ''}`}
                onClick={() => handleNav('/admin/configs?tab=FEED_ALGORITHM')}
              >
                <Sparkles size={14} />
                <span>Feed Algorithm</span>
              </button>
              <button
                type="button"
                className={`admin-subnav-item ${location.pathname === '/health' ? 'active' : ''}`}
                onClick={() => handleNav('/health')}
              >
                <Activity size={14} />
                <span>Platform Health</span>
              </button>
            </div>
          )}

          {/* Settings */}
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `admin-nav-btn ${isActive || location.pathname === '/settings' ? 'active' : ''}`
            }
            onClick={() => onCloseMobile && onCloseMobile()}
          >
            <span className="admin-nav-btn-left">
              <Settings size={17} />
              <span>Settings</span>
            </span>
          </NavLink>
        </nav>

        {/* Bottom Admin Profile Card */}
        <div className="admin-sidebar-footer">
          {profileMenuOpen && (
            <div className="admin-profile-popover" role="menu">
              <button
                type="button"
                className="admin-popover-item"
                onClick={() => {
                  if (onToggleTheme) onToggleTheme();
                  setProfileMenuOpen(false);
                }}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
              {onOpenSwitchAccounts && (
                <button
                  type="button"
                  className="admin-popover-item"
                  onClick={() => {
                    onOpenSwitchAccounts();
                    setProfileMenuOpen(false);
                  }}
                >
                  <ArrowLeftRight size={14} />
                  <span>Switch Accounts</span>
                </button>
              )}
              <button
                type="button"
                className="admin-popover-item danger"
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="admin-profile-pill"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-expanded={profileMenuOpen}
          >
            <span className="admin-profile-left">
              <span className="admin-initials-avatar">
                {avatarSrc ? (
                  <Avatar src={avatarSrc} alt={displayName} size="xs" />
                ) : (
                  getInitials(displayName)
                )}
              </span>
              <span className="admin-profile-meta">
                <span className="admin-profile-name">{displayName}</span>
                <span className="admin-profile-role">Super Admin</span>
              </span>
            </span>
            <ChevronDown
              size={15}
              className={`admin-nav-chevron ${profileMenuOpen ? 'open' : ''}`}
            />
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminConsoleSidebar;

