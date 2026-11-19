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

    // Check Mobile Grid template areas (actions placed directly below avatar & stats row)
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*grid-template-areas:\s*"avatar\s+stats"\s*"actions\s+actions"\s*"username\s+username"\s*"bio\s+bio"/);

    // Check display: contents on wrapper elements so children participate directly in the grid
    expect(cssContent).toMatch(/\.profile-info-column\s*\{[\s\S]*display:\s*contents;/);
    expect(cssContent).toMatch(/\.profile-username-row\s*\{[\s\S]*display:\s*contents;/);

    // Check vertical stacked stat item (number on top, label on bottom)
    expect(cssContent).toMatch(/\.stat-item\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;/);

    // Check action buttons full-width responsive flex
    expect(cssContent).toMatch(/\.profile-action-buttons\s*\{[\s\S]*grid-area:\s*actions;/);

    // Check Highlights, Close Friends, and Gear buttons removed from mobile web action bar
    expect(cssContent).toMatch(/\.profile-highlight-action-btn,[\s\S]*\.profile-close-friends-btn,[\s\S]*\.profile-gear-btn,[\s\S]*\.profile-action-buttons\s+\.profile-desktop-only\s*\{[\s\S]*display:\s*none\s*!important;/);
    expect(cssContent).toMatch(/\.profile-action-buttons\s*\{[\s\S]*flex-wrap:\s*nowrap;/);

    // Check compact 360px breakpoint
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*360px\)\s*\{[\s\S]*\.profile-avatar-trigger/);
  });

  it('renders floating note prompt above avatar when own profile has no active note', () => {
    const mockProfile = {
      username: 'ram',
      displayName: 'Ram Developer',
      avatarUrl: 'https://example.com/ram.jpg',
    };

    render(
      <MemoryRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          activeNote={null}
        />
      </MemoryRouter>
    );

    // Prompt bubble rendered above avatar
    const noteBtn = screen.getByRole('button', { name: /Share a note/i });
    expect(noteBtn).toBeInTheDocument();
    expect(noteBtn).toHaveClass('profile-avatar-note-bubble');
    expect(noteBtn).toHaveClass('profile-add-note-bubble');
    expect(noteBtn.querySelector('.note-bubble-pointer')).toBeInTheDocument();
  });
});
