import React from 'react';

export const NotificationsSettingsTab = ({
  pushEnabled = false,
  togglingPush = false,
  handleTogglePushNotifications,
  settingsForm = {},
  handleSaveSettings,
}) => {
  return (
    <div style={{ maxWidth: '540px' }}>
      <h2 className="settings-section-title">Notifications</h2>

      <div
        className="settings-toggle-row"
        style={{
          borderBottom: '1px solid var(--border-subtle, #363636)',
          paddingBottom: '16px',
          marginBottom: '16px',
        }}
      >
        <div className="toggle-info">
          <span
            className="toggle-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Browser Push Notifications (FCM)</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(168, 85, 247, 0.18)',
                color: '#c084fc',
                fontWeight: 600,
              }}
            >
              Web Push
            </span>
          </span>
          <span className="toggle-desc">
            Receive real-time push alerts on your desktop or device even when the browser tab is closed or in the background.
          </span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={pushEnabled}
            disabled={togglingPush}
            onChange={(e) => handleTogglePushNotifications?.(e.target.checked)}
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="toggle-info">
          <span className="toggle-title">Likes Notifications</span>
          <span className="toggle-desc">Receive notifications when someone likes your posts.</span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={Boolean(settingsForm.notifyLikes)}
            onChange={(e) =>
              handleSaveSettings?.({ ...settingsForm, notifyLikes: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="toggle-info">
          <span className="toggle-title">Comments Notifications</span>
          <span className="toggle-desc">Receive notifications when someone comments on your posts.</span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={Boolean(settingsForm.notifyComments)}
            onChange={(e) =>
              handleSaveSettings?.({ ...settingsForm, notifyComments: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="toggle-info">
          <span className="toggle-title">New Follower Notifications</span>
          <span className="toggle-desc">Receive notifications when someone starts following you.</span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={Boolean(settingsForm.notifyFollows)}
            onChange={(e) =>
              handleSaveSettings?.({ ...settingsForm, notifyFollows: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="toggle-info">
          <span className="toggle-title">Message Notifications</span>
          <span className="toggle-desc">Receive notifications for direct messages.</span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={Boolean(settingsForm.notifyMessages)}
            onChange={(e) =>
              handleSaveSettings?.({ ...settingsForm, notifyMessages: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>
    </div>
  );
};

export default NotificationsSettingsTab;
