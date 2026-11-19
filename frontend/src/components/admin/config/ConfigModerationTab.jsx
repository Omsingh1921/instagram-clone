import React from 'react';
import { ShieldCheck, Save } from 'lucide-react';

export const ConfigModerationTab = ({
  moderation,
  setModeration,
  handleSaveModeration,
  saving,
}) => {
  return (
    <div className="config-card">
      <div className="config-card-header">
        <h2 className="config-card-title">
          <ShieldCheck size={18} color="#0095f6" />
          Automated Moderation & Safety Governance
        </h2>
        <span className="config-value-badge">Active Engine</span>
      </div>

      <div className="config-grid">
        <div className="config-field">
          <label className="config-label">
            <span>Auto-Quarantine Report Threshold</span>
            <span className="config-value-badge">{moderation.autoQuarantineReportThreshold} Reports</span>
          </label>
          <input
            type="number"
            min="1"
            max="50"
            className="config-input"
            value={moderation.autoQuarantineReportThreshold}
            onChange={(e) =>
              setModeration({
                ...moderation,
                autoQuarantineReportThreshold: parseInt(e.target.value, 10) || 5,
              })
            }
          />
          <span className="config-toggle-desc">
            Unique reports needed to automatically hide content pending admin review.
          </span>
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>Copyright Strike Limit</span>
            <span className="config-value-badge">{moderation.copyrightStrikeLimit} Strikes</span>
          </label>
          <input
            type="number"
            min="1"
            max="10"
            className="config-input"
            value={moderation.copyrightStrikeLimit}
            onChange={(e) =>
              setModeration({
                ...moderation,
                copyrightStrikeLimit: parseInt(e.target.value, 10) || 3,
              })
            }
          />
          <span className="config-toggle-desc">
            Number of verified takedowns before creator account is flagged for suspension.
          </span>
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>AI NSFW Blur Sensitivity</span>
            <span className="config-value-badge">
              {Math.round(moderation.nsfwBlurThreshold * 100)}%
            </span>
          </label>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            className="config-slider"
            value={moderation.nsfwBlurThreshold}
            onChange={(e) =>
              setModeration({ ...moderation, nsfwBlurThreshold: parseFloat(e.target.value) })
            }
          />
          <span className="config-toggle-desc">
            Confidence score required to automatically apply sensitivity blur cover.
          </span>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label className="config-label" style={{ marginBottom: 8 }}>
          Banned Words & Profanity Dictionary
        </label>
        <textarea
          className="config-textarea"
          rows="4"
          style={{ width: '100%' }}
          value={moderation.profanityBannedWords || ''}
          onChange={(e) =>
            setModeration({ ...moderation, profanityBannedWords: e.target.value })
          }
        />
        <span className="config-toggle-desc" style={{ marginTop: 4, display: 'block' }}>
          Comma-separated terms that automatically trigger comment quarantine and spam flagging.
        </span>
      </div>

      <div className="config-actions-bar">
        <span style={{ fontSize: 13, color: '#8e8e8e' }}>
          Enforced dynamically in ModerationService and automated content safety checks.
        </span>
        <button className="btn-primary" onClick={handleSaveModeration} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Safety Rules'}
        </button>
      </div>
    </div>
  );
};

export default ConfigModerationTab;
