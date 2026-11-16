import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreatePostModal, TrimmedVideoPlayer, PhoneVideoTrimmer } from '../components/modals/CreatePostModal';

// Mock Lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
  };
});

// Mock services
vi.mock('../services/post.service', () => ({
  default: {
    createPost: vi.fn().mockResolvedValue({ id: 'post-1', caption: 'Test' }),
    createCarouselPost: vi.fn().mockResolvedValue({ id: 'post-2' }),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    searchUsers: vi.fn().mockResolvedValue({ content: [] }),
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
global.URL.createObjectURL = vi.fn(() => 'blob:mock-image-url');
global.URL.revokeObjectURL = vi.fn();

describe('CreatePostModal Crop & Zoom Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders aspect ratio options and crop controls in edit step', async () => {
    render(<CreatePostModal isOpen={true} onClose={vi.fn()} onPostCreated={vi.fn()} />);

    // Upload an image file to transition to EDIT step
    const file = new File(['mock content'], 'test-photo.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(0);

    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    // Should be in EDIT step
    await waitFor(() => {
      expect(screen.getByText('Crop & Filters')).toBeInTheDocument();
    });

    // Switch to 'Adjust & Ratio' tab
    const adjustTabBtn = screen.getByText('Adjust & Ratio');
    fireEvent.click(adjustTabBtn);

    // Verify Aspect Ratio buttons are present
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('1:1 (Square)')).toBeInTheDocument();
    expect(screen.getByText('4:5 (Portrait)')).toBeInTheDocument();
    expect(screen.getByText('16:9 (Landscape)')).toBeInTheDocument();
    expect(screen.getByText('Custom (Free)')).toBeInTheDocument();

    // Verify Crop & Zoom section is present
    expect(screen.getByText('Crop & Zoom')).toBeInTheDocument();
    expect(screen.getByText('Custom Crop')).toBeInTheDocument();
    expect(screen.getByText('Zoom')).toBeInTheDocument();
    expect(screen.getByText('Rotate 90°')).toBeInTheDocument();

    // Verify Zoom Range slider exists
    const zoomSlider = screen.getByLabelText('Zoom Level');
    expect(zoomSlider).toBeInTheDocument();
    expect(zoomSlider.value).toBe('1');

    // Test Zoom change
    fireEvent.change(zoomSlider, { target: { value: '1.5' } });
    expect(screen.getByText('150%')).toBeInTheDocument();

    // Test Rotate 90° button
    const rotateBtn = screen.getByText('Rotate 90°');
    fireEvent.click(rotateBtn);

    // Reset button should now be available
    const resetBtn = screen.getByText('Reset Crop');
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);

    // Zoom should be reset to 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('toggles aspect ratios correctly', async () => {
    render(<CreatePostModal isOpen={true} onClose={vi.fn()} onPostCreated={vi.fn()} />);

    const file = new File(['mock content'], 'photo.png', { type: 'image/png' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Crop & Filters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Adjust & Ratio'));

    // Select 4:5 Portrait
    const portraitBtn = screen.getByText('4:5 (Portrait)');
    fireEvent.click(portraitBtn);
    expect(portraitBtn.closest('button')).toHaveClass('active');

    // Select 16:9 Landscape
    const landscapeBtn = screen.getByText('16:9 (Landscape)');
    fireEvent.click(landscapeBtn);
    expect(landscapeBtn.closest('button')).toHaveClass('active');

    // Select Custom (Free)
    const customRatioBtn = screen.getByText('Custom (Free)');
    fireEvent.click(customRatioBtn);
    expect(customRatioBtn.closest('button')).toHaveClass('active');

    // Interactive custom crop frame should appear
    const cropFrame = document.querySelector('.ig-custom-crop-frame');
    expect(cropFrame).toBeInTheDocument();

    // Verify Corner and Edge handles exist
    expect(document.querySelector('.handle-nw')).toBeInTheDocument();
    expect(document.querySelector('.handle-se')).toBeInTheDocument();
    expect(document.querySelector('.handle-n')).toBeInTheDocument();
    expect(document.querySelector('.handle-e')).toBeInTheDocument();
  });

  it('toggles custom crop frame via Custom Crop button', async () => {
    render(<CreatePostModal isOpen={true} onClose={vi.fn()} onPostCreated={vi.fn()} />);

    const file = new File(['mock content'], 'photo.png', { type: 'image/png' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Crop & Filters')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Adjust & Ratio'));

    const customCropBtn = screen.getByText('Custom Crop');
    expect(customCropBtn).toBeInTheDocument();

    // Click to enable Custom Crop
    fireEvent.click(customCropBtn);
    expect(screen.getByText('Crop Active')).toBeInTheDocument();
    expect(document.querySelector('.ig-custom-crop-frame')).toBeInTheDocument();

    // Click again to disable
    fireEvent.click(screen.getByText('Crop Active'));
    expect(screen.getByText('Custom Crop')).toBeInTheDocument();
    expect(document.querySelector('.ig-custom-crop-frame')).not.toBeInTheDocument();
  });

  it('renders video duration trimmer and adjusts start and end time when video is uploaded', async () => {
    render(<CreatePostModal isOpen={true} onClose={vi.fn()} onPostCreated={vi.fn()} />);

    const videoFile = new File(['mock video bytes'], 'sample-reel.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Crop & Filters')).toBeInTheDocument();
    });

    // Go to Adjust & Ratio tab
    fireEvent.click(screen.getByText('Adjust & Ratio'));

    // Verify Trim Video Duration section is rendered
    expect(screen.getByText('Trim Video Duration')).toBeInTheDocument();
    expect(screen.getByText('Start Trim')).toBeInTheDocument();
    expect(screen.getByText('End Trim')).toBeInTheDocument();
    expect(screen.getByText('Cover Frame')).toBeInTheDocument();

    // Verify Start and End Trim range sliders
    const startSlider = screen.getByLabelText('Video Start Time');
    const endSlider = screen.getByLabelText('Video End Time');
    expect(startSlider).toBeInTheDocument();
    expect(endSlider).toBeInTheDocument();

    // Adjust start time
    fireEvent.change(startSlider, { target: { value: '5' } });
    expect(screen.getAllByText('0:05').length).toBeGreaterThan(0);

    // Adjust end time
    fireEvent.change(endSlider, { target: { value: '25' } });
    expect(screen.getAllByText('0:25').length).toBeGreaterThan(0);

    // Verify duration calculation
    expect(screen.getAllByText(/0:05 – 0:25/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Length: 0:20/).length).toBeGreaterThan(0);

    // Verify Reset button
    const resetBtns = screen.getAllByText('Reset');
    expect(resetBtns.length).toBeGreaterThan(0);
    fireEvent.click(resetBtns[0]);
  });

  it('renders TrimmedVideoPlayer with normalized duration and trim badge', () => {
    render(
      <TrimmedVideoPlayer
        src="blob:mock-video-url"
        videoTrim={{ start: 2, end: 8, duration: 11, coverTime: 5 }}
        filterStyle={{}}
        aspectRatio="1 / 1"
        fitMode="cover"
      />
    );

    // Should display trimmed duration badge
    expect(screen.getByText(/Trimmed: 0:02 – 0:08 \(0:06\)/)).toBeInTheDocument();

    // Should display normalized time 0:00 / 0:06
    expect(screen.getByText('0:00 / 0:06')).toBeInTheDocument();

    // Verify play button and seek slider
    expect(screen.getByLabelText('Play video')).toBeInTheDocument();
    expect(screen.getByLabelText('Seek trimmed video')).toBeInTheDocument();
    expect(screen.getByLabelText('Unmute audio')).toBeInTheDocument();
  });

  it('renders PhoneVideoTrimmer with mobile-style filmstrip and draggable duration crop handles', () => {
    const handleTrimChange = vi.fn();
    const handleSeek = vi.fn();
    const handleReset = vi.fn();

    render(
      <PhoneVideoTrimmer
        videoTrim={{ start: 2, end: 8, duration: 15 }}
        currentTime={4}
        isPlaying={false}
        isMuted={false}
        onTogglePlay={vi.fn()}
        onToggleMute={vi.fn()}
        onTrimChange={handleTrimChange}
        onSeek={handleSeek}
        onReset={handleReset}
        onPreset={vi.fn()}
        filmstripFrames={['frame1.jpg', 'frame2.jpg']}
      />
    );

    // Verify phone trimmer is rendered
    expect(screen.getByTestId('phone-video-trimmer')).toBeInTheDocument();

    // Verify start handle (<|) and end handle (|>) exist
    expect(screen.getByLabelText('Drag to crop video start')).toBeInTheDocument();
    expect(screen.getByLabelText('Drag to crop video end')).toBeInTheDocument();

    // Verify time indicators
    expect(screen.getByText('0:02 – 0:08')).toBeInTheDocument();
    expect(screen.getByText('Length: 0:06')).toBeInTheDocument();

    // Verify play button and reset button
    expect(screen.getByLabelText('Play video')).toBeInTheDocument();
    expect(screen.getByTitle('Reset video trim')).toBeInTheDocument();

    // Click Reset
    fireEvent.click(screen.getByTitle('Reset video trim'));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('saves image crop with top-right corner checkmark button and sidebar Save Crop button', async () => {
    render(<CreatePostModal isOpen={true} onClose={vi.fn()} onPostCreated={vi.fn()} />);

    const file = new File(['image bytes'], 'my-test-photo.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Crop & Filters')).toBeInTheDocument();
    });

    // Verify Right-Up corner Save buttons exist
    const subnavSaveBtn = screen.getByLabelText('Save Crop & Changes');
    expect(subnavSaveBtn).toBeInTheDocument();

    const canvasCornerSaveBtn = screen.getByLabelText('Save current crop');
    expect(canvasCornerSaveBtn).toBeInTheDocument();

    // Switch to Adjust & Ratio tab
    fireEvent.click(screen.getByText('Adjust & Ratio'));

    const sidebarSaveBtn = screen.getByText('Save Crop');
    expect(sidebarSaveBtn).toBeInTheDocument();

    // Click Top-Right Canvas Corner Save Button
    fireEvent.click(canvasCornerSaveBtn);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringMatching(/Crop (applied & )?saved!/));
    });

    // Reset crop restores original
    const resetBtn = screen.getByText('Reset Crop');
    fireEvent.click(resetBtn);

    expect(mockShowSuccess).toHaveBeenCalledWith('Crop reset to original.');
  });

  it('saves video duration trim with Save Trim button', async () => {
    render(<CreatePostModal isOpen={true} onClose={vi.fn()} onPostCreated={vi.fn()} />);

    const videoFile = new File(['mock video bytes'], 'clip.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Crop & Filters')).toBeInTheDocument();
    });

    // Switch to Adjust & Ratio tab
    fireEvent.click(screen.getByText('Adjust & Ratio'));

    // Save Trim button should be present in video presets row
    const saveTrimBtn = screen.getByText('Save Trim');
    expect(saveTrimBtn).toBeInTheDocument();

    // Click Save Trim
    fireEvent.click(saveTrimBtn);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringMatching(/Video trim saved!/));
    });
  });
});

