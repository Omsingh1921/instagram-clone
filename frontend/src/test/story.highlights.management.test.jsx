import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AddToHighlightModal } from '../components/modals/AddToHighlightModal';
import { EditHighlightModal } from '../components/modals/EditHighlightModal';
import { StoryViewerModal } from '../components/story/StoryViewerModal';
import storyService from '../services/story.service';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/story.service', () => ({
  default: {
    getUserHighlights: vi.fn(),
    getHighlightById: vi.fn(),
    createHighlight: vi.fn(),
    updateHighlight: vi.fn(),
    deleteHighlight: vi.fn(),
    addStoriesToHighlight: vi.fn(),
    removeStoryFromHighlight: vi.fn(),
    getUserStories: vi.fn(),
    getStoryArchive: vi.fn(),
    deleteStory: vi.fn(),
    markStoryViewed: vi.fn().mockResolvedValue({ success: true }),
    toggleLikeStory: vi.fn().mockResolvedValue({ data: { liked: true } }),
    getStoryViewers: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// Mock current logged in user
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-me', username: 'current_user', displayName: 'Current User' },
    isAdmin: false,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Story Highlights Management & Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AddToHighlightModal', () => {
    it('renders user highlights and + New option, and adds story on selection', async () => {
      const mockStory = { id: 'story-active-1', mediaUrl: 'https://img.test/story1.jpg' };
      const mockHighlights = [
        { id: 'hl-1', title: 'Vacation 🏖️', coverImageUrl: 'https://img.test/cover1.jpg' },
      ];
      storyService.getUserHighlights.mockResolvedValueOnce({ data: mockHighlights });
      storyService.addStoriesToHighlight.mockResolvedValueOnce({ data: { id: 'hl-1' } });

      const onHighlightAdded = vi.fn();
      const onClose = vi.fn();

      render(
        <ToastProvider>
          <AddToHighlightModal
            isOpen={true}
            onClose={onClose}
            story={mockStory}
            onHighlightAdded={onHighlightAdded}
          />
        </ToastProvider>
      );

      expect(screen.getByText('Add to Highlight')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('Vacation 🏖️')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Vacation 🏖️'));

      await waitFor(() => {
        expect(storyService.addStoriesToHighlight).toHaveBeenCalledWith('hl-1', ['story-active-1']);
        expect(onHighlightAdded).toHaveBeenCalledWith(mockHighlights[0]);
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('triggers onCreateNewRequested when clicking New', async () => {
      const mockStory = { id: 'story-active-1', mediaUrl: 'https://img.test/story1.jpg' };
      storyService.getUserHighlights.mockResolvedValueOnce({ data: [] });
      const onCreateNewRequested = vi.fn();
      const onClose = vi.fn();

      render(
        <ToastProvider>
          <AddToHighlightModal
            isOpen={true}
            onClose={onClose}
            story={mockStory}
            onCreateNewRequested={onCreateNewRequested}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New'));
      expect(onClose).toHaveBeenCalled();
      expect(onCreateNewRequested).toHaveBeenCalledWith(mockStory);
    });
  });

  describe('EditHighlightModal', () => {
    it('loads highlight, removes a story, adds from archive, and updates title', async () => {
      const mockHlDetail = {
        id: 'hl-123',
        title: 'Old Title',
        coverImageUrl: 'https://img.test/cover.jpg',
        stories: [
          { id: 'st-1', mediaUrl: 'https://img.test/st1.jpg' },
          { id: 'st-2', mediaUrl: 'https://img.test/st2.jpg' },
        ],
      };
      const mockArchive = {
        data: {
          content: [
            { id: 'st-arch-1', mediaUrl: 'https://img.test/arch1.jpg' },
          ],
        },
      };

      storyService.getHighlightById.mockResolvedValueOnce({ data: mockHlDetail });
      storyService.getUserStories.mockResolvedValueOnce({ data: { stories: [] } });
      storyService.getStoryArchive.mockResolvedValueOnce(mockArchive);
      storyService.updateHighlight.mockResolvedValueOnce({ data: { id: 'hl-123', title: 'New Title' } });

      const onHighlightUpdated = vi.fn();
      const onClose = vi.fn();

      render(
        <ToastProvider>
          <EditHighlightModal
            isOpen={true}
            onClose={onClose}
            highlightId="hl-123"
            onHighlightUpdated={onHighlightUpdated}
          />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Highlight')).toBeInTheDocument();
        expect(screen.getByText('Selected (2)')).toBeInTheDocument();
      });

      // Switch to Details tab and edit title
      fireEvent.click(screen.getByText('Title & Cover'));
      const titleInput = screen.getByPlaceholderText('Highlight name');
      expect(titleInput.value).toBe('Old Title');
      fireEvent.change(titleInput, { target: { value: 'Updated Highlight' } });

      // Switch to Add More tab and click the archived story tile to add it
      fireEvent.click(screen.getByText('Add More'));
      await waitFor(() => {
        expect(screen.getByTitle('Click to add to highlight')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTitle('Click to add to highlight'));

      // Save
      fireEvent.click(screen.getByText('Done'));
      await waitFor(() => {
        expect(storyService.updateHighlight).toHaveBeenCalledWith(
          'hl-123',
          expect.objectContaining({
            title: 'Updated Highlight',
            storyIds: expect.arrayContaining(['st-1', 'st-2', 'st-arch-1']),
          })
        );
        expect(onHighlightUpdated).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('StoryViewerModal Highlights Integration', () => {
    it('renders Highlight title badge and exposes Edit & Remove options in more menu', async () => {
      const mockHighlightGroup = [
        {
          id: 'highlight-group-1',
          isHighlight: true,
          highlightId: 'hl-555',
          highlightTitle: 'Travel 🌄',
          author: { id: 'user-me', username: 'current_user' },
          stories: [
            { id: 'story-hl-1', mediaUrl: 'https://img.test/hl1.jpg', createdAt: new Date().toISOString() },
            { id: 'story-hl-2', mediaUrl: 'https://img.test/hl2.jpg', createdAt: new Date().toISOString() },
          ],
        },
      ];

      storyService.removeStoryFromHighlight.mockResolvedValueOnce({ success: true });

      render(
        <MemoryRouter>
          <ToastProvider>
            <StoryViewerModal
              isOpen={true}
              storyGroups={mockHighlightGroup}
              initialGroupIdx={0}
              initialStoryIdx={0}
              onClose={vi.fn()}
            />
          </ToastProvider>
        </MemoryRouter>
      );

      // Verify Highlight Badge is rendered in header
      expect(screen.getByText('Travel 🌄')).toBeInTheDocument();

      // Verify Edit Highlight button in bottom bar
      expect(screen.getByText('Edit Highlight')).toBeInTheDocument();

      // Open More Options Menu
      const moreBtn = screen.getByLabelText('Story options');
      fireEvent.click(moreBtn);

      // Verify highlight-specific actions
      expect(screen.getByText('Remove from Highlight')).toBeInTheDocument();
      expect(screen.getByText('Delete Highlight')).toBeInTheDocument();

      // Click Remove from Highlight
      fireEvent.click(screen.getByText('Remove from Highlight'));
      await waitFor(() => {
        expect(storyService.removeStoryFromHighlight).toHaveBeenCalledWith('hl-555', 'story-hl-1');
      });
    });

    it('renders Highlight trigger button on author active story to open AddToHighlightModal', async () => {
      const mockActiveStoryGroup = [
        {
          id: 'active-group-1',
          isHighlight: false,
          author: { id: 'user-me', username: 'current_user' },
          stories: [
            { id: 'story-active-1', mediaUrl: 'https://img.test/active.jpg', createdAt: new Date().toISOString() },
          ],
        },
      ];

      storyService.getUserHighlights.mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <ToastProvider>
            <StoryViewerModal
              isOpen={true}
              storyGroups={mockActiveStoryGroup}
              initialGroupIdx={0}
              initialStoryIdx={0}
              onClose={vi.fn()}
            />
          </ToastProvider>
        </MemoryRouter>
      );

      // Highlight button in bottom bar
      const highlightBtn = screen.getByTitle('Add to Highlight');
      expect(highlightBtn).toBeInTheDocument();
      expect(screen.getByText('Highlight')).toBeInTheDocument();

      // Clicking opens AddToHighlightModal
      fireEvent.click(highlightBtn);
      await waitFor(() => {
        expect(screen.getByText('Add to Highlight')).toBeInTheDocument();
      });
    });
  });
});
