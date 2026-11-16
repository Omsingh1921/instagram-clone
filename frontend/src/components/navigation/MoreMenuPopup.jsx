import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Activity,
  Bookmark,
  Moon,
  Sun,
  AlertCircle,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import './MoreMenuPopup.css';

export const MoreMenuPopup = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onOpenReportProblem,
  onLogout,
  isAdmin = false,
  triggerRef = null,
  onMouseEnter,
  onMouseLeave,
}) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Click outside and keyboard handling (Escape + Arrow navigation)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      if (triggerRef?.current && triggerRef.current.contains(event.target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        const wasInsideMenu =
          menuRef.current && menuRef.current.contains(document.activeElement);
        onClose();
        if (wasInsideMenu && triggerRef?.current) {
          triggerRef.current.focus();
        }
        return;
      }

      if (
        (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
        menuRef.current &&
        (menuRef.current.contains(document.activeElement) ||
          document.activeElement === triggerRef?.current)
      ) {
        const items = Array.from(
          menuRef.current.querySelectorAll('.more-menu-item')
        );
        if (items.length === 0) return;

        event.preventDefault();
        const currentIndex = items.indexOf(document.activeElement);
        const nextIndex =
          event.key === 'ArrowDown'
            ? (currentIndex + 1 + items.length) % items.length
            : (currentIndex - 1 + items.length) % items.length;
        items[nextIndex]?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const renderMenuItemContent = (icon, badgeClass, label, trailing = null) => (
    <>
      <span className={`more-menu-icon-badge ${badgeClass}`}>{icon}</span>
      <span className="more-menu-label">{label}</span>
      {trailing ?? <ChevronRight size={15} className="more-menu-chevron" aria-hidden="true" />}
    </>
  );

  return (
    <div
      className="more-popup-positioner"
      ref={menuRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="more-popup-menu-container" role="menu" aria-label="More options">
        <div className="more-popup-main-view">
          {/* Group 1: Main Settings & Preferences */}
          <div className="more-menu-group">
            <button
              type="button"
              className="more-menu-item"
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
            >
              {renderMenuItemContent(<Settings size={16} />, 'badge-settings', 'Settings')}
            </button>

            {!isAdmin && (
              <>
                <button
                  type="button"
                  className="more-menu-item"
                  onClick={() => {
                    onClose();
                    navigate('/your-activity');
                  }}
                >
                  {renderMenuItemContent(<Activity size={16} />, 'badge-activity', 'Your Activity')}
                </button>

                <button
                  type="button"
                  className="more-menu-item"
                  onClick={() => {
                    onClose();
                    navigate('/profile/me?tab=saved');
                  }}
                >
                  {renderMenuItemContent(<Bookmark size={16} />, 'badge-saved', 'Saved')}
                </button>
              </>
            )}

            <button
              type="button"
              className="more-menu-item"
              aria-pressed={theme === 'dark'}
              onClick={() => onToggleTheme?.()}
            >
              {renderMenuItemContent(
                theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />,
                'badge-appearance',
                'Switch appearance',
                <span
                  className={`more-menu-theme-switch ${theme === 'dark' ? 'is-dark' : ''}`}
                  aria-hidden="true"
                >
                  <span className="more-menu-theme-thumb" />
                </span>
              )}
            </button>

            {!isAdmin && (
              <button
                type="button"
                className="more-menu-item"
                onClick={() => {
                  onClose();
                  onOpenReportProblem();
                }}
              >
                {renderMenuItemContent(<AlertCircle size={16} />, 'badge-report', 'Report a problem')}
              </button>
            )}
          </div>

          <div className="more-menu-divider-thin" />

          {/* Group 2: Logout */}
          <div className="more-menu-group">
            <button
              type="button"
              className="more-menu-item logout-item"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              {renderMenuItemContent(<LogOut size={16} />, 'badge-logout', 'Log out')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoreMenuPopup;
