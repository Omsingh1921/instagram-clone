import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { MobileHeader } from '../components/layout/MobileHeader';

describe('MobileHeader Responsive Layout', () => {
  it('renders brand logo and action buttons with dedicated classes', () => {
    const handleMenu = vi.fn();
    render(
      <MemoryRouter>
        <MobileHeader
          isAdmin={false}
          isAdminRoute={false}
          unreadNotifications={3}
          unreadChatCount={5}
          isMessagesRoute={false}
          onOpenMobileMenu={handleMenu}
          onOpenAdminDrawer={vi.fn()}
        />
      </MemoryRouter>
    );

    // Verify brand home link has mobile-brand-link class and aria-label
    const brandLink = screen.getByLabelText('Instagram Home');
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveClass('mobile-brand-link');

    // Verify search button has dedicated mobile-header-search-btn class
    const searchBtn = screen.getByLabelText('Search');
    expect(searchBtn).toBeInTheDocument();
    expect(searchBtn).toHaveClass('mobile-header-search-btn');

    // Verify notification dot is rendered
    const notifBtn = screen.getByLabelText('Notifications');
    expect(notifBtn).toBeInTheDocument();
    expect(notifBtn.querySelector('.nav-badge-dot')).toBeInTheDocument();

    // Verify message count is rendered
    const msgBtn = screen.getByLabelText('Messages');
    expect(msgBtn).toBeInTheDocument();
    expect(msgBtn).toHaveTextContent('5');

    // Verify menu button triggers onOpenMobileMenu
    const menuBtn = screen.getByLabelText('Open mobile menu');
    expect(menuBtn).toBeInTheDocument();
    fireEvent.click(menuBtn);
    expect(handleMenu).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenAdminDrawer when isAdmin and isAdminRoute are active', () => {
    const handleAdminDrawer = vi.fn();
    render(
      <MemoryRouter>
        <MobileHeader
          isAdmin={true}
          isAdminRoute={true}
          unreadNotifications={0}
          unreadChatCount={0}
          isMessagesRoute={false}
          onOpenMobileMenu={vi.fn()}
          onOpenAdminDrawer={handleAdminDrawer}
        />
      </MemoryRouter>
    );

    const brandLink = screen.getByLabelText('Instagram Home');
    expect(brandLink).toHaveAttribute('href', '/admin');

    const menuBtn = screen.getByLabelText('Open mobile menu');
    fireEvent.click(menuBtn);
    expect(handleAdminDrawer).toHaveBeenCalledTimes(1);
  });

  it('hides messages button when already on messages route', () => {
    render(
      <MemoryRouter>
        <MobileHeader
          isAdmin={false}
          isAdminRoute={false}
          unreadNotifications={0}
          unreadChatCount={0}
          isMessagesRoute={true}
          onOpenMobileMenu={vi.fn()}
          onOpenAdminDrawer={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText('Messages')).not.toBeInTheDocument();
  });

  it('verifies AppLayout.css contains responsive rules preventing icon collision', () => {
    const cssPath = path.resolve(__dirname, '../layouts/AppLayout.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Check flex-shrink and wordmark styling
    expect(cssContent).toMatch(/\.mobile-header\s+\.mobile-brand-link/);
    expect(cssContent).toMatch(/font-size:\s*clamp\(23px,\s*6\.2vw,\s*29px\)/);
    expect(cssContent).toMatch(/white-space:\s*nowrap/);

    // Check action buttons dynamic gap
    expect(cssContent).toMatch(/\.mobile-header-actions\s*\{[\s\S]*gap:\s*clamp\(/);

    // Check compact viewport media query hiding redundant search
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*420px\)\s*\{[\s\S]*\.mobile-header-search-btn\s*\{[\s\S]*display:\s*none\s*!important/);
  });
});
