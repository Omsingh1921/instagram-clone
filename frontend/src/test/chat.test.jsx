import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import chatService from '../services/chat.service';
import userService from '../services/user.service';
import MessagesPage from '../pages/MessagesPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock dependencies
vi.mock('../services/chat.service', () => ({
  default: {
    getConversations: vi.fn(),
    getOrCreateDirectConversation: vi.fn(),
    getConversationById: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    getPinnedMessages: vi.fn().mockResolvedValue({ data: [] }),
    togglePinMessage: vi.fn().mockResolvedValue({ data: {} }),
    editMessage: vi.fn().mockResolvedValue({ data: {} }),
    forwardMessage: vi.fn().mockResolvedValue({ data: [] }),
    updateConversationFolder: vi.fn().mockResolvedValue({ success: true }),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    getUserPresence: vi.fn().mockResolvedValue({ data: { online: true } }),
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
        username: 'test1',
        displayName: 'Test One',
      },
    }),
    searchUsers: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/note.service', () => ({
  default: {
    getActiveNotesFeed: vi.fn().mockResolvedValue({ data: [] }),
    createOrUpdateNote: vi.fn().mockResolvedValue({}),
    deleteCurrentNote: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    getStoryFeed: vi.fn().mockResolvedValue({ data: [] }),
    getUserStories: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../services/websocket', () => ({
  default: {
    connect: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    send: vi.fn(),
  },
}));

describe('Chat & Messages Suite', () => {
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    userId: '11111111-1111-1111-1111-111111111111',
    username: 'test1',
  };

  const mockOtherUser = {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'test2',
    displayName: 'Test Two',
    avatarUrl: '/uploads/avatar2.jpg',
  };

  const mockConversation = {
    id: 'conv-id-test-3',
    members: [mockUser, mockOtherUser],
    lastMessage: { content: 'hello from test2', createdAt: new Date().toISOString() },
    unreadCount: 0,
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', 'mock_jwt_token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    userService.getCurrentUser.mockImplementation(() =>
      Promise.resolve({
        data: {
          id: '11111111-1111-1111-1111-111111111111',
          userId: '11111111-1111-1111-1111-111111111111',
          username: 'test1',
          displayName: 'Test One',
        },
      })
    );
    chatService.getConversations.mockResolvedValue({
      data: { content: [mockConversation] },
    });
  });

  it('renders conversations sidebar and placeholder correctly', async () => {
    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [mockConversation] },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Initial placeholder when no conversation is active
    expect(await screen.findByText('Your Messages')).toBeInTheDocument();
    expect(await screen.findByText('Test Two')).toBeInTheDocument();
  });

  it('shows single right tick on sent message when recipient has not yet read', async () => {
    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [mockConversation] },
    });

    // Only user A sent a message, recipient has not seen or replied
    chatService.getMessages.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 'msg-unseen',
            sender: mockUser,
            content: 'Unread by test2',
            createdAt: '2026-10-05T12:10:00',
            status: 'sent',
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const convItems = await screen.findAllByText('Test Two');
    const convItem = convItems[0];
    fireEvent.click(convItem);

    expect(await screen.findByText('Unread by test2')).toBeInTheDocument();

    await waitFor(() => {
      const msgBubble = screen.getByText('Unread by test2').closest('.message-bubble');
      expect(msgBubble).toHaveClass('mine');
      expect(msgBubble.querySelector('.status-check-single')).toBeInTheDocument();
    });
  });

  it('shows double right tick when recipient replied or seen', async () => {
    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [mockConversation] },
    });

    // msg-1 is seen because msg-2 was sent by other user afterwards
    chatService.getMessages.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 'msg-2',
            sender: mockOtherUser,
            content: 'I see your message',
            createdAt: '2026-10-05T12:05:00',
          },
          {
            id: 'msg-1',
            sender: mockUser,
            content: 'Sent earlier',
            createdAt: '2026-10-05T12:00:00',
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const convItems = await screen.findAllByText('Test Two');
    const convItem = convItems[0];
    fireEvent.click(convItem);

    expect(await screen.findByText('Sent earlier')).toBeInTheDocument();
    expect(await screen.findByText('I see your message')).toBeInTheDocument();

    await waitFor(() => {
      const sentBubble = screen.getByText('Sent earlier').closest('.message-bubble');
      expect(sentBubble).toHaveClass('mine');
      expect(sentBubble.querySelector('.status-check-double')).toBeInTheDocument();
    });
  });

  it('renders call snippet cleanly without phone emoji and toggles 3-dots conversation menu', async () => {
    const callConv = {
      id: '44444444-4444-4444-4444-444444444444',
      members: [mockUser, mockOtherUser],
      lastMessage: {
        messageType: 'CALL',
        content: 'Audio call ended',
        mediaUrl: 'call:AUDIO:ENDED:0',
        createdAt: new Date().toISOString(),
      },
      unreadCount: 0,
    };

    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [callConv] },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Call snippet displays cleanly without emoji
    expect(await screen.findByText(/Audio call ended/)).toBeInTheDocument();
    expect(screen.queryByText(/📞/)).toBeNull();

    // 3-dots menu button is present
    const moreBtn = screen.getByLabelText('More options');
    expect(moreBtn).toBeInTheDocument();

    // Clicking 3-dots opens context menu
    fireEvent.click(moreBtn);

    expect(await screen.findByText('Mark as unread')).toBeInTheDocument();
    expect(screen.getByText('Pin')).toBeInTheDocument();
    expect(screen.getByText('Mute')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders pin and edit buttons on messages and handles pinning', async () => {
    const pinMsg = {
      id: 'msg-pin-1',
      sender: mockUser,
      content: 'Hello World',
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      isPinnedInChat: false,
    };

    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [mockConversation] },
    });
    chatService.getMessages.mockResolvedValueOnce({
      data: { content: [pinMsg], last: true },
    });
    chatService.togglePinMessage.mockResolvedValueOnce({
      data: { ...pinMsg, isPinnedInChat: true },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const convItem = await screen.findByText('Test Two');
    fireEvent.click(convItem);

    expect(await screen.findByText('Hello World')).toBeInTheDocument();

    const pinBtn = screen.getByTitle('Pin message');
    expect(pinBtn).toBeInTheDocument();

    fireEvent.click(pinBtn);

    await waitFor(() => {
      expect(chatService.togglePinMessage).toHaveBeenCalledWith(mockConversation.id, 'msg-pin-1');
    });
  });

  it('renders forwarded indicator and allows forwarding messages', async () => {
    const forwardedMsg = {
      id: 'msg-fwd-1',
      conversationId: mockConversation.id,
      sender: mockOtherUser,
      senderId: mockOtherUser.id,
      content: 'Important forwarded message',
      messageType: 'TEXT',
      isForwarded: true,
      createdAt: new Date().toISOString(),
    };

    const targetConv = {
      id: 'conv-id-target-99',
      members: [mockUser, { id: '33333333-3333-3333-3333-333333333333', username: 'target_friend', displayName: 'Target Friend' }],
      lastMessage: { content: 'hey', createdAt: new Date().toISOString() },
      unreadCount: 0,
    };

    chatService.getConversations.mockResolvedValue({
      data: { content: [mockConversation, targetConv] },
    });
    chatService.getMessages.mockResolvedValueOnce({
      data: { content: [forwardedMsg], last: true },
    });
    chatService.forwardMessage.mockResolvedValueOnce({
      data: [{ ...forwardedMsg, id: 'msg-fwd-copy' }],
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const convItem = await screen.findByText('Test Two');
    fireEvent.click(convItem);

    expect(await screen.findByText('Important forwarded message')).toBeInTheDocument();
    expect(screen.getByText('Forwarded')).toBeInTheDocument();

    const forwardBtns = screen.getAllByTitle('Forward message');
    expect(forwardBtns.length).toBeGreaterThan(0);
    fireEvent.click(forwardBtns[0]);

    // Modal opens
    expect(await screen.findByText(/Forward Message/i)).toBeInTheDocument();
    expect(await screen.findByText('target_friend')).toBeInTheDocument();

    // Select target conversation
    const targetItem = screen.getByText('target_friend');
    fireEvent.click(targetItem);

    // Click Send
    const sendBtn = screen.getByRole('button', { name: /^Send$/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(chatService.forwardMessage).toHaveBeenCalledWith(
        mockConversation.id,
        'msg-fwd-1',
        ['conv-id-target-99']
      );
    });
  });

  it('supports Primary and General inbox folder tabs and moving conversations between folders', async () => {
    const primaryConv = {
      id: 'conv-primary-1',
      folder: 'PRIMARY',
      members: [mockUser, { id: 'user-p', username: 'primary_friend', displayName: 'Primary Friend' }],
      lastMessage: { content: 'hello in primary', createdAt: new Date().toISOString() },
      unreadCount: 0,
    };
    const generalConv = {
      id: 'conv-general-1',
      folder: 'GENERAL',
      members: [mockUser, { id: 'user-g', username: 'general_friend', displayName: 'General Friend' }],
      lastMessage: { content: 'hello in general', createdAt: new Date().toISOString() },
      unreadCount: 0,
    };

    chatService.getConversations.mockResolvedValue({
      data: { content: [primaryConv, generalConv] },
    });
    chatService.getMessages.mockResolvedValue({
      data: { content: [], last: true },
    });
    chatService.updateConversationFolder.mockResolvedValue({
      success: true,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Initial Primary tab should be active
    const primaryTab = await screen.findByRole('tab', { name: 'Primary' });
    const generalTab = screen.getByRole('tab', { name: 'General' });
    const requestsTab = screen.getByRole('tab', { name: 'Requests' });

    expect(primaryTab).toHaveClass('active');
    expect(generalTab).toBeInTheDocument();
    expect(requestsTab).toBeInTheDocument();
    expect(await screen.findByText('Primary Friend')).toBeInTheDocument();
    expect(screen.queryByText('General Friend')).toBeNull();

    // Switch to General tab
    fireEvent.click(generalTab);
    expect(generalTab).toHaveClass('active');
    expect(await screen.findByText('General Friend')).toBeInTheDocument();
    expect(screen.queryByText('Primary Friend')).toBeNull();

    // Switch back to Primary tab
    fireEvent.click(primaryTab);
    expect(await screen.findByText('Primary Friend')).toBeInTheDocument();

    // Open conversation more options menu on Primary Friend
    const moreOptionsBtns = screen.getAllByLabelText('More options');
    fireEvent.click(moreOptionsBtns[0]);

    // Click "Move to General"
    const moveToGeneralBtn = await screen.findByText('Move to General');
    fireEvent.click(moveToGeneralBtn);

    await waitFor(() => {
      expect(chatService.updateConversationFolder).toHaveBeenCalledWith('conv-primary-1', 'GENERAL');
    });
  });
});
