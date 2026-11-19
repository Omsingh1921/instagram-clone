import React from 'react';
import { Trash2, AlertTriangle, Save } from 'lucide-react';

export const ConfigDeletionTab = ({
  deletion,
  setDeletion,
  handleSaveDeletion,
  saving,
}) => {
  return (
    <div className="config-card">
      <div className="config-card-header">
        <h2 className="config-card-title">
          <Trash2 size={18} color="#0095f6" />
          Deletion & Data Lifecycle Policy
        </h2>
        <span className="config-value-badge">
          {deletion.pseudoPermanentEnabled ? 'Pretend Purge Enabled' : 'Hard Purge Enabled'}
        </span>
      </div>

      {deletion.legalHoldEnabled && (
        <div className="alert-banner danger">
          <AlertTriangle size={18} />
          <span>
            EMERGENCY LEGAL HOLD ACTIVE: All automated cron purges and permanent deletion operations are strictly frozen.
          </span>
        </div>
      )}

      <div className="config-grid">
        <div className="config-field">
          <label className="config-label">
            <span>Recently Deleted Trash Lifespan</span>
            <span className="config-value-badge">{deletion.trashRetentionDays} Days</span>
          </label>
          <input
            type="range"
            min="1"
            max="90"
            className="config-slider"
            value={deletion.trashRetentionDays}
            onChange={(e) =>
              setDeletion({ ...deletion, trashRetentionDays: parseInt(e.target.value, 10) })
            }
          />
          <span className="config-toggle-desc">
            Duration items remain recoverable in the user&apos;s trash bin.
          </span>
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>Cloudinary & Media Purge Buffer</span>
            <span className="config-value-badge">{deletion.mediaPurgeDelayDays} Days</span>
          </label>
          <input
            type="range"
            min="0"
            max="90"
            className="config-slider"
            value={deletion.mediaPurgeDelayDays}
            onChange={(e) =>
              setDeletion({ ...deletion, mediaPurgeDelayDays: parseInt(e.target.value, 10) })
            }
          />
          <span className="config-toggle-desc">
            Grace period before deleted media is permanently cleaned from CDN storage.
          </span>
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>Account Deletion Grace Window</span>
            <span className="config-value-badge">{deletion.accountGraceDays} Days</span>
          </label>
          <input
            type="range"
            min="0"
            max="60"
            className="config-slider"
            value={deletion.accountGraceDays}
            onChange={(e) =>
              setDeletion({ ...deletion, accountGraceDays: parseInt(e.target.value, 10) })
            }
          />
          <span className="config-toggle-desc">
            Days a user can log back in to cancel account self-deletion.
          </span>
        </div>

        <div className="config-field">
          <label className="config-label">
            <span>Admin Takedown Preservation</span>
            <span className="config-value-badge">{deletion.adminTakedownPreserveDays} Days</span>
          </label>
          <input
            type="number"
            className="config-input"
            value={deletion.adminTakedownPreserveDays}
            onChange={(e) =>
              setDeletion({
                ...deletion,
                adminTakedownPreserveDays: parseInt(e.target.value, 10) || 365,
              })
            }
          />
          <span className="config-toggle-desc">
            Retention period for administrative copyright and violation evidence.
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div className="config-toggle-row">
          <div className="config-toggle-info">
            <span className="config-toggle-title">Pseudo-Permanent &quot;Pretend Purge&quot;</span>
            <span className="config-toggle-desc">
              User believes content is permanently destroyed, but database retains for legal buffer
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={deletion.pseudoPermanentEnabled}
              onChange={(e) =>
                setDeletion({ ...deletion, pseudoPermanentEnabled: e.target.checked })
              }
            />
            <span className="slider-toggle"></span>
          </label>
        </div>

        <div className="config-toggle-row">
          <div className="config-toggle-info">
            <span className="config-toggle-title">Emergency Legal Hold Freeze</span>
            <span className="config-toggle-desc">
              Instantly halts all background purge jobs for regulatory investigations
            </span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={deletion.legalHoldEnabled}
              onChange={(e) => setDeletion({ ...deletion, legalHoldEnabled: e.target.checked })}
            />
            <span className="slider-toggle"></span>
          </label>
        </div>
      </div>

      <div className="config-actions-bar">
        <span style={{ fontSize: 13, color: '#8e8e8e' }}>
          Controls dynamic cutoff in ReelService, PostService, and Cloudinary Purge cron jobs.
        </span>
        <button className="btn-primary" onClick={handleSaveDeletion} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Deletion Configuration'}
        </button>
      </div>
    </div>
  );
};

export default ConfigDeletionTab;
