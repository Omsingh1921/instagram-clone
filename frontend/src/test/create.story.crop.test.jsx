import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateStoryModal from '../components/modals/CreateStoryModal';

// Mock services
vi.mock('../services/media.service', () => ({
  default: {
    uploadMedia: vi.fn().mockResolvedValue({
      secureUrl: 'https://cloudinary.com/story-media.jpg',
      url: 'https://cloudinary.com/story-media.jpg',
    }),
  },
}));

vi.mock('../services/story.service', () => ({
  default: {
    createStory: vi.fn().mockResolvedValue({ id: 'story-123', success: true }),
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
global.URL.createObjectURL = vi.fn(() => 'blob:mock-story-url');
global.URL.revokeObjectURL = vi.fn();

describe('CreateStoryModal Crop, Trim, Stickers & Right-Up Corner Save Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. renders upload dropzone initially and displays 9:16 Story ratio and photo crop controls when photo uploaded', async () => {
    render(<CreateStoryModal isOpen={true} onClose={vi.fn()} onStoryCreated={vi.fn()} />);

    expect(screen.getByText('Upload a Story')).toBeInTheDocument();
    expect(screen.getByText('Select Photo or Video')).toBeInTheDocument();

    const photoFile = new File(['mock photo bytes'], 'sunset.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(0);

    fireEvent.change(fileInputs[0], { target: { files: [photoFile] } });

    // Should transition to Edit Story
    await waitFor(() => {
      expect(screen.getAllByText('Edit Story').length).toBeGreaterThan(0);
    });

    // Default Story aspect ratio 9:16 should be selected
    const storyRatioBtn = screen.getByText('9:16 (Story)');
    expect(storyRatioBtn).toBeInTheDocument();
    expect(storyRatioBtn.closest('button')).toHaveClass('active');

    // Other aspect ratio options are present
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('1:1 (Square)')).toBeInTheDocument();
    expect(screen.getByText('4:5 (Portrait)')).toBeInTheDocument();
    expect(screen.getByText('Custom (Free)')).toBeInTheDocument();

    // Photo Crop & Zoom controls are rendered
    expect(screen.getByText('Crop & Zoom')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom Level')).toBeInTheDocument();
    expect(screen.getByText('Custom Crop')).toBeInTheDocument();
    expect(screen.getByText('Rotate 90°')).toBeInTheDocument();
    expect(screen.getByText('Reset Crop')).toBeInTheDocument();
    expect(screen.getByText('Save Crop')).toBeInTheDocument();
  });

  it('2. provides Right-Up corner Save button (✓) and saves photo crop', async () => {
    render(<CreateStoryModal isOpen={true} onClose={vi.fn()} onStoryCreated={vi.fn()} />);

    const photoFile = new File(['mock photo bytes'], 'portrait.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [photoFile] } });

    await waitFor(() => {
      expect(screen.getAllByText('Edit Story').length).toBeGreaterThan(0);
    });

    // Right-Up corner Save button in subnav
    const subnavSaveBtn = screen.getByLabelText('Save Story Crop & Changes');
    expect(subnavSaveBtn).toBeInTheDocument();

    // Corner save button on canvas
    const canvasSaveBtn = screen.getByLabelText('Save current crop/trim');
    expect(canvasSaveBtn).toBeInTheDocument();

    // Click Save Crop in subnav
    fireEvent.click(subnavSaveBtn);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/Crop applied & saved!|Crop saved!/)
      );
    });
  });

  it('3. activates custom crop frame with corner & edge drag handles when Custom Crop is clicked', async () => {
    render(<CreateStoryModal isOpen={true} onClose={vi.fn()} onStoryCreated={vi.fn()} />);

    const photoFile = new File(['mock photo bytes'], 'landscape.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [photoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Custom Crop')).toBeInTheDocument();
    });

    // Click Custom Crop button
    fireEvent.click(screen.getByText('Custom Crop'));

    // Should show "Crop Active"
    expect(screen.getByText('Crop Active')).toBeInTheDocument();

    // Custom crop frame elements should be in the DOM
    const handles = document.querySelectorAll('.ig-crop-handle');
    expect(handles.length).toBe(8); // 4 corners + 4 edges

    // Apply button inside crop frame
    const applyBtn = screen.getByLabelText('Apply & Save Custom Crop');
    expect(applyBtn).toBeInTheDocument();

    // Click Apply inside the custom crop frame
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/Crop applied & saved!|Crop saved!/)
      );
    });
  });

  it('4. renders phone trimmer and dual duration sliders when video is uploaded, and saves trim', async () => {
    render(<CreateStoryModal isOpen={true} onClose={vi.fn()} onStoryCreated={vi.fn()} />);

    const videoFile = new File(['mock video bytes'], 'vlog.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });

    await waitFor(() => {
      expect(screen.getAllByText('Edit Story').length).toBeGreaterThan(0);
    });

    // Phone-style trimmer rendered at the bottom of the video
    expect(screen.getByTestId('phone-video-trimmer')).toBeInTheDocument();
    expect(screen.getByText('Trim Story Duration')).toBeInTheDocument();

    // Start & End Trim range sliders
    const startInput = screen.getByLabelText('Story Start Time');
    const endInput = screen.getByLabelText('Story End Time');
    expect(startInput).toBeInTheDocument();
    expect(endInput).toBeInTheDocument();

    // Change trim range
    fireEvent.change(startInput, { target: { value: '2' } });
    fireEvent.change(endInput, { target: { value: '10' } });

    // Quick preset buttons
    expect(screen.getAllByText('Full').length).toBeGreaterThanOrEqual(1);

    // Click Save Trim in sidebar
    const saveTrimBtn = screen.getByRole('button', { name: /Save Trim/i });
    fireEvent.click(saveTrimBtn);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('Story trim saved!'));
    });
  });

  it('5. switches between Crop & Trim, Filters, and Stickers tabs', async () => {
    render(<CreateStoryModal isOpen={true} onClose={vi.fn()} onStoryCreated={vi.fn()} />);

    const photoFile = new File(['mock photo bytes'], 'pic.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [photoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Crop & Trim')).toBeInTheDocument();
    });

    // Switch to Filters tab
    fireEvent.click(screen.getByText('Filters'));
    expect(screen.getByText('Clarendon')).toBeInTheDocument();
    expect(screen.getByText('Gingham')).toBeInTheDocument();
    expect(screen.getByText('Juno')).toBeInTheDocument();

    // Select Juno filter
    fireEvent.click(screen.getByText('Juno'));

    // Switch to Stickers tab
    fireEvent.click(screen.getByText('Stickers'));
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('Poll')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('Slider')).toBeInTheDocument();
    expect(screen.getByText('Countdown')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Hashtag')).toBeInTheDocument();
    expect(screen.getByText('Music')).toBeInTheDocument();

    // Click Question sticker
    fireEvent.click(screen.getByText('Question'));

    // Expect sticker configuration prompt input both in canvas overlay and sidebar form
    expect(screen.getAllByPlaceholderText('Ask me a question').length).toBeGreaterThanOrEqual(1);
  });

  it('6. submits story to Your Story and Close Friends', async () => {
    const onStoryCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <CreateStoryModal isOpen={true} onClose={onClose} onStoryCreated={onStoryCreated} />
    );

    const photoFile = new File(['mock photo bytes'], 'story.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [photoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Your Story')).toBeInTheDocument();
      expect(screen.getByText('Close Friends')).toBeInTheDocument();
    });

    // Click "Close Friends"
    fireEvent.click(screen.getByText('Close Friends'));

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('Shared to Close Friends! 🟢');
      expect(onStoryCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('7. applies multiple features and stickers simultaneously to a single story', async () => {
    const onStoryCreated = vi.fn();
    render(<CreateStoryModal isOpen={true} onClose={vi.fn()} onStoryCreated={onStoryCreated} />);

    const photoFile = new File(['mock photo bytes'], 'multi.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [photoFile] } });

    await waitFor(() => {
      expect(screen.getByText('Stickers')).toBeInTheDocument();
    });

    // 1. Switch to Stickers tab
    fireEvent.click(screen.getByText('Stickers'));

    // 2. Select Music sticker and click trending song
    fireEvent.click(screen.getByText('Music'));
    const trendingBtn = screen.getByText('Die With A Smile');
    fireEvent.click(trendingBtn);

    // Verify Music attached chip appears
    expect(screen.getByText(/Applied to Story/i)).toBeInTheDocument();

    // 3. Select Question sticker
    fireEvent.click(screen.getByText('Question'));
    expect(screen.getAllByPlaceholderText('Ask me a question').length).toBeGreaterThanOrEqual(1);

    // 4. Select Location sticker and enter a city
    fireEvent.click(screen.getByText('Location'));
    const locInput = screen.getByPlaceholderText('Add location (e.g. Mumbai, India)');
    fireEvent.change(locInput, { target: { value: 'Mumbai, India' } });

    // Verify all 3 attached chips appear in Applied to Story strip
    expect(screen.getByText(/🎵 Die With A Smile/i)).toBeInTheDocument();
    expect(screen.getByText(/❓ Question/i)).toBeInTheDocument();
    expect(screen.getByText(/📍 Mumbai, India/i)).toBeInTheDocument();

    // Submit story to Your Story
    fireEvent.click(screen.getByText('Your Story'));

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('Story added!'));
    });
  });
});
