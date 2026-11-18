import React from 'react';
import { Archive, Play, RotateCcw } from 'lucide-react';
import { SkeletonMediaGrid } from '../ui/Skeleton';
import EmptyState from '../common/EmptyState';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import { formatCount } from '../../utils';

export const ProfileArchivedTab = ({
  archivedSubTab = 'posts',
  setArchivedSubTab,
  archivedPosts = [],
  loadingArchived = false,
  archivedReels = [],
  loadingArchivedReels = false,
  archivedStories = [],
  loadingArchivedStories = false,
  onSelectPost,
  handleUnarchivePost,
  handleUnarchiveReel,
  handleReshareStory,
  navigate,
}) => {
  return (
    <div>
      <div className="tab-info-header">
        <Archive size={16} />
        <span>Only you can see the posts and reels you've archived.</span>
      </div>

      <div className="saved-subtabs-row" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={`saved-subtab-btn ${archivedSubTab === 'posts' ? 'active' : ''}`}
          onClick={() => setArchivedSubTab?.('posts')}
        >
          Posts ({archivedPosts.length})
        </button>
        <button
          type="button"
          className={`saved-subtab-btn ${archivedSubTab === 'reels' ? 'active' : ''}`}
          onClick={() => setArchivedSubTab?.('reels')}
        >
          Reels ({archivedReels.length})
        </button>
        <button
          type="button"
          className={`saved-subtab-btn ${archivedSubTab === 'stories' ? 'active' : ''}`}
          onClick={() => setArchivedSubTab?.('stories')}
        >
          Stories ({archivedStories.length})
        </button>
      </div>

      {archivedSubTab === 'posts' ? (
        loadingArchived ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        ) : archivedPosts.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="No Archived Posts"
            description="Posts you archive are hidden from your profile grid and saved here."
          />
        ) : (
          <div className="profile-grid">
            {archivedPosts.map((post) => {
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
                      alt={post.caption || 'Archived post'}
                      className="profile-grid-media"
                      loading="lazy"
                    />
                  )}
                  <div className="profile-grid-overlay">
                    <button
                      type="button"
                      className="profile-overlay-action-btn"
                      onClick={(e) => handleUnarchivePost?.(e, post.id)}
                      title="Show on profile"
                    >
                      <Archive size={14} />
                      <span>Show on profile</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : archivedSubTab === 'reels' ? (
        loadingArchivedReels ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        ) : archivedReels.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="No Archived Reels"
            description="Reels you archive are hidden from your feed and profile, and saved here."
          />
        ) : (
          <div className="profile-reels-grid">
            {archivedReels.map((reel) => (
              <div
                key={reel.id}
                className="profile-reel-item"
                onClick={() => navigate?.(`/reels/${reel.id}`)}
              >
                <video
                  src={reel.videoUrl}
                  poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                  className="profile-reel-media"
                  muted
                  playsInline
                  preload="none"
                />
                <div className="profile-reel-view-count">
                  <Play size={11} fill="#fff" strokeWidth={0} />
                  <span>{formatCount(reel.viewCount || 0)}</span>
                </div>
                <div className="profile-grid-overlay">
                  <button
                    type="button"
                    className="profile-overlay-action-btn"
                    onClick={(e) => handleUnarchiveReel?.(e, reel.id)}
                    title="Show on profile"
                  >
                    <Archive size={14} />
                    <span>Show on profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loadingArchivedStories ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <SkeletonMediaGrid count={6} />
        </div>
      ) : archivedStories.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No Archived Stories"
          description="Your stories are automatically saved to your private archive after 24 hours."
        />
      ) : (
        <div className="profile-grid">
          {archivedStories.map((story) => (
            <div key={story.id} className="profile-grid-item">
              {story.mediaType === 'VIDEO' ? (
                <video
                  src={story.mediaUrl}
                  poster={getVideoPosterUrl(story.mediaUrl)}
                  className="profile-grid-media"
                  muted
                  preload="none"
                />
              ) : (
                <ProgressiveImage
                  src={story.mediaUrl}
                  alt="Archived story"
                  className="profile-grid-media"
                  loading="lazy"
                />
              )}
              <div
                className="profile-corner-badge"
                title="Date shared"
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(4px)',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {new Date(story.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="profile-grid-overlay">
                <button
                  type="button"
                  className="profile-overlay-action-btn"
                  onClick={(e) => handleReshareStory?.(e, story.id)}
                  title="Reshare memory to story"
                >
                  <RotateCcw size={14} />
                  <span>Reshare to Story</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileArchivedTab;
