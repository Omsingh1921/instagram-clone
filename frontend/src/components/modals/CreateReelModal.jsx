import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import mediaService from '../../services/media.service';
import reelService from '../../services/reel.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
} from '../create-post';
import {
  ReelUploadStep,
  ReelSubnav,
  ReelCanvasPreview,
  ReelEditSidebar,
  ReelDetailsStep,
} from '../create-reel';
import './CreatePostModal.css';

export {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
};

const WIZARD_STEPS = {
  UPLOAD: 'UPLOAD',
  EDIT: 'EDIT',
  DETAILS: 'DETAILS',
};

const REEL_ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 (Reel)', ratio: '9 / 16' },
  { id: 'ORIGINAL', label: 'Original', ratio: null },
  { id: '1:1', label: '1:1 (Square)', ratio: '1 / 1' },
  { id: '4:5', label: '4:5 (Portrait)', ratio: '4 / 5' },
];

const POPULAR_LOCATIONS = [
  'Mumbai, India',
  'New Delhi, India',
  'Bengaluru, India',
  'Goa, India',
  'London, UK',
  'New York, NY',
];

export const CreateReelModal = ({ isOpen, onClose, onReelCreated }) => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();

  const [currentStep, setCurrentStep] = useState(WIZARD_STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState(REEL_ASPECT_RATIOS[0]);
  const [selectedFilter, setSelectedFilter] = useState('NORMAL');
  const [editTab, setEditTab] = useState('RATIO'); // 'RATIO' | 'FILTERS'

  // Video duration trimming state
  const [videoTrim, setVideoTrim] = useState({
    start: 0,
    end: 15,
    duration: 15,
    coverTime: 0,
  });
  const [filmstripFrames, setFilmstripFrames] = useState([]);
  const [editVideoCurrentTime, setEditVideoCurrentTime] = useState(0);
  const [isEditVideoPlaying, setIsEditVideoPlaying] = useState(false);
  const [isEditVideoMuted, setIsEditVideoMuted] = useState(false);

  // Save Crop state & toast
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [cropSavedToast, setCropSavedToast] = useState(false);
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState(null);

  // Details step form state
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup object URLs on unmount / reset
  const resetForm = (keepThumbnailUrl = null) => {
    if (previewUrl && previewUrl !== keepThumbnailUrl && previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setFile(null);
    setPreviewUrl('');
    setVideoDuration(0);
    setSelectedRatio(REEL_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');
    setEditTab('RATIO');
    setVideoTrim({ start: 0, end: 15, duration: 15, coverTime: 0 });
    setFilmstripFrames([]);
    setEditVideoCurrentTime(0);
    setIsEditVideoPlaying(false);
    setIsEditVideoMuted(false);
    setIsSavingCrop(false);
    setCropSavedToast(false);
    setCustomThumbnailUrl(null);
    setCaption('');
    setLocation('');
    setHideLikeCount(false);
    setCommentsDisabled(false);
    setShowAdvanced(false);
    setLoading(false);
    setCurrentStep(WIZARD_STEPS.UPLOAD);
  };

  const handleClose = (keepThumbnailUrl = null) => {
    resetForm(keepThumbnailUrl);
    onClose();
  };

  // Video File Selection
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      showError('Please select a video file for your reel (MP4, MOV, WEBM).');
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      showError('Reel video exceeds 100MB limit.');
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
    setCurrentStep(WIZARD_STEPS.EDIT);

    // Asynchronously extract duration, initial poster, and filmstrip frames
    try {
      const info = await extractVideoThumbnail(selectedFile, 0.5);
      const dur = info?.duration || 15;
      setVideoDuration(dur);
      setVideoTrim({
        start: 0,
        end: Math.min(90, dur),
        duration: dur,
        coverTime: 0,
      });
      if (info?.thumbnailUrl) {
        setCustomThumbnailUrl(info.thumbnailUrl);
      }
      const frames = await extractFilmstripFrames(selectedFile, dur, 8);
      if (frames && frames.length > 0) {
        setFilmstripFrames(frames);
      }
    } catch (err) {
      console.warn('Reel metadata extraction warning:', err);
    }
  };

  // Video metadata loaded in Edit canvas
  const handleVideoMetadataLoaded = (e) => {
    const dur = Math.floor(e.target.duration) || 15;
    if (dur && dur !== videoDuration) {
      setVideoDuration(dur);
      setVideoTrim((prev) => ({
        start: prev.start || 0,
        end: prev.end && prev.end <= dur ? prev.end : Math.min(90, dur),
        duration: dur,
        coverTime: prev.coverTime || 0,
      }));
    }
  };

  // Looping constraint in Edit canvas
  const handleVideoTimeUpdate = (e) => {
    const cur = e.target.currentTime;
    setEditVideoCurrentTime(cur);
    const start = videoTrim.start || 0;
    const end = videoTrim.end || videoDuration || 15;
    if (cur >= end) {
      e.target.currentTime = start;
    }
  };

  const handleToggleEditVideoPlay = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!videoPreviewRef.current) return;
    if (isEditVideoPlaying) {
      videoPreviewRef.current.pause();
    } else {
      const start = videoTrim.start || 0;
      const end = videoTrim.end || videoDuration || 15;
      if (videoPreviewRef.current.currentTime < start || videoPreviewRef.current.currentTime >= end) {
        videoPreviewRef.current.currentTime = start;
      }
      videoPreviewRef.current.play().catch(() => {});
    }
  };

  const handleToggleEditVideoMute = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!videoPreviewRef.current) return;
    const next = !isEditVideoMuted;
    videoPreviewRef.current.muted = next;
    setIsEditVideoMuted(next);
  };

  // Video Trim Handlers
  const handleTrimStartChange = (val) => {
    const dur = videoTrim.duration || videoDuration || 15;
    const curEnd = videoTrim.end || dur;
    const maxStart = Math.max(0, curEnd - 1);
    const nextStart = Math.min(val, maxStart);
    setVideoTrim((prev) => ({ ...prev, start: nextStart }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = nextStart;
    }
  };

  const handleTrimEndChange = (val) => {
    const curStart = videoTrim.start || 0;
    const minEnd = curStart + 1;
    const nextEnd = Math.max(val, minEnd);
    setVideoTrim((prev) => ({ ...prev, end: nextEnd }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = nextEnd;
    }
  };

  const handleCoverTimeChange = (val) => {
    setVideoTrim((prev) => ({ ...prev, coverTime: val }));
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = val;
    }
    extractVideoThumbnail(file, val).then((res) => {
      if (res?.thumbnailUrl && res.thumbnailUrl.startsWith('data:image')) {
        setCustomThumbnailUrl(res.thumbnailUrl);
      }
    });
  };

  const handleApplyVideoPreset = (seconds) => {
    const dur = videoTrim.duration || videoDuration || 15;
    if (seconds >= dur) {
      setVideoTrim((prev) => ({ ...prev, start: 0, end: dur }));
      if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    } else {
      setVideoTrim((prev) => ({ ...prev, start: 0, end: seconds }));
      if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    }
  };

  const handleResetVideoTrim = () => {
    const dur = videoDuration || 15;
    setVideoTrim({ start: 0, end: dur, duration: dur, coverTime: 0 });
    setSelectedRatio(REEL_ASPECT_RATIOS[0]);
    setSelectedFilter('NORMAL');
    if (videoPreviewRef.current) videoPreviewRef.current.currentTime = 0;
    showSuccess('Reel trim reset to original.');
  };

  // Save Crop & Trim immediately (Right Tick Button)
  const handleSaveCrop = async () => {
    if (!file) return;
    setIsSavingCrop(true);
    try {
      const trim = videoTrim;
      const start = trim.start || 0;
      const end = trim.end || trim.duration || videoDuration || 15;

      let thumb = customThumbnailUrl;
      if (!thumb || !thumb.startsWith('data:image')) {
        const res = await extractVideoThumbnail(file, trim.coverTime || start || 0.5);
        if (res?.thumbnailUrl) {
          thumb = res.thumbnailUrl;
          setCustomThumbnailUrl(thumb);
        }
      }
      showSuccess(`Reel trim saved! (${formatTime(start)} – ${formatTime(end)}) ✓`);
      setCropSavedToast(true);
      setTimeout(() => setCropSavedToast(false), 2400);
    } catch (err) {
      console.error('Failed to save reel crop:', err);
      showError('Failed to save reel trim. Please try again.');
    } finally {
      setIsSavingCrop(false);
    }
  };

  const captureThumbnailBlob = () => {
    return new Promise((resolve) => {
      const video = videoPreviewRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        resolve(null);
        return;
      }
      try {
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 854;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      } catch {
        resolve(null);
      }
    });
  };

  // Proceed to Details Step
  const handleProceedToDetails = async () => {
    if (!customThumbnailUrl) {
      const res = await extractVideoThumbnail(file, videoTrim.coverTime || videoTrim.start || 0.5);
      if (res?.thumbnailUrl) setCustomThumbnailUrl(res.thumbnailUrl);
    }
    setCurrentStep(WIZARD_STEPS.DETAILS);
  };

  // Submit Reel (Share or Save Draft)
  const handleSubmit = async (e, isDraft = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!file) {
      showError('Please select a video file.');
      return;
    }

    const capturedFile = file;
    const capturedPreviewUrl = previewUrl;
    const capturedRatio = selectedRatio;
    const capturedTrim = { ...videoTrim };
    const capturedDuration = videoDuration;
    const capturedCaption = caption;
    const capturedLocation = location;
    const capturedHideLike = hideLikeCount;
    const capturedCommentsDisabled = commentsDisabled;

    const performReelUpload = async (updateProgress = () => {}) => {
      updateProgress(20, 'Sharing reel...');
      const uploadRes = await mediaService.uploadMedia(capturedFile, 'reels', (filePct) => {
        const dynamicPct = Math.min(65, Math.round(20 + (filePct / 100) * 45));
        updateProgress(dynamicPct, 'Sharing reel...');
      });
      let mediaUrl =
        uploadRes?.secureUrl ||
        uploadRes?.data?.secureUrl ||
        uploadRes?.data?.mediaUrl ||
        uploadRes?.mediaUrl ||
        uploadRes?.url ||
        uploadRes?.data?.url;

      if (!mediaUrl) {
        throw new Error('Failed to upload video.');
      }

      let thumbnailUrl = uploadRes?.data?.thumbnailUrl || uploadRes?.thumbnailUrl || mediaUrl;

      // Try uploading custom cover thumbnail blob if captured
      try {
        updateProgress(66, 'Uploading cover frame...');
        const thumbBlob = await captureThumbnailBlob();
        if (thumbBlob) {
          const thumbFile = new File([thumbBlob], 'reel_thumb.jpg', { type: 'image/jpeg' });
          const thumbRes = await mediaService.uploadMedia(thumbFile, 'reels');
          const customThumb =
            thumbRes?.secureUrl || thumbRes?.data?.secureUrl || thumbRes?.url || thumbRes?.data?.url;
          if (customThumb) thumbnailUrl = customThumb;
        }
      } catch {
        // Fallback to default thumbnail
      }

      // Attach Cloudinary video transformation URL for duration crop & aspect ratio
      updateProgress(75, 'Processing reel video...');
      if (mediaUrl) {
        const transforms = [];
        if (capturedRatio?.id && capturedRatio.id !== 'ORIGINAL' && capturedRatio.id !== 'CUSTOM') {
          transforms.push(`c_fill,ar_${capturedRatio.id === '9:16' ? '9:16' : capturedRatio.id}`);
        }
        if (capturedTrim) {
          const { start = 0, end = 0, duration = 0 } = capturedTrim;
          if (start > 0 || (end > 0 && end < duration)) {
            transforms.push(`so_${Math.round(start)},eo_${Math.round(end)}`);
          }
        }
        if (transforms.length > 0) {
          const transformPrefix = transforms.join(',') + '/';
          if (mediaUrl.includes('/video/upload/')) {
            mediaUrl = mediaUrl.replace('/video/upload/', `/video/upload/${transformPrefix}`);
          } else if (mediaUrl.includes('/upload/')) {
            mediaUrl = mediaUrl.replace('/upload/', `/upload/${transformPrefix}`);
          }
        }
      }

      const trimmedDuration = Math.max(1, (capturedTrim.end || capturedDuration) - (capturedTrim.start || 0));
      const durationMs = Math.round(trimmedDuration * 1000);

      const payload = {
        videoUrl: mediaUrl,
        thumbnailUrl: thumbnailUrl,
        caption: capturedCaption.trim(),
        location: capturedLocation.trim(),
        hideLikeCount: capturedHideLike,
        commentsDisabled: capturedCommentsDisabled,
        durationMs: durationMs,
      };

      updateProgress(88, 'Finishing up...');
      await reelService.createReel(payload);
      if (onReelCreated) onReelCreated();
    };

    // 🚀 BACKGROUND UPLOAD: If UploadContext is available and not a draft, fire in background & close modal immediately!
    if (uploadCtx?.startUpload && !isDraft) {
      uploadCtx.startUpload({
        type: 'reel',
        title: capturedCaption ? `Reel: ${capturedCaption.slice(0, 22)}...` : 'New Reel',
        thumbnail: capturedPreviewUrl,
        mediaUrl: capturedPreviewUrl,
        mediaType: 'VIDEO',
        videoUrl: capturedPreviewUrl,
        caption: capturedCaption.trim(),
        location: capturedLocation.trim() || null,
        user: currentUser,
        createdAt: new Date().toISOString(),
        task: performReelUpload,
      });
      handleClose(capturedPreviewUrl);
      return;
    }

    // Synchronous fallback (e.g. for drafts or standalone tests without UploadProvider)
    try {
      setLoading(true);
      if (isDraft) {
        const trimmedDuration = Math.max(1, (videoTrim.end || videoDuration) - (videoTrim.start || 0));
        const payload = {
          videoUrl: previewUrl,
          thumbnailUrl: previewUrl,
          caption: caption.trim(),
          location: location.trim(),
          hideLikeCount: hideLikeCount,
          commentsDisabled: commentsDisabled,
          durationMs: Math.round(trimmedDuration * 1000),
        };
        await reelService.createDraft(payload);
        showSuccess('Reel saved as draft! ✓');
      } else {
        await performReelUpload();
        showSuccess('Reel shared successfully! ✓');
      }
      handleClose();
      if (onReelCreated) onReelCreated();
    } catch (err) {
      showError(err.message || (isDraft ? 'Failed to save draft' : 'Failed to create reel'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === WIZARD_STEPS.UPLOAD
          ? 'Create new reel'
          : currentStep === WIZARD_STEPS.EDIT
          ? 'Crop & Trim Reel'
          : 'Create new reel'
      }
      size={currentStep === WIZARD_STEPS.UPLOAD ? 'md' : 'lg'}
    >
      <div className="ig-wizard-container">
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Wizard Navigation Header */}
        <ReelSubnav
          currentStep={currentStep}
          WIZARD_STEPS={WIZARD_STEPS}
          onBack={() => {
            if (currentStep === WIZARD_STEPS.DETAILS) {
              setCurrentStep(WIZARD_STEPS.EDIT);
            } else if (currentStep === WIZARD_STEPS.EDIT) {
              setCurrentStep(WIZARD_STEPS.UPLOAD);
            }
          }}
          onSaveCrop={handleSaveCrop}
          isSavingCrop={isSavingCrop}
          onProceedToDetails={handleProceedToDetails}
          onSubmit={handleSubmit}
          loading={loading}
        />

        {/* STEP 1: INITIAL UPLOAD SELECTOR */}
        {currentStep === WIZARD_STEPS.UPLOAD && (
          <ReelUploadStep
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
          />
        )}

        {/* STEP 2: EDIT, CROP & PHONE VIDEO TRIMMER */}
        {currentStep === WIZARD_STEPS.EDIT && file && (
          <div className="ig-edit-workspace">
            <ReelCanvasPreview
              selectedRatio={selectedRatio}
              onSaveCrop={handleSaveCrop}
              isSavingCrop={isSavingCrop}
              cropSavedToast={cropSavedToast}
              videoPreviewRef={videoPreviewRef}
              previewUrl={previewUrl}
              selectedFilter={selectedFilter}
              videoDuration={videoDuration}
              handleVideoMetadataLoaded={handleVideoMetadataLoaded}
              handleVideoTimeUpdate={handleVideoTimeUpdate}
              isEditVideoPlaying={isEditVideoPlaying}
              setIsEditVideoPlaying={setIsEditVideoPlaying}
              handleToggleEditVideoPlay={handleToggleEditVideoPlay}
              videoTrim={videoTrim}
              editVideoCurrentTime={editVideoCurrentTime}
              isEditVideoMuted={isEditVideoMuted}
              handleToggleEditVideoMute={handleToggleEditVideoMute}
              setVideoTrim={setVideoTrim}
              setEditVideoCurrentTime={setEditVideoCurrentTime}
              handleResetVideoTrim={handleResetVideoTrim}
              handleApplyVideoPreset={handleApplyVideoPreset}
              filmstripFrames={filmstripFrames}
            />

            <ReelEditSidebar
              editTab={editTab}
              setEditTab={setEditTab}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              customThumbnailUrl={customThumbnailUrl}
              REEL_ASPECT_RATIOS={REEL_ASPECT_RATIOS}
              selectedRatio={selectedRatio}
              setSelectedRatio={setSelectedRatio}
              videoTrim={videoTrim}
              videoDuration={videoDuration}
              handleResetVideoTrim={handleResetVideoTrim}
              handleTrimStartChange={handleTrimStartChange}
              handleTrimEndChange={handleTrimEndChange}
              handleApplyVideoPreset={handleApplyVideoPreset}
              handleSaveCrop={handleSaveCrop}
              isSavingCrop={isSavingCrop}
              handleCoverTimeChange={handleCoverTimeChange}
            />
          </div>
        )}

        {/* STEP 3: DETAILS & SHARE */}
        {currentStep === WIZARD_STEPS.DETAILS && file && (
          <ReelDetailsStep
            previewUrl={previewUrl}
            videoTrim={videoTrim}
            selectedFilter={selectedFilter}
            selectedRatio={selectedRatio}
            currentUser={currentUser}
            caption={caption}
            setCaption={setCaption}
            location={location}
            setLocation={setLocation}
            POPULAR_LOCATIONS={POPULAR_LOCATIONS}
            customThumbnailUrl={customThumbnailUrl}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            hideLikeCount={hideLikeCount}
            setHideLikeCount={setHideLikeCount}
            commentsDisabled={commentsDisabled}
            setCommentsDisabled={setCommentsDisabled}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </Modal>
  );
};

export default CreateReelModal;
