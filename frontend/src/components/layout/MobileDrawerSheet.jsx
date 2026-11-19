import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Moon,
  Sun,
  BarChart3,
  Settings,
  User as UserIcon,
  Compass,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import Avatar from '../common/Avatar';

export const MobileDrawerSheet = ({
  isOpen,
  onClose,
  user,
  isAdmin,
  theme,
  onToggleTheme,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="mobile-drawer-backdrop"
      onClick={onClose}
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
            onClick={onClose}
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
            onClick={onToggleTheme}
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
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawerSheet;
