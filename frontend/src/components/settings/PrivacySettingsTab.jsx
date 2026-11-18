import React from 'react';
import { ChevronRight } from 'lucide-react';

export const PrivacySettingsTab = ({
  settingsForm = {},
  handleSaveSettings,
  setActiveTab,
}) => {
  return (
    <div style={{ maxWidth: '520px' }}>
      <h2 className="settings-section-title">Privacy & Notifications</h2>

      <div className="settings-toggle-row">
        <div className="toggle-info">
          <span className="toggle-title">Private Account</span>
          <span className="toggle-desc">
            When your account is private, only approved followers can see your posts and stories.
          </span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={Boolean(settingsForm.privateAccount)}
            onChange={(e) =>
              handleSaveSettings?.({ ...settingsForm, privateAccount: e.target.checked })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div
        className="settings-toggle-row"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab?.('story_privacy')}
      >
        <div className="toggle-info">
          <span className="toggle-title">Hide story and live</span>
          <span className="toggle-desc">
            Hide your story and live videos from specific accounts.
          </span>
        </div>
        <ChevronRight size={18} color="var(--text-secondary)" />
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

export default PrivacySettingsTab;
