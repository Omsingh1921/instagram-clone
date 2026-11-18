import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MessagesPage from '../pages/MessagesPage';
import chatService from '../services/chat.service';
import noteService from '../services/note.service';
import storyService from '../services/story.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/chat.service', () => ({
  default: {
    getConversations: vi.fn(),
    getOrCreateDirectConversation: vi.fn(),
    getConversationById: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    acceptMessageRequest: vi.fn().mockResolvedValue({ success: true }),
    declineMessageRequest: vi.fn().mockResolvedValue({ success: true }),
    updateGroupConversation: vi.fn().mockResolvedValue({ data: { name: 'Trip Squad Updated' } }),
    addGroupMembers: vi.fn().mockResolvedValue({ data: { members: [] } }),
    removeGroupMember: vi.fn().mockResolvedValue({ success: true }),
    leaveGroup: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../services/note.service', () => ({
  default: {
    getActiveNotesFeed: vi.fn().mockResolvedValue({ data: [] }),
    createOrUpdateNote: vi.fn(),
    deleteCurrentNote: vi.fn(),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getStoryFeed: vi.fn().mockResolvedValue({ data: [] }),
    getUserStories: vi.fn().mockResolvedValue({ data: { stories: [] } }),
    shareMentionedStory: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue({ data: [] }),
    followUser: vi.fn().mockResolvedValue({}),
    unfollowUser: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      data: {
        userId: '11111111-1111-1111-1111-111111111111',
        username: 'test',
        displayName: 'Test User',
      },
    }),
    searchUsers: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/websocket', () => ({
  default: {
    connect: vi.fn(),
    subscribe: vi.fn(() => () => { }),
    send: vi.fn(),
  },
}));

const renderMessages = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <MessagesPage />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('MessagesPage Redesign Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', 'mock_jwt_token');
    chatService.getConversations.mockResolvedValue({ data: { content: [] } });
    noteService.getActiveNotesFeed.mockResolvedValue({ data: [] });
  });

  it('renders search pill, note prompt, Messages/Requests tabs, and empty state CTA', async () => {
    renderMessages();

    expect(await screen.findByPlaceholderText('Search messages')).toBeTruthy();
    expect(await screen.findByText('Share a thought...')).toBeTruthy();
    expect(screen.getByText('Your note')).toBeTruthy();

    expect(screen.getByRole('tab', { name: 'Primary' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Requests' })).toHaveAttribute('aria-selected', 'false');

    expect(await screen.findByText('No messages yet')).toBeTruthy();
    expect(screen.getByText('Send a direct message to a friend or start a group chat.')).toBeTruthy();

    expect(screen.getByText('Your Messages')).toBeTruthy();
    expect(screen.getByText('Send private photos and messages to a friend or group.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeTruthy();
  });

  it('switches cleanly between Messages and Requests tabs', async () => {
    renderMessages();

    await screen.findByText('No messages yet');
    fireEvent.click(screen.getByRole('tab', { name: 'Requests' }));

    expect(screen.getByRole('tab', { name: 'Requests' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('No message requests')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Primary' }));
    expect(await screen.findByText('No messages yet')).toBeTruthy();
  });

  it('opens New message modal when Send Message CTA is clicked', async () => {
    renderMessages();

    const ctaBtn = await screen.findByRole('button', { name: /Send Message/i });
    fireEvent.click(ctaBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
  });

  it('portals New Note modal to document.body outside conversations-sidebar so chat pane cannot overlap it', async () => {
    const { container } = renderMessages();

    const yourNoteBtn = await screen.findByText('Your note');
    fireEvent.click(yourNoteBtn);

    const dialog = await screen.findByRole('dialog');
    expect(screen.getByText('New Note')).toBeTruthy();
    expect(container.querySelector('.conversations-sidebar')?.contains(dialog)).toBe(false);
    expect(dialog.parentElement).toBe(document.body);
  });

  it('creates, updates, and deletes a Note through real noteService API contracts', async () => {
    noteService.createOrUpdateNote.mockResolvedValue({
      data: {
        id: 'note-1',
        text: 'Coffee time',
        isOwnNote: true,
        user: { id: '11111111-1111-1111-1111-111111111111', username: 'test' },
      },
    });
    noteService.deleteCurrentNote.mockResolvedValue({ success: true });

    renderMessages();

    fireEvent.click(await screen.findByText('Your note'));
    expect(screen.queryByPlaceholderText(/Add music or track name/i)).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/Share a thought \(up to 60 chars\)/i), {
      target: { value: 'Coffee time' },
    });

    noteService.getActiveNotesFeed.mockResolvedValue({
      data: [
        {
          id: 'note-1',
          text: 'Coffee time',
          isOwnNote: true,
          user: { id: '11111111-1111-1111-1111-111111111111', username: 'test' },
        },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: /^Share$/i }));

    await waitFor(() => {
      expect(noteService.createOrUpdateNote).toHaveBeenCalledWith({
        text: 'Coffee time',
      });
    });

    expect(await screen.findByText('Coffee time')).toBeTruthy();

    fireEvent.click(screen.getByText('Your note'));
    expect(await screen.findByText('Your Note')).toBeTruthy();

    noteService.getActiveNotesFeed.mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByRole('button', { name: /Delete note/i }));

    await waitFor(() => {
      expect(noteService.deleteCurrentNote).toHaveBeenCalledTimes(1);
    });
  });

  it('loads REQUESTS folder conversations, displays request banner, and promotes on Accept', async () => {
    const requestConv = {
      id: '99999999-9999-9999-9999-999999999999',
      folder: 'REQUESTS',
      members: [
        { userId: '11111111-1111-1111-1111-111111111111', username: 'test', displayName: 'Test User' },
        { userId: '22222222-2222-2222-2222-222222222222', username: 'stranger', displayName: 'Stranger User' },
      ],
      lastMessage: {
        id: 'msg-req-1',
        content: 'Hey from non-follower',
        messageType: 'TEXT',
        createdAt: new Date().toISOString(),
        sender: { id: '22222222-2222-2222-2222-222222222222', username: 'stranger' },
      },
      unreadCount: 1,
    };

    chatService.getConversations.mockImplementation((_page, _size, folder) =>
      Promise.resolve({
        data: { content: folder === 'REQUESTS' ? [requestConv] : [] },
      })
    );
    chatService.getMessages.mockResolvedValue({
      data: { content: [requestConv.lastMessage] },
    });

    renderMessages();

    // Primary Messages tab starts empty while Requests tab displays badge count 1
    expect(await screen.findByText('No messages yet')).toBeTruthy();
    const requestsTab = screen.getByRole('tab', { name: 'Requests' });
    expect(requestsTab).toHaveTextContent('1');

    // Switch to Requests tab -> see the request conversation and click to open it
    fireEvent.click(requestsTab);
    const reqItem = await screen.findByText('Stranger User');
    expect(screen.getByText(/Hey from non-follower/)).toBeTruthy();
    fireEvent.click(reqItem);

    // Accept banner appears above composer
    const acceptBtn = await screen.findByRole('button', { name: 'Accept' });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(chatService.acceptMessageRequest).toHaveBeenCalledWith(requestConv.id);
    });
    expect(screen.getByRole('tab', { name: 'Primary' })).toHaveAttribute('aria-selected', 'true');
    expect((await screen.findAllByText('Stranger User')).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
  });

  it('shows note story ring circle only when active story is available', async () => {
    storyService.getStoryFeed.mockResolvedValue({ data: [] });
    storyService.getUserStories.mockResolvedValue({ data: { stories: [] } });
    noteService.getActiveNotesFeed.mockResolvedValue({
      data: [
        {
          id: 'note-friend-1',
          text: 'Chilling',
          isOwnNote: false,
          user: { id: 'friend-9', username: 'no_story_friend' },
        },
      ],
    });

    const { container, unmount } = renderMessages();
    await screen.findByText('Your note');
    await screen.findByText('no_story_friend');
    expect(container.querySelectorAll('.note-avatar-ring')).toHaveLength(0);
    expect(container.querySelectorAll('.note-avatar-plain')).toHaveLength(2);
    unmount();

    // When active story IS available for user & friend, show circle line
    storyService.getStoryFeed.mockResolvedValue({
      data: [
        {
          user: { id: 'friend-9', username: 'no_story_friend' },
          stories: [{ id: 's-f1' }],
        },
      ],
    });
    storyService.getUserStories.mockResolvedValue({
      data: { stories: [{ id: 's-me' }] },
    });

    const withStories = renderMessages();
    await screen.findByText('Your note');
    await waitFor(() => {
      expect(withStories.container.querySelectorAll('.note-avatar-ring')).toHaveLength(2);
    });
  });

  it('renders story mention DM card with "Mentioned you in their story" and "Add this to your story" button', async () => {
    const mentionConv = {
      id: 'conv-mention-1',
      isGroup: false,
      folder: 'PRIMARY',
      members: [
        { id: 'user-creator', username: 'story_creator', displayName: 'Creator' },
        { id: 'u-1', username: 'test', displayName: 'Test User' },
      ],
      lastMessage: {
        id: 'msg-mention-1',
        sender: { id: 'user-creator', username: 'story_creator' },
        messageType: 'STORY_SHARE',
        content: 'Mentioned you in their story',
        mediaUrl: 'https://cloudinary.com/test.jpg#storyId=story-999&mediaType=IMAGE',
        createdAt: new Date().toISOString(),
      },
      unreadCount: 0,
    };

    chatService.getConversations.mockResolvedValue({ data: { content: [mentionConv] } });
    chatService.getMessages.mockResolvedValue({
      data: {
        content: [
          {
            id: 'msg-mention-1',
            sender: { id: 'user-creator', username: 'story_creator' },
            messageType: 'STORY_SHARE',
            content: 'Mentioned you in their story',
            mediaUrl: 'https://cloudinary.com/test.jpg#storyId=story-999&mediaType=IMAGE',
            createdAt: new Date().toISOString(),
          },
        ],
        totalPages: 1,
        last: true,
      },
    });

    renderMessages();
    await screen.findByText('Creator');
    expect(screen.getByText(/Mentioned you in their story/i)).toBeTruthy();

    fireEvent.click(screen.getByText('Creator'));

    const addBtn = await screen.findByRole('button', { name: /Add this to your story/i });
    expect(addBtn).toBeTruthy();

    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(storyService.shareMentionedStory).toHaveBeenCalledWith('story-999');
    });
    expect((await screen.findAllByText(/Added to your story/i)).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Group Details modal on clicking Info and displays members and actions', async () => {
    chatService.getConversations.mockResolvedValue({
      data: {
        content: [
          {
            id: 'group-100',
            type: 'GROUP',
            name: 'Trip Squad',
            folder: 'PRIMARY',
            creatorId: '11111111-1111-1111-1111-111111111111',
            members: [
              { id: '11111111-1111-1111-1111-111111111111', username: 'test', displayName: 'Test User' },
              { id: '22222222-2222-2222-2222-222222222222', username: 'ram', displayName: 'Ram' },
              { id: '33333333-3333-3333-3333-333333333333', username: 'shyam', displayName: 'Shyam' },
            ],
            unreadCount: 0,
            lastMessage: null,
          },
        ],
      },
    });

    chatService.getMessages.mockResolvedValue({
      data: {
        content: [],
        totalPages: 1,
        last: true,
      },
    });

    renderMessages();
    await screen.findByText('Trip Squad');
    fireEvent.click(screen.getByText('Trip Squad'));

    // Verify group subtext showing 3 members
    expect(await screen.findByText('3 members')).toBeTruthy();

    // Click Conversation details (Info button)
    const infoBtn = screen.getByTitle('Conversation details');
    fireEvent.click(infoBtn);

    // Modal opens with Details, members, and quick actions
    expect(await screen.findByText('Details')).toBeTruthy();
    expect(screen.getByText('Change name')).toBeTruthy();
    expect(screen.getByText('Add people')).toBeTruthy();
    expect(screen.getByText('Leave')).toBeTruthy();
    expect(screen.getByText('ram')).toBeTruthy();
    expect(screen.getByText('shyam')).toBeTruthy();
  });
});

