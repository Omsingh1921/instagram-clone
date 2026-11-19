import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { ProfileHeader } from '../components/profile/ProfileHeader';

describe('ProfileHeader Dynamic Phone Web Responsive Suite', () => {
  it('renders all semantic sections (avatar, username with badge-wrap, stats with labels, bio, actions)', () => {
    const mockProfile = {
      username: 'ram',
      displayName: 'Ram Developer',
      isVerified: true,
      category: 'Software Engineer',
      bio: 'Full stack engineer building Instagram clone',
      websiteUrl: 'https://github.com/ram',
      avatarUrl: 'https://example.com/ram.jpg',
    };

    render(
      <MemoryRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          postsCount={12}
          followersCount={1420}
          followingCount={380}
        />
      </MemoryRouter>
    );

    // Username & verified badge in dedicated wrap
    expect(screen.getByText('ram')).toBeInTheDocument();
    expect(document.querySelector('.profile-username-badge-wrap')).toBeInTheDocument();
    expect(document.querySelector('.profile-verified-badge')).toBeInTheDocument();

    // Stats with stat-num and stat-label
    expect(screen.getByText('12')).toHaveClass('stat-num');
    expect(screen.getByText('posts')).toHaveClass('stat-label');
    expect(screen.getByText('1.4K')).toHaveClass('stat-num');
    expect(screen.getByText('followers')).toHaveClass('stat-label');
    expect(screen.getByText('380')).toHaveClass('stat-num');
    expect(screen.getByText('following')).toHaveClass('stat-label');

    // Bio info
    expect(screen.getByText('Ram Developer')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Full stack engineer building Instagram clone')).toBeInTheDocument();

    // Action buttons
    expect(screen.getByText('Edit profile')).toBeInTheDocument();
    expect(screen.getByText('View archive')).toBeInTheDocument();
  });

  it('verifies ProfilePage.css contains authentic Instagram mobile grid areas and responsive rules', () => {
    const cssPath = path.resolve(__dirname, '../pages/profile/ProfilePage.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Check Mobile Grid template areas
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*grid-template-areas:\s*"avatar\s+stats"\s*"username\s+username"\s*"bio\s+bio"\s*"actions\s+actions"/);

    // Check display: contents on wrapper elements so children participate directly in the grid
    expect(cssContent).toMatch(/\.profile-info-column\s*\{[\s\S]*display:\s*contents;/);
    expect(cssContent).toMatch(/\.profile-username-row\s*\{[\s\S]*display:\s*contents;/);

    // Check vertical stacked stat item (number on top, label on bottom)
    expect(cssContent).toMatch(/\.stat-item\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;/);

    // Check action buttons full-width responsive flex
    expect(cssContent).toMatch(/\.profile-action-buttons\s*\{[\s\S]*grid-area:\s*actions;/);

    // Check compact 360px breakpoint
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*360px\)\s*\{[\s\S]*\.profile-avatar-trigger/);
  });
});
