import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Scissors } from 'lucide-react';
import { formatTime } from './videoUtils';

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

export default TrimmedVideoPlayer;
