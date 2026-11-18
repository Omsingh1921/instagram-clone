import React from 'react';
import { Trash2, Clock, RotateCcw } from 'lucide-react';
import { SkeletonMediaGrid } from '../ui/Skeleton';
import EmptyState from '../common/EmptyState';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl } from '../../utils/mediaUrl';

export const ProfileRecentlyDeletedTab = ({
  deletedSubTab = 'posts',
  setDeletedSubTab,
  recentlyDeletedPosts = [],
  loadingRecentlyDeleted = false,
  recentlyDeletedReels = [],
  loadingDeletedReels = false,
  handleRestorePost,
  handlePermanentDeletePost,
  handleRestoreReel,
  handlePermanentDeleteReel,
}) => {
  return (
    <div>
      <div className="tab-info-header warning">
        <Trash2 size={16} />
        <span>Only you can see deleted items. Content is permanently deleted after 30 days.</span>
      </div>

      <div className="saved-subtabs-row" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={`saved-subtab-btn ${deletedSubTab === 'posts' ? 'active' : ''}`}
          onClick={() => setDeletedSubTab?.('posts')}
        >
          Posts ({recentlyDeletedPosts.length})
        </button>
        <button
          type="button"
          className={`saved-subtab-btn ${deletedSubTab === 'reels' ? 'active' : ''}`}
          onClick={() => setDeletedSubTab?.('reels')}
        >
          Reels ({recentlyDeletedReels.length})
        </button>
      </div>

      {deletedSubTab === 'posts' ? (
        loadingRecentlyDeleted ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        ) : recentlyDeletedPosts.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="No Recently Deleted Posts"
            description="When you delete a post, it will be kept here for 30 days before being permanently deleted."
          />
        ) : (
          <div className="profile-grid">
            {recentlyDeletedPosts.map((post) => {
              const media = post.media?.[0];
              const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
              const daysLeft = post.daysRemainingUntilPermanentDelete ?? 30;
              return (
                <div
                  key={post.id}
                  className="profile-grid-item recently-deleted-item"
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
                      alt={post.caption || 'Deleted post'}
                      className="profile-grid-media"
                      loading="lazy"
                    />
                  )}
                  <div className="days-left-badge">
                    <Clock size={11} />
                    <span>{daysLeft}d left</span>
                  </div>
                  <div className="profile-grid-overlay recently-deleted-overlay">
                    <button
                      type="button"
                      className="profile-overlay-action-btn restore"
                      onClick={(e) => handleRestorePost?.(e, post.id)}
                      title="Restore post to profile"
                    >
                      <RotateCcw size={14} />
                      <span>Restore</span>
                    </button>
                    <button
                      type="button"
                      className="profile-overlay-action-btn danger"
                      onClick={(e) => handlePermanentDeletePost?.(e, post.id)}
                      title="Delete permanently"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : loadingDeletedReels ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <SkeletonMediaGrid count={6} />
        </div>
      ) : recentlyDeletedReels.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="No Recently Deleted Reels"
          description="When you delete a reel, it will be kept here for 30 days before being permanently deleted."
        />
      ) : (
        <div className="profile-reels-grid">
          {recentlyDeletedReels.map((reel) => {
            const daysLeft = reel.daysRemainingUntilPermanentDelete ?? 30;
            return (
              <div
                key={reel.id}
                className="profile-reel-item recently-deleted-item"
              >
                <video
                  src={reel.videoUrl}
                  poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                  className="profile-reel-media"
                  muted
                  playsInline
                  preload="none"
                />
                <div className="days-left-badge">
                  <Clock size={11} />
                  <span>{daysLeft}d left</span>
                </div>
                <div className="profile-grid-overlay recently-deleted-overlay">
                  <button
                    type="button"
                    className="profile-overlay-action-btn restore"
                    onClick={(e) => handleRestoreReel?.(e, reel.id)}
                    title="Restore reel to profile"
                  >
                    <RotateCcw size={14} />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    className="profile-overlay-action-btn danger"
                    onClick={(e) => handlePermanentDeleteReel?.(e, reel.id)}
                    title="Delete permanently"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileRecentlyDeletedTab;
