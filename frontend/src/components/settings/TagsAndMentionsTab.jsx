import React from 'react';

export const TagsAndMentionsTab = ({
  settingsForm = {},
  handleSaveSettings,
}) => {
  return (
    <div style={{ maxWidth: '540px' }}>
      <h2 className="settings-section-title">Tags and mentions</h2>

      <div style={{ marginBottom: '24px' }}>
        <strong
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Who can tag you
        </strong>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Choose who can tag you in their photos and videos.
        </p>
        <div className="settings-radio-group">
          {['EVERYONE', 'PEOPLE_YOU_FOLLOW', 'NOBODY'].map((opt) => (
            <label key={opt} className="settings-radio-label">
              <input
                type="radio"
                name="allowTagsFrom"
                checked={settingsForm.allowTagsFrom === opt}
                onChange={() =>
                  handleSaveSettings?.({ ...settingsForm, allowTagsFrom: opt })
                }
              />
              <span>
                {opt === 'EVERYONE'
                  ? 'Allow tags from everyone'
                  : opt === 'PEOPLE_YOU_FOLLOW'
                  ? 'Allow tags from people you follow'
                  : "Don't allow tags"}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <strong
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Who can @mention you
        </strong>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Choose who can @mention you in their stories, comments, live videos, and captions.
        </p>
        <div className="settings-radio-group">
          {['EVERYONE', 'PEOPLE_YOU_FOLLOW', 'NOBODY'].map((opt) => (
            <label key={opt} className="settings-radio-label">
              <input
                type="radio"
                name="allowMentionsFrom"
                checked={settingsForm.allowMentionsFrom === opt}
                onChange={() =>
                  handleSaveSettings?.({ ...settingsForm, allowMentionsFrom: opt })
                }
              />
              <span>
                {opt === 'EVERYONE'
                  ? 'Allow mentions from everyone'
                  : opt === 'PEOPLE_YOU_FOLLOW'
                  ? 'Allow mentions from people you follow'
                  : "Don't allow mentions"}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagsAndMentionsTab;
