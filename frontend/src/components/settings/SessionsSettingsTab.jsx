import React from 'react';
import { Laptop, Smartphone, Globe } from 'lucide-react';
import { SkeletonUserRows } from '../ui/Skeleton';
import EmptyState from '../common/EmptyState';

const getDeviceIcon = (deviceName) => {
  if (!deviceName) return Globe;
  const lower = deviceName.toLowerCase();
  if (
    lower.includes('iphone') ||
    lower.includes('android') ||
    lower.includes('ios') ||
    lower.includes('mobile')
  ) {
    return Smartphone;
  }
  return Laptop;
};

const formatSessionTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return (
      d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' at ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return isoString;
  }
};

export const SessionsSettingsTab = ({
  sessions = [],
  sessionsLoading = false,
  sessionsError = null,
  loadSessions,
  handleRevokeSession,
  handleRevokeOtherSessions,
  handleLogoutAll,
  revokingId = null,
  saving = false,
  showRevokeOtherModal = false,
  setShowRevokeOtherModal,
  showLogoutAllModal = false,
  setShowLogoutAllModal,
}) => {
  return (
    <div className="sessions-container">
      <h2 className="settings-section-title">Login Activity</h2>
      <p className="sessions-header-desc">
        Manage your active sessions and devices where your account is currently signed in.
      </p>

      <div className="sessions-action-bar">
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
            Active Sessions
          </strong>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {sessions.length} logged-in device{sessions.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
            disabled={sessions.filter((s) => !s.current).length === 0 || saving}
            onClick={() => setShowRevokeOtherModal?.(true)}
          >
            Log out other devices
          </button>
          <button
            type="button"
            className="btn btn-danger"
            style={{ fontSize: '12px', padding: '6px 12px' }}
            disabled={saving}
            onClick={() => setShowLogoutAllModal?.(true)}
          >
            Log out of all
          </button>
        </div>
      </div>

      {sessionsLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <SkeletonUserRows count={4} showAction />
        </div>
      ) : sessionsError ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>
            {sessionsError}
          </p>
          <button type="button" className="btn btn-secondary" onClick={loadSessions}>
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Laptop}
          title="No Active Sessions"
          description="No active sessions were found for your account."
        />
      ) : (
        <div className="sessions-list">
          {sessions.map((sess) => {
            const sessionId = sess.sessionId || sess.id;
            const isCurrent =
              sess.current !== undefined ? sess.current : sess.currentSession;
            const DeviceIcon = getDeviceIcon(sess.deviceName);
            return (
              <div
                key={sessionId || sess.id}
                className={`session-card ${isCurrent ? 'current' : ''}`}
              >
                <div className="session-main-details">
                  <div className="session-icon-box">
                    <DeviceIcon size={20} />
                  </div>
                  <div className="session-info">
                    <div className="session-title-line">
                      <span className="session-device-name">
                        {sess.deviceName || 'Unknown Device'}
                      </span>
                      {isCurrent && (
                        <span className="session-current-badge">This Device</span>
                      )}
                    </div>
                    <div className="session-meta-line">
                      {sess.ipAddress ? `IP: ${sess.ipAddress} • ` : ''}
                      {isCurrent
                        ? 'Active now'
                        : `Last active ${formatSessionTime(sess.lastActivityAt)}`}
                    </div>
                    <div className="session-meta-line" style={{ opacity: 0.75 }}>
                      Signed in {formatSessionTime(sess.createdAt)}
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                    disabled={revokingId === sessionId || saving}
                    onClick={() => handleRevokeSession?.(sessionId, isCurrent)}
                  >
                    {revokingId === sessionId ? 'Processing...' : 'Log Out'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Revoke Other Sessions */}
      {showRevokeOtherModal && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setShowRevokeOtherModal?.(false)}
        >
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Log out other devices?</h3>
            <p className="modal-body-text">
              You will be signed out on all other web and mobile devices. You will stay signed in on this device.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowRevokeOtherModal?.(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleRevokeOtherSessions}
              >
                {saving ? 'Processing...' : 'Log Out Others'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Logout All Sessions */}
      {showLogoutAllModal && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setShowLogoutAllModal?.(false)}
        >
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Log out of all devices?</h3>
            <p className="modal-body-text">
              You will be signed out everywhere, including this device. You will need to enter your credentials to sign back in.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowLogoutAllModal?.(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleLogoutAll}
              >
                {saving ? 'Processing...' : 'Log Out All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsSettingsTab;
