import React from 'react';
import { getVideoPosterUrl, getAdaptiveVideoUrl } from '../../utils/mediaUrl';

export const ReelPreviewCard = ({ reel, type = 'next' }) => {
  if (!reel) return null;

  return (
    <div className={`reel-card-preview reel-card-${type}`} aria-hidden="true">
      <video
        src={reel.videoUrl?.startsWith('blob:') ? reel.videoUrl : getAdaptiveVideoUrl(reel.videoUrl)}
        poster={reel.videoUrl?.startsWith('blob:') ? undefined : getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
        className="reel-video-element-preview"
        preload={type === 'next' ? 'auto' : 'none'}
        muted
        playsInline
      />
      <div className="reel-preview-overlay">
        <span className="reel-preview-caption">@{reel.author?.username}</span>
      </div>
    </div>
  );
};

export default ReelPreviewCard;
