import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { StoryViewerModal } from '../components/story/StoryViewerModal';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-1', username: 'current_user' },
    isAdmin: false,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

const mockStoryGroups = [
  {
    userId: 'u1',
    author: { id: 'u1', username: 'alice_creator', avatarUrl: 'https://example.com/alice.jpg' },
    hasUnviewed: true,
    stories: [
      {
        id: 's1',
        mediaUrl: 'https://example.com/story1.jpg',
        mediaType: 'IMAGE',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    userId: 'u2',
    author: { id: 'u2', username: 'bob_creator', avatarUrl: 'https://example.com/bob.jpg' },
    hasUnviewed: true,
    stories: [
      {
        id: 's2',
        mediaUrl: 'https://example.com/story2.jpg',
        mediaType: 'IMAGE',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

describe('Story Section Responsive & Dynamic Suite (PC Web & Phone Web)', () => {
  beforeEach(() => {
    document.body.className = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.className = '';
    document.body.style.overflow = '';
  });

  it('renders StoryViewerModal via portal into document.body and sets in-story-viewer class and scroll lock', () => {
    const handleClose = vi.fn();

    const { unmount } = render(
      <MemoryRouter>
        <StoryViewerModal
          isOpen={true}
          storyGroups={mockStoryGroups}
          initialGroupIdx={0}
          initialStoryIdx={0}
          onClose={handleClose}
        />
      </MemoryRouter>
    );

    // Modal overlay is in document.body
    const overlay = document.querySelector('.story-viewer-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay.parentElement).toBe(document.body);

    // in-story-viewer class applied to document.body
    expect(document.body).toHaveClass('in-story-viewer');
    expect(document.body.style.overflow).toBe('hidden');

    // Desktop close button rendered
    const desktopClose = screen.getByLabelText('Close story viewer');
    expect(desktopClose).toBeInTheDocument();
    fireEvent.click(desktopClose);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Clean unmount removes class
    unmount();
    expect(document.body).not.toHaveClass('in-story-viewer');
  });

  it('closes StoryViewerModal on backdrop click', () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <StoryViewerModal
          isOpen={true}
          storyGroups={mockStoryGroups}
          initialGroupIdx={0}
          initialStoryIdx={0}
          onClose={handleClose}
        />
      </MemoryRouter>
    );

    const overlay = document.querySelector('.story-viewer-overlay');
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('verifies AppLayout.css hides mobile headers & bottom navs when in-story-viewer is active', () => {
    const appLayoutCssPath = path.resolve(__dirname, '../layouts/AppLayout.css');
    const appLayoutCss = fs.readFileSync(appLayoutCssPath, 'utf8');

    expect(appLayoutCss).toMatch(/body\.in-story-viewer\s+\.mobile-header/);
    expect(appLayoutCss).toMatch(/body\.in-story-viewer\s+\.mobile-bottom-nav/);
    expect(appLayoutCss).toMatch(/display:\s*none\s*!important/);
  });

  it('verifies StoryViewerModal.css provides fluid aspect ratio on PC web and safe-area full viewport on mobile', () => {
    const storyViewerCssPath = path.resolve(__dirname, '../components/story/StoryViewerModal.css');
    const storyViewerCss = fs.readFileSync(storyViewerCssPath, 'utf8');

    // Desktop 9:16 aspect ratio
    expect(storyViewerCss).toMatch(/aspect-ratio:\s*9\s*\/\s*16;/);

    // Mobile 100dvh and safe area insets
    expect(storyViewerCss).toMatch(/height:\s*100dvh;/);
    expect(storyViewerCss).toMatch(/env\(safe-area-inset-top,\s*0px\)/);
    expect(storyViewerCss).toMatch(/env\(safe-area-inset-bottom,\s*0px\)/);

    // High z-index above headers and sidebars
    expect(storyViewerCss).toMatch(/z-index:\s*calc\(var\(--z-modal\)\s*\+\s*200\);/);
  });

  it('verifies StoryBar.css has mobile responsive rules hiding scroll buttons and scaling items', () => {
    const storyBarCssPath = path.resolve(__dirname, '../components/story/StoryBar.css');
    const storyBarCss = fs.readFileSync(storyBarCssPath, 'utf8');

    expect(storyBarCss).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.story-scroll-btn\s*\{[\s\S]*display:\s*none/);
    expect(storyBarCss).toMatch(/@media\s*\(max-width:\s*360px\)/);
  });
});
