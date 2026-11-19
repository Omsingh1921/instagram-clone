import React from 'react';
import {
  Check,
  Scissors,
  Film,
  Play,
  Crop,
} from 'lucide-react';
import { PhoneVideoTrimmer, formatTime } from '../create-post';
import { getFilterStyle } from '../../utils/instagramFilters';
import StoryStickerOverlays from './StoryStickerOverlays';

export const StoryCanvasPreview = ({
  canvasRef,
  isDragging,
  selectedRatio,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  handleSaveCrop,
  isSavingCrop,
  cropSavedToast,
  isVideo,
  videoPreviewRef,
  previewUrl,
  selectedFilter,
  videoDuration,
  handleVideoMetadataLoaded,
  handleVideoTimeUpdate,
  setIsEditVideoPlaying,
  isEditVideoPlaying,
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
  imageStageRef,
  imgElementRef,
  isCropped,
  originalPreviewUrl,
  isCustomCropActive,
  activeCrop,
  customBox,
  handleStartBoxDrag,
  showGrid,
  // Sticker props
  stickerProps,
}) => {
  return (
    <div
      ref={canvasRef}
      className={`ig-edit-canvas story-canvas ${isDragging ? 'dragging' : ''}`}
      style={{ aspectRatio: selectedRatio.ratio || '9 / 16' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Floating Top-Right Save Button */}
      <button
        type="button"
        className="ig-canvas-corner-save-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleSaveCrop();
        }}
        disabled={isSavingCrop}
        title="Save current crop/trim (✓)"
        aria-label="Save current crop/trim"
      >
        <Check size={15} strokeWidth={2.8} />
        <span>Save</span>
      </button>

      {/* Floating Green Toast Banner */}
      {cropSavedToast && (
        <div className="ig-crop-saved-banner" role="status">
          <Check size={14} strokeWidth={3} />
          <span>{isVideo ? 'Story trim saved! ✓' : 'Crop applied & saved! ✓'}</span>
        </div>
      )}

      {isVideo ? (
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

          {/* Center Play Icon Overlay */}
          {!isEditVideoPlaying && (
            <div className="ig-video-center-play-overlay" onClick={handleToggleEditVideoPlay}>
              <div className="ig-video-center-play-circle">
                <Play size={32} fill="#ffffff" color="#ffffff" style={{ marginLeft: '4px' }} />
              </div>
            </div>
          )}

          {/* Indicator Pill: Full Story vs Trimmed */}
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
              <span>Full Story: {formatTime(videoTrim.duration || videoDuration)}</span>
            </div>
          )}

          {/* Phone-Style Video Timeline Trimmer */}
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
              if (videoPreviewRef?.current) {
                videoPreviewRef.current.currentTime = time;
                setEditVideoCurrentTime(time);
              }
            }}
            onReset={handleResetVideoTrim}
            onPreset={handleApplyVideoPreset}
            filmstripFrames={filmstripFrames}
          />
        </div>
      ) : (
        <div className="ig-crop-viewport">
          <div className="ig-crop-image-stage" ref={imageStageRef}>
            <img
              ref={imgElementRef}
              src={isCropped ? previewUrl : (originalPreviewUrl || previewUrl)}
              alt="Story preview"
              className={`ig-canvas-media ${!isCustomCropActive ? (isDragging ? 'grabbing' : 'grabbable') : ''}`}
              style={{
                ...getFilterStyle(selectedFilter),
                transform: !isCustomCropActive
                  ? `translate(${activeCrop.panX}px, ${activeCrop.panY}px) scale(${activeCrop.zoom}) rotate(${activeCrop.rotation}deg)`
                  : `rotate(${activeCrop.rotation}deg)`,
                transformOrigin: 'center center',
              }}
              draggable={false}
            />

            {/* Interactive Custom Crop Frame with Corner & Edge Handles */}
            {isCustomCropActive && (
              <div
                className="ig-custom-crop-frame"
                style={{
                  left: `${customBox.x}%`,
                  top: `${customBox.y}%`,
                  width: `${customBox.width}%`,
                  height: `${customBox.height}%`,
                }}
                onPointerDown={(e) => handleStartBoxDrag(e, 'move')}
              >
                <div className="ig-crop-grid-overlay" aria-hidden="true">
                  <div className="ig-grid-line vertical line-1" />
                  <div className="ig-grid-line vertical line-2" />
                  <div className="ig-grid-line horizontal line-1" />
                  <div className="ig-grid-line horizontal line-2" />
                </div>

                <div className="ig-crop-frame-badge">
                  <Crop size={12} />
                  <span>Custom Crop</span>
                </div>

                <button
                  type="button"
                  className="ig-crop-frame-confirm-tick"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveCrop();
                  }}
                  title="Apply & Save Custom Crop"
                  aria-label="Apply & Save Custom Crop"
                >
                  <Check size={13} strokeWidth={3} />
                  <span>Apply</span>
                </button>

                {/* 4 Corner Handles */}
                <div
                  className="ig-crop-handle corner handle-nw"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-nw')}
                  title="Drag to resize crop"
                />
                <div
                  className="ig-crop-handle corner handle-ne"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-ne')}
                  title="Drag to resize crop"
                />
                <div
                  className="ig-crop-handle corner handle-se"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-se')}
                  title="Drag to resize crop"
                />
                <div
                  className="ig-crop-handle corner handle-sw"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-sw')}
                  title="Drag to resize crop"
                />

                {/* 4 Edge Handles */}
                <div
                  className="ig-crop-handle edge handle-n"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-n')}
                />
                <div
                  className="ig-crop-handle edge handle-s"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-s')}
                />
                <div
                  className="ig-crop-handle edge handle-w"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-w')}
                />
                <div
                  className="ig-crop-handle edge handle-e"
                  onPointerDown={(e) => handleStartBoxDrag(e, 'resize-e')}
                />
              </div>
            )}

            {/* Full-Canvas 3x3 Grid during pan/zoom */}
            {!isCustomCropActive && (isDragging || showGrid) && (
              <div className="ig-crop-grid-overlay" aria-hidden="true">
                <div className="ig-grid-line vertical line-1" />
                <div className="ig-grid-line vertical line-2" />
                <div className="ig-grid-line horizontal line-1" />
                <div className="ig-grid-line horizontal line-2" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Composable Multi-Sticker Overlays on Story Canvas */}
      <StoryStickerOverlays {...stickerProps} />
    </div>
  );
};

export default StoryCanvasPreview;
