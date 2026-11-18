import React from 'react';
import { Tag, Film, Layers, Heart, MessageCircle } from 'lucide-react';
import { SkeletonMediaGrid } from '../ui/Skeleton';
import EmptyState from '../common/EmptyState';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import { formatCount } from '../../utils';

export const ProfileTaggedTab = ({
  taggedPosts = [],
  loadingTagged = false,
  onSelectPost,
}) => {
  if (loadingTagged) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <SkeletonMediaGrid count={6} />
      </div>
    );
  }

  if (taggedPosts.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="Photos of you"
        description="When people tag you in photos, they'll appear here."
      />
    );
  }

  return (
    <div className="profile-grid">
      {taggedPosts.map((post) => {
        const media = post.media?.[0];
        const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
        return (
          <div
            key={post.id}
            className="profile-grid-item"
            onClick={() => onSelectPost?.(post.id)}
          >
            {isVideo ? (
              <video
                src={media?.mediaUrl}
                poster={getVideoPosterUrl(media?.mediaUrl, post.thumbnailUrl)}
                className="profile-grid-media"
                muted
                preload="none"
              />
            ) : (
              <ProgressiveImage
                src={media?.mediaUrl}
                alt={post.caption || 'Tagged post'}
                className="profile-grid-media"
                loading="lazy"
              />
            )}
            {post.isReel ? (
              <div className="profile-corner-badge" title="Reel">
                <Film size={13} color="#fff" />
              </div>
            ) : (post.media?.length || 1) > 1 ? (
              <div className="profile-corner-badge" title="Carousel">
                <Layers size={13} color="#fff" />
              </div>
            ) : (
              <div className="profile-corner-badge" title="Tagged">
                <Tag size={13} color="#fff" />
              </div>
            )}
            <div className="profile-grid-overlay">
              <div className="overlay-stat">
                <Heart size={20} fill="#fff" />
                <span>{formatCount(post.likeCount || 0)}</span>
              </div>
              <div className="overlay-stat">
                <MessageCircle size={20} fill="#fff" />
                <span>{formatCount(post.commentCount || 0)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileTaggedTab;
