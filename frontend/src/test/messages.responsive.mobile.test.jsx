import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { ConversationSidebar } from '../components/chat/ConversationSidebar';
import { ConversationsList } from '../components/chat/ConversationsList';
import { MobileHeader } from '../components/layout/MobileHeader';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u-1', username: 'ram' },
    isAuthenticated: true,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../services/note.service', () => ({
  default: {
    getActiveNotesFeed: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getStoryFeed: vi.fn().mockResolvedValue([]),
    getUserStories: vi.fn().mockResolvedValue([]),
  },
}));

describe('Messages Page Dynamic Phone Web Responsive Suite', () => {
  it('renders ConversationSidebar with mobile back button, username, search, and new chat trigger', () => {
    const mockUser = { id: 'u-1', username: 'ram' };

    render(
      <MemoryRouter>
        <ConversationSidebar
          currentUser={mockUser}
          currentUsername="ram"
          activeConversation={null}
          loadingConvs={false}
          activeInboxTab="primary"
          setActiveInboxTab={vi.fn()}
          convSearchTerm=""
          setConvSearchTerm={vi.fn()}
          requestConversations={[]}
          filteredConversations={[]}
          filteredRequestConversations={[]}
          onSelectConversation={vi.fn()}
          onOpenNewChat={vi.fn()}
          onSelectUserForChat={vi.fn()}
        />
      </MemoryRouter>
    );

    // Mobile back button to navigate back to feed
    const backBtn = screen.getByRole('button', { name: /Back to home/i });
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveClass('conversations-mobile-back-btn');

    // Username display
    expect(screen.getByText('ram')).toBeInTheDocument();

    // New Message trigger
    expect(screen.getByRole('button', { name: /New Message/i })).toBeInTheDocument();

    // Search input and pill styling
    const searchInput = screen.getByPlaceholderText(/Search messages/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveClass('conversations-search-input');
    const searchBar = document.querySelector('.conversations-search-bar');
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toHaveClass('conversations-search-inner');
  });

  it('renders conversation items with proper meta box and single-line snippet class', () => {
    const mockConversations = [
      {
        id: 'c-1',
        type: 'DIRECT',
        unreadCount: 1,
        members: [
          { id: 'u-1', username: 'ram' },
          { id: 'u-2', username: 'test1', displayName: 'test1', avatarUrl: 'https://example.com/test1.jpg' },
        ],
        lastMessage: {
          content: 'Mentioned you in their story',
          messageType: 'TEXT',
          createdAt: new Date().toISOString(),
        },
      },
    ];

    render(
      <MemoryRouter>
        <ConversationsList
          activeInboxTab="primary"
          setActiveInboxTab={vi.fn()}
          filteredConversations={mockConversations}
          loadingConvs={false}
          convSearchTerm=""
          activeConversation={null}
          currentUsername="ram"
          onSelectConversation={vi.fn()}
          getOtherMember={() => ({
            id: 'u-2',
            username: 'test1',
            displayName: 'test1',
            avatarUrl: 'https://example.com/test1.jpg',
          })}
        />
      </MemoryRouter>
    );

    // Recipient name
    expect(screen.getByText('test1')).toHaveClass('conversation-recipient-name');

    // Last message snippet
    const snippet = screen.getByText(/Mentioned you in their story/i);
    expect(snippet).toHaveClass('conversation-last-message');
  });

  it('verifies MobileHeader adds is-messages-route class when on messages route', () => {
    const { container } = render(
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

    expect(container.querySelector('.mobile-header.is-messages-route')).toBeInTheDocument();
  });

  it('verifies AppLayout.css contains rules removing 72px margin and hiding duplicate mobile header on /messages', () => {
    const cssPath = path.resolve(__dirname, '../layouts/AppLayout.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // On mobile: Hide duplicate feed header on /messages
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.mobile-header\.is-messages-route\s*\{[\s\S]*display:\s*none\s*!important;/);

    // On mobile: Messages mode must always span 100% full width with 0 left margin
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.app-main-content\.messages-mode\s*\{[\s\S]*margin-left:\s*0\s*!important;[\s\S]*width:\s*100%\s*!important;/);
  });

  it('verifies MessagesPage.css contains responsive rules for single-line snippets and mobile layout', () => {
    const cssPath = path.resolve(__dirname, '../pages/MessagesPage.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Search bar flex pill styling
    expect(cssContent).toMatch(/\.conversations-search-bar\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;/);
    expect(cssContent).toMatch(/\.conversations-search-bar\s+input\s*\{[\s\S]*border:\s*none/);

    // Snippet single-line ellipsis styles
    expect(cssContent).toMatch(/\.conversation-last-message\s*\{[\s\S]*white-space:\s*nowrap;[\s\S]*text-overflow:\s*ellipsis;/);

    // Mobile layout 100% width and back button
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.conversations-mobile-back-btn\s*\{[\s\S]*display:\s*inline-flex;/);
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.conversations-sidebar\.hidden-mobile\s*\{[\s\S]*display:\s*none\s*!important;/);
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*\.chat-window\.hidden-mobile\s*\{[\s\S]*display:\s*none\s*!important;/);
  });

  it('renders both group and normal chat items and verifies unified avatar circle dimensions', () => {
    const mockConversations = [
      {
        id: 'c-1',
        type: 'DIRECT',
        unreadCount: 0,
        members: [
          { id: 'u-1', username: 'ram' },
          { id: 'u-2', username: 'test1', displayName: 'test1', avatarUrl: 'https://example.com/test1.jpg' },
        ],
        lastMessage: {
          content: 'Mentioned you in their story',
          messageType: 'TEXT',
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: 'c-2',
        type: 'GROUP',
        name: '444',
        unreadCount: 0,
        members: [
          { id: 'u-1', username: 'ram' },
          { id: 'u-2', username: 'test1' },
          { id: 'u-3', username: 'test4' },
        ],
        lastMessage: {
          content: 'Group audio call',
          messageType: 'CALL',
          createdAt: new Date().toISOString(),
        },
      },
    ];

    const { container } = render(
      <MemoryRouter>
        <ConversationsList
          activeInboxTab="primary"
          setActiveInboxTab={vi.fn()}
          filteredConversations={mockConversations}
          loadingConvs={false}
          convSearchTerm=""
          activeConversation={null}
          currentUsername="ram"
          onSelectConversation={vi.fn()}
          getOtherMember={(conv) =>
            conv.type === 'GROUP'
              ? null
              : { id: 'u-2', username: 'test1', displayName: 'test1', avatarUrl: 'https://example.com/test1.jpg' }
          }
        />
      </MemoryRouter>
    );

    // Direct chat avatar
    const directAvatar = container.querySelector('.conversation-item .avatar-wrapper');
    expect(directAvatar).toBeInTheDocument();

    // Group chat avatar bubble
    const groupAvatar = container.querySelector('.conversation-item .group-avatar-icon-bubble');
    expect(groupAvatar).toBeInTheDocument();

    // Verify CSS contains 56px identical dimensions for both
    const cssPath = path.resolve(__dirname, '../pages/MessagesPage.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).toMatch(
      /\.conversation-item\s+\.avatar-wrapper,\s*\.conversation-item\s+\.group-avatar-icon-bubble\s*\{[\s\S]*width:\s*56px;[\s\S]*height:\s*56px;/
    );
    expect(cssContent).toMatch(
      /\.chat-header-avatar,\s*\.chat-recipient-info\s+\.group-avatar-icon-bubble\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/
    );
  });
});
