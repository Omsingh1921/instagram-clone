import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  PlusSquare,
  Film,
  BarChart3,
  Settings,
} from 'lucide-react';
import Avatar from '../common/Avatar';

export const MobileBottomNav = ({ isAdmin, user, onOpenCreate }) => {
  return (
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
            onClick={onOpenCreate}
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
  );
};

export default MobileBottomNav;
