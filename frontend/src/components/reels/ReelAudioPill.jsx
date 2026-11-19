import React from 'react';
import { Music } from 'lucide-react';

export const ReelAudioPill = ({ currentReel, navigate }) => {
  if (!currentReel) return null;

  const audioTitle = currentReel.audioTitle || 'Original Audio';
  const audioArtist = currentReel.audioArtist || currentReel.author?.username || 'Artist';

  const handleClick = (e) => {
    e.stopPropagation();
    navigate?.(`/audio?title=${encodeURIComponent(audioTitle)}&artist=${encodeURIComponent(audioArtist)}`);
  };

  return (
    <div
      className="reel-audio-track"
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Audio: ${audioTitle} by ${audioArtist}`}
    >
      <Music size={12} />
      <span>
        {audioTitle} · {audioArtist}
      </span>
    </div>
  );
};

export default ReelAudioPill;
