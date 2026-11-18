import React from 'react';
import {
  Camera,
  Heart,
  MessageCircle,
  Film,
  Layers,
  Pin,
  MoreHorizontal,
  Trash2,
  Archive,
  Copy,
  RotateCw,
} from 'lucide-react';
import { SkeletonMediaGrid } from '../ui/Skeleton';
import EmptyState from '../common/EmptyState';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import { formatCount } from '../../utils';

export const ProfilePostsTab = ({
  posts = [],
  loadingPosts = false,
  activePostUploads = [],
  isOwnProfile = false,
  isViewerAdmin = false,
  myUserId,
  profile,
  gridMenuPost,
  setGridMenuPost,
  onSelectPost,
  onTogglePin,
  onDeletePost,
  onToggleArchive,
  showSuccess,
}) => {
  if (loadingPosts) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <SkeletonMediaGrid count={6} />
      </div>
    );
  }

  if (posts.length === 0 && activePostUploads.length === 0) {
    const isProfileAdmin =
      profile?.role === 'ROLE_ADMIN' ||
      profile?.role === 'ADMIN' ||
      profile?.username?.toLowerCase() === 'admin';

    return (
      <EmptyState
        icon={Camera}
        title={isProfileAdmin ? 'System Administrator' : 'No Posts Yet'}
        description={
          isProfileAdmin
            ? 'Official system administrator account.'
            : isOwnProfile
            ? 'When you share photos and videos, they will appear on your profile.'
            : "This user hasn't posted anything yet."
        }
        actionLabel={!isProfileAdmin && isOwnProfile ? 'Share your first photo' : undefined}
        onAction={
          !isProfileAdmin && isOwnProfile
            ? () => window.dispatchEvent(new CustomEvent('open-create-modal'))
            : undefined
        }
      />
    );
  }

  return (
    <div className="profile-grid">
      {/* Optimistic uploading posts */}
      {activePostUploads.map((up) => {
        const isVid = up.mediaType === 'VIDEO' || up.mediaItems?.[0]?.type === 'VIDEO';
        const src = up.thumbnail || up.mediaUrl || up.mediaItems?.[0]?.previewUrl;
        return (
          <div
            key={up.id}
            className="profile-grid-item profile-grid-uploading-item"
            onClick={() => onSelectPost?.(`uploading-post-${up.id}`)}
            title={`Post is uploading (${up.progress || 10}%)...`}
          >
            {isVid ? (
              <video src={src} className="profile-grid-media" muted autoPlay loop playsInline />
            ) : (
              <img src={src} alt="Uploading" className="profile-grid-media" />
            )}
            <div className="profile-grid-uploading-overlay">
              <RotateCw size={22} className="story-upload-spinning-icon" />
              <span className="profile-grid-uploading-pct">{up.progress || 10}%</span>
              <div className="profile-grid-uploading-track">
                <div
                  className="profile-grid-uploading-bar"
                  style={{ width: `${Math.max(10, up.progress || 10)}%` }}
                />
              </div>
              <span className="profile-grid-uploading-msg">{up.statusMessage || 'Sharing...'}</span>
            </div>
          </div>
        );
      })}

      {posts.map((post) => {
        const media = post.media?.[0];
        const postUserId = String(
          post.userId || post.author?.id || post.author?.userId || ''
        ).toLowerCase();
        const isPostOwner = Boolean(
          isOwnProfile || isViewerAdmin || (myUserId && postUserId && myUserId === postUserId)
        );

        return (
          <div
            key={post.id}
            className={`profile-grid-item ${gridMenuPost?.id === post.id ? 'dropdown-active' : ''}`}
            onClick={() => onSelectPost?.(post.id)}
          >
            {media?.mediaType === 'VIDEO' ? (
              <video
                src={media.mediaUrl}
                poster={getVideoPosterUrl(media.mediaUrl, post.thumbnailUrl)}
                className="profile-grid-media"
                muted
                preload="none"
              />
            ) : (
              <ProgressiveImage
                src={media?.mediaUrl}
                alt={post.caption || 'Post image'}
                className="profile-grid-media"
                loading="lazy"
              />
            )}

            {/* Top-Right Badges Bar: Indicator (Carousel/Pin/Video) + Three-Dot Options Button */}
            <div className="profile-grid-top-badges" onClick={(e) => e.stopPropagation()}>
              {post.isPinned ? (
                <div className="profile-corner-badge pinned" title="Pinned to profile">
                  <Pin size={13} color="#fff" />
                </div>
              ) : (post.media?.length || 1) > 1 ? (
                <div className="profile-corner-badge" title="Carousel">
                  <Layers size={13} color="#fff" />
                </div>
              ) : post.isReel || media?.mediaType === 'VIDEO' ? (
                <div className="profile-corner-badge" title="Video">
                  <Film size={13} color="#fff" />
                </div>
              ) : null}

              {isPostOwner && (
                <div className="profile-grid-opts-wrapper" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="profile-grid-item-opts-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGridMenuPost?.((prev) => (prev?.id === post.id ? null : post));
                    }}
                    aria-label="Post options"
                    title="Post options"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {gridMenuPost?.id === post.id && (
                    <div
                      className="profile-grid-dropdown-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => onTogglePin?.(post.id)}
                      >
                        <Pin size={14} />
                        <span>
                          {post.isPinned ? 'Unpin from your profile' : 'Pin to your profile'}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="profile-dropdown-item danger"
                        onClick={() => onDeletePost?.(post.id)}
                      >
                        <Trash2 size={14} />
                        <span>Delete post</span>
                      </button>
                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => onToggleArchive?.(post.id)}
                      >
                        <Archive size={14} />
                        <span>{post.isArchived ? 'Show on profile' : 'Archive post'}</span>
                      </button>
                      <button
                        type="button"
                        className="profile-dropdown-item"
                        onClick={() => {
                          const url = `${window.location.origin}/posts/${post.id}`;
                          navigator.clipboard.writeText(url);
                          showSuccess?.('Link copied to clipboard!');
                          setGridMenuPost?.(null);
                        }}
                      >
                        <Copy size={14} />
                        <span>Copy link</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

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

export default ProfilePostsTab;
