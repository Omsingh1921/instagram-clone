import React from 'react';
import { Camera } from 'lucide-react';
import Avatar from '../common/Avatar';

export const ProfileAvatar = ({
  profile = {},
  isOwnProfile = false,
  activeNote,
  hasActiveStory = false,
  uploadingStory = null,
  userStories = [],
  avatarInputRef,
  handleAvatarClick,
  handleAvatarFile,
  setNoteModalOpen,
}) => {
  return (
    <div className="profile-avatar-column">
      <div className="profile-avatar-note-container">
        {/* Floating Note Bubble (active note or share note prompt) placed ABOVE avatar */}
        {activeNote ? (
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
        ) : isOwnProfile ? (
          <button
            type="button"
            className="profile-avatar-note-bubble profile-add-note-bubble profile-add-note-pill clickable"
            onClick={() => setNoteModalOpen?.(true)}
            title="Share a note"
            aria-label="Share a note"
          >
            <div className="note-bubble-content">
              <span className="note-bubble-text">+ Note</span>
            </div>
            <div className="note-bubble-pointer" />
          </button>
        ) : null}

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
      </div>
    </div>
  );
};

export default ProfileAvatar;
