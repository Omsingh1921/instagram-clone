import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UploadProvider, useUpload } from '../context/UploadContext';
import BackgroundUploadWidget from '../components/common/BackgroundUploadWidget';
import CreatePostModal from '../components/modals/CreatePostModal';
import CreateReelModal from '../components/modals/CreateReelModal';
import CreateStoryModal from '../components/modals/CreateStoryModal';
import '../components/story/StoryViewerModal';
import StoryBar from '../components/story/StoryBar';

// Mock services
vi.mock('../services/media.service', () => ({
  default: {
    uploadMedia: vi.fn().mockResolvedValue({
      secureUrl: 'https://cloudinary.com/test-media.mp4',
      url: 'https://cloudinary.com/test-media.mp4',
      data: {
        secureUrl: 'https://cloudinary.com/test-media.mp4',
        url: 'https://cloudinary.com/test-media.mp4',
      },
    }),
  },
}));

vi.mock('../services/post.service', () => ({
  default: {
    createPost: vi.fn().mockResolvedValue({ id: 'post-123', success: true }),
    uploadMedia: vi.fn().mockResolvedValue({
      secureUrl: 'https://cloudinary.com/test-media.jpg',
      url: 'https://cloudinary.com/test-media.jpg',
      data: {
        secureUrl: 'https://cloudinary.com/test-media.jpg',
        url: 'https://cloudinary.com/test-media.jpg',
      },
    }),
  },
}));

vi.mock('../services/reel.service', () => ({
  default: {
    createReel: vi.fn().mockResolvedValue({ id: 'reel-123', success: true }),
    createDraft: vi.fn().mockResolvedValue({ id: 'reel-draft-1', success: true }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    createStory: vi.fn().mockResolvedValue({ id: 'story-123', success: true }),
    getStoryFeed: vi.fn().mockResolvedValue({
      data: [
        {
          user: { id: 'u1', username: 'om_thakur', fullName: 'Om Thakur' },
          stories: [
            {
              id: 'already-uploaded-1',
              mediaUrl: 'https://cloudinary.com/already-uploaded-1.jpg',
              mediaType: 'IMAGE',
              createdAt: new Date().toISOString(),
              viewed: true,
              viewCount: 5,
            },
          ],
          allViewed: true,
        },
      ],
    }),
    getUserStories: vi.fn().mockResolvedValue({
      data: {
        user: { id: 'u1', username: 'om_thakur' },
        stories: [
          {
            id: 'already-uploaded-1',
            mediaUrl: 'https://cloudinary.com/already-uploaded-1.jpg',
            mediaType: 'IMAGE',
            createdAt: new Date().toISOString(),
            viewed: true,
            viewCount: 5,
          },
        ],
        allViewed: true,
      },
    }),
    markStoryViewed: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', username: 'om_thakur', fullName: 'Om Thakur' },
  }),
}));

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
global.URL.revokeObjectURL = vi.fn();

// Test Component that triggers an upload via hook
const UploadTestTrigger = () => {
  const { startUpload } = useUpload();
  return (
    <button
      onClick={() => {
        startUpload({
          type: 'post',
          title: 'Test Background Post',
          thumbnail: 'blob:mock-thumb',
          task: async (updateProgress) => {
            updateProgress(40, 'Uploading image...');
            await new Promise((r) => setTimeout(r, 50));
            updateProgress(85, 'Saving to feed...');
          },
        });
      }}
    >
      Trigger Test Upload
    </button>
  );
};

describe('Background Upload System (Reels, Posts & Stories)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. UploadProvider and BackgroundUploadWidget display live background upload progress', async () => {
    render(
      <UploadProvider>
        <UploadTestTrigger />
        <BackgroundUploadWidget />
      </UploadProvider>
    );

    // Click trigger
    fireEvent.click(screen.getByText('Trigger Test Upload'));

    // Floating widget should appear in DOM
    await waitFor(() => {
      expect(screen.getByText('Test Background Post')).toBeInTheDocument();
    });

    // Check progress elements
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Eventually reaches completion
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Post shared successfully!')
      );
    });
  });

  it('2. CreatePostModal closes immediately on Share and executes background upload', async () => {
    const handleClose = vi.fn();
    const handlePostCreated = vi.fn();

    render(
      <UploadProvider>
        <CreatePostModal isOpen={true} onClose={handleClose} onPostCreated={handlePostCreated} />
        <BackgroundUploadWidget />
      </UploadProvider>
    );

    const file = new File(['post-photo'], 'vacation.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    // Transition to Edit Step -> click Next to Details
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));

    // Details step -> click Share
    await waitFor(() => {
      expect(screen.getByText('Share')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Share'));

    // Modal should close IMMEDIATELY (0ms waiting!)
    expect(handleClose).toHaveBeenCalled();

    // Floating Background Widget should display the upload in progress
    await waitFor(() => {
      expect(screen.getByText('New Post')).toBeInTheDocument();
    });

    // Complete background task
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Post shared successfully!')
      );
    });
  });

  it('3. CreateReelModal closes immediately on Share and executes background upload', async () => {
    const handleClose = vi.fn();
    const handleReelCreated = vi.fn();

    render(
      <UploadProvider>
        <CreateReelModal isOpen={true} onClose={handleClose} onReelCreated={handleReelCreated} />
        <BackgroundUploadWidget />
      </UploadProvider>
    );

    const videoFile = new File(['reel-video'], 'dance.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    // Edit step -> click Next
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));

    // Details step -> click Share
    await waitFor(() => {
      expect(screen.getByText('Share Reel')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Share Reel'));

    // Modal should close IMMEDIATELY
    expect(handleClose).toHaveBeenCalled();

    // Background upload widget displays Reel upload
    await waitFor(() => {
      expect(screen.getByText('New Reel')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Reel shared successfully!')
      );
    });
  });

  it('4. CreateStoryModal closes immediately on Your Story and executes background upload', async () => {
    const handleClose = vi.fn();
    const handleStoryCreated = vi.fn();

    render(
      <UploadProvider>
        <CreateStoryModal isOpen={true} onClose={handleClose} onStoryCreated={handleStoryCreated} />
        <BackgroundUploadWidget />
      </UploadProvider>
    );

    const storyFile = new File(['story-photo'], 'coffee.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [storyFile] } });

    // Edit Story -> click Your Story
    await waitFor(() => {
      expect(screen.getByText('Your Story')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Your Story'));

    // Modal should close IMMEDIATELY
    expect(handleClose).toHaveBeenCalled();

    // Background upload widget displays Story upload
    await waitFor(() => {
      expect(screen.getByText('Your Story')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Story added!')
      );
    });
  });

  it('5. StoryBar displays live uploading ring and "Uploading..." label when story upload is active', async () => {
    const StoryBarTestApp = () => {
      const { startUpload } = useUpload();
      return (
        <div>
          <button
            onClick={() => {
              startUpload({
                type: 'story',
                title: 'Your Story',
                thumbnail: 'blob:story-frame',
                task: async (updateProgress) => {
                  updateProgress(35, 'Uploading story...');
                  await new Promise((r) => setTimeout(r, 80));
                },
              });
            }}
          >
            Start Story Upload
          </button>
          <StoryBar />
        </div>
      );
    };

    render(
      <MemoryRouter>
        <UploadProvider>
          <StoryBarTestApp />
        </UploadProvider>
      </MemoryRouter>
    );

    // Click trigger to start story background upload
    fireEvent.click(screen.getByText('Start Story Upload'));

    // In StoryBar, label should change to "Uploading..." and spinning ring should be applied
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(document.querySelector('.avatar-ring-uploading')).toBeInTheDocument();
      expect(document.querySelector('.uploading-badge')).toBeInTheDocument();
    });
  });

  it('6. Clicking on uploading story in StoryBar opens StoryViewerModal with uploading indicator and live preview', async () => {
    let completeUploadResolve;
    const StoryBarTestApp = () => {
      const { startUpload } = useUpload();
      return (
        <div>
          <button
            onClick={() => {
              startUpload({
                type: 'story',
                title: 'Your Story',
                thumbnail: 'blob:story-preview-url',
                mediaUrl: 'blob:story-preview-url',
                mediaType: 'IMAGE',
                task: async (updateProgress) => {
                  updateProgress(42, 'Uploading story...');
                  await new Promise((r) => {
                    completeUploadResolve = r;
                  });
                },
              });
            }}
          >
            Start Active Story Upload
          </button>
          <StoryBar />
        </div>
      );
    };

    render(
      <MemoryRouter>
        <UploadProvider>
          <StoryBarTestApp />
        </UploadProvider>
      </MemoryRouter>
    );

    // 1. Start active story upload
    fireEvent.click(screen.getByText('Start Active Story Upload'));

    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    // 2. Click the user's uploading story circle in StoryBar
    const storyHolder = document.querySelector('.story-avatar-holder');
    expect(storyHolder).toBeInTheDocument();
    fireEvent.click(storyHolder);

    // 3. StoryViewerModal must OPEN immediately and show both already uploaded story AND currently uploading story!
    await waitFor(() => {
      expect(document.querySelector('.story-viewer-overlay')).toBeInTheDocument();
      // Verifies BOTH stories are present in the viewer:
      const progressBars = document.querySelectorAll('.story-progress-bar');
      expect(progressBars.length).toBe(2);
    });

    // 4. Tap right to the uploading story slide
    const tapRight = document.querySelector('.story-nav-tap.right');
    if (tapRight) {
      fireEvent.pointerDown(tapRight);
      fireEvent.pointerUp(tapRight);
      fireEvent.click(tapRight);
    }

    await waitFor(() => {
      expect(document.querySelector('.story-uploading-tag')).toBeInTheDocument();
      expect(document.querySelector('.story-viewer-uploading-card')).toBeInTheDocument();
      expect(screen.getByText(/Uploading your story/i)).toBeInTheDocument();
      expect(screen.getByText('42%')).toBeInTheDocument();
    });

    // Cleanup promise
    if (completeUploadResolve) completeUploadResolve();
  });

  it('renders UploadingPostCard with preview, progress bar, and carousel navigation during post upload', async () => {
    const { UploadingPostCard } = await import('../components/post/UploadingPostCard');

    const fakeUpload = {
      id: 'up_post_test',
      type: 'post',
      title: 'New Carousel Post',
      thumbnail: 'blob:http://localhost:5173/preview-1',
      mediaUrl: 'blob:http://localhost:5173/preview-1',
      mediaType: 'IMAGE',
      mediaItems: [
        { previewUrl: 'blob:http://localhost:5173/preview-1', type: 'IMAGE' },
        { previewUrl: 'blob:http://localhost:5173/preview-2', type: 'IMAGE' },
      ],
      caption: 'Testing optimistic carousel post upload',
      progress: 35,
      statusMessage: 'Sharing media 1 of 2...',
      status: 'uploading',
    };

    render(
      <MemoryRouter>
        <UploadingPostCard
          upload={fakeUpload}
          currentUser={{ username: 'om_thakur', avatarUrl: 'https://example.com/avatar.jpg' }}
        />
      </MemoryRouter>
    );

    // Verify banner, percentage and carousel badge
    expect(screen.getByText('Sharing Post to Feed...')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('Sharing media 1 of 2...')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('Testing optimistic carousel post upload')).toBeInTheDocument();

    // Verify next slide navigation works
    const nextBtn = screen.getByLabelText('Next slide');
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('BackgroundUploadWidget safely renders video element for video uploads without broken image icons', async () => {
    const TestVideoUploadApp = () => {
      const uploadCtx = useUpload();
      return (
        <div>
          <button
            onClick={() =>
              uploadCtx.startUpload({
                type: 'post',
                mediaType: 'VIDEO',
                title: 'New Video Post',
                thumbnail: 'blob:http://localhost:5173/video-thumb-1',
                task: async () => {},
              })
            }
          >
            Start Video Post Upload
          </button>
          <BackgroundUploadWidget />
        </div>
      );
    };

    render(
      <UploadProvider>
        <TestVideoUploadApp />
      </UploadProvider>
    );

    fireEvent.click(screen.getByText('Start Video Post Upload'));

    await waitFor(() => {
      expect(screen.getByText('New Video Post')).toBeInTheDocument();
      // Should render a <video> element inside the thumbnail wrap, NOT an <img>
      const videoEl = document.querySelector('.ig-bg-upload-thumb-wrap video');
      expect(videoEl).toBeInTheDocument();
      expect(videoEl.getAttribute('src')).toBe('blob:http://localhost:5173/video-thumb-1');
    });
  });
});

