import React from 'react';

export const PasswordSettingsTab = ({
  passwordForm = {},
  setPasswordForm,
  handleChangePassword,
  saving = false,
}) => {
  return (
    <div>
      <h2 className="settings-section-title">Change Password</h2>
      <form onSubmit={handleChangePassword} className="settings-form">
        <div className="editor-form-group">
          <label className="editor-label">Current Password</label>
          <input
            type="password"
            className="input"
            required
            value={passwordForm.currentPassword || ''}
            onChange={(e) =>
              setPasswordForm?.({ ...passwordForm, currentPassword: e.target.value })
            }
          />
        </div>

        <div className="editor-form-group">
          <label className="editor-label">New Password</label>
          <input
            type="password"
            className="input"
            required
            minLength={8}
            value={passwordForm.newPassword || ''}
            onChange={(e) =>
              setPasswordForm?.({ ...passwordForm, newPassword: e.target.value })
            }
          />
        </div>

        <div className="editor-form-group">
          <label className="editor-label">Confirm New Password</label>
          <input
            type="password"
            className="input"
            required
            minLength={8}
            value={passwordForm.confirmPassword || ''}
            onChange={(e) =>
              setPasswordForm?.({ ...passwordForm, confirmPassword: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          style={{ marginTop: '8px', alignSelf: 'flex-start' }}
        >
          {saving ? 'Processing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default PasswordSettingsTab;
