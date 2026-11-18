import React from 'react';
import { Briefcase } from 'lucide-react';

export const ProfessionalAccountTab = ({
  profileForm = {},
  setProfileForm,
  handleSaveAccountType,
  saving = false,
}) => {
  return (
    <div style={{ maxWidth: '580px' }}>
      <h2 className="settings-section-title">Professional & Creator Account</h2>
      <p
        className="settings-section-subtitle"
        style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}
      >
        Switch to a Creator or Business account to display category badges, track rich post & reel insights, and unlock professional tools.
      </p>

      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Briefcase size={18} color="var(--color-primary)" />
          <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Account Type</strong>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '18px',
          }}
        >
          {[
            {
              type: 'PERSONAL',
              label: 'Personal',
              desc: 'Standard account for everyday sharing',
            },
            {
              type: 'CREATOR',
              label: 'Creator',
              desc: 'Best for public figures, content producers & artists',
            },
            {
              type: 'BUSINESS',
              label: 'Business',
              desc: 'Best for brands, retailers & organizations',
            },
          ].map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() =>
                setProfileForm?.({ ...profileForm, accountType: opt.type })
              }
              style={{
                padding: '12px 10px',
                borderRadius: 'var(--radius-md)',
                border:
                  profileForm.accountType === opt.type
                    ? '2px solid #a855f7'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                background:
                  profileForm.accountType === opt.type
                    ? 'rgba(168, 85, 247, 0.14)'
                    : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color:
                    profileForm.accountType === opt.type
                      ? '#e9d5ff'
                      : 'var(--text-primary)',
                }}
              >
                {opt.label}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.3,
                }}
              >
                {opt.desc}
              </span>
            </button>
          ))}
        </div>

        {profileForm.accountType !== 'PERSONAL' && (
          <>
            <div className="editor-form-group">
              <label className="editor-label">Category Title</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Digital Creator, Artist, Photographer, Blogger, Fitness"
                value={profileForm.category || ''}
                onChange={(e) =>
                  setProfileForm?.({ ...profileForm, category: e.target.value })
                }
              />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginTop: '8px',
                }}
              >
                {[
                  'Digital Creator',
                  'Artist',
                  'Photographer',
                  'Gamer',
                  'Musician',
                  'Writer',
                  'Entrepreneur',
                  'Blogger',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="location-pill"
                    onClick={() =>
                      setProfileForm?.({ ...profileForm, category: cat })
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Category Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderTop: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                margin: '16px 0',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Display category on profile
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Show your professional label under your name
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(profileForm.showCategoryBadge)}
                onChange={(e) =>
                  setProfileForm?.({
                    ...profileForm,
                    showCategoryBadge: e.target.checked,
                  })
                }
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Contact Options */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                Public Contact Information
              </div>
              <div className="editor-form-group">
                <label className="editor-label">Contact Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="business@example.com"
                  value={profileForm.contactEmail || ''}
                  onChange={(e) =>
                    setProfileForm?.({
                      ...profileForm,
                      contactEmail: e.target.value,
                    })
                  }
                />
              </div>
              <div className="editor-form-group">
                <label className="editor-label">Contact Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 555-123-4567"
                  value={profileForm.contactPhone || ''}
                  onChange={(e) =>
                    setProfileForm?.({
                      ...profileForm,
                      contactPhone: e.target.value,
                    })
                  }
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Display contact info on profile
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Allow people to email or call you from your profile
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(profileForm.showContactInfo)}
                  onChange={(e) =>
                    setProfileForm?.({
                      ...profileForm,
                      showContactInfo: e.target.checked,
                    })
                  }
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={saving}
          onClick={() =>
            handleSaveAccountType?.(profileForm.accountType, profileForm.category)
          }
          style={{ marginTop: '12px' }}
        >
          {saving
            ? 'Processing...'
            : `Save Account Type (${profileForm.accountType})`}
        </button>
      </div>
    </div>
  );
};

export default ProfessionalAccountTab;
