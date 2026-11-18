import React from 'react';
import { EyeOff } from 'lucide-react';

export const HiddenWordsTab = ({
  settingsForm = {},
  setSettingsForm,
  handleSaveHiddenWords,
  saving = false,
}) => {
  return (
    <div style={{ maxWidth: '580px' }}>
      <h2 className="settings-section-title">Hidden Words & Filtering</h2>
      <p
        className="settings-section-subtitle"
        style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}
      >
        Protect yourself from offensive comments and unwanted interactions by automatically hiding inappropriate words and phrases.
      </p>

      <form onSubmit={handleSaveHiddenWords}>
        {/* Offensive words toggle */}
        <div
          className="settings-toggle-row"
          style={{
            background: 'var(--bg-secondary)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}
        >
          <div className="toggle-info">
            <span className="toggle-title">Hide offensive comments</span>
            <span className="toggle-desc">
              Comments that may be offensive or abusive will be automatically hidden from your posts and reels.
            </span>
          </div>
          <label className="switch-control">
            <input
              type="checkbox"
              checked={Boolean(settingsForm.hideOffensiveComments)}
              onChange={(e) =>
                setSettingsForm?.({
                  ...settingsForm,
                  hideOffensiveComments: e.target.checked,
                })
              }
            />
            <span className="switch-slider" />
          </label>
        </div>

        {/* Custom words section */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <EyeOff size={18} color="var(--color-primary)" />
            <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
              Custom words and phrases
            </strong>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '14px',
              lineHeight: 1.4,
            }}
          >
            Add specific words or phrases to your list separated by commas. Any comment on your posts containing these words will be rejected.
          </p>

          <div className="editor-form-group">
            <label className="editor-label">Blocked keywords (comma-separated)</label>
            <textarea
              rows={4}
              className="input"
              placeholder="e.g. spam, scam, fake, promo, follow me"
              value={settingsForm.filteredKeywords || ''}
              onChange={(e) =>
                setSettingsForm?.({ ...settingsForm, filteredKeywords: e.target.value })
              }
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          style={{ marginTop: '4px' }}
        >
          {saving ? 'Processing...' : 'Save Hidden Words'}
        </button>
      </form>
    </div>
  );
};

export default HiddenWordsTab;
