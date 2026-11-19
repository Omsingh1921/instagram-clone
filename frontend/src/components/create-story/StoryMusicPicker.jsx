import React from 'react';
import { Music, X } from 'lucide-react';

export const TRENDING_TRACKS = [
  { title: 'Die With A Smile', artist: 'Lady Gaga, Bruno Mars' },
  { title: 'Espresso', artist: 'Sabrina Carpenter' },
  { title: 'Birds of a Feather', artist: 'Billie Eilish' },
  { title: 'Starboy', artist: 'The Weeknd' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
];

export const StoryMusicPicker = ({
  audioTitle,
  setAudioTitle,
  audioArtist,
  setAudioArtist,
  onRemoveMusic,
}) => {
  const isMusicSet = Boolean(audioTitle?.trim() || audioArtist?.trim());

  return (
    <div className="sticker-input-group story-music-picker">
      <div className="story-music-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ margin: 0 }}>Trending on Instagram</label>
        {isMusicSet && onRemoveMusic && (
          <button
            type="button"
            className="sticker-remove-text-btn"
            onClick={onRemoveMusic}
            title="Remove music track"
          >
            Remove track
          </button>
        )}
      </div>

      <div className="ig-trending-music-chips">
        {TRENDING_TRACKS.map((track) => {
          const isSelected =
            audioTitle?.trim().toLowerCase() === track.title.toLowerCase();
          return (
            <button
              key={track.title}
              type="button"
              className={`ig-trending-track-btn ${isSelected ? 'active-track' : ''}`}
              onClick={() => {
                setAudioTitle(track.title);
                setAudioArtist(track.artist);
              }}
            >
              <Music size={12} />
              <span className="ig-track-name">{track.title}</span>
              <span className="ig-track-artist">• {track.artist}</span>
            </button>
          );
        })}
      </div>

      <label style={{ marginTop: '12px' }}>Custom Song & Artist</label>
      <input
        type="text"
        value={audioTitle}
        onChange={(e) => setAudioTitle(e.target.value)}
        placeholder="Song title..."
        className="ig-details-input"
        aria-label="Song title"
      />
      <input
        type="text"
        value={audioArtist}
        onChange={(e) => setAudioArtist(e.target.value)}
        placeholder="Artist name..."
        className="ig-details-input"
        style={{ marginTop: '6px' }}
        aria-label="Artist name"
      />
    </div>
  );
};

export default StoryMusicPicker;
