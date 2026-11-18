import React from 'react';

export const SharingAndRemixesTab = ({
  settingsForm = {},
  handleSaveSettings,
}) => {
  return (
    <div style={{ maxWidth: '540px' }}>
      <h2 className="settings-section-title">Sharing and reuse</h2>
      <p
        className="settings-section-subtitle"
        style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}
      >
        Control how other people can share your stories, posts, and reels across Instagram.
      </p>

      <div className="settings-toggle-row">
        <div className="toggle-info">
          <span className="toggle-title">Allow story sharing to messages</span>
          <span className="toggle-desc">
            Let your story viewers share your stories in direct messages.
          </span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={Boolean(settingsForm.allowStorySharing)}
            onChange={(e) =>
              handleSaveSettings?.({
                ...settingsForm,
                allowStorySharing: e.target.checked,
              })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>

      <div className="settings-toggle-row">
        <div className="toggle-info">
          <span className="toggle-title">Allow story resharing</span>
          <span className="toggle-desc">
            Let people you @mention in your stories add them to their own story.
          </span>
        </div>
        <label className="switch-control">
          <input
            type="checkbox"
            checked={Boolean(settingsForm.allowStoryResharing)}
            onChange={(e) =>
              handleSaveSettings?.({
                ...settingsForm,
                allowStoryResharing: e.target.checked,
              })
            }
          />
          <span className="switch-slider" />
        </label>
      </div>
    </div>
  );
};

export default SharingAndRemixesTab;
