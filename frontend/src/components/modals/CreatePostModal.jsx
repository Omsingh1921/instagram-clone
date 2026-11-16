import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  X,
  Globe,
  Lock,
  User,
  Tag,
  Search,
  MapPin,
  ChevronDown,
  ChevronUp,
  MessageSquareOff,
  Users,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Maximize2,
  Plus,
  Trash2,
  EyeOff,
  Check,
  ArrowLeft,
  Image as ImageIcon,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Film,
  Clock,
  Scissors,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import postService from '../../services/post.service';
import userService from '../../services/user.service';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import { INSTAGRAM_FILTERS, ASPECT_RATIOS, getFilterStyle } from '../../utils/instagramFilters';
import './CreatePostModal.css';

const POPULAR_LOCATIONS = [
  'New York, NY',
  'Tokyo, Japan',
  'London, UK',
  'Paris, France',
  'Mumbai, India',
  'Dubai, UAE',
  'Los Angeles, CA',
  'Bali, Indonesia',
];

const WIZARD_STEPS = {
  UPLOAD: 'UPLOAD',
  EDIT: 'EDIT', // Crop, filters, aspect ratio
  DETAILS: 'DETAILS', // Caption, tags, location, alt-text, settings
};

/**
 * Helper to format duration in minutes and seconds (mm:ss)
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds == null) return '0:00';
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Extract a high-quality poster frame / thumbnail from a video File
 */
export const extractVideoThumbnail = (fileOrUrl, seekTime = 0.5) => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !document.createElement) {
      resolve({ thumbnailUrl: null, duration: 0 });
      return;
    }

    const isBlob = typeof fileOrUrl !== 'string';
    const url = isBlob ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    if (!url.startsWith('blob:')) {
      v.crossOrigin = 'anonymous';
    }
    v.src = url;

    let hasResolved = false;
    const finish = (result) => {
      if (hasResolved) return;
      hasResolved = true;
      if (isBlob) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      resolve(result);
    };

    const captureFrame = () => {
      try {
        if (!v.videoWidth || !v.videoHeight) {
          finish({ thumbnailUrl: null, duration: Math.floor(v.duration || 0) });
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(v.videoWidth || 640, 640);
        const aspect = (v.videoWidth || 640) / (v.videoHeight || 640);
        canvas.height = Math.round(canvas.width / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl && dataUrl.startsWith('data:image') && dataUrl.length > 50) {
            finish({
              thumbnailUrl: dataUrl,
              duration: Math.floor(v.duration || 0),
              width: v.videoWidth,
              height: v.videoHeight,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Video frame extraction fallback:', err);
      }
      finish({ thumbnailUrl: null, duration: Math.floor(v.duration || 0) });
    };

    v.onloadedmetadata = () => {
      const dur = v.duration || 0;
      const targetTime = Math.min(seekTime, Math.max(0, dur - 0.1));
      v.currentTime = targetTime;
    };

    v.onseeked = () => {
      captureFrame();
    };

    v.onerror = () => finish({ thumbnailUrl: null, duration: 0 });
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    setTimeout(() => finish({ thumbnailUrl: null, duration: Math.floor(v.duration || 0) }), isTestEnv ? 80 : 3000);
    try {
      v.load();
    } catch {}
  });
};

/**
 * Extract an array of evenly spaced filmstrip frames for the mobile-style trimmer
 */
export const extractFilmstripFrames = (fileOrUrl, duration = 15, count = 8) => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !document.createElement || !duration || duration <= 0) {
      resolve([]);
      return;
    }
    const isBlob = typeof fileOrUrl !== 'string';
    const url = isBlob ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    if (!url.startsWith('blob:')) {
      v.crossOrigin = 'anonymous';
    }
    v.src = url;

    const frames = [];
    const interval = duration / count;
    let currentIdx = 0;
    let hasResolved = false;

    const finish = () => {
      if (hasResolved) return;
      hasResolved = true;
      if (isBlob) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      resolve(frames);
    };

    const capture = () => {
      try {
        if (v.videoWidth && v.videoHeight) {
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 60;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
            if (dataUrl && dataUrl.startsWith('data:image')) {
              frames.push(dataUrl);
            }
          }
        }
      } catch (e) {
        console.warn('Filmstrip frame capture error:', e);
      }

      currentIdx++;
      if (currentIdx < count) {
        v.currentTime = Math.min(duration - 0.1, currentIdx * interval + 0.1);
      } else {
        finish();
      }
    };

    v.onloadedmetadata = () => {
      v.currentTime = 0.1;
    };

    v.onseeked = () => {
      capture();
    };

    v.onerror = () => finish();
    setTimeout(() => finish(), 3500);
    try {
      v.load();
    } catch {}
  });
};

/**
 * Generate a cropped File object using off-screen HTML5 Canvas
 */
export const generateCroppedImage = (item, selectedRatio) => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !document.createElement) {
      resolve(item.file);
      return;
    }

    const crop = item.crop || { zoom: 1, panX: 0, panY: 0, rotation: 0 };
    const zoom = crop.zoom || 1;
    const panX = crop.panX || 0;
    const panY = crop.panY || 0;
    const rotation = (crop.rotation || 0) * (Math.PI / 180);
    const box = crop.customCropBox;

    const hasCustomCrop = box && (box.width < 99.5 || box.height < 99.5 || box.x > 0.5 || box.y > 0.5);

    // If default zoom/pan/rotation, no custom box, and original ratio, return original file
    if (
      !hasCustomCrop &&
      zoom === 1 &&
      panX === 0 &&
      panY === 0 &&
      (crop.rotation || 0) === 0 &&
      (selectedRatio.id === 'ORIGINAL' || selectedRatio.id === 'CUSTOM')
    ) {
      resolve(item.file);
      return;
    }

    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const safetyTimer = setTimeout(() => {
      resolve(item.file);
    }, isTestEnv ? 80 : 3000);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(safetyTimer);
      try {
        let canvasWidth = 1080;
        let canvasHeight = 1080;

        // 1. Custom Interactive Bounding Box Crop Mode
        if (hasCustomCrop) {
          const srcX = Math.max(0, Math.round((box.x / 100) * img.naturalWidth));
          const srcY = Math.max(0, Math.round((box.y / 100) * img.naturalHeight));
          const srcW = Math.max(1, Math.min(img.naturalWidth - srcX, Math.round((box.width / 100) * img.naturalWidth)));
          const srcH = Math.max(1, Math.min(img.naturalHeight - srcY, Math.round((box.height / 100) * img.naturalHeight)));

          const targetAspect = srcW / srcH;
          canvasWidth = Math.min(Math.max(srcW, 800), 1920);
          canvasHeight = Math.round(canvasWidth / targetAspect);

          const canvas = document.createElement('canvas');
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(item.file);
            return;
          }

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          ctx.save();
          if (rotation) {
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.rotate(rotation);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
          } else {
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvasWidth, canvasHeight);
          }
          ctx.restore();

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(item.file);
                return;
              }
              const croppedFile = new File(
                [blob],
                (item.file.name || 'image').replace(/\.[^/.]+$/, '') + '_cropped.jpg',
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(croppedFile);
            },
            'image/jpeg',
            0.92
          );
          return;
        }

        // 2. Standard Aspect Ratio + Zoom/Pan Crop Mode
        let targetAspect = img.naturalWidth / img.naturalHeight;
        if (selectedRatio.id === '1:1') targetAspect = 1.0;
        else if (selectedRatio.id === '4:5') targetAspect = 0.8;
        else if (selectedRatio.id === '16:9') targetAspect = 16 / 9;

        canvasWidth = 1080;
        canvasHeight = Math.round(canvasWidth / targetAspect);
        if (targetAspect < 1) {
          canvasHeight = 1350;
          canvasWidth = Math.round(canvasHeight * targetAspect);
        }

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(item.file);
          return;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        if (rotation) ctx.rotate(rotation);
        ctx.scale(zoom, zoom);

        const scale = Math.max(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
        const drawWidth = img.naturalWidth * scale;
        const drawHeight = img.naturalHeight * scale;

        const panScale = canvasWidth / 450;
        ctx.drawImage(
          img,
          -drawWidth / 2 + panX * panScale,
          -drawHeight / 2 + panY * panScale,
          drawWidth,
          drawHeight
        );
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(item.file);
              return;
            }
            const croppedFile = new File(
              [blob],
              (item.file.name || 'image').replace(/\.[^/.]+$/, '') + '_cropped.jpg',
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(croppedFile);
          },
          'image/jpeg',
          0.92
        );
      } catch (err) {
        console.warn('Canvas cropping fallback:', err);
        resolve(item.file);
      }
    };

    img.onerror = () => {
      clearTimeout(safetyTimer);
      resolve(item.file);
    };
    img.src = item.originalPreviewUrl || item.previewUrl;
  });
};

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
      onTrimChange({ start: rounded, end });
      if (onSeek) onSeek(rounded);
    } else if (activeDrag === 'end') {
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const nextEnd = Math.min(duration, Math.max(ratio * duration, start + 0.5));
      const rounded = Math.round(nextEnd * 10) / 10;
      onTrimChange({ start, end: rounded });
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
      onTrimChange({ start: rStart, end: rEnd });
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

/**
 * TrimmedVideoPlayer: Specialized player for Instagram Details preview.
 * Strictly plays the trimmed segment [start, end], normalizes time display (0:00 / 0:06),
 * loops seamlessly, and provides sleek Instagram-styled playback and scrub controls.
 */
export const TrimmedVideoPlayer = ({
  src,
  videoTrim,
  filterStyle = {},
  aspectRatio = '1 / 1',
  fitMode = 'cover',
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(videoTrim?.start || 0);

  const start = Math.max(0, videoTrim?.start || 0);
  const duration = Math.max(1, videoTrim?.duration || 60);
  const end = Math.min(duration, Math.max(start + 0.5, videoTrim?.end || duration));
  const trimmedDuration = Math.max(0.5, end - start);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      setCurrentTime(start);
    }
  }, [src, start, end]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      setCurrentTime(start);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    if (cur >= end) {
      videoRef.current.currentTime = start;
      setCurrentTime(start);
      videoRef.current.play().catch(() => {});
    } else if (cur < start) {
      videoRef.current.currentTime = start;
      setCurrentTime(start);
    } else {
      setCurrentTime(cur);
    }
  };

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= end || videoRef.current.currentTime < start) {
        videoRef.current.currentTime = start;
      }
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleScrub = (e) => {
    if (e) e.stopPropagation();
    const percent = parseFloat(e.target.value);
    const targetTime = start + (percent / 100) * trimmedDuration;
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const elapsedTrimmed = Math.max(0, Math.min(trimmedDuration, currentTime - start));
  const progressPercent = Math.max(0, Math.min(100, (elapsedTrimmed / trimmedDuration) * 100));

  return (
    <div
      className="ig-trimmed-video-player-root"
      onClick={togglePlay}
      style={{ aspectRatio }}
      data-testid="trimmed-video-player"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        muted={isMuted}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="ig-trimmed-video-element"
        style={{
          ...filterStyle,
          objectFit: fitMode,
        }}
      />

      {/* Floating Trim Badge */}
      <div className="ig-trimmed-pill-badge" onClick={(e) => e.stopPropagation()}>
        <Scissors size={12} color="#0095f6" />
        <span>
          Trimmed: {formatTime(start)} – {formatTime(end)} ({formatTime(trimmedDuration)})
        </span>
      </div>

      {/* Center Big Play overlay icon when paused */}
      {!isPlaying && (
        <div className="ig-trimmed-center-play" onClick={togglePlay}>
          <div className="ig-trimmed-center-circle">
            <Play size={28} fill="#ffffff" color="#ffffff" style={{ marginLeft: '3px' }} />
          </div>
        </div>
      )}

      {/* Sleek Instagram Bottom Player Controls */}
      <div className="ig-trimmed-controls-bar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="ig-trimmed-ctrl-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
        </button>

        {/* Scrubber Slider */}
        <div className="ig-trimmed-scrubber-wrap">
          <div className="ig-trimmed-scrubber-track">
            <div
              className="ig-trimmed-scrubber-progress"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={progressPercent}
            onChange={handleScrub}
            className="ig-trimmed-scrubber-slider"
            aria-label="Seek trimmed video"
          />
        </div>

        {/* Trimmed Duration Time Display (e.g. 0:00 / 0:06) */}
        <span className="ig-trimmed-time-badge">
          {formatTime(elapsedTrimmed)} / {formatTime(trimmedDuration)}
        </span>

        {/* Audio Mute / Unmute Button */}
        <button
          type="button"
          className="ig-trimmed-ctrl-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
};

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [currentStep, setCurrentStep] = useState(WIZARD_STEPS.UPLOAD);

  // Multi-media Carousel state: array of { file, previewUrl, filterName, altText, tags: [] }
  const [mediaItems, setMediaItems] = useState([]);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  // Aspect ratio state
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[1]); // Default 1:1

  // Active edit tab: 'FILTERS' | 'RATIO'
  const [editTab, setEditTab] = useState('FILTERS');

  // Details step states
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAltTextSection, setShowAltTextSection] = useState(false);

  // Tagging states for active media
  const [taggingPos, setTaggingPos] = useState(null); // { xPercent, yPercent }
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Collaborator state
  const [collaborator, setCollaborator] = useState(null);
  const [collabQuery, setCollabQuery] = useState('');
  const [collabResults, setCollabResults] = useState([]);
  const [showCollabSearch, setShowCollabSearch] = useState(false);

  // Drag & drop and loading
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Interactive Crop & Zoom states
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [processingCrop, setProcessingCrop] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [cropSavedToast, setCropSavedToast] = useState(false);
  const [isCustomCropActive, setIsCustomCropActive] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });
  const imageStageRef = useRef(null);
  const imgElementRef = useRef(null);
  const videoPlayerRef = useRef(null);

  // Edit Step Video Playback & Trimmer states
  const [editVideoCurrentTime, setEditVideoCurrentTime] = useState(0);
  const [isEditVideoPlaying, setIsEditVideoPlaying] = useState(false);
  const [isEditVideoMuted, setIsEditVideoMuted] = useState(false);

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);
  const imagePreviewRef = useRef(null);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const uploadCtx = useUpload();

  const resetForm = (keepThumbnailUrl = null, preserveObjectUrls = false) => {
    // Revoke object URLs unless handing off to background uploader
    if (!preserveObjectUrls) {
      mediaItems.forEach((item) => {
        if (item.previewUrl && item.previewUrl !== keepThumbnailUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.originalPreviewUrl && item.originalPreviewUrl !== item.previewUrl && item.originalPreviewUrl !== keepThumbnailUrl) {
          URL.revokeObjectURL(item.originalPreviewUrl);
        }
      });
    }
    setMediaItems([]);
    setActiveMediaIdx(0);
    setSelectedRatio(ASPECT_RATIOS[1]);
    setEditTab('FILTERS');
    setShowRatioMenu(false);
    setShowZoomMenu(false);
    setShowGrid(false);
    setIsDragging(false);
    setIsCustomCropActive(false);
    setProcessingCrop(false);
    setIsSavingCrop(false);
    setCropSavedToast(false);
    setEditVideoCurrentTime(0);
    setIsEditVideoPlaying(false);
    setIsEditVideoMuted(false);
    setCaption('');
    setLocation('');
    setCommentsDisabled(false);
    setHideLikeCount(false);
    setVisibility('PUBLIC');
    setShowAdvanced(false);
    setShowAltTextSection(false);
    setTaggingPos(null);
    setUserSearchQuery('');
    setUserSearchResults([]);
    setCollaborator(null);
    setCollabQuery('');
    setCollabResults([]);
    setShowCollabSearch(false);
    setLoading(false);
    setIsDragOver(false);
    setCurrentStep(WIZARD_STEPS.UPLOAD);
  };

  const handleClose = (keepThumbnailUrl = null, preserveObjectUrls = false) => {
    resetForm(keepThumbnailUrl, preserveObjectUrls);
    onClose();
  };

  // Add files to mediaItems (up to 10)
  const handleFilesAdded = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const incoming = Array.from(filesList);

    const validFiles = incoming.filter((f) => {
      const isImg = f.type.startsWith('image/');
      const isVid = f.type.startsWith('video/');
      if (!isImg && !isVid) {
        showError(`${f.name} is not an image or video file.`);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        showError(`${f.name} exceeds 50MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (mediaItems.length + validFiles.length > 10) {
      showError('You can only select up to 10 media items for a carousel.');
    }

    const availableSlots = 10 - mediaItems.length;
    const toAdd = validFiles.slice(0, availableSlots).map((file) => {
      const url = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video/');
      return {
        file,
        originalFile: file,
        originalPreviewUrl: url,
        previewUrl: url,
        thumbnailUrl: isVid ? null : url,
        duration: isVid ? 60 : 0,
        filterName: 'NORMAL',
        altText: '',
        tags: [],
        crop: {
          zoom: 1,
          panX: 0,
          panY: 0,
          rotation: 0,
          customCropBox: { x: 0, y: 0, width: 100, height: 100 },
        },
        videoTrim: isVid ? { start: 0, end: 60, duration: 60, coverTime: 0 } : null,
        filmstripFrames: [],
      };
    });

    setMediaItems((prev) => [...prev, ...toAdd]);
    if (currentStep === WIZARD_STEPS.UPLOAD) {
      setCurrentStep(WIZARD_STEPS.EDIT);
    }

    // Asynchronously extract poster frame thumbnail and duration for video files
    toAdd.forEach(async (item) => {
      if (item.file.type.startsWith('video/')) {
        const info = await extractVideoThumbnail(item.file, 0.5);
        const dur = info?.duration || 60;
        const frames = await extractFilmstripFrames(item.file, dur, 8);
        if (info) {
          setMediaItems((prev) =>
            prev.map((m) =>
              m.file === item.file
                ? {
                    ...m,
                    thumbnailUrl: info.thumbnailUrl,
                    duration: dur,
                    filmstripFrames: frames,
                    videoTrim: {
                      start: 0,
                      end: dur,
                      duration: dur,
                      coverTime: 0,
                    },
                  }
                : m
            )
          );
        }
      }
    });
  };

  const handleRemoveMedia = (index) => {
    if (mediaItems.length <= 1) {
      resetForm();
      return;
    }
    const itemToRemove = mediaItems[index];
    if (itemToRemove?.previewUrl) URL.revokeObjectURL(itemToRemove.previewUrl);
    if (itemToRemove?.originalPreviewUrl && itemToRemove.originalPreviewUrl !== itemToRemove.previewUrl) {
      URL.revokeObjectURL(itemToRemove.originalPreviewUrl);
    }

    const updated = mediaItems.filter((_, i) => i !== index);
    setMediaItems(updated);
    if (activeMediaIdx >= updated.length) {
      setActiveMediaIdx(updated.length - 1);
    }
  };

  // Active crop helper
  const updateActiveCrop = (updates) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? {
              ...item,
              crop: {
                ...(item.crop || { zoom: 1, panX: 0, panY: 0, rotation: 0 }),
                ...updates,
              },
            }
          : item
      )
    );
  };

  // Mouse & Touch Pan Handlers
  const handleMouseDown = (e) => {
    if (isVideo) return;
    setIsDragging(true);
    setShowGrid(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: activeCrop.panX,
      initialPanY: activeCrop.panY,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const maxBound = (activeCrop.zoom - 0.9) * 220 + 80;
    const nextX = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initialPanX + deltaX));
    const nextY = Math.max(-maxBound, Math.min(maxBound, dragStartRef.current.initialPanY + deltaY));
    updateActiveCrop({ panX: nextX, panY: nextY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setShowGrid(false);
    }
  };

  // Wheel Zoom Handler
  const handleWheel = (e) => {
    if (isVideo) return;
    e.preventDefault();
    const currentZ = activeCrop.zoom || 1;
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZ = Math.min(3, Math.max(1, Math.round((currentZ + delta) * 100) / 100));
    setShowGrid(true);
    updateActiveCrop({ zoom: nextZ });
    setTimeout(() => setShowGrid(false), 400);
  };

  const handleZoomChange = (val) => {
    const nextZoom = parseFloat(val);
    updateActiveCrop({ zoom: nextZoom });
  };

  const handleRotate = () => {
    const curRot = activeCrop.rotation || 0;
    updateActiveCrop({ rotation: (curRot + 90) % 360 });
  };

  const handleStartBoxDrag = (e, actionType) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVideo) return;

    const stage = imageStageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return;

    setShowGrid(true);

    const currentBox = activeCrop.customCropBox || { x: 5, y: 5, width: 90, height: 90 };
    const startPointer = { x: e.clientX, y: e.clientY };
    const startBox = { ...currentBox };

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaXPercent = ((moveEvent.clientX - startPointer.x) / stageRect.width) * 100;
      const deltaYPercent = ((moveEvent.clientY - startPointer.y) / stageRect.height) * 100;

      let { x, y, width, height } = startBox;

      switch (actionType) {
        case 'move': {
          x = Math.max(0, Math.min(100 - width, startBox.x + deltaXPercent));
          y = Math.max(0, Math.min(100 - height, startBox.y + deltaYPercent));
          break;
        }
        case 'resize-se': {
          width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
          height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
          break;
        }
        case 'resize-nw': {
          const nextX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent));
          const nextY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent));
          width = startBox.width - (nextX - startBox.x);
          height = startBox.height - (nextY - startBox.y);
          x = nextX;
          y = nextY;
          break;
        }
        case 'resize-ne': {
          const nextY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent));
          width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
          height = startBox.height - (nextY - startBox.y);
          y = nextY;
          break;
        }
        case 'resize-sw': {
          const nextX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent));
          width = startBox.width - (nextX - startBox.x);
          height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
          x = nextX;
          break;
        }
        case 'resize-n': {
          const nextY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + deltaYPercent));
          height = startBox.height - (nextY - startBox.y);
          y = nextY;
          break;
        }
        case 'resize-s': {
          height = Math.max(10, Math.min(100 - y, startBox.height + deltaYPercent));
          break;
        }
        case 'resize-w': {
          const nextX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + deltaXPercent));
          width = startBox.width - (nextX - startBox.x);
          x = nextX;
          break;
        }
        case 'resize-e': {
          width = Math.max(10, Math.min(100 - x, startBox.width + deltaXPercent));
          break;
        }
        default:
          break;
      }

      updateActiveCrop({
        customCropBox: {
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          width: Math.round(width * 10) / 10,
          height: Math.round(height * 10) / 10,
        },
      });
    };

    const onPointerUp = () => {
      setShowGrid(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handleToggleCustomCrop = () => {
    setIsCustomCropActive((prev) => {
      const next = !prev;
      if (next && (!activeCrop.customCropBox || activeCrop.customCropBox.width === 100)) {
        updateActiveCrop({
          customCropBox: { x: 5, y: 5, width: 90, height: 90 },
        });
      }
      return next;
    });
  };

  const handleSelectRatio = (ratio) => {
    setSelectedRatio(ratio);
    if (ratio.id === 'CUSTOM') {
      setIsCustomCropActive(true);
      if (!activeCrop.customCropBox || activeCrop.customCropBox.width === 100) {
        updateActiveCrop({
          customCropBox: { x: 5, y: 5, width: 90, height: 90 },
        });
      }
    }
  };

  const handleResetCrop = () => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? {
              ...item,
              file: item.originalFile || item.file,
              previewUrl: item.originalPreviewUrl || item.previewUrl,
              isCropped: false,
              crop: {
                zoom: 1,
                panX: 0,
                panY: 0,
                rotation: 0,
                customCropBox: { x: 0, y: 0, width: 100, height: 100 },
              },
            }
          : item
      )
    );
    setIsCustomCropActive(false);
    showSuccess('Crop reset to original.');
  };

  // Immediate Save & Commit for Crop or Video Trim (Right Tick Button)
  const handleSaveCrop = async () => {
    if (!activeItem) return;
    setIsSavingCrop(true);
    try {
      if (activeItem.file.type.startsWith('video/')) {
        const trim = activeItem.videoTrim || {
          start: 0,
          end: activeItem.duration || 60,
          duration: activeItem.duration || 60,
          coverTime: 0,
        };
        const trimmedDuration = Math.max(1, (trim.end || trim.duration) - (trim.start || 0));
        let thumb = activeItem.thumbnailUrl;
        if (!thumb || !thumb.startsWith('data:image')) {
          const res = await extractVideoThumbnail(
            activeItem.originalFile || activeItem.file,
            trim.coverTime || trim.start || 0.5
          );
          if (res?.thumbnailUrl) thumb = res.thumbnailUrl;
        }
        setMediaItems((prev) =>
          prev.map((item, idx) =>
            idx === activeMediaIdx
              ? {
                  ...item,
                  thumbnailUrl: thumb,
                  trimmedDuration,
                  isTrimmed: true,
                }
              : item
          )
        );
        showSuccess(`Video trim saved! (${formatTime(trim.start)} – ${formatTime(trim.end || trim.duration)}) ✓`);
      } else {
        const croppedFile = await generateCroppedImage(activeItem, selectedRatio);
        if (croppedFile) {
          const newPreview = URL.createObjectURL(croppedFile);
          setMediaItems((prev) =>
            prev.map((item, idx) =>
              idx === activeMediaIdx
                ? {
                    ...item,
                    file: croppedFile,
                    previewUrl: newPreview,
                    isCropped: true,
                    crop: {
                      zoom: 1,
                      panX: 0,
                      panY: 0,
                      rotation: 0,
                      customCropBox: { x: 0, y: 0, width: 100, height: 100 },
                    },
                  }
                : item
            )
          );
          setIsCustomCropActive(false);
          showSuccess('Crop applied & saved! ✓');
        } else {
          showSuccess('Crop saved! ✓');
        }
      }
      setCropSavedToast(true);
      setTimeout(() => setCropSavedToast(false), 2400);
    } catch (err) {
      console.error('Failed to save crop:', err);
      showError('Failed to save crop. Please try again.');
    } finally {
      setIsSavingCrop(false);
    }
  };

  // Video Duration Trimming & Playback Sync
  const updateActiveVideoTrim = (updates) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? {
              ...item,
              videoTrim: {
                ...(item.videoTrim || {
                  start: 0,
                  end: Math.floor(item.duration) || 60,
                  duration: Math.floor(item.duration) || 60,
                  coverTime: 0,
                }),
                ...updates,
              },
            }
          : item
      )
    );
  };

  const handleToggleEditVideoPlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoPlayerRef.current) return;
    if (isEditVideoPlaying) {
      videoPlayerRef.current.pause();
      setIsEditVideoPlaying(false);
    } else {
      const { start, end } = activeItem?.videoTrim || { start: 0, end: 15 };
      if (videoPlayerRef.current.currentTime >= end || videoPlayerRef.current.currentTime < start) {
        videoPlayerRef.current.currentTime = start;
      }
      videoPlayerRef.current
        .play()
        .then(() => setIsEditVideoPlaying(true))
        .catch(() => {});
    }
  };

  const handleToggleEditVideoMute = (e) => {
    if (e) e.stopPropagation();
    if (!videoPlayerRef.current) return;
    videoPlayerRef.current.muted = !isEditVideoMuted;
    setIsEditVideoMuted(!isEditVideoMuted);
  };

  const handleVideoTimeUpdate = () => {
    if (!videoPlayerRef.current || !activeItem?.videoTrim) return;
    const cur = videoPlayerRef.current.currentTime;
    setEditVideoCurrentTime(cur);
    const { start, end } = activeItem.videoTrim;
    if (end > 0 && cur >= end) {
      videoPlayerRef.current.currentTime = start || 0;
      setEditVideoCurrentTime(start || 0);
      videoPlayerRef.current.play().catch(() => {});
    }
  };

  const handleVideoMetadataLoaded = (e) => {
    const v = e.target;
    const dur = Math.floor(v.duration) || 0;
    if (dur > 0) {
      updateActiveVideoTrim({
        duration: dur,
        start: activeItem?.videoTrim?.start || 0,
        end: activeItem?.videoTrim?.end || dur,
      });

      if (!activeItem?.filmstripFrames || activeItem.filmstripFrames.length === 0) {
        extractFilmstripFrames(activeItem.originalFile || activeItem.file, dur, 8).then((frames) => {
          if (frames && frames.length > 0) {
            setMediaItems((prev) =>
              prev.map((item, idx) =>
                idx === activeMediaIdx ? { ...item, filmstripFrames: frames } : item
              )
            );
          }
        });
      }
    }

    // Capture crisp poster thumbnail from active video element immediately
    try {
      if (v.videoWidth && v.videoHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(v.videoWidth, 480);
        const aspect = v.videoWidth / v.videoHeight;
        canvas.height = Math.round(canvas.width / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl && dataUrl.startsWith('data:image') && dataUrl.length > 50) {
            setMediaItems((prev) =>
              prev.map((item, idx) =>
                idx === activeMediaIdx ? { ...item, thumbnailUrl: dataUrl } : item
              )
            );
          }
        }
      }
    } catch (err) {
      console.warn('Direct video frame capture fallback:', err);
    }
  };

  const handleTrimStartChange = (val) => {
    const dur = activeItem?.videoTrim?.duration || 60;
    const curEnd = activeItem?.videoTrim?.end || dur;
    const maxStart = Math.max(0, curEnd - 1);
    const nextStart = Math.min(val, maxStart);
    updateActiveVideoTrim({ start: nextStart });
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = nextStart;
    }
  };

  const handleTrimEndChange = (val) => {
    const curStart = activeItem?.videoTrim?.start || 0;
    const minEnd = curStart + 1;
    const nextEnd = Math.max(val, minEnd);
    updateActiveVideoTrim({ end: nextEnd });
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = nextEnd;
    }
  };

  const handleCoverTimeChange = (val) => {
    updateActiveVideoTrim({ coverTime: val });
    if (videoPlayerRef.current) {
      const v = videoPlayerRef.current;
      v.currentTime = val;
      const onSeekedCapture = () => {
        try {
          if (v.videoWidth && v.videoHeight) {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(v.videoWidth, 480);
            const aspect = v.videoWidth / v.videoHeight;
            canvas.height = Math.round(canvas.width / aspect);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              if (dataUrl && dataUrl.startsWith('data:image') && dataUrl.length > 50) {
                setMediaItems((prev) =>
                  prev.map((item, idx) =>
                    idx === activeMediaIdx ? { ...item, thumbnailUrl: dataUrl } : item
                  )
                );
              }
            }
          }
        } catch (err) {
          console.warn('Cover frame capture fallback:', err);
        } finally {
          v.removeEventListener('seeked', onSeekedCapture);
        }
      };
      v.addEventListener('seeked', onSeekedCapture, { once: true });
    }
    extractVideoThumbnail(activeItem.originalFile || activeItem.file, val).then((res) => {
      if (res?.thumbnailUrl && res.thumbnailUrl.startsWith('data:image')) {
        setMediaItems((prev) =>
          prev.map((item, idx) =>
            idx === activeMediaIdx ? { ...item, thumbnailUrl: res.thumbnailUrl } : item
          )
        );
      }
    });
  };

  const handleApplyVideoPreset = (seconds) => {
    const dur = activeItem?.videoTrim?.duration || 60;
    if (seconds >= dur) {
      updateActiveVideoTrim({ start: 0, end: dur });
      if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
    } else {
      updateActiveVideoTrim({ start: 0, end: seconds });
      if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
    }
  };

  const handleResetVideoTrim = () => {
    const dur = activeItem?.videoTrim?.duration || 60;
    updateActiveVideoTrim({ start: 0, end: dur, coverTime: 0 });
    if (videoPlayerRef.current) videoPlayerRef.current.currentTime = 0;
  };

  // Proceed to Details with Crop Rendering
  const handleProceedToDetails = async () => {
    setProcessingCrop(true);
    try {
      const updatedMedia = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.file.type.startsWith('video/')) {
            const trim = item.videoTrim || {
              start: 0,
              end: item.duration || 60,
              duration: item.duration || 60,
              coverTime: 0,
            };
            const trimmedDuration = Math.max(1, (trim.end || trim.duration) - (trim.start || 0));
            let thumb = item.thumbnailUrl;
            if (!thumb || !thumb.startsWith('data:image')) {
              const res = await extractVideoThumbnail(
                item.originalFile || item.file,
                trim.coverTime || trim.start || 0.5
              );
              if (res?.thumbnailUrl) thumb = res.thumbnailUrl;
            }
            return {
              ...item,
              thumbnailUrl: thumb,
              trimmedDuration,
              isTrimmed: trim.start > 0 || (trim.end > 0 && trim.end < trim.duration) || item.isTrimmed,
            };
          }
          if (item.isCropped) {
            return item;
          }
          const croppedFile = await generateCroppedImage(item, selectedRatio);
          if (croppedFile) {
            const newPreview = URL.createObjectURL(croppedFile);
            return {
              ...item,
              file: croppedFile,
              previewUrl: newPreview,
              isCropped: true,
            };
          }
          return item;
        })
      );
      setMediaItems(updatedMedia);
      setCurrentStep(WIZARD_STEPS.DETAILS);
    } catch (err) {
      console.error('Failed to crop media:', err);
      setCurrentStep(WIZARD_STEPS.DETAILS);
    } finally {
      setProcessingCrop(false);
    }
  };

  const handleApplyFilter = (filterId) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx ? { ...item, filterName: filterId } : item
      )
    );
  };

  const handleAltTextChange = (idx, text) => {
    setMediaItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, altText: text } : item))
    );
  };

  // Interactive user tagging on active photo
  const handleImageClick = (e) => {
    const activeItem = mediaItems[activeMediaIdx];
    if (!activeItem || activeItem.file.type.startsWith('video/')) return;
    if (!imagePreviewRef.current) return;

    const rect = imagePreviewRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.round((clickX / rect.width) * 1000) / 10;
    const yPercent = Math.round((clickY / rect.height) * 1000) / 10;

    setTaggingPos({ xPercent, yPercent });
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleSearchUsers = async (q) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setUserSearchResults([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const res = await userService.searchUsers(q.trim(), 0, 5);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setUserSearchResults(list);
    } catch {
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSelectTaggedUser = (user) => {
    if (!taggingPos) return;
    const activeItem = mediaItems[activeMediaIdx];
    if (activeItem.tags.some((t) => t.userId === user.id)) {
      showError(`@${user.username} is already tagged on this photo.`);
      setTaggingPos(null);
      return;
    }

    const newTag = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.fullName,
      avatarUrl: user.profilePictureUrl || user.avatarUrl,
      xPercent: taggingPos.xPercent,
      yPercent: taggingPos.yPercent,
    };

    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx ? { ...item, tags: [...item.tags, newTag] } : item
      )
    );

    setTaggingPos(null);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleRemoveTag = (userId) => {
    setMediaItems((prev) =>
      prev.map((item, idx) =>
        idx === activeMediaIdx
          ? { ...item, tags: item.tags.filter((t) => t.userId !== userId) }
          : item
      )
    );
  };

  // Collaborator search
  const handleSearchCollab = async (q) => {
    setCollabQuery(q);
    if (!q.trim()) {
      setCollabResults([]);
      return;
    }
    try {
      const res = await userService.searchUsers(q.trim(), 0, 5);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setCollabResults(list);
    } catch {
      setCollabResults([]);
    }
  };

  // Submit Post
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (mediaItems.length === 0) {
      showError('Please select at least one photo or video.');
      return;
    }

    // Snapshot parameters for background execution
    const capturedItems = mediaItems.map((item) => ({ ...item }));
    const capturedCaption = caption;
    const capturedLocation = location;
    const capturedCollaborator = collaborator;
    const capturedCommentsDisabled = commentsDisabled;
    const capturedHideLike = hideLikeCount;
    const capturedVisibility = visibility;
    const capturedRatio = selectedRatio;
    const capturedThumbnail = mediaItems[0]?.previewUrl || '';

    const performPostUpload = async (updateProgress = () => {}) => {
      // 1. Upload media files in sequence/parallel with dynamic progress updates
      const uploadedMediaRequests = [];
      const totalItems = capturedItems.length;
      for (let i = 0; i < totalItems; i++) {
        const item = capturedItems[i];
        const basePct = Math.round(15 + (i / totalItems) * 65);
        const itemSlice = Math.round(65 / totalItems);
        const statusMsg = totalItems > 1
          ? `Sharing media ${i + 1} of ${totalItems}...`
          : 'Sharing media...';

        updateProgress(basePct, statusMsg);

        const uploadRes = await postService.uploadMedia(item.file, 'posts', (filePct) => {
          const dynamicPct = Math.min(80, Math.round(basePct + (filePct / 100) * itemSlice));
          updateProgress(dynamicPct, statusMsg);
        });
        let mediaUrl =
          uploadRes?.secureUrl ||
          uploadRes?.data?.secureUrl ||
          uploadRes?.data?.mediaUrl ||
          uploadRes?.mediaUrl;
        const mediaType =
          uploadRes?.data?.mediaType ||
          uploadRes?.mediaType ||
          (item.file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');

        if (!mediaUrl) {
          throw new Error(`Media upload failed for item #${i + 1}`);
        }

        // Apply Cloudinary video duration trimming & aspect ratio transformations if trimmed/cropped
        if (item.file.type.startsWith('video/') && mediaUrl) {
          const trim = item.videoTrim;
          const transforms = [];
          if (capturedRatio?.id && capturedRatio.id !== 'original' && capturedRatio.id !== 'custom') {
            transforms.push(`c_fill,ar_${capturedRatio.id}`);
          }
          if (trim) {
            const { start = 0, end = 0, duration = 0 } = trim;
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

        uploadedMediaRequests.push({
          mediaUrl,
          mediaType,
          displayOrder: i,
          width: uploadRes?.data?.width || 1080,
          height: uploadRes?.data?.height || 1080,
          altText: item.altText?.trim() || null,
          filterName: item.filterName || 'NORMAL',
          tags: item.tags.map((t) => ({
            taggedUserId: t.userId,
            xPercent: t.xPercent,
            yPercent: t.yPercent,
          })),
        });
      }

      updateProgress(85, 'Finishing up...');

      // Gather distinct tagged users across all slides
      const allTaggedUsersMap = new Map();
      capturedItems.forEach((item) => {
        item.tags.forEach((t) => {
          if (!allTaggedUsersMap.has(t.userId)) {
            allTaggedUsersMap.set(t.userId, {
              taggedUserId: t.userId,
              xPercent: t.xPercent,
              yPercent: t.yPercent,
            });
          }
        });
      });

      const postPayload = {
        caption: capturedCaption.trim(),
        location: capturedLocation.trim() || null,
        collaboratorId: capturedCollaborator?.id || null,
        commentsDisabled: Boolean(capturedCommentsDisabled),
        hideLikeCount: Boolean(capturedHideLike),
        visibility: capturedVisibility,
        taggedUsers: Array.from(allTaggedUsersMap.values()),
        media: uploadedMediaRequests,
      };

      await postService.createPost(postPayload);
      if (onPostCreated) onPostCreated();
    };

    // 🚀 BACKGROUND UPLOAD: If UploadContext is available, fire in background & close modal immediately!
    if (uploadCtx?.startUpload) {
      uploadCtx.startUpload({
        type: 'post',
        title: capturedCaption
          ? `Post: ${capturedCaption.slice(0, 22)}...`
          : capturedItems.length > 1
          ? 'New Carousel Post'
          : 'New Post',
        thumbnail: capturedThumbnail,
        mediaUrl: capturedThumbnail,
        mediaType: capturedItems[0]?.file?.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        mediaItems: capturedItems.map((item) => ({
          previewUrl: item.previewUrl,
          type: item.file?.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        })),
        caption: capturedCaption.trim(),
        location: capturedLocation.trim() || null,
        user: currentUser,
        createdAt: new Date().toISOString(),
        task: performPostUpload,
      });
      handleClose(capturedThumbnail, true);
      return;
    }

    // Synchronous fallback (e.g. for standalone tests without UploadProvider)
    try {
      setLoading(true);
      setUploadProgress('Sharing media...');
      await performPostUpload();
      showSuccess(
        mediaItems.length > 1
          ? 'Carousel post published successfully!'
          : 'Post published successfully!'
      );
      handleClose();
    } catch (err) {
      showError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const activeItem = mediaItems[activeMediaIdx] || mediaItems[0];
  const isVideo = activeItem?.file?.type?.startsWith('video/');
  const activeCrop = activeItem?.crop || {
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    customCropBox: { x: 0, y: 0, width: 100, height: 100 },
  };
  const customBox = activeCrop.customCropBox || { x: 0, y: 0, width: 100, height: 100 };
  const videoTrim = activeItem?.videoTrim || {
    start: 0,
    end: Math.floor(activeItem?.duration) || 60,
    duration: Math.floor(activeItem?.duration) || 60,
    coverTime: 0,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === WIZARD_STEPS.UPLOAD
          ? 'Create new post'
          : currentStep === WIZARD_STEPS.EDIT
          ? 'Crop & Filters'
          : 'Create new post'
      }
      size={currentStep === WIZARD_STEPS.UPLOAD ? 'md' : 'lg'}
    >
      <div className="ig-wizard-container">
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
              {currentStep === WIZARD_STEPS.EDIT ? 'Edit' : 'Create new post'}
            </span>

            {currentStep === WIZARD_STEPS.EDIT ? (
              <div className="ig-subnav-right-actions">
                <button
                  type="button"
                  className="ig-subnav-save-crop-btn"
                  onClick={handleSaveCrop}
                  disabled={isSavingCrop || processingCrop}
                  title="Save Crop & Changes (✓)"
                  aria-label="Save Crop & Changes"
                >
                  <Check size={16} strokeWidth={2.8} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  className="ig-subnav-action-btn next"
                  onClick={handleProceedToDetails}
                  disabled={processingCrop || isSavingCrop}
                >
                  {processingCrop ? 'Cropping...' : 'Next'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ig-subnav-action-btn share"
                onClick={handleSubmit}
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
              onChange={(e) => handleFilesAdded(e.target.files)}
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
            />
            <div className="ig-dropzone-circle">
              <UploadCloud size={44} />
            </div>
            <h3 className="ig-dropzone-title">Select photos and videos</h3>
            <p className="ig-dropzone-desc">
              Supports single images, videos, and carousels with up to 10 items
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
        )}

        {/* STEP 2: CROP, ASPECT RATIO & 12 FILTERS */}
        {currentStep === WIZARD_STEPS.EDIT && activeItem && (
          <div className="ig-edit-workspace">
            {/* Left: Media Canvas */}
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
                      if (videoPlayerRef.current) {
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

            {/* Right: Controls Sidebar */}
            <div className="ig-edit-sidebar">
              {/* Tabs: Filters vs Ratio */}
              <div className="ig-edit-tab-headers">
                <button
                  type="button"
                  className={`ig-edit-tab-btn ${editTab === 'FILTERS' ? 'active' : ''}`}
                  onClick={() => setEditTab('FILTERS')}
                >
                  <Sparkles size={16} />
                  <span>Filters</span>
                </button>
                <button
                  type="button"
                  className={`ig-edit-tab-btn ${editTab === 'RATIO' ? 'active' : ''}`}
                  onClick={() => setEditTab('RATIO')}
                >
                  <Sliders size={16} />
                  <span>Adjust & Ratio</span>
                </button>
              </div>

              {/* Filters Gallery */}
              {editTab === 'FILTERS' && (
                <div className="ig-filters-gallery">
                  {INSTAGRAM_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`ig-filter-card ${activeItem.filterName === f.id ? 'active' : ''}`}
                      onClick={() => handleApplyFilter(f.id)}
                    >
                      <div className="ig-filter-thumb-box">
                        {isVideo && (!activeItem.thumbnailUrl || !activeItem.thumbnailUrl.startsWith('data:image')) ? (
                          <div className="ig-filter-thumb-video-fallback" style={{ filter: f.filter }}>
                            <Film size={20} />
                          </div>
                        ) : (
                          <img
                            src={isVideo ? activeItem.thumbnailUrl : (activeItem.originalPreviewUrl || activeItem.previewUrl)}
                            alt={f.name}
                            className="ig-filter-thumb-img"
                            style={{ filter: f.filter }}
                          />
                        )}
                        {isVideo && (
                          <span className="ig-filter-video-badge" title="Video filter">
                            <Film size={10} />
                          </span>
                        )}
                      </div>
                      <span className="ig-filter-name">{f.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Aspect Ratio & Reorder */}
              {editTab === 'RATIO' && (
                <div className="ig-ratio-panel">
                  <h4 className="ig-panel-heading">Aspect Ratio</h4>
                  <div className="ig-ratio-options-grid">
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`ig-ratio-option-btn ${selectedRatio.id === r.id ? 'active' : ''}`}
                        onClick={() => handleSelectRatio(r)}
                      >
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Interactive Crop & Zoom Controls */}
                  {!isVideo && (
                    <div className="ig-crop-controls-section">
                      <div className="ig-crop-section-header">
                        <h4 className="ig-panel-heading" style={{ margin: 0 }}>
                          Crop & Zoom
                        </h4>
                        {(activeCrop.zoom > 1 ||
                          activeCrop.panX !== 0 ||
                          activeCrop.panY !== 0 ||
                          activeCrop.rotation !== 0 ||
                          (activeCrop.customCropBox &&
                            (activeCrop.customCropBox.width < 99.5 ||
                              activeCrop.customCropBox.height < 99.5 ||
                              activeCrop.customCropBox.x > 0.5 ||
                              activeCrop.customCropBox.y > 0.5))) && (
                          <button
                            type="button"
                            className="ig-crop-reset-link"
                            onClick={handleResetCrop}
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="ig-crop-slider-row">
                        <div className="ig-slider-label-group">
                          <span className="ig-slider-title">Zoom</span>
                          <span className="ig-slider-val-badge">
                            {Math.round(activeCrop.zoom * 100)}%
                          </span>
                        </div>
                        <div className="ig-slider-input-container">
                          <ZoomOut size={14} className="slider-icon" />
                          <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.05"
                            value={activeCrop.zoom}
                            onMouseDown={() => setShowGrid(true)}
                            onMouseUp={() => setShowGrid(false)}
                            onChange={(e) => handleZoomChange(e.target.value)}
                            className="ig-zoom-range-input"
                            aria-label="Zoom Level"
                          />
                          <ZoomIn size={14} className="slider-icon" />
                        </div>
                      </div>

                      <div className="ig-crop-actions-row">
                        <button
                          type="button"
                          className={`ig-crop-action-pill-btn ${isCustomCropActive ? 'active-crop-tool' : ''}`}
                          onClick={handleToggleCustomCrop}
                          title="Custom crop: drag corner brackets or edges freely"
                        >
                          <Crop size={14} />
                          <span>{isCustomCropActive ? 'Crop Active' : 'Custom Crop'}</span>
                        </button>
                        <button
                          type="button"
                          className="ig-crop-action-pill-btn"
                          onClick={handleRotate}
                          title="Rotate 90 degrees clockwise"
                        >
                          <RotateCw size={14} />
                          <span>Rotate 90°</span>
                        </button>
                        <button
                          type="button"
                          className="ig-crop-action-pill-btn"
                          onClick={handleResetCrop}
                          title="Reset crop and zoom"
                        >
                          <RotateCcw size={14} />
                          <span>Reset Crop</span>
                        </button>
                        <button
                          type="button"
                          className="ig-crop-action-pill-btn save-crop"
                          onClick={handleSaveCrop}
                          disabled={isSavingCrop}
                          title="Save current crop & edits"
                        >
                          <Check size={14} strokeWidth={2.5} />
                          <span>Save Crop</span>
                        </button>
                      </div>

                      <p className="ig-crop-drag-hint">
                        {isCustomCropActive
                          ? '✨ Drag corner brackets or edges on the photo to customize crop size freely'
                          : '💡 Click "Custom Crop" to crop any custom area, or drag photo to reposition'}
                      </p>
                    </div>
                  )}

                  {/* Video Duration Trimming & Cropping Controls */}
                  {isVideo && (
                    <div className="ig-video-trim-section">
                      <div className="ig-crop-section-header">
                        <h4 className="ig-panel-heading" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Scissors size={15} color="#0095f6" />
                          <span>Trim Video Duration</span>
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
                            max={videoTrim.duration || 60}
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
                            className={`ig-trim-preset-btn ${(videoTrim.end - videoTrim.start) === 15 ? 'active' : ''}`}
                            onClick={() => handleApplyVideoPreset(15)}
                          >
                            15s
                          </button>
                        )}
                        {videoTrim.duration > 30 && (
                          <button
                            type="button"
                            className={`ig-trim-preset-btn ${(videoTrim.end - videoTrim.start) === 30 ? 'active' : ''}`}
                            onClick={() => handleApplyVideoPreset(30)}
                          >
                            30s
                          </button>
                        )}
                        {videoTrim.duration > 60 && (
                          <button
                            type="button"
                            className={`ig-trim-preset-btn ${(videoTrim.end - videoTrim.start) === 60 ? 'active' : ''}`}
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
                          <span className="ig-trim-val">{formatTime(videoTrim.coverTime || videoTrim.start)}</span>
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
                        ✂️ Video playback will loop between {formatTime(videoTrim.start)} and {formatTime(videoTrim.end || videoTrim.duration)}
                      </p>
                    </div>
                  )}

                  <h4 className="ig-panel-heading" style={{ marginTop: '20px' }}>
                    Carousel Items ({mediaItems.length}/10)
                  </h4>
                  <div className="ig-carousel-thumbs-list">
                    {mediaItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`ig-thumb-item ${idx === activeMediaIdx ? 'active' : ''}`}
                        onClick={() => setActiveMediaIdx(idx)}
                      >
                        {item.file.type.startsWith('video/') ? (
                          item.thumbnailUrl && item.thumbnailUrl.startsWith('data:image') ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              className="ig-thumb-preview-img"
                              style={getFilterStyle(item.filterName)}
                            />
                          ) : (
                            <div className="ig-thumb-video-placeholder">
                              <Film size={18} />
                            </div>
                          )
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            className="ig-thumb-preview-img"
                            style={getFilterStyle(item.filterName)}
                          />
                        )}
                        {item.file.type.startsWith('video/') && (
                          <span className="ig-thumb-video-badge" title="Video">
                            <Film size={10} color="#ffffff" />
                          </span>
                        )}
                        <button
                          type="button"
                          className="ig-thumb-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMedia(idx);
                          }}
                          title="Remove item"
                        >
                          <X size={12} />
                        </button>
                        <span className="ig-thumb-order-badge">{idx + 1}</span>
                      </div>
                    ))}

                    {mediaItems.length < 10 && (
                      <button
                        type="button"
                        className="ig-add-more-thumb-btn"
                        onClick={() => addMoreInputRef.current?.click()}
                        title="Add more photos/videos"
                      >
                        <Plus size={20} />
                        <input
                          type="file"
                          ref={addMoreInputRef}
                          onChange={(e) => handleFilesAdded(e.target.files)}
                          accept="image/*,video/*"
                          multiple
                          style={{ display: 'none' }}
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: DETAILS, TAGS, ALT-TEXT & ADVANCED SETTINGS */}
        {currentStep === WIZARD_STEPS.DETAILS && activeItem && (
          <div className="ig-details-workspace">
            {/* Left: Tagging & Preview Canvas */}
            <div className="ig-details-media-pane">
              <div
                className="ig-tagging-canvas"
                ref={imagePreviewRef}
                onClick={handleImageClick}
                style={{ aspectRatio: selectedRatio.ratio || '1 / 1' }}
                title="Click on the photo to tag someone"
              >
                {isVideo ? (
                  <TrimmedVideoPlayer
                    src={activeItem.previewUrl}
                    videoTrim={videoTrim}
                    filterStyle={getFilterStyle(activeItem.filterName)}
                    aspectRatio={selectedRatio.ratio || '1 / 1'}
                    fitMode={selectedRatio.id === 'original' ? 'contain' : 'cover'}
                  />
                ) : (
                  <img
                    src={activeItem.previewUrl}
                    alt="Active slide"
                    className="ig-canvas-media"
                    style={getFilterStyle(activeItem.filterName)}
                  />
                )}

                {/* Tag Pins on active slide */}
                {activeItem.tags.map((t) => (
                  <div
                    key={t.userId}
                    className="ig-tag-pin"
                    style={{ left: `${t.xPercent}%`, top: `${t.yPercent}%` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="ig-tag-bubble">
                      <span>@{t.username}</span>
                      <button
                        type="button"
                        className="ig-tag-delete-btn"
                        onClick={() => handleRemoveTag(t.userId)}
                        title="Remove tag"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Active Tag placement search popup */}
                {taggingPos && (
                  <div
                    className="ig-tag-search-popup"
                    style={{ left: `${taggingPos.xPercent}%`, top: `${taggingPos.yPercent}%` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="ig-tag-search-box">
                      <Search size={14} className="ig-tag-search-icon" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search user to tag..."
                        value={userSearchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className="ig-tag-search-input"
                      />
                      <button
                        type="button"
                        className="ig-tag-cancel-btn"
                        onClick={() => setTaggingPos(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {userSearchResults.length > 0 && (
                      <div className="ig-tag-search-dropdown">
                        {userSearchResults.map((u) => (
                          <div
                            key={u.id}
                            className="ig-tag-result-row"
                            onClick={() => handleSelectTaggedUser(u)}
                          >
                            <Avatar src={u.avatarUrl} username={u.username} size="sm" />
                            <div className="ig-tag-result-info">
                              <span className="ig-tag-result-username">{u.username}</span>
                              {u.displayName && (
                                <span className="ig-tag-result-name">{u.displayName}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Carousel thumbnail bar at bottom of canvas */}
                {mediaItems.length > 1 && (
                  <div className="ig-details-carousel-strip">
                    {mediaItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`ig-strip-thumb ${idx === activeMediaIdx ? 'active' : ''}`}
                        onClick={() => setActiveMediaIdx(idx)}
                      >
                        <img src={item.previewUrl} alt={`Slide ${idx + 1}`} />
                        {item.tags.length > 0 && (
                          <span className="ig-strip-tag-badge">
                            <User size={8} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Metadata Form */}
            <div className="ig-details-form-pane">
              {/* Author Row */}
              <div className="ig-details-author-row">
                <Avatar
                  src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
                  username={currentUser?.username}
                  size="sm"
                />
                <span className="ig-details-author-username">{currentUser?.username}</span>
              </div>

              {/* Caption with hashtag suggestion */}
              <div className="ig-details-caption-box">
                <textarea
                  className="ig-details-caption-textarea"
                  rows={4}
                  maxLength={2200}
                  placeholder="Write a caption... (use #hashtags and @mentions)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <div className="ig-details-char-count">{caption.length}/2,200</div>
              </div>

              {/* Add Location */}
              <div className="ig-details-form-group">
                <label className="ig-details-field-label">
                  <MapPin size={16} />
                  <span>Add location</span>
                </label>
                <div className="ig-location-input-wrapper">
                  <input
                    type="text"
                    className="ig-details-input"
                    placeholder="Where was this taken?"
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
                  <div className="ig-popular-locations-row">
                    {POPULAR_LOCATIONS.slice(0, 4).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        className="ig-location-chip"
                        onClick={() => setLocation(loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Invite Collaborator */}
              <div className="ig-details-form-group">
                <label className="ig-details-field-label">
                  <Users size={16} />
                  <span>Invite collaborator</span>
                </label>
                {collaborator ? (
                  <div className="ig-collab-selected-card">
                    <Avatar
                      src={collaborator.avatarUrl}
                      username={collaborator.username}
                      size="sm"
                    />
                    <div className="ig-collab-selected-info">
                      <span className="ig-collab-username">@{collaborator.username}</span>
                      <span className="ig-collab-subtext">Will be invited as co-author</span>
                    </div>
                    <button
                      type="button"
                      className="ig-clear-btn"
                      onClick={() => setCollaborator(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="ig-collab-search-wrapper">
                    <input
                      type="text"
                      className="ig-details-input"
                      placeholder="Search username to collaborate..."
                      value={collabQuery}
                      onChange={(e) => {
                        handleSearchCollab(e.target.value);
                        setShowCollabSearch(true);
                      }}
                      onFocus={() => setShowCollabSearch(true)}
                    />
                    {showCollabSearch && collabResults.length > 0 && (
                      <div className="ig-collab-dropdown">
                        {collabResults.map((u) => (
                          <div
                            key={u.id}
                            className="ig-collab-row"
                            onClick={() => {
                              setCollaborator(u);
                              setCollabQuery('');
                              setCollabResults([]);
                              setShowCollabSearch(false);
                            }}
                          >
                            <Avatar src={u.avatarUrl} username={u.username} size="sm" />
                            <div className="ig-collab-row-info">
                              <span className="ig-collab-row-username">@{u.username}</span>
                              {u.displayName && (
                                <span className="ig-collab-row-name">{u.displayName}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accessibility (Alt Text) Section */}
              <div className="ig-details-accordion">
                <button
                  type="button"
                  className="ig-accordion-header"
                  onClick={() => setShowAltTextSection(!showAltTextSection)}
                >
                  <div className="ig-accordion-title-wrap">
                    <span className="ig-accordion-title">Accessibility (Alt Text)</span>
                    <span className="ig-accordion-desc">
                      Describe your photos for people with visual impairments.
                    </span>
                  </div>
                  {showAltTextSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAltTextSection && (
                  <div className="ig-accordion-content">
                    {mediaItems.map((item, idx) => (
                      <div key={idx} className="ig-alt-text-field">
                        <div className="ig-alt-text-header">
                          <img
                            src={item.previewUrl}
                            alt="Slide thumbnail"
                            className="ig-alt-thumb"
                          />
                          <span className="ig-alt-slide-label">
                            Slide {idx + 1} of {mediaItems.length}
                          </span>
                        </div>
                        <input
                          type="text"
                          className="ig-details-input"
                          placeholder="Write alt text..."
                          maxLength={500}
                          value={item.altText}
                          onChange={(e) => handleAltTextChange(idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Settings (Hide likes & Turn off comments) */}
              <div className="ig-details-accordion">
                <button
                  type="button"
                  className="ig-accordion-header"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <div className="ig-accordion-title-wrap">
                    <span className="ig-accordion-title">Advanced Settings</span>
                  </div>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAdvanced && (
                  <div className="ig-accordion-content">
                    {/* Hide Like Count */}
                    <label className="ig-switch-control-row">
                      <div className="ig-switch-text">
                        <span className="ig-switch-main-text">Hide like and view counts</span>
                        <span className="ig-switch-sub-text">
                          Only you will see the total number of likes and views on this post.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="ig-switch-box"
                        checked={hideLikeCount}
                        onChange={(e) => setHideLikeCount(e.target.checked)}
                      />
                    </label>

                    {/* Turn Off Commenting */}
                    <label className="ig-switch-control-row">
                      <div className="ig-switch-text">
                        <span className="ig-switch-main-text">Turn off commenting</span>
                        <span className="ig-switch-sub-text">
                          You can change this anytime from the post menu.
                        </span>
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
            </div>
          </div>
        )}

        {/* Global Loading Overlay */}
        {loading && (
          <div className="ig-loading-overlay">
            <LoadingSpinner size="lg" />
            <p className="ig-loading-status-text">{uploadProgress || 'Processing...'}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreatePostModal;
