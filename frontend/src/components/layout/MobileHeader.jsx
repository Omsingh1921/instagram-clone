import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Heart, MessageCircle, Menu } from 'lucide-react';
import { InstagramLogo } from '../common/InstagramLogo';

export const MobileHeader = ({
  isAdmin,
  isAdminRoute,
  unreadNotifications,
  unreadChatCount,
  isMessagesRoute,
  onOpenMobileMenu,
  onOpenAdminDrawer,
}) => {
  return (
    <header className="mobile-header">
      <NavLink
        to={isAdmin ? "/admin" : "/"}
        className="mobile-brand-link brand-link"
        aria-label="Instagram Home"
      >
        <InstagramLogo
          width={103}
          height={28}
          color="var(--text-primary)"
          className="mobile-header-wordmark"
        />
      </NavLink>

      <div className="mobile-header-actions">
        <NavLink
          to="/search"
          className="mobile-icon-btn mobile-header-search-btn"
          aria-label="Search"
          title="Search"
        >
          <Search size={22} />
        </NavLink>

        <NavLink
          to="/notifications"
          className="mobile-icon-btn mobile-header-notifications-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Heart size={22} />
          {unreadNotifications > 0 && <span className="nav-badge-dot" />}
        </NavLink>

        {!isMessagesRoute && (
          <NavLink
            to="/messages"
            className="mobile-icon-btn mobile-header-messages-btn"
            aria-label="Messages"
            title="Direct Messages"
          >
            <div
              className="nav-icon-wrapper"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle size={22} />
              {unreadChatCount > 0 && (
                <span className="nav-badge-count">
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              )}
            </div>
          </NavLink>
        )}

        <button
          type="button"
          className="mobile-icon-btn mobile-menu-trigger"
          onClick={() => {
            if (isAdmin && isAdminRoute) {
              onOpenAdminDrawer();
            } else {
              onOpenMobileMenu();
            }
          }}
          aria-label="Open mobile menu"
          title="Menu"
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
