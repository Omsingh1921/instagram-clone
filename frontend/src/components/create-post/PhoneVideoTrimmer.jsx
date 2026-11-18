import React, { useState, useRef } from 'react';
import {
  Scissors,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { formatTime } from './videoUtils';

/**
 * PhoneVideoTrimmer: Mobile-styled bottom video timeline trimmer with filmstrip preview
 * and dual yellow bracket handles (<| and |>) for duration cropping, just like on a smartphone.
 */
export const PhoneVideoTrimmer = ({
  videoTrim,
  currentTime = 0,
  isPlaying = false,
  isMuted = false,
  onTogglePlay,
  onToggleMute,
  onTrimChange,
  onSeek,
  onReset,
  onPreset,
  filmstripFrames = [],
}) => {
  const trackRef = useRef(null);
  const [activeDrag, setActiveDrag] = useState(null); // 'start' | 'end' | 'window' | null
  const dragDataRef = useRef({});

  const duration = Math.max(1, videoTrim?.duration || 15);
  const start = Math.max(0, videoTrim?.start || 0);
  const end = Math.min(duration, Math.max(start + 0.5, videoTrim?.end || duration));
  const trimmedLen = Math.max(0.5, end - start);

  const startPercent = Math.max(0, Math.min(100, (start / duration) * 100));
  const endPercent = Math.max(0, Math.min(100, (end / duration) * 100));
  const widthPercent = Math.max(0, endPercent - startPercent);
  const playheadPercent = Math.max(0, Math.min(100, (currentTime / duration) * 100));

  // Pointer Down on Left (Start) Handle
  const handleStartHandlePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {}
    setActiveDrag('start');
  };

  // Pointer Down on Right (End) Handle
  const handleEndHandlePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {}
    setActiveDrag('end');
  };

  // Pointer Down on Center Box (Slide Window)
  const handleWindowPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {}
    setActiveDrag('window');
    dragDataRef.current = {
      startX: e.clientX,
      initialStart: start,
      initialEnd: end,
    };
  };

  // Pointer Move Handler
  const handlePointerMove = (e) => {
    if (!activeDrag || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (!rect.width) return;

    if (activeDrag === 'start') {
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const nextStart = Math.max(0, Math.min(ratio * duration, end - 0.5));
      const rounded = Math.round(nextStart * 10) / 10;
      onTrimChange?.({ start: rounded, end });
      if (onSeek) onSeek(rounded);
    } else if (activeDrag === 'end') {
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const nextEnd = Math.min(duration, Math.max(ratio * duration, start + 0.5));
      const rounded = Math.round(nextEnd * 10) / 10;
      onTrimChange?.({ start, end: rounded });
      if (onSeek) onSeek(rounded);
    } else if (activeDrag === 'window') {
      const { startX, initialStart, initialEnd } = dragDataRef.current;
      const deltaX = e.clientX - startX;
      const deltaSec = (deltaX / rect.width) * duration;
      const windowLen = initialEnd - initialStart;

      let nextStart = initialStart + deltaSec;
      let nextEnd = initialEnd + deltaSec;

      if (nextStart < 0) {
        nextStart = 0;
        nextEnd = windowLen;
      } else if (nextEnd > duration) {
        nextEnd = duration;
        nextStart = duration - windowLen;
      }

      const rStart = Math.round(nextStart * 10) / 10;
      const rEnd = Math.round(nextEnd * 10) / 10;
      onTrimChange?.({ start: rStart, end: rEnd });
      if (onSeek) onSeek(rStart);
    }
  };

  // Pointer Up Handler
  const handlePointerUp = (e) => {
    if (activeDrag) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
    }
  };

  // Direct Click on Track to Seek Playhead
  const handleTrackClick = (e) => {
    if (activeDrag || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = Math.max(start, Math.min(end, ratio * duration));
    if (onSeek) onSeek(targetSec);
  };

  return (
    <div
      className="ig-phone-trimmer-root"
      onClick={(e) => e.stopPropagation()}
      data-testid="phone-video-trimmer"
    >
      {/* Top Header Bar of Trimmer */}
      <div className="ig-phone-trimmer-header">
        <div className="ig-phone-trimmer-left">
          <button
            type="button"
            className="ig-phone-trimmer-play-btn"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
          </button>
          <button
            type="button"
            className="ig-phone-trimmer-mute-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <div className="ig-phone-trimmer-badge">
            {start > 0 || end < duration ? (
              <Scissors size={12} color="#ffcc00" />
            ) : (
              <Film size={12} color="#0095f6" />
            )}
            <span className="ig-phone-trimmer-badge-time">
              {formatTime(start)} – {formatTime(end)}
            </span>
            <span className="ig-phone-trimmer-badge-len">
              Length: {formatTime(trimmedLen)} {start === 0 && end >= duration ? '(Full)' : ''}
            </span>
          </div>
        </div>

        <div className="ig-phone-trimmer-right">
          {/* Quick Presets */}
          <div className="ig-phone-trimmer-presets">
            <button
              type="button"
              className={`ig-phone-preset-pill ${trimmedLen === duration ? 'active' : ''}`}
              onClick={() => onPreset && onPreset(duration)}
              title="Full Duration"
            >
              Full
            </button>
            {duration > 15 && (
              <button
                type="button"
                className={`ig-phone-preset-pill ${Math.abs(trimmedLen - 15) < 0.8 ? 'active' : ''}`}
                onClick={() => onPreset && onPreset(15)}
                title="Trim to 15s"
              >
                15s
              </button>
            )}
            {duration > 30 && (
              <button
                type="button"
                className={`ig-phone-preset-pill ${Math.abs(trimmedLen - 30) < 0.8 ? 'active' : ''}`}
                onClick={() => onPreset && onPreset(30)}
                title="Trim to 30s"
              >
                30s
              </button>
            )}
          </div>

          <button
            type="button"
            className="ig-phone-trimmer-reset-btn"
            onClick={onReset}
            title="Reset video trim"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Filmstrip & Dual-Handle Trimmer Track */}
      <div
        className="ig-phone-filmstrip-track"
        ref={trackRef}
        onClick={handleTrackClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Background Filmstrip Thumbnails */}
        <div className="ig-phone-filmstrip-frames">
          {filmstripFrames && filmstripFrames.length > 0 ? (
            filmstripFrames.map((frameUrl, idx) => (
              <img
                key={idx}
                src={frameUrl}
                alt=""
                className="ig-phone-filmstrip-img"
                draggable={false}
              />
            ))
          ) : (
            <div className="ig-phone-filmstrip-placeholder">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="ig-phone-filmstrip-cell">
                  <Film size={14} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Excluded Left Dim Mask */}
        <div
          className="ig-phone-dim-mask left"
          style={{ width: `${startPercent}%` }}
        />

        {/* Excluded Right Dim Mask */}
        <div
          className="ig-phone-dim-mask right"
          style={{ width: `${100 - endPercent}%` }}
        />

        {/* Moving White Playhead Line */}
        <div
          className="ig-phone-playhead-line"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="ig-phone-playhead-knob" />
        </div>

        {/* Active Selected Trim Box with Top & Bottom Border */}
        <div
          className={`ig-phone-active-crop-box ${activeDrag ? 'dragging' : ''}`}
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
          }}
          onPointerDown={handleWindowPointerDown}
          title="Drag center to slide time window"
        >
          {/* Left Handle (Start Trim) */}
          <div
            className={`ig-phone-handle handle-start ${activeDrag === 'start' ? 'active' : ''}`}
            onPointerDown={handleStartHandlePointerDown}
            title="Drag to crop video start"
            aria-label="Drag to crop video start"
          >
            <div className="ig-phone-handle-grip">
              <span />
              <span />
              <span />
            </div>
            {activeDrag === 'start' && (
              <div className="ig-phone-handle-tooltip">{formatTime(start)}</div>
            )}
          </div>

          {/* Right Handle (End Trim) */}
          <div
            className={`ig-phone-handle handle-end ${activeDrag === 'end' ? 'active' : ''}`}
            onPointerDown={handleEndHandlePointerDown}
            title="Drag to crop video end"
            aria-label="Drag to crop video end"
          >
            <div className="ig-phone-handle-grip">
              <span />
              <span />
              <span />
            </div>
            {activeDrag === 'end' && (
              <div className="ig-phone-handle-tooltip">{formatTime(end)}</div>
            )}
          </div>
        </div>
      </div>

      <div className="ig-phone-trimmer-hint">
        <span>💡 Drag yellow handles to crop duration • Drag middle to slide window</span>
      </div>
    </div>
  );
};

export default PhoneVideoTrimmer;
