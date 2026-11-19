import React from 'react';
import { Scissors, Film, Check } from 'lucide-react';
import { formatTime } from '../create-post';

export const ReelAdjustTab = ({
  REEL_ASPECT_RATIOS = [],
  selectedRatio = {},
  setSelectedRatio,
  videoTrim = {},
  handleResetVideoTrim,
  handleTrimStartChange,
  handleTrimEndChange,
  handleApplyVideoPreset,
  handleSaveCrop,
  isSavingCrop = false,
  handleCoverTimeChange,
}) => {
  return (
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
  );
};

export default ReelAdjustTab;
