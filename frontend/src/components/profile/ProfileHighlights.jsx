import React from 'react';
import { Plus, Camera, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export const ProfileHighlights = ({
  profile = {},
  isOwnProfile = false,
  isFollowing = false,
  isViewerAdmin = false,
  highlights = [],
  highlightMenuId = null,
  setHighlightMenuId,
  setCreateHighlightOpen,
  handleOpenHighlight,
  setEditingHighlightId,
  handleDeleteHighlightFromProfile,
}) => {
  if (!(!profile?.isPrivate || isOwnProfile || isFollowing || isViewerAdmin)) {
    return null;
  }

  const isProfileAdmin =
    profile?.role === 'ROLE_ADMIN' ||
    profile?.role === 'ADMIN' ||
    profile?.username?.toLowerCase() === 'admin';

  return (
    <div className="profile-highlights-tray">
      {isOwnProfile && !isProfileAdmin && (
        <div
          className="highlight-tray-item highlight-add-item"
          onClick={() => setCreateHighlightOpen?.(true)}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-new-bubble">
            <Plus size={28} strokeWidth={1.6} />
          </div>
          <span className="highlight-item-label">New</span>
        </div>
      )}

      {highlights.map((hl) => (
        <div
          key={hl.id}
          className="highlight-tray-item"
          onClick={() => handleOpenHighlight?.(hl)}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-avatar-bubble">
            {hl.coverImageUrl ? (
              <img
                src={hl.coverImageUrl}
                alt={hl.title}
                className="highlight-cover-thumbnail"
              />
            ) : (
              <div className="highlight-cover-placeholder">
                <Camera size={22} color="var(--text-secondary)" />
              </div>
            )}
            {isOwnProfile && (
              <button
                type="button"
                className="highlight-tray-menu-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setHighlightMenuId?.(highlightMenuId === hl.id ? null : hl.id);
                }}
                title="Highlight options"
                aria-label="Highlight options"
              >
                <MoreVertical size={13} />
              </button>
            )}
          </div>
          <span className="highlight-item-label" title={hl.title}>
            {hl.title || 'Highlight'}
          </span>

          {isOwnProfile && highlightMenuId === hl.id && (
            <div
              className="highlight-tray-menu-popover"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="highlight-popover-item"
                onClick={() => {
                  setHighlightMenuId?.(null);
                  setEditingHighlightId?.(hl.id);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Highlight</span>
              </button>
              <button
                type="button"
                className="highlight-popover-item danger"
                onClick={() => {
                  setHighlightMenuId?.(null);
                  handleDeleteHighlightFromProfile?.(hl.id);
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfileHighlights;
