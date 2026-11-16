import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateReelModal from '../components/modals/CreateReelModal';

// Mock Lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
  };
});

// Mock services
vi.mock('../services/media.service', () => ({
  default: {
    uploadMedia: vi.fn().mockResolvedValue({
      secureUrl: 'https://cloudinary.com/reel-video.mp4',
      thumbnailUrl: 'https://cloudinary.com/reel-thumb.jpg',
    }),
  },
}));

vi.mock('../services/reel.service', () => ({
  default: {
    createReel: vi.fn().mockResolvedValue({ id: 'reel-123' }),
    createDraft: vi.fn().mockResolvedValue({ id: 'reel-draft-1' }),
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

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-reel-video-url');
global.URL.revokeObjectURL = vi.fn();

describe('CreateReelModal Crop, Trim & Right-Up Corner Save Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload dropzone initially and transitions to edit step when video is selected', async () => {
    render(<CreateReelModal isOpen={true} onClose={vi.fn()} onReelCreated={vi.fn()} />);

    expect(screen.getByText('Upload a Reel Video')).toBeInTheDocument();
    expect(screen.getByText('Select from computer')).toBeInTheDocument();

    const videoFile = new File(['mock video bytes'], 'reel-clip.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(0);

    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    // Should transition to EDIT step
    await waitFor(() => {
      expect(screen.getByText('Crop & Trim Reel')).toBeInTheDocument();
      expect(screen.getByText('Edit Reel')).toBeInTheDocument();
    });

    // Verify 9:16 (Reel) vertical format option is present and active by default
    const reelRatioBtn = screen.getByText('9:16 (Reel)');
    expect(reelRatioBtn).toBeInTheDocument();
    expect(reelRatioBtn.closest('button')).toHaveClass('active');

    // Other aspect ratio options are also present
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('1:1 (Square)')).toBeInTheDocument();
    expect(screen.getByText('4:5 (Portrait)')).toBeInTheDocument();

    // Verify Phone-style video trimmer is rendered at the bottom
    expect(screen.getByTestId('phone-video-trimmer')).toBeInTheDocument();
    expect(screen.getByLabelText('Drag to crop video start')).toBeInTheDocument();
    expect(screen.getByLabelText('Drag to crop video end')).toBeInTheDocument();
  });

  it('provides right-up corner Save button (✓) in both subnav and canvas to immediately save trim and edits', async () => {
    render(<CreateReelModal isOpen={true} onClose={vi.fn()} onReelCreated={vi.fn()} />);

    const videoFile = new File(['mock video bytes'], 'my-reel.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Edit Reel')).toBeInTheDocument();
    });

    // Verify Right-Up corner Save buttons exist
    const subnavSaveBtn = screen.getByLabelText('Save Reel Trim & Edits');
    expect(subnavSaveBtn).toBeInTheDocument();

    const canvasCornerSaveBtn = screen.getByLabelText('Save current trim');
    expect(canvasCornerSaveBtn).toBeInTheDocument();

    const sidebarSaveTrimBtn = screen.getByText('Save Trim');
    expect(sidebarSaveTrimBtn).toBeInTheDocument();

    // Click canvas corner Save button
    fireEvent.click(canvasCornerSaveBtn);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringMatching(/Reel trim saved!/));
    });

    // Click Reset
    const resetLink = screen.getByText('Reset');
    fireEvent.click(resetLink);
    expect(mockShowSuccess).toHaveBeenCalledWith('Reel trim reset to original.');
  });

  it('switches to filters tab and applies Instagram filters to reel', async () => {
    render(<CreateReelModal isOpen={true} onClose={vi.fn()} onReelCreated={vi.fn()} />);

    const videoFile = new File(['mock video bytes'], 'my-reel.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Edit Reel')).toBeInTheDocument();
    });

    // Switch to Filters tab
    const filtersTabBtn = screen.getByText('Filters');
    fireEvent.click(filtersTabBtn);

    // Verify filter presets are listed
    expect(screen.getByText('Clarendon')).toBeInTheDocument();
    expect(screen.getByText('Gingham')).toBeInTheDocument();
    expect(screen.getByText('Moon')).toBeInTheDocument();

    // Select Clarendon filter
    fireEvent.click(screen.getByText('Clarendon'));
    expect(screen.getByText('Clarendon').closest('button')).toHaveClass('active');
  });

  it('proceeds to Details step and submits reel post with trimmed video player and caption', async () => {
    const handleReelCreated = vi.fn();
    render(<CreateReelModal isOpen={true} onClose={vi.fn()} onReelCreated={handleReelCreated} />);

    const videoFile = new File(['mock video bytes'], 'my-reel.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Edit Reel')).toBeInTheDocument();
    });

    // Click Next button
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    // Should transition to DETAILS step
    await waitFor(() => {
      expect(screen.getByText('New Reel')).toBeInTheDocument();
    });

    // Enter caption
    const captionInput = screen.getByPlaceholderText(/Write a caption for your reel/);
    fireEvent.change(captionInput, { target: { value: 'Awesome weekend reel #trending' } });
    expect(captionInput.value).toBe('Awesome weekend reel #trending');

    // Click Share Reel
    const shareBtns = screen.getAllByText('Share Reel');
    expect(shareBtns.length).toBeGreaterThan(0);
    fireEvent.click(shareBtns[0]);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringMatching(/Reel shared successfully!/));
      expect(handleReelCreated).toHaveBeenCalled();
    });
  });
});

