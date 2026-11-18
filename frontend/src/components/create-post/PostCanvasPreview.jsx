import React from 'react';
import {
  Check,
  Play,
  Scissors,
  Film,
  Crop,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PhoneVideoTrimmer } from './PhoneVideoTrimmer';
import { formatTime } from './videoUtils';
import { ASPECT_RATIOS, getFilterStyle } from '../../utils/instagramFilters';

export const PostCanvasPreview = ({
  selectedRatio,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  handleSaveCrop,
  isSavingCrop,
  cropSavedToast,
  isVideo,
  videoPlayerRef,
  activeItem,
  handleVideoMetadataLoaded,
  handleVideoTimeUpdate,
  isEditVideoPlaying,
  setIsEditVideoPlaying,
  handleToggleEditVideoPlay,
  videoTrim,
  editVideoCurrentTime,
  setEditVideoCurrentTime,
  isEditVideoMuted,
  handleToggleEditVideoMute,
  updateActiveVideoTrim,
  handleResetVideoTrim,
  handleApplyVideoPreset,
  imageStageRef,
  imgElementRef,
  isCustomCropActive,
  activeCrop,
  customBox,
  handleStartBoxDrag,
  showGrid,
  showRatioMenu,
  setShowRatioMenu,
  showZoomMenu,
  setShowZoomMenu,
  handleSelectRatio,
  handleZoomChange,
  mediaItems,
  activeMediaIdx,
  setActiveMediaIdx,
}) => {
  return (
    <div
      className={`ig-edit-canvas ${isDragging ? 'dragging' : ''}`}
      style={{ aspectRatio: selectedRatio.ratio || 'auto' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
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
        title="Save current crop (✓)"
        aria-label="Save current crop"
      >
        <Check size={15} strokeWidth={2.8} />
        <span>Save</span>
      </button>

      {/* Toast banner upon saving crop */}
      {cropSavedToast && (
        <div className="ig-crop-saved-banner" role="status">
          <Check size={14} strokeWidth={3} />
          <span>{isVideo ? 'Video trim saved! ✓' : 'Crop applied & saved! ✓'}</span>
        </div>
      )}
      {isVideo ? (
        <div className="ig-video-viewport">
          <video
            ref={videoPlayerRef}
            src={activeItem.previewUrl}
            className="ig-canvas-media"
            style={{
              ...getFilterStyle(activeItem.filterName),
              objectFit: selectedRatio.id === 'original' ? 'contain' : 'cover',
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

          {videoTrim.start > 0 || (videoTrim.end < (videoTrim.duration || 60) && videoTrim.end > 0) ? (
            <div className="ig-video-trim-indicator-pill">
              <Scissors size={12} color="#ffcc00" />
              <span>
                Trim: {formatTime(videoTrim.start)} – {formatTime(videoTrim.end || videoTrim.duration)} ({formatTime(Math.max(1, (videoTrim.end || videoTrim.duration) - videoTrim.start))})
              </span>
            </div>
          ) : (
            <div className="ig-video-trim-indicator-pill full-len">
              <Film size={12} color="#0095f6" />
              <span>
                Full Video: {formatTime(videoTrim.duration || 60)}
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
              updateActiveVideoTrim({ start, end });
            }}
            onSeek={(time) => {
              if (videoPlayerRef?.current) {
                videoPlayerRef.current.currentTime = time;
                setEditVideoCurrentTime(time);
              }
            }}
            onReset={handleResetVideoTrim}
            onPreset={handleApplyVideoPreset}
            filmstripFrames={activeItem.filmstripFrames || []}
          />
        </div>
      ) : (
        <div className="ig-crop-viewport">
          <div className="ig-crop-image-stage" ref={imageStageRef}>
            <img
              ref={imgElementRef}
              src={activeItem.isCropped ? activeItem.previewUrl : (activeItem.originalPreviewUrl || activeItem.previewUrl)}
              alt="Edit preview"
              className={`ig-canvas-media ${!isCustomCropActive ? (isDragging ? 'grabbing' : 'grabbable') : ''}`}
              style={{
                ...getFilterStyle(activeItem.filterName),
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
                {/* 3x3 Rule-of-Thirds Grid Inside Crop Box */}
                <div className="ig-crop-grid-overlay" aria-hidden="true">
                  <div className="ig-grid-line vertical line-1" />
                  <div className="ig-grid-line vertical line-2" />
                  <div className="ig-grid-line horizontal line-1" />
                  <div className="ig-grid-line horizontal line-2" />
                </div>

                {/* Floating Live Badge */}
                <div className="ig-crop-frame-badge">
                  <Crop size={12} />
                  <span>Custom Crop</span>
                </div>

                {/* Top-Right Apply / Tick Button on Crop Frame */}
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

                {/* 4 Corner Handles (L-shaped bracket handles) */}
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

            {/* Standard Full-Canvas 3x3 Rule-of-Thirds Grid when panning/zooming */}
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

      {/* Floating bottom-left Instagram controls */}
      {!isVideo && (
        <div className="ig-canvas-floating-controls" onClick={(e) => e.stopPropagation()}>
          {/* Ratio Toggle Button */}
          <div className="ig-floating-btn-wrap">
            <button
              type="button"
              className={`ig-floating-circle-btn ${showRatioMenu || isCustomCropActive ? 'active' : ''}`}
              onClick={() => {
                setShowRatioMenu((p) => !p);
                setShowZoomMenu(false);
              }}
              title="Select Aspect Ratio & Crop Mode"
              aria-label="Select Aspect Ratio & Crop Mode"
            >
              <Crop size={17} />
            </button>

            {showRatioMenu && (
              <div className="ig-floating-popup ig-ratio-popup">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`ig-floating-popup-item ${selectedRatio.id === r.id ? 'active' : ''}`}
                    onClick={() => {
                      handleSelectRatio(r);
                      setShowRatioMenu(false);
                    }}
                  >
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zoom / Crop Slider Button */}
          <div className="ig-floating-btn-wrap">
            <button
              type="button"
              className={`ig-floating-circle-btn ${showZoomMenu ? 'active' : ''}`}
              onClick={() => {
                setShowZoomMenu((p) => !p);
                setShowRatioMenu(false);
              }}
              title="Zoom & Crop"
              aria-label="Zoom & Crop"
            >
              <ZoomIn size={17} />
            </button>

            {showZoomMenu && (
              <div className="ig-floating-popup ig-zoom-popup">
                <span className="ig-zoom-label">Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={activeCrop.zoom}
                  onChange={(e) => handleZoomChange(e.target.value)}
                  className="ig-zoom-slider"
                  aria-label="Crop Zoom Slider"
                />
                <span className="ig-zoom-val">{Math.round(activeCrop.zoom * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Carousel Previous / Next Arrows */}
      {mediaItems.length > 1 && (
        <>
          {activeMediaIdx > 0 && (
            <button
              type="button"
              className="ig-carousel-arrow left"
              onClick={() => setActiveMediaIdx((prev) => prev - 1)}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {activeMediaIdx < mediaItems.length - 1 && (
            <button
              type="button"
              className="ig-carousel-arrow right"
              onClick={() => setActiveMediaIdx((prev) => prev + 1)}
            >
              <ChevronRight size={20} />
            </button>
          )}
          <div className="ig-carousel-indicator-dots">
            {mediaItems.map((_, i) => (
              <span
                key={i}
                className={`ig-carousel-dot ${i === activeMediaIdx ? 'active' : ''}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PostCanvasPreview;
