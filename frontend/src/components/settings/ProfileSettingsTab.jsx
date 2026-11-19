import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';

export const ProfileSettingsTab = ({
  currentUser,
  profileForm = {},
  setProfileForm,
  handleSaveProfile,
  avatarInputRef,
  handleAvatarFile,
  handleRemoveAvatar,
  uploadingAvatar = false,
  saving = false,
  usernameCooldownDays = 14,
}) => {
  return (
    <div>
      <h2 className="settings-section-title">Edit Profile</h2>
      <form onSubmit={handleSaveProfile} className="settings-form">
        {/* Profile Photo Header */}
        <div className="settings-profile-card">
          <div className="settings-profile-user-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar
              src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
              alt={currentUser?.username}
              size="lg"
              hasStory={Boolean(currentUser?.hasActiveStory || currentUser?.hasStory)}
            />
            <div>
              <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                @{currentUser?.username}
              </strong>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {profileForm.displayName || 'No display name set'}
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={avatarInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleAvatarFile}
          />
          <div className="settings-profile-card-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => avatarInputRef?.current?.click()}
              disabled={uploadingAvatar}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              {!uploadingAvatar && <Camera size={14} />}
              <span>{uploadingAvatar ? 'Uploading...' : 'Change photo'}</span>
            </button>
            {(currentUser?.avatarUrl || currentUser?.profilePictureUrl) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--color-error)',
                }}
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Username Field */}
        <div className="editor-form-group">
          <label className="editor-label">Username</label>
          <div className="settings-prefix-input-wrap">
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginRight: '4px' }}>@</span>
            <input
              type="text"
              className="input"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '10px 0',
                width: '100%',
                boxShadow: 'none',
              }}
              value={profileForm.username || ''}
              onChange={(e) => setProfileForm?.({ ...profileForm, username: e.target.value })}
              minLength={3}
              maxLength={30}
              required
            />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            3-30 characters. Letters, numbers, underscores, and periods allowed.
          </div>
          {profileForm.previousUsername && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-primary)',
                marginTop: '6px',
                background: 'rgba(0, 149, 246, 0.08)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              In most cases, you can change your username back to{' '}
              <strong>{profileForm.previousUsername}</strong> for another {usernameCooldownDays} days.
            </div>
          )}
        </div>

        {/* Display Name Field */}
        <div className="editor-form-group">
          <label className="editor-label">Name</label>
          <input
            type="text"
            className="input"
            value={profileForm.displayName || ''}
            onChange={(e) => setProfileForm?.({ ...profileForm, displayName: e.target.value })}
            maxLength={50}
            placeholder="Your display name"
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Help people discover your account by using the name you're known by.
          </div>
        </div>

        {/* Pronouns Field */}
        <div className="editor-form-group">
          <label className="editor-label">Pronouns</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. they/them, she/her, he/him"
            value={profileForm.pronouns || ''}
            onChange={(e) => setProfileForm?.({ ...profileForm, pronouns: e.target.value })}
            maxLength={50}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Add pronouns to your profile to let people know how to refer to you.
          </div>
        </div>

        {/* Gender Field */}
        <div className="editor-form-group">
          <label className="editor-label">Gender</label>
          <select
            className="input"
            value={profileForm.gender || 'PREFER_NOT_TO_SAY'}
            onChange={(e) => setProfileForm?.({ ...profileForm, gender: e.target.value })}
          >
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            This won't be part of your public profile.
          </div>
        </div>

        {/* Bio Field */}
        <div className="editor-form-group">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label className="editor-label" style={{ margin: 0 }}>
              Bio
            </label>
            <span
              style={{
                fontSize: '11px',
                color:
                  (profileForm.bio?.length || 0) > 140
                    ? 'var(--color-error)'
                    : 'var(--text-muted)',
              }}
            >
              {profileForm.bio?.length || 0} / 150
            </span>
          </div>
          <textarea
            rows={3}
            className="input"
            value={profileForm.bio || ''}
            onChange={(e) => setProfileForm?.({ ...profileForm, bio: e.target.value })}
            maxLength={150}
            placeholder="Write a brief bio about yourself..."
          />
        </div>

        {/* Website Field */}
        <div className="editor-form-group">
          <label className="editor-label">Website</label>
          <input
            type="text"
            className="input"
            placeholder="https://example.com"
            value={profileForm.websiteUrl || ''}
            onChange={(e) => setProfileForm?.({ ...profileForm, websiteUrl: e.target.value })}
            maxLength={200}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving || uploadingAvatar}
          style={{ marginTop: '8px', alignSelf: 'flex-start' }}
        >
          {saving ? 'Processing...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettingsTab;
