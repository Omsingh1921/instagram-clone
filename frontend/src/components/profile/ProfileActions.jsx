import React from 'react';
import {
  Settings,
  UserCheck,
  UserPlus,
  Send,
  Clock,
  Star,
  Trash2,
  MoreHorizontal,
  BellOff,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';

export const ProfileActions = ({
  profile = {},
  isOwnProfile = false,
  isViewerAdmin = false,
  isEditing = false,
  setIsEditing,
  setActiveTab,
  setCreateHighlightOpen,
  setCloseFriendsModalOpen,
  setGearMenuOpen,
  isBlockedByMe = false,
  setUnblockModalOpen,
  isFollowing = false,
  isRequested = false,
  handleFollowToggle,
  handleMessageUser,
  handleDeleteUserProfile,
  moreMenuOpen = false,
  setMoreMenuOpen,
  isMuted = false,
  handleToggleMute,
  setReportModalOpen,
  handleBlockUser,
}) => {
  return (
    <div className="profile-username-row">
      <div className="profile-username-badge-wrap">
        <h1 className="profile-username-title">{profile.username}</h1>
        {(profile.isVerified || profile.verified) && (
          <span
            title="Verified Account"
            className="profile-verified-badge"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <BadgeCheck size={20} color="#ffffff" fill="#0095f6" />
          </span>
        )}
      </div>

      <div className="profile-action-buttons">
        {isOwnProfile ? (
          <>
            <button
              type="button"
              className="btn btn-secondary profile-btn"
              onClick={() => setIsEditing?.(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit profile'}
            </button>
            <button
              type="button"
              className="btn btn-secondary profile-btn"
              onClick={() => setActiveTab?.('archived')}
              title="View archive"
            >
              View archive
            </button>
            {!(
              profile?.role === 'ROLE_ADMIN' ||
              profile?.role === 'ADMIN' ||
              profile?.username?.toLowerCase() === 'admin'
            ) && (
              <button
                type="button"
                className="btn btn-secondary profile-btn"
                onClick={() => setCreateHighlightOpen?.(true)}
                title="Create story highlight"
              >
                <Sparkles size={14} />
                <span>Highlights</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary profile-btn profile-icon-btn"
              onClick={() => setCloseFriendsModalOpen?.(true)}
              title="Close Friends"
              aria-label="Close Friends"
            >
              <Star size={16} style={{ color: '#2ecc71', fill: '#2ecc71' }} />
            </button>
            <button
              type="button"
              className="btn btn-secondary profile-btn profile-icon-btn profile-gear-btn"
              onClick={() => setGearMenuOpen?.(true)}
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
          </>
        ) : (
          <>
            {isBlockedByMe ? (
              <button
                type="button"
                className="btn btn-secondary profile-btn"
                onClick={() => setUnblockModalOpen?.(true)}
              >
                Unblock
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`btn profile-btn ${
                    isFollowing || isRequested ? 'btn-secondary' : 'btn-primary'
                  }`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={16} /> Following
                    </span>
                  ) : isRequested ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} /> Requested
                    </span>
                  ) : profile?.followsCurrentUser ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserPlus size={16} /> Follow Back
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserPlus size={16} /> Follow
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary profile-btn"
                  onClick={handleMessageUser}
                >
                  <Send size={16} style={{ marginRight: '6px' }} />
                  Message
                </button>
              </>
            )}

            {isViewerAdmin && (
              <button
                type="button"
                className="btn btn-secondary profile-btn danger"
                onClick={handleDeleteUserProfile}
                style={{
                  borderColor: 'var(--ig-error, #ed4956)',
                  color: 'var(--ig-error, #ed4956)',
                }}
                title="Delete User Account"
              >
                <Trash2 size={16} style={{ marginRight: '6px' }} />
                Delete Account
              </button>
            )}

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-secondary profile-btn"
                onClick={() => setMoreMenuOpen?.(!moreMenuOpen)}
              >
                <MoreHorizontal size={18} />
              </button>
              {moreMenuOpen && (
                <div className="post-options-menu" style={{ right: 0, top: '40px' }}>
                  {!isBlockedByMe && (
                    <button
                      type="button"
                      className="post-menu-item"
                      onClick={handleToggleMute}
                    >
                      <BellOff size={14} />
                      <span>{isMuted ? 'Unmute user' : 'Mute user'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="post-menu-item danger"
                    onClick={() => {
                      setMoreMenuOpen?.(false);
                      setReportModalOpen?.(true);
                    }}
                  >
                    Report user
                  </button>
                  {isBlockedByMe ? (
                    <button
                      type="button"
                      className="post-menu-item"
                      onClick={() => {
                        setMoreMenuOpen?.(false);
                        setUnblockModalOpen?.(true);
                      }}
                    >
                      Unblock user
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="post-menu-item danger"
                      onClick={handleBlockUser}
                    >
                      Block user
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileActions;
