import React from 'react';
import { Link2, Mail, Phone } from 'lucide-react';

export const ProfileBio = ({ profile = {} }) => {
  const distinctDisplayName =
    (profile.displayName || profile.fullName) &&
    (profile.displayName || profile.fullName).trim().toLowerCase() !==
      (profile.username || '').trim().toLowerCase()
      ? (profile.displayName || profile.fullName).trim()
      : null;

  return (
    <div className="profile-bio-section">
      {(distinctDisplayName || profile.pronouns) && (
        <div
          className="profile-name-pronouns-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {distinctDisplayName && (
            <span className="profile-full-name">
              {distinctDisplayName}
            </span>
          )}
          {profile.pronouns && (
            <span
              className="profile-pronouns"
              style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
            >
              {distinctDisplayName ? '· ' : ''}{profile.pronouns}
            </span>
          )}
        </div>
      )}
      {profile.showCategoryBadge !== false && profile.category && (
        <span className="profile-category-pill">{profile.category}</span>
      )}
      {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}
      {profile.websiteUrl && (
        <a
          href={
            profile.websiteUrl.startsWith('http')
              ? profile.websiteUrl
              : `https://${profile.websiteUrl}`
          }
          target="_blank"
          rel="noreferrer noopener"
          className="profile-website-link"
        >
          <Link2 size={14} />
          <span>{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      {profile.showContactInfo &&
        (profile.contactEmail || profile.contactPhone) && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '6px',
              fontSize: '13px',
              flexWrap: 'wrap',
            }}
          >
            {profile.contactEmail && (
              <a
                href={`mailto:${profile.contactEmail}`}
                className="profile-website-link"
                style={{ gap: '4px' }}
              >
                <Mail size={13} /> {profile.contactEmail}
              </a>
            )}
            {profile.contactPhone && (
              <a
                href={`tel:${profile.contactPhone}`}
                className="profile-website-link"
                style={{ gap: '4px' }}
              >
                <Phone size={13} /> {profile.contactPhone}
              </a>
            )}
          </div>
        )}
    </div>
  );
};

export default ProfileBio;
