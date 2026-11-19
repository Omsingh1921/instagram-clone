import React from 'react';
import { Film, Save } from 'lucide-react';

export const ConfigMediaTab = ({
  media,
  setMedia,
  handleSaveMedia,
  saving,
}) => {
  return (
    <div className="config-card">
      <div className="config-card-header">
        <h2 className="config-card-title">
          <Film size={18} color="#0095f6" />
          Media Upload Limits & Storage Constraints
        </h2>
        <span className="config-value-badge">Publicly Exposed to Web App</span>
      </div>

      <div className="config-grid">
        <div className="config-field">
          <label className="config-label">
            <span>Max Reel Video Size</span>
            <span className="config-value-badge">{Math.round(media.maxReelBytes / (1024 * 1024))} MB</span>
          </label>
          <input
            type="range"
            min="10"
            max="500"
            className="config-slider"
            value={Math.round(media.maxReelBytes / (1024 * 1024))}
            onChange={(e) =>
              setMedia({ ...media, maxReelBytes: parseInt(e.target.value, 10) * 1024 * 1024 })
            }
          />
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>Max Post File Size</span>
            <span className="config-value-badge">{Math.round(media.maxPostBytes / (1024 * 1024))} MB</span>
          </label>
          <input
            type="range"
            min="5"
            max="250"
            className="config-slider"
            value={Math.round(media.maxPostBytes / (1024 * 1024))}
            onChange={(e) =>
              setMedia({ ...media, maxPostBytes: parseInt(e.target.value, 10) * 1024 * 1024 })
            }
          />
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>Max Reel Duration</span>
            <span className="config-value-badge">{media.maxReelDurationSec} Seconds</span>
          </label>
          <input
            type="range"
            min="15"
            max="300"
            className="config-slider"
            value={media.maxReelDurationSec}
            onChange={(e) =>
              setMedia({ ...media, maxReelDurationSec: parseInt(e.target.value, 10) })
            }
          />
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>Max Story Duration</span>
            <span className="config-value-badge">{media.maxStoryDurationSec} Seconds</span>
          </label>
          <input
            type="range"
            min="10"
            max="120"
            className="config-slider"
            value={media.maxStoryDurationSec}
            onChange={(e) =>
              setMedia({ ...media, maxStoryDurationSec: parseInt(e.target.value, 10) })
            }
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label className="config-label" style={{ marginBottom: 8 }}>
          Permitted MIME Types (Whitelist)
        </label>
        <input
          type="text"
          className="config-input"
          style={{ width: '100%' }}
          value={media.allowedMimeTypes || ''}
          onChange={(e) => setMedia({ ...media, allowedMimeTypes: e.target.value })}
        />
        <span className="config-toggle-desc" style={{ marginTop: 4, display: 'block' }}>
          Comma-separated list of MIME types accepted by file upload validation.
        </span>
      </div>

      <div className="config-actions-bar">
        <span style={{ fontSize: 13, color: '#8e8e8e' }}>
          Cached in Redis and shared with the client frontend for live validation.
        </span>
        <button className="btn-primary" onClick={handleSaveMedia} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Media Limits'}
        </button>
      </div>
    </div>
  );
};

export default ConfigMediaTab;
