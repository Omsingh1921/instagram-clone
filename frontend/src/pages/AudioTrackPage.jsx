import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Music, Play, Bookmark, Film, Disc } from 'lucide-react';
import reelService from '../services/reel.service';
import { SkeletonMediaGrid } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import './AudioTrackPage.css';

export const AudioTrackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const title = searchParams.get('title') || 'Original Audio';
  const artist = searchParams.get('artist') || 'Original Artist';

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchAudioReels = async () => {
      try {
        setLoading(true);
        const res = await reelService.getReelsByAudio(title, 0, 30);
        const list = res?.data?.content || res?.content || res?.data || [];
        setReels(list);
      } catch (err) {
        console.error('Failed to load reels for audio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudioReels();
  }, [title]);

  const handleUseAudio = () => {
    // Navigate to Reels with suggestion or open creation modal
    navigate('/reels');
    showSuccess(`Using "${title}" by ${artist}`);
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    showSuccess(isSaved ? 'Removed from saved audio' : 'Saved audio to collection');
  };

  return (
    <div className="audio-page-container">
      {/* Audio Header */}
      <div className="audio-header">
        <div className="audio-cover-art spinning">
          <Disc size={56} color="#ffffff" />
        </div>

        <div className="audio-info">
          <h1 className="audio-title">
            <Music size={22} />
            {title}
          </h1>
          <p className="audio-artist">{artist}</p>
          <div className="audio-stats">
            <Film size={15} />
            <span>{reels.length} {reels.length === 1 ? 'reel' : 'reels'}</span>
          </div>

          <div className="audio-actions-row">
            <button type="button" className="btn-use-audio" onClick={handleUseAudio}>
              <Music size={16} />
              Use audio
            </button>
            <button
              type="button"
              className="btn-save-audio"
              onClick={handleToggleSave}
              style={{ color: isSaved ? '#0095f6' : 'inherit' }}
            >
              <Bookmark size={16} fill={isSaved ? '#0095f6' : 'none'} />
              {isSaved ? 'Saved' : 'Save audio'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Header */}
      <div className="audio-grid-header">
        <Film size={16} />
        <span>Reels</span>
      </div>

      {/* Reels Grid */}
      {loading ? (
        <div style={{ padding: '24px 0' }}>
          <SkeletonMediaGrid count={6} aspect="aspect-[9/16]" />
        </div>
      ) : reels.length > 0 ? (
        <div className="audio-reels-grid">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="audio-reel-item"
              onClick={() => navigate('/reels')}
            >
              {reel.videoUrl ? (
                <video src={reel.videoUrl} preload="metadata" muted playsInline />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#1e1e1e' }} />
              )}
              <div className="audio-reel-overlay">
                <div className="audio-reel-views">
                  <Play size={14} fill="#ffffff" />
                  <span>{reel.viewCount || reel.likeCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="audio-empty-state">
          <Film size={44} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3>No reels yet</h3>
          <p>Be the first to create a reel with this audio!</p>
          <button
            type="button"
            className="btn-use-audio"
            style={{ marginTop: '16px' }}
            onClick={handleUseAudio}
          >
            Create Reel
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioTrackPage;
