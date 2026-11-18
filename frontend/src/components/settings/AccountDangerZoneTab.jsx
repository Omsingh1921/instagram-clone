import React from 'react';
import { Mail, ShieldCheck, Power, Trash2 } from 'lucide-react';

export const AccountDangerZoneTab = ({
  currentAccountEmail = '',
  currentUser,
  emailChangeSent = '',
  newEmailInput = '',
  setNewEmailInput,
  emailCurrentPassword = '',
  setEmailCurrentPassword,
  changingEmail = false,
  handleInitiateEmailChange,
  handleCancelPendingEmail,
  isUserAdmin = false,
  accountDeletionGraceDays = 30,
  showDeactivateModal = false,
  setShowDeactivateModal,
  handleDeactivateAccount,
  showDeleteModal = false,
  setShowDeleteModal,
  handleDeleteAccount,
  saving = false,
}) => {
  return (
    <div style={{ maxWidth: '580px' }}>
      <h2 className="settings-section-title">Account & Security</h2>

      {/* Email Address Section */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Mail size={18} color="var(--ig-primary-button)" />
          <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
            Email Address
          </strong>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Current email:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {currentAccountEmail || currentUser?.email || 'No email associated'}
          </strong>
        </p>

        {emailChangeSent ? (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: 'var(--color-success)',
                marginBottom: '6px',
              }}
            >
              ✓ Verification email sent to <strong>{emailChangeSent}</strong>. Please check your inbox and click the verification link.
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={handleCancelPendingEmail}
            >
              Cancel Request
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleInitiateEmailChange}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxWidth: '420px',
            }}
          >
            <input
              type="email"
              className="input"
              placeholder="Enter new email address"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput?.(e.target.value)}
              required
            />
            <input
              type="password"
              className="input"
              placeholder="Current password (to verify identity)"
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword?.(e.target.value)}
              autoComplete="current-password"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={changingEmail || !newEmailInput}
              >
                {changingEmail ? 'Processing...' : 'Change Email'}
              </button>
            </div>
          </form>
        )}
      </div>

      {isUserAdmin ? (
        <div
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.34)',
            padding: '16px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <ShieldCheck size={24} color="#c084fc" />
          <div>
            <strong
              style={{
                fontSize: '14px',
                color: 'var(--text-primary)',
                display: 'block',
                marginBottom: '2px',
              }}
            >
              System Administrator Account Protected
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Admin accounts cannot be deactivated or deleted to preserve platform governance and audit consistency.
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Account Deactivation (Temporary) */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Power size={18} color="var(--color-warning)" />
              <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                Temporarily Deactivate Account
              </strong>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '14px',
                lineHeight: 1.5,
              }}
            >
              Temporarily deactivating your account hides your profile, photos, comments, and likes. You can easily reactivate whenever you want by simply logging back into your account.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowDeactivateModal?.(true)}
            >
              Deactivate My Account
            </button>
          </div>

          {/* Danger Zone: Account Deletion (Permanent) */}
          <div
            style={{
              background: 'rgba(237, 73, 86, 0.05)',
              border: '1px solid rgba(237, 73, 86, 0.3)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Trash2 size={18} color="var(--color-error)" />
              <strong style={{ fontSize: '15px', color: 'var(--color-error)' }}>
                Danger Zone: Delete Account
              </strong>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '14px',
                lineHeight: 1.5,
              }}
            >
              When you delete your account, your profile and content will be scheduled for permanent removal with a {accountDeletionGraceDays}-day recovery grace period. All your active sessions will be terminated immediately.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowDeleteModal?.(true)}
            >
              Delete Account
            </button>
          </div>
        </>
      )}

      {/* Modal for Deactivate Account */}
      {showDeactivateModal && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setShowDeactivateModal?.(false)}
        >
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Deactivate Account?</h3>
            <p className="modal-body-text">
              Your profile, posts, comments, and likes will be hidden from everyone until you log back in. Are you sure you want to proceed?
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowDeactivateModal?.(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={handleDeactivateAccount}
              >
                {saving ? 'Processing...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Delete Account */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setShowDeleteModal?.(false)}
        >
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: 'var(--color-error)' }}>
              Permanently Delete Account?
            </h3>
            <p className="modal-body-text">
              This will immediately sign you out and schedule your profile, posts, reels, and stories for permanent removal. You will have a {accountDeletionGraceDays}-day recovery window to restore your account.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowDeleteModal?.(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleDeleteAccount}
              >
                {saving ? 'Processing...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDangerZoneTab;
