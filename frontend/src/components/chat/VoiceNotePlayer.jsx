import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import './VoiceNotePlayer.css';

export const VoiceNotePlayer = ({ src, mine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`voice-note-player-bubble ${mine ? 'mine' : 'theirs'}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="voice-play-pause-btn"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>

      <div className="voice-waveform-container" onClick={(e) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pos * duration;
      }}>
        {/* Animated Waveform Bars */}
        <div className="voice-bars-grid">
          {[40, 75, 30, 90, 60, 100, 45, 80, 55, 95, 35, 70, 85, 50, 65, 90, 40, 60].map((h, i) => {
            const barPercent = (i / 18) * 100;
            const isFilled = barPercent <= progressPercent;
            return (
              <span
                key={i}
                className={`voice-bar ${isFilled ? 'filled' : ''} ${isPlaying ? 'animating' : ''}`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </div>

      <span className="voice-duration-text">
        {formatTime(isPlaying ? currentTime : duration || 0)}
      </span>
    </div>
  );
};

export default VoiceNotePlayer;
