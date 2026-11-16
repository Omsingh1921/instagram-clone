import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReelsPage from '../pages/ReelsPage';
import reelService from '../services/reel.service';

const mockAuthUser = vi.hoisted(() => ({ id: 'me-1', username: 'viewer_user' }));
const mockIsFollowing = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockToggleFollow = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const mockToast = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn() }));
const mockUploadCtx = vi.hoisted(() => ({ uploads: [] }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isFollowing: mockIsFollowing,
    toggleFollow: mockToggleFollow,
    isAdmin: false,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => mockToast,
}));

vi.mock('../context/UploadContext', () => ({
  useUpload: () => mockUploadCtx,
}));

vi.mock('../services/reel.service', () => ({
  default: {
    getReels: vi.fn(),
    getFollowingReels: vi.fn(),
    getReelById: vi.fn(),
    recordView: vi.fn().mockResolvedValue({}),
    toggleLike: vi.fn().mockResolvedValue({}),
    saveReel: vi.fn().mockResolvedValue({}),
    markNotInterested: vi.fn().mockResolvedValue({}),
  },
}));

const sampleReels = [
  {
    id: 'r-1',
    videoUrl: 'https://example.com/reel1.mp4',
    caption: 'First sunset reel',
    audioTitle: 'Golden Hour',
    audioArtist: 'creator_one',
    likeCount: 14,
    commentCount: 2,
    shareCount: 1,
    author: { id: 'a-1', username: 'creator_one', hasActiveStory: true },
  },
  {
    id: 'r-2',
    videoUrl: 'https://example.com/reel2.mp4',
    caption: 'Second city reel',
    audioTitle: 'City Nights',
    audioArtist: 'creator_two',
    likeCount: 22,
    commentCount: 5,
    shareCount: 3,
    author: { id: 'a-2', username: 'creator_two', hasActiveStory: false },
  },
];

const renderReels = () =>
  render(
    <MemoryRouter>
      <ReelsPage />
    </MemoryRouter>
  );

describe('ReelsPage Redesign & Controls Removal Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
    reelService.getReels.mockResolvedValue({ data: { content: sampleReels } });
    reelService.getFollowingReels.mockResolvedValue({ data: { content: [sampleReels[1]] } });
  });

  it('removes the floating up/down and 1/1 counter controls while rendering redesigned feed pills and conditional story ring', async () => {
    const { container } = renderReels();

    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    // Up/down buttons and counter are removed
    expect(container.querySelector('.reels-nav-controls')).toBeNull();
    expect(container.querySelector('.reels-nav-counter')).toBeNull();
    expect(screen.queryByLabelText('Previous Reel')).toBeNull();
    expect(screen.queryByLabelText('Next Reel')).toBeNull();

    // Top For You / Following tabs work cleanly
    expect(screen.getByRole('tab', { name: 'For You' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Following' })).toHaveAttribute('aria-selected', 'false');

    // Creator 1 has active story -> renders story ring
    expect(container.querySelectorAll('.avatar-ring-unseen').length).toBe(1);

    // Top stage header renders outside the reel card with feed tabs + Mute + Reel options
    const topbar = container.querySelector('.reels-stage-topbar');
    const card = container.querySelector('.reel-card-item');
    expect(topbar).not.toBeNull();
    expect(card).not.toBeNull();
    expect(card.contains(topbar)).toBe(false);
    expect(topbar.querySelector('.reels-top-feed-switcher')).not.toBeNull();
    expect(topbar.querySelector('.reel-top-right-controls')).not.toBeNull();
    expect(card.querySelector('.reel-top-right-controls')).toBeNull();

    const muteBtn = screen.getByLabelText('Unmute');
    const optionsBtn = screen.getByLabelText('Reel options');
    expect(topbar.contains(muteBtn)).toBe(true);
    expect(topbar.contains(optionsBtn)).toBe(true);

    fireEvent.click(muteBtn);
    expect(screen.getByLabelText('Mute')).toBeInTheDocument();
  });

  it('supports keyboard ArrowDown navigation and switching to Following reels feed', async () => {
    const { container } = renderReels();

    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(await screen.findByText('Second city reel')).toBeInTheDocument();

    // Creator 2 has no active story -> no story ring
    expect(container.querySelectorAll('.avatar-ring-unseen').length).toBe(0);

    fireEvent.click(screen.getByRole('tab', { name: 'Following' }));
    await waitFor(() => {
      expect(reelService.getFollowingReels).toHaveBeenCalled();
    });
  });

  it('opens anchored floating three-dot popover on desktop without full-page modal backdrop and closes on toggle, Cancel, Escape, outside click, and reel change', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue() } });

    const { container } = renderReels();
    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    const topBtn = screen.getByLabelText('Reel options');
    const bottomBtn = screen.getByLabelText('More options');

    // Open from top button
    fireEvent.click(topBtn);
    const menu = screen.getByRole('menu', { name: 'Reel actions' });
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveAttribute('data-reel-id', 'r-1');
    expect(menu).toHaveAttribute('data-anchor', 'top');
    expect(topBtn).toHaveAttribute('aria-expanded', 'true');
    // Desktop must NOT render full-page backdrop or dialog
    expect(container.querySelector('.reel-options-backdrop')).toBeNull();
    expect(container.querySelector('.reel-options-mobile-scrim')).toBeNull();

    // Verify vertical options order: Report reel, Not interested, Copy link, Cancel
    const items = screen.getAllByRole('menuitem').map((el) => el.textContent);
    expect(items).toEqual(['Report reel', 'Not interested', 'Copy link', 'Cancel']);

    // Clicking the same three-dot button again toggles the menu closed
    fireEvent.click(topBtn);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(topBtn).toHaveAttribute('aria-expanded', 'false');

    // Open from bottom three-dot button and test Cancel
    fireEvent.click(bottomBtn);
    const bottomMenu = screen.getByRole('menu', { name: 'Reel actions' });
    expect(bottomMenu).toHaveAttribute('data-anchor', 'bottom');
    expect(bottomBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cancel' }));
    expect(screen.queryByRole('menu')).toBeNull();

    // Open and press Escape -> closes
    fireEvent.click(topBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();

    // Open and click an interactive element on the Reel (outside menu) -> closes AND keeps Reel interactive
    fireEvent.click(topBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    const likeBtn = container.querySelector('.reel-actions-column .reel-action-btn-item');
    fireEvent.click(likeBtn);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(reelService.toggleLike).toHaveBeenCalledWith('r-1');

    // Copy link preserves clipboard behavior and closes popover
    fireEvent.click(topBtn);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/reels/r-1'));
    expect(screen.queryByRole('menu')).toBeNull();

    // Opening on Reel 1 then navigating to Reel 2 closes Reel 1 menu; reopening binds to Reel 2
    fireEvent.click(topBtn);
    expect(screen.getByRole('menu')).toHaveAttribute('data-reel-id', 'r-1');
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(await screen.findByText('Second city reel')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByLabelText('Reel options'));
    expect(screen.getByRole('menu')).toHaveAttribute('data-reel-id', 'r-2');

    // Not interested calls backend service and closes menu
    fireEvent.click(screen.getByRole('menuitem', { name: 'Not interested' }));
    await waitFor(() => {
      expect(reelService.markNotInterested).toHaveBeenCalledWith('r-2');
    });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('uses compact bottom sheet mode on mobile viewports', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 844 });

    const { container } = renderReels();
    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Reel options'));
    const menu = screen.getByRole('menu', { name: 'Reel actions' });
    expect(menu).toHaveClass('mobile-sheet');
    expect(container.querySelector('.reel-options-mobile-scrim')).not.toBeNull();

    // Tapping scrim closes mobile sheet
    fireEvent.click(container.querySelector('.reel-options-mobile-scrim'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('positions floating menu beside the button when space allows and above/below without clipping when constrained', async () => {
    const { container } = renderReels();
    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    const bottomBtn = screen.getByLabelText('More options');
    // Mock bounding box at bottom-right of centered reel card with ample right-side desktop space
    vi.spyOn(bottomBtn, 'getBoundingClientRect').mockReturnValue({
      top: 700,
      bottom: 740,
      left: 800,
      right: 840,
      width: 40,
      height: 40,
    });

    fireEvent.click(bottomBtn);
    let menu = screen.getByRole('menu', { name: 'Reel actions' });
    expect(menu).toHaveAttribute('data-placement', 'beside-right');
    expect(Number.parseInt(menu.style.left, 10)).toBeGreaterThanOrEqual(840);

    // Close and move button close to viewport right edge + middle/left constrained so it falls back to above
    fireEvent.click(bottomBtn);
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 820 });
    bottomBtn.getBoundingClientRect.mockReturnValue({
      top: 700,
      bottom: 740,
      left: 180,
      right: 780,
      width: 40,
      height: 40,
    });

    fireEvent.click(bottomBtn);
    menu = screen.getByRole('menu', { name: 'Reel actions' });
    expect(menu).toHaveAttribute('data-placement', 'above');
    expect(Number.parseInt(menu.style.top, 10)).toBeLessThan(700);
    expect(Number.parseInt(menu.style.left, 10)).toBeLessThanOrEqual(820 - 220);

    expect(container.querySelector('.reel-options-backdrop')).toBeNull();
  });

  it('supports precision touchpad two-finger wheel accumulation and line-mode mouse wheel scrolling', async () => {
    const { container } = renderReels();
    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    const stage = container.querySelector('.reels-page-container');

    // Simulate precision touchpad small deltas (<30px each) summing past threshold
    fireEvent.wheel(stage, { deltaY: 12, deltaMode: 0 });
    fireEvent.wheel(stage, { deltaY: 14, deltaMode: 0 });
    fireEvent.wheel(stage, { deltaY: 18, deltaMode: 0 });

    expect(await screen.findByText('Second city reel')).toBeInTheDocument();

    // Fresh render to verify line-mode mouse wheel (deltaMode: 1) also scrolls cleanly
    const secondRender = renderReels();
    const secondStage = secondRender.container.querySelector('.reels-page-container');
    await waitFor(() => {
      expect(secondStage.querySelector('.reel-card-item')).not.toBeNull();
    });
    fireEvent.wheel(secondStage, { deltaY: 2, deltaMode: 1 });
    await waitFor(() => {
      expect(secondStage.textContent).toContain('Second city reel');
    });
  });

  it('supports finger touch swipe and desktop mouse click-drag scrolling', async () => {
    const { container } = renderReels();
    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    const stage = container.querySelector('.reels-page-container');

    // Finger swipe up -> next reel
    fireEvent.touchStart(stage, { touches: [{ clientY: 420, clientX: 200 }] });
    fireEvent.touchMove(stage, { touches: [{ clientY: 340, clientX: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientY: 300, clientX: 200 }] });
    expect(await screen.findByText('Second city reel')).toBeInTheDocument();

    // Finger swipe down -> previous reel
    fireEvent.touchStart(stage, { touches: [{ clientY: 260 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientY: 360 }] });
    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();

    // Mouse click-and-drag up -> next reel
    const videoEl = container.querySelector('.reel-video-element');
    fireEvent.mouseDown(videoEl, { button: 0, clientY: 400, clientX: 200 });
    fireEvent.mouseMove(window, { clientY: 310, clientX: 200 });
    fireEvent.mouseUp(window, { clientY: 300, clientX: 200 });
    expect(await screen.findByText('Second city reel')).toBeInTheDocument();

    // Mouse click-and-drag down -> previous reel
    fireEvent.mouseDown(container.querySelector('.reel-video-element'), { button: 0, clientY: 240, clientX: 200 });
    fireEvent.mouseMove(window, { clientY: 340, clientX: 200 });
    fireEvent.mouseUp(window, { clientY: 350, clientX: 200 });
    expect(await screen.findByText('First sunset reel')).toBeInTheDocument();
  });
});

