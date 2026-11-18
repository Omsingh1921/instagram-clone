import React from 'react';

export const ProfileEditForm = ({
  isEditing = false,
  isOwnProfile = false,
  handleSaveEdit,
  editFormData = {},
  setEditFormData,
  setIsEditing,
  savingEdit = false,
}) => {
  if (!isEditing || !isOwnProfile) return null;

  return (
    <form onSubmit={handleSaveEdit} className="profile-edit-box">
      <h3 style={{ margin: 0, fontSize: '16px' }}>Edit Profile Information</h3>
      <div className="editor-form-group">
        <label className="editor-label">Display Name</label>
        <input
          type="text"
          className="input"
          value={editFormData.displayName || ''}
          onChange={(e) =>
            setEditFormData?.({ ...editFormData, displayName: e.target.value })
          }
          maxLength={50}
        />
      </div>
      <div className="editor-form-group">
        <label className="editor-label">Pronouns</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. they/them, she/her, he/him"
          value={editFormData.pronouns || ''}
          onChange={(e) =>
            setEditFormData?.({ ...editFormData, pronouns: e.target.value })
          }
          maxLength={50}
        />
      </div>
      <div className="editor-form-group">
        <label className="editor-label">Gender</label>
        <select
          className="input"
          value={editFormData.gender || 'PREFER_NOT_TO_SAY'}
          onChange={(e) =>
            setEditFormData?.({ ...editFormData, gender: e.target.value })
          }
          style={{ background: 'var(--bg-elevated)' }}
        >
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>
      <div className="editor-form-group">
        <label className="editor-label">Category (Creator or Business Title)</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. Digital Creator, Artist, Photographer, Blogger"
          value={editFormData.category || ''}
          onChange={(e) =>
            setEditFormData?.({ ...editFormData, category: e.target.value })
          }
          maxLength={100}
        />
      </div>
      <div className="editor-form-group">
        <label className="editor-label">Bio</label>
        <textarea
          rows={3}
          className="input"
          value={editFormData.bio || ''}
          onChange={(e) =>
            setEditFormData?.({ ...editFormData, bio: e.target.value })
          }
          maxLength={150}
        />
      </div>
      <div className="editor-form-group">
        <label className="editor-label">Website</label>
        <input
          type="text"
          className="input"
          placeholder="https://example.com"
          value={editFormData.websiteUrl || ''}
          onChange={(e) =>
            setEditFormData?.({ ...editFormData, websiteUrl: e.target.value })
          }
        />
      </div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          marginTop: '8px',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsEditing?.(false)}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={savingEdit}
        >
          {savingEdit ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
