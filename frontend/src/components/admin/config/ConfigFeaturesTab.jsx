import React from 'react';
import { Flag, AlertTriangle, Save } from 'lucide-react';

export const ConfigFeaturesTab = ({
  features,
  setFeatures,
  handleSaveFeatures,
  saving,
}) => {
  return (
    <div className="config-card">
      <div className="config-card-header">
        <h2 className="config-card-title">
          <Flag size={18} color="#0095f6" />
          Platform Feature Switches & Maintenance Mode
        </h2>
        <span className="config-value-badge">
          {features.maintenanceModeEnabled ? 'MAINTENANCE ACTIVE' : 'Platform Online'}
        </span>
      </div>

      {features.maintenanceModeEnabled && (
        <div className="alert-banner warning">
          <AlertTriangle size={18} />
          <span>
            MAINTENANCE MODE IS ENABLED: Non-admin users will receive HTTP 503 Service Unavailable and a broadcast message.
          </span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div className="config-toggle-row">
          <div className="config-toggle-info">
            <span className="config-toggle-title">Reel Creation & Uploads</span>
            <span className="config-toggle-desc">Enable or disable creator reel video publishing</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={features.reelsUploadEnabled}
              onChange={(e) =>
                setFeatures({ ...features, reelsUploadEnabled: e.target.checked })
              }
            />
            <span className="slider-toggle"></span>
          </label>
        </div>

        <div className="config-toggle-row">
          <div className="config-toggle-info">
            <span className="config-toggle-title">Story Creation</span>
            <span className="config-toggle-desc">Enable or disable 24-hour ephemeral story uploads</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={features.storyCreationEnabled}
              onChange={(e) =>
                setFeatures({ ...features, storyCreationEnabled: e.target.checked })
              }
            />
            <span className="slider-toggle"></span>
          </label>
        </div>

        <div className="config-toggle-row">
          <div className="config-toggle-info">
            <span className="config-toggle-title">Voice Messages in DMs</span>
            <span className="config-toggle-desc">Enable or disable audio notes in Direct Messaging</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={features.voiceMessagesEnabled}
              onChange={(e) =>
                setFeatures({ ...features, voiceMessagesEnabled: e.target.checked })
              }
            />
            <span className="slider-toggle"></span>
          </label>
        </div>

        <div className="config-toggle-row">
          <div className="config-toggle-info">
            <span className="config-toggle-title">Platform Maintenance Mode</span>
            <span className="config-toggle-desc">Switch platform to read-only; admins bypass restrictions</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={features.maintenanceModeEnabled}
              onChange={(e) =>
                setFeatures({ ...features, maintenanceModeEnabled: e.target.checked })
              }
            />
            <span className="slider-toggle"></span>
          </label>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label className="config-label" style={{ marginBottom: 8 }}>
          Maintenance Broadcast Message
        </label>
        <textarea
          className="config-textarea"
          rows="3"
          style={{ width: '100%' }}
          value={features.maintenanceMessage || ''}
          onChange={(e) => setFeatures({ ...features, maintenanceMessage: e.target.value })}
        />
      </div>

      <div className="config-actions-bar">
        <span style={{ fontSize: 13, color: '#8e8e8e' }}>
          Disables mutation operations in ReelServiceImpl, StoryServiceImpl, and returns 400/503.
        </span>
        <button className="btn-primary" onClick={handleSaveFeatures} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Feature Switches'}
        </button>
      </div>
    </div>
  );
};

export default ConfigFeaturesTab;
