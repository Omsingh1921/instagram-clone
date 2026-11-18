import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const PreferencesTab = ({
  tab = 'like_counts', // 'like_counts' | 'archiving' | 'supervision'
  settingsForm = {},
  handleSaveSettings,
}) => {
  if (tab === 'like_counts') {
    return (
      <div style={{ maxWidth: '540px' }}>
        <h2 className="settings-section-title">Like and share counts</h2>
        <div className="settings-toggle-row">
          <div className="toggle-info">
            <span className="toggle-title">Hide like and share counts</span>
            <span
              className="toggle-desc"
              style={{ marginTop: '4px', lineHeight: 1.4 }}
            >
              On Instagram, the number of likes and shares on posts from other accounts will be hidden. You can hide the number of likes on your own posts when you create them.
            </span>
          </div>
          <label className="switch-control">
            <input
              type="checkbox"
              checked={Boolean(settingsForm.hideLikeAndShareCounts)}
              onChange={(e) =>
                handleSaveSettings?.({
                  ...settingsForm,
                  hideLikeAndShareCounts: e.target.checked,
                })
              }
            />
            <span className="switch-slider" />
          </label>
        </div>
      </div>
    );
  }

  if (tab === 'archiving') {
    return (
      <div style={{ maxWidth: '540px' }}>
        <h2 className="settings-section-title">Archiving and downloading</h2>
        <div className="settings-toggle-row">
          <div className="toggle-info">
            <span className="toggle-title">Save story to archive</span>
            <span className="toggle-desc">
              Automatically save photos and videos to your private archive so you don’t need to save them to your phone. Only you can see your archive.
            </span>
          </div>
          <label className="switch-control">
            <input
              type="checkbox"
              checked={Boolean(settingsForm.saveStoriesToArchive)}
              onChange={(e) =>
                handleSaveSettings?.({
                  ...settingsForm,
                  saveStoriesToArchive: e.target.checked,
                })
              }
            />
            <span className="switch-slider" />
          </label>
        </div>
      </div>
    );
  }

  if (tab === 'supervision') {
    return (
      <div style={{ maxWidth: '540px' }}>
        <h2 className="settings-section-title">Supervision for Teen Accounts</h2>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '24px',
            borderRadius: '18px',
            textAlign: 'center',
          }}
        >
          <ShieldAlert
            size={48}
            color="#c084fc"
            style={{ margin: '0 auto 12px' }}
          />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              margin: '0 0 8px 0',
              color: 'var(--text-primary)',
            }}
          >
            Family Centre
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 16px 0',
            }}
          >
            Supervision allows parents and guardians to support their teens' experience on Instagram. Set daily time limits, schedule breaks, and see who they follow and are followed by.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '8px 24px' }}
          >
            Set Up Supervision
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PreferencesTab;
