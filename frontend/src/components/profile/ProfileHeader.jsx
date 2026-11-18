import React from 'react';
import {
  Camera,
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
  Link2,
  Mail,
  Phone,
  BadgeCheck,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatCount } from '../../utils';

export const ProfileHeader = ({
  profile = {},
  isOwnProfile = false,
  isViewerAdmin = false,
  activeNote,
  hasActiveStory = false,
  uploadingStory = null,
  userStories = [],
  avatarInputRef,
  handleAvatarClick,
  handleAvatarFile,
  setNoteModalOpen,
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
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  setFollowModalType,
  setFollowModalOpen,
}) => {
  return (
    <header className="profile-header-section">
      <div className="profile-avatar-column">
        <div className="profile-avatar-note-container">
          {activeNote && (
            <div
              className={`profile-avatar-note-bubble ${isOwnProfile ? 'clickable' : ''}`}
              onClick={() => isOwnProfile && setNoteModalOpen?.(true)}
              role="button"
              tabIndex={0}
              title={activeNote.text}
            >
              <div className="note-bubble-content">
                <span className="note-bubble-text">{activeNote.text}</span>
                {isOwnProfile && <span className="note-bubble-toggle-arrow">↕</span>}
              </div>
              <div className="note-bubble-pointer" />
            </div>
          )}

          <div
            className={`profile-avatar-trigger ${hasActiveStory ? 'has-live-story' : ''}`}
            onClick={handleAvatarClick}
            title={
              uploadingStory
                ? `Story is uploading (${uploadingStory.progress}%)...`
                : hasActiveStory
                ? 'View story'
                : isOwnProfile
                ? 'Change photo'
                : ''
            }
          >
            <Avatar
              src={profile.profilePictureUrl || profile.avatarUrl}
              alt={profile.username}
              size="xxl"
              hasStory={hasActiveStory}
              storyViewed={Boolean(
                !uploadingStory &&
                  Array.isArray(userStories) &&
                  userStories.length > 0 &&
                  userStories.every((s) => s.viewed)
              )}
              isUploading={Boolean(uploadingStory)}
            />
            {isOwnProfile && (
              <div
                className="profile-avatar-overlay"
                onClick={(e) => {
                  e.stopPropagation();
                  avatarInputRef?.current?.click();
                }}
                title="Change photo"
              >
                <Camera size={28} />
              </div>
            )}
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarFile}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {isOwnProfile && !activeNote && (
            <button
              type="button"
              className="profile-add-note-pill"
              onClick={() => setNoteModalOpen?.(true)}
            >
              + Share a note
            </button>
          )}
        </div>
      </div>

      <div className="profile-info-column">
        {/* Username & Action Buttons */}
        <div className="profile-username-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="profile-username-title">{profile.username}</h1>
            {(profile.isVerified || profile.verified) && (
              <span
                title="Verified Account"
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
                )}
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

        {/* Stats Row */}
        <div className="profile-stats-row">
          <div className="stat-item">
            <span className="stat-num">{formatCount(postsCount)}</span>
            <span>posts</span>
          </div>
          <div
            className="stat-item clickable"
            onClick={() => {
              setFollowModalType?.('followers');
              setFollowModalOpen?.(true);
            }}
          >
            <span className="stat-num">{formatCount(followersCount)}</span>
            <span>followers</span>
          </div>
          <div
            className="stat-item clickable"
            onClick={() => {
              setFollowModalType?.('following');
              setFollowModalOpen?.(true);
            }}
          >
            <span className="stat-num">{formatCount(followingCount)}</span>
            <span>following</span>
          </div>
        </div>

        {/* Bio Info */}
        <div className="profile-bio-section">
          {(profile.displayName || profile.fullName || profile.pronouns) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span className="profile-full-name">
                {profile.displayName || profile.fullName}
              </span>
              {profile.pronouns && (
                <span
                  className="profile-pronouns"
                  style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  · {profile.pronouns}
                </span>
              )}
            </div>
          )}
          {profile.showCategoryBadge !== false && profile.category && (
            <span className="profile-category-pill">{profile.category}</span>
          )}
          {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}
          {profile.websiteUrl && (
            <a
              href={
                profile.websiteUrl.startsWith('http')
                  ? profile.websiteUrl
                  : `https://${profile.websiteUrl}`
              }
              target="_blank"
              rel="noreferrer noopener"
              className="profile-website-link"
            >
              <Link2 size={14} />
              <span>{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {profile.showContactInfo &&
            (profile.contactEmail || profile.contactPhone) && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '6px',
                  fontSize: '13px',
                  flexWrap: 'wrap',
                }}
              >
                {profile.contactEmail && (
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    className="profile-website-link"
                    style={{ gap: '4px' }}
                  >
                    <Mail size={13} /> {profile.contactEmail}
                  </a>
                )}
                {profile.contactPhone && (
                  <a
                    href={`tel:${profile.contactPhone}`}
                    className="profile-website-link"
                    style={{ gap: '4px' }}
                  >
                    <Phone size={13} /> {profile.contactPhone}
                  </a>
                )}
              </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;
