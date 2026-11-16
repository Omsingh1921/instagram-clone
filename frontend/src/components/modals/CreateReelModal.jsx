import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Check,
  Scissors,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Crop,
  Film,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Avatar from '../common/Avatar';
import mediaService from '../../services/media.service';
import reelService from '../../services/reel.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  formatTime,
  extractVideoThumbnail,
  extractFilmstripFrames,
  PhoneVideoTrimmer,
  TrimmedVideoPlayer,
} from './CreatePostModal';
import { INSTAGRAM_FILTERS, getFilterStyle } from '../../utils/instagramFilters';
import { useUpload } from '../../context/UploadContext';
import './CreatePostModal.css';

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
  const [isDragOver, setIsDragOver] = useState(false);
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
    setIsDragOver(false);
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

    // Snapshot parameters for background execution
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
        {currentStep !== WIZARD_STEPS.UPLOAD && (
          <div className="ig-wizard-subnav">
            <button
              type="button"
              className="ig-subnav-btn"
              onClick={() => {
                if (currentStep === WIZARD_STEPS.DETAILS) {
                  setCurrentStep(WIZARD_STEPS.EDIT);
                } else if (currentStep === WIZARD_STEPS.EDIT) {
                  setCurrentStep(WIZARD_STEPS.UPLOAD);
                }
              }}
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <span className="ig-subnav-title">
              {currentStep === WIZARD_STEPS.EDIT ? 'Edit Reel' : 'New Reel'}
            </span>

            {currentStep === WIZARD_STEPS.EDIT ? (
              <div className="ig-subnav-right-actions">
                <button
                  type="button"
                  className="ig-subnav-save-crop-btn"
                  onClick={handleSaveCrop}
                  disabled={isSavingCrop}
                  title="Save Reel Trim & Edits (✓)"
                  aria-label="Save Reel Trim & Edits"
                >
                  <Check size={16} strokeWidth={2.8} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  className="ig-subnav-action-btn next"
                  onClick={handleProceedToDetails}
                  disabled={isSavingCrop}
                >
                  Next
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ig-subnav-action-btn share"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Share'}
              </button>
            )}
          </div>
        )}

        {/* STEP 1: INITIAL UPLOAD SELECTOR */}
        {currentStep === WIZARD_STEPS.UPLOAD && (
          <div
            className="ig-upload-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept="video/*"
              style={{ display: 'none' }}
            />
            <div className="ig-upload-center-box">
              <div className="ig-dropzone-circle">
                <Video size={36} className="ig-media-main-icon" />
              </div>
              <h3 className="ig-dropzone-title">Upload a Reel Video</h3>
              <p className="ig-dropzone-desc">
                Vertical short videos up to 90 seconds (MP4, MOV, WEBM)
              </p>
              <button
                type="button"
                className="btn btn-primary ig-browse-files-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select from computer
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EDIT, CROP & PHONE VIDEO TRIMMER */}
        {currentStep === WIZARD_STEPS.EDIT && file && (
          <div className="ig-edit-workspace">
            {/* Left: Media Canvas */}
            <div
              className="ig-edit-canvas"
              style={{ aspectRatio: selectedRatio.ratio || '9 / 16' }}
            >
              {/* Floating Top-Right Save / Confirm Button over Media Canvas */}
              <button
                type="button"
                className="ig-canvas-corner-save-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveCrop();
                }}
                disabled={isSavingCrop}
                title="Save current trim (✓)"
                aria-label="Save current trim"
              >
                <Check size={15} strokeWidth={2.8} />
                <span>Save</span>
              </button>

              {/* Toast banner upon saving crop */}
              {cropSavedToast && (
                <div className="ig-crop-saved-banner" role="status">
                  <Check size={14} strokeWidth={3} />
                  <span>Reel trim & crop saved! ✓</span>
                </div>
              )}

              <div className="ig-video-viewport">
                <video
                  ref={videoPreviewRef}
                  src={previewUrl}
                  className="ig-canvas-media"
                  style={{
                    ...getFilterStyle(selectedFilter),
                    objectFit: selectedRatio.id === 'ORIGINAL' ? 'contain' : 'cover',
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  onLoadedMetadata={handleVideoMetadataLoaded}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={() => setIsEditVideoPlaying(true)}
                  onPause={() => setIsEditVideoPlaying(false)}
                  onClick={handleToggleEditVideoPlay}
                />

                {/* Center Play Icon Overlay when paused */}
                {!isEditVideoPlaying && (
                  <div className="ig-video-center-play-overlay" onClick={handleToggleEditVideoPlay}>
                    <div className="ig-video-center-play-circle">
                      <Play size={32} fill="#ffffff" color="#ffffff" style={{ marginLeft: '4px' }} />
                    </div>
                  </div>
                )}

                {/* Scissors trim indicator badge / Full video badge */}
                {videoTrim.start > 0 || (videoTrim.end < (videoTrim.duration || videoDuration) && videoTrim.end > 0) ? (
                  <div className="ig-video-trim-indicator-pill">
                    <Scissors size={12} color="#ffcc00" />
                    <span>
                      Trim: {formatTime(videoTrim.start)} – {formatTime(videoTrim.end || videoTrim.duration)} (
                      {formatTime(Math.max(1, (videoTrim.end || videoTrim.duration) - videoTrim.start))})
                    </span>
                  </div>
                ) : (
                  <div className="ig-video-trim-indicator-pill full-len">
                    <Film size={12} color="#0095f6" />
                    <span>
                      Full Reel: {formatTime(videoTrim.duration || videoDuration)}
                    </span>
                  </div>
                )}

                {/* BOTTOM PHONE-STYLE CUSTOM CROP ACCORDING TO DURATION */}
                <PhoneVideoTrimmer
                  videoTrim={videoTrim}
                  currentTime={editVideoCurrentTime}
                  isPlaying={isEditVideoPlaying}
                  isMuted={isEditVideoMuted}
                  onTogglePlay={handleToggleEditVideoPlay}
                  onToggleMute={handleToggleEditVideoMute}
                  onTrimChange={({ start, end }) => {
                    setVideoTrim((prev) => ({ ...prev, start, end }));
                  }}
                  onSeek={(time) => {
                    if (videoPreviewRef.current) {
                      videoPreviewRef.current.currentTime = time;
                      setEditVideoCurrentTime(time);
                    }
                  }}
                  onReset={handleResetVideoTrim}
                  onPreset={handleApplyVideoPreset}
                  filmstripFrames={filmstripFrames}
                />
              </div>
            </div>

            {/* Right: Sidebar Controls (Ratio & Filters) */}
            <div className="ig-edit-sidebar">
              <div className="ig-edit-tab-headers">
                <button
                  type="button"
                  className={`ig-edit-tab-btn ${editTab === 'RATIO' ? 'active' : ''}`}
                  onClick={() => setEditTab('RATIO')}
                >
                  <Sliders size={16} />
                  <span>Adjust & Trim</span>
                </button>
                <button
                  type="button"
                  className={`ig-edit-tab-btn ${editTab === 'FILTERS' ? 'active' : ''}`}
                  onClick={() => setEditTab('FILTERS')}
                >
                  <Sparkles size={16} />
                  <span>Filters</span>
                </button>
              </div>

              {/* Filters Gallery */}
              {editTab === 'FILTERS' && (
                <div className="ig-filters-gallery">
                  {INSTAGRAM_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`ig-filter-card ${selectedFilter === f.id ? 'active' : ''}`}
                      onClick={() => setSelectedFilter(f.id)}
                    >
                      <div className="ig-filter-thumb-box">
                        {customThumbnailUrl ? (
                          <img
                            src={customThumbnailUrl}
                            alt={f.name}
                            className="ig-filter-thumb-img"
                            style={{ filter: f.filter }}
                          />
                        ) : (
                          <div className="ig-filter-thumb-video-fallback" style={{ filter: f.filter }}>
                            <Film size={20} />
                          </div>
                        )}
                        <span className="ig-filter-video-badge" title="Reel filter">
                          <Film size={10} />
                        </span>
                      </div>
                      <span className="ig-filter-name">{f.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Aspect Ratio & Trim Controls */}
              {editTab === 'RATIO' && (
                <div className="ig-ratio-panel">
                  <h4 className="ig-panel-heading">Aspect Ratio</h4>
                  <div className="ig-ratio-options-grid">
                    {REEL_ASPECT_RATIOS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`ig-ratio-option-btn ${selectedRatio.id === r.id ? 'active' : ''}`}
                        onClick={() => setSelectedRatio(r)}
                      >
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Video Duration Trimming & Cropping Controls */}
                  <div className="ig-video-trim-section">
                    <div className="ig-crop-section-header">
                      <h4
                        className="ig-panel-heading"
                        style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Scissors size={15} color="#0095f6" />
                        <span>Trim Reel Duration</span>
                      </h4>
                      {(videoTrim.start > 0 || (videoTrim.end < videoTrim.duration && videoTrim.end > 0)) && (
                        <button
                          type="button"
                          className="ig-crop-reset-link"
                          onClick={handleResetVideoTrim}
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Duration summary badge */}
                    <div className="ig-trim-summary-badge">
                      <span className="ig-trim-time-range">
                        {formatTime(videoTrim.start)} – {formatTime(videoTrim.end || videoTrim.duration)}
                      </span>
                      <span className="ig-trim-duration-pill">
                        Length: {formatTime(Math.max(0, (videoTrim.end || videoTrim.duration) - videoTrim.start))}
                      </span>
                    </div>

                    {/* Dual Range Sliders for Start & End Time */}
                    <div className="ig-trim-slider-block">
                      <div className="ig-trim-row">
                        <div className="ig-trim-label">
                          <span>Start Trim</span>
                          <span className="ig-trim-val">{formatTime(videoTrim.start)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(1, (videoTrim.end || videoTrim.duration) - 1)}
                          step="1"
                          value={videoTrim.start}
                          onChange={(e) => handleTrimStartChange(Number(e.target.value))}
                          className="ig-trim-range-input"
                          aria-label="Video Start Time"
                        />
                      </div>

                      <div className="ig-trim-row">
                        <div className="ig-trim-label">
                          <span>End Trim</span>
                          <span className="ig-trim-val">{formatTime(videoTrim.end || videoTrim.duration)}</span>
                        </div>
                        <input
                          type="range"
                          min={(videoTrim.start || 0) + 1}
                          max={videoTrim.duration || 90}
                          step="1"
                          value={videoTrim.end || videoTrim.duration}
                          onChange={(e) => handleTrimEndChange(Number(e.target.value))}
                          className="ig-trim-range-input"
                          aria-label="Video End Time"
                        />
                      </div>
                    </div>

                    {/* Quick Duration Preset Pills */}
                    <div className="ig-trim-presets-row">
                      <button
                        type="button"
                        className={`ig-trim-preset-btn ${videoTrim.start === 0 && (videoTrim.end === videoTrim.duration || !videoTrim.end) ? 'active' : ''}`}
                        onClick={() => handleApplyVideoPreset(videoTrim.duration)}
                      >
                        Full
                      </button>
                      {videoTrim.duration > 15 && (
                        <button
                          type="button"
                          className={`ig-trim-preset-btn ${videoTrim.end - videoTrim.start === 15 ? 'active' : ''}`}
                          onClick={() => handleApplyVideoPreset(15)}
                        >
                          15s
                        </button>
                      )}
                      {videoTrim.duration > 30 && (
                        <button
                          type="button"
                          className={`ig-trim-preset-btn ${videoTrim.end - videoTrim.start === 30 ? 'active' : ''}`}
                          onClick={() => handleApplyVideoPreset(30)}
                        >
                          30s
                        </button>
                      )}
                      {videoTrim.duration > 60 && (
                        <button
                          type="button"
                          className={`ig-trim-preset-btn ${videoTrim.end - videoTrim.start === 60 ? 'active' : ''}`}
                          onClick={() => handleApplyVideoPreset(60)}
                        >
                          60s
                        </button>
                      )}
                      <button
                        type="button"
                        className="ig-trim-preset-btn save-trim"
                        onClick={handleSaveCrop}
                        disabled={isSavingCrop}
                        title="Save current video trim"
                      >
                        <Check size={12} strokeWidth={2.5} />
                        <span>Save Trim</span>
                      </button>
                    </div>

                    {/* Video Cover Frame Selector */}
                    <div className="ig-trim-cover-block">
                      <div className="ig-trim-label">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Film size={13} />
                          <span>Cover Frame</span>
                        </span>
                        <span className="ig-trim-val">
                          {formatTime(videoTrim.coverTime || videoTrim.start)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={videoTrim.start}
                        max={videoTrim.end || videoTrim.duration}
                        step="1"
                        value={videoTrim.coverTime || videoTrim.start}
                        onChange={(e) => handleCoverTimeChange(Number(e.target.value))}
                        className="ig-trim-range-input"
                        aria-label="Video Cover Frame"
                      />
                    </div>

                    <p className="ig-crop-drag-hint">
                      ✂️ Reel will play and loop between {formatTime(videoTrim.start)} and{' '}
                      {formatTime(videoTrim.end || videoTrim.duration)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: DETAILS & SHARE */}
        {currentStep === WIZARD_STEPS.DETAILS && file && (
          <form onSubmit={(e) => handleSubmit(e, false)} className="ig-details-workspace">
            {/* Left: Trimmed Reel Video Player */}
            <div className="ig-details-media-pane">
              <TrimmedVideoPlayer
                src={previewUrl}
                videoTrim={videoTrim}
                filterStyle={getFilterStyle(selectedFilter)}
                aspectRatio={selectedRatio.ratio || '9 / 16'}
                fitMode={selectedRatio.id === 'ORIGINAL' ? 'contain' : 'cover'}
              />
            </div>

            {/* Right: Caption, Location, Advanced Settings & Buttons */}
            <div className="ig-details-form-pane">
              {/* User Identity Header */}
              <div className="ig-details-author-row">
                <Avatar
                  user={currentUser}
                  size="sm"
                  src={currentUser?.profilePictureUrl || currentUser?.avatarUrl}
                />
                <span className="ig-details-author-username">{currentUser?.username || 'user'}</span>
              </div>

              {/* Caption Area */}
              <div className="ig-details-caption-box">
                <textarea
                  rows={4}
                  className="ig-details-caption-textarea"
                  placeholder="Write a caption for your reel... (use #hashtags and @mentions)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                />
                <span className="ig-details-char-count">{caption.length}/2,200</span>
              </div>

              {/* Location Input with quick pill suggestions */}
              <div className="ig-details-form-group">
                <label className="ig-details-field-label">
                  <MapPin size={15} />
                  <span>Add Location</span>
                </label>
                <div className="ig-location-input-wrapper">
                  <input
                    type="text"
                    className="ig-details-input"
                    placeholder="Add location (e.g. Mumbai, India)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                  />
                  {location && (
                    <button
                      type="button"
                      className="ig-clear-btn"
                      onClick={() => setLocation('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {!location && (
                  <div className="ig-location-pills">
                    {POPULAR_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        className="ig-location-pill"
                        onClick={() => setLocation(loc)}
                      >
                        {loc.split(',')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cover Frame Thumbnail Preview */}
              {customThumbnailUrl && (
                <div className="ig-cover-preview-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <img
                    src={customThumbnailUrl}
                    alt="Cover preview"
                    style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Cover Frame</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Frame at {formatTime(videoTrim.coverTime || videoTrim.start)}
                    </span>
                  </div>
                </div>
              )}

              {/* Advanced Settings Accordion */}
              <div className="ig-details-accordion">
                <button
                  type="button"
                  className="ig-accordion-header"
                  onClick={() => setShowAdvanced((p) => !p)}
                >
                  <div className="ig-accordion-title-wrap">
                    <span className="ig-accordion-title">Advanced Settings</span>
                    <span className="ig-accordion-desc">Manage comments and view counts</span>
                  </div>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvanced && (
                  <div className="ig-accordion-content">
                    <label className="ig-setting-switch-row">
                      <div className="ig-switch-text">
                        <span className="ig-switch-main-text">Hide like and view counts</span>
                        <span className="ig-switch-sub-text">
                          Only you will see total likes/views on this reel
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="ig-switch-box"
                        checked={hideLikeCount}
                        onChange={(e) => setHideLikeCount(e.target.checked)}
                      />
                    </label>

                    <label className="ig-setting-switch-row">
                      <div className="ig-switch-text">
                        <span className="ig-switch-main-text">Turn off commenting</span>
                        <span className="ig-switch-sub-text">Disable comments on this reel</span>
                      </div>
                      <input
                        type="checkbox"
                        className="ig-switch-box"
                        checked={commentsDisabled}
                        onChange={(e) => setCommentsDisabled(e.target.checked)}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Bottom Action Buttons: Save Draft & Share Reel */}
              <div className="ig-details-bottom-actions" style={{ display: 'flex', gap: '10px', padding: '14px', marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSubmit(null, true)}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Share Reel'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default CreateReelModal;
