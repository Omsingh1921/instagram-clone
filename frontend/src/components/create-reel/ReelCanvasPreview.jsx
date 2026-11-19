import React from 'react';
import { Check, Play, Scissors, Film } from 'lucide-react';
import { formatTime, PhoneVideoTrimmer } from '../create-post';
import { getFilterStyle } from '../../utils/instagramFilters';

export const ReelCanvasPreview = ({
  selectedRatio,
  onSaveCrop,
  isSavingCrop,
  cropSavedToast,
  videoPreviewRef,
  previewUrl,
  selectedFilter,
  videoDuration,
  handleVideoMetadataLoaded,
  handleVideoTimeUpdate,
  isEditVideoPlaying,
  setIsEditVideoPlaying,
  handleToggleEditVideoPlay,
  videoTrim,
  editVideoCurrentTime,
  isEditVideoMuted,
  handleToggleEditVideoMute,
  setVideoTrim,
  setEditVideoCurrentTime,
  handleResetVideoTrim,
  handleApplyVideoPreset,
  filmstripFrames,
}) => {
  return (
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
          onSaveCrop();
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
  );
};

export default ReelCanvasPreview;
