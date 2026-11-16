import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Film, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Avatar from '../common/Avatar';
import postService from '../../services/post.service';
import reelService from '../../services/reel.service';
import './SharedPostCard.css';

// Module-level in-memory cache to prevent duplicate fetches across renders
const previewCache = new Map();

export const SharedPostCard = ({ id, type = 'post', fallbackMediaUrl, mine }) => {
  const [data, setData] = useState(() => previewCache.get(`${type}:${id}`) || null);
  const [loading, setLoading] = useState(!previewCache.has(`${type}:${id}`));
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const isReel = type === 'reel' || type === 'reels';

  useEffect(() => {
    let isMounted = true;
    const cacheKey = `${type}:${id}`;

    if (previewCache.has(cacheKey)) {
      setData(previewCache.get(cacheKey));
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        let item = null;
        if (isReel) {
          const res = await reelService.getReelById(id);
          item = res?.data || res;
        } else {
          const res = await postService.getPostById(id);
          item = res?.data || res;
        }

        if (isMounted && item) {
          previewCache.set(cacheKey, item);
          setData(item);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchPreview();
    }

    return () => {
      isMounted = false;
    };
  }, [id, type, isReel]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isReel) {
      navigate(`/reels/${id}`);
    } else {
      navigate(`/p/${id}`);
    }
  };

  // Extract author info
  const author = data?.author || data?.user || {};
  const username = author.username || 'instagram_user';
  const avatarUrl = author.avatarUrl || author.profile?.avatarUrl;

  // Extract media preview URL
  let mediaUrl = fallbackMediaUrl;
  let isVideo = isReel;

  if (data) {
    if (isReel) {
      mediaUrl = data.thumbnailUrl || data.videoUrl || fallbackMediaUrl;
      isVideo = true;
    } else {
      const firstMedia = data.media?.[0];
      if (firstMedia) {
        mediaUrl = firstMedia.mediaUrl;
        isVideo = firstMedia.mediaType === 'VIDEO' || Boolean(data.isReel);
      } else if (data.mediaUrl) {
        mediaUrl = data.mediaUrl;
      }
    }
  }

  const caption = data?.caption || '';

  if (loading && !mediaUrl) {
    return (
      <div className={`ig-shared-post-card skeleton ${mine ? 'mine' : 'theirs'}`}>
        <div className="ig-shared-card-header">
          <div className="skeleton-avatar" />
          <div className="skeleton-text" />
        </div>
        <div className="ig-shared-card-media skeleton-media" />
        <div className="ig-shared-card-footer">
          <div className="skeleton-caption" />
        </div>
      </div>
    );
  }

  if (error && !mediaUrl) {
    return (
      <div className={`ig-shared-post-card error ${mine ? 'mine' : 'theirs'}`} onClick={handleClick}>
        <div className="ig-shared-card-header">
          <span className="ig-shared-card-username">{isReel ? 'Reel' : 'Post'}</span>
          <ExternalLink size={14} opacity={0.6} />
        </div>
        <div className="ig-shared-card-media-placeholder">
          {isReel ? <Film size={32} /> : <ImageIcon size={32} />}
          <span>View {isReel ? 'Reel' : 'Post'}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ig-shared-post-card ${mine ? 'mine' : 'theirs'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={`View ${isReel ? 'Reel' : 'Post'} by @${username}`}
    >
      {/* Header */}
      <div className="ig-shared-card-header">
        <div className="ig-shared-author-group">
          <Avatar src={avatarUrl} alt={username} size={24} />
          <span className="ig-shared-card-username">{username}</span>
        </div>
        {isReel && (
          <span className="ig-shared-reel-badge" title="Reel">
            <Film size={13} />
          </span>
        )}
      </div>

      {/* Media Box */}
      <div className="ig-shared-card-media">
        {mediaUrl ? (
          isVideo && !mediaUrl.match(/\.(jpeg|jpg|png|gif|webp)/i) ? (
            <video
              src={mediaUrl}
              className="ig-shared-media-element"
              preload="metadata"
              muted
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt={caption || 'Shared post'}
              className="ig-shared-media-element"
              loading="lazy"
            />
          )
        ) : (
          <div className="ig-shared-media-fallback">
            <ImageIcon size={32} />
          </div>
        )}

        {/* Video / Reel Play Glyphs */}
        {isVideo && (
          <div className="ig-shared-play-overlay">
            <div className="ig-shared-play-btn">
              <Play size={16} fill="white" color="white" />
            </div>
          </div>
        )}
      </div>

      {/* Caption snippet or View CTA */}
      <div className="ig-shared-card-footer">
        {caption ? (
          <p className="ig-shared-card-caption">
            <strong className="ig-shared-caption-author">{username}</strong> {caption}
          </p>
        ) : (
          <div className="ig-shared-card-cta">
            <span>Watch {isReel ? 'reel' : 'post'}</span>
            <ExternalLink size={12} opacity={0.7} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedPostCard;
