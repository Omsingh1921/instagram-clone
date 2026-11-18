import React from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Grid,
  Film,
  Bookmark,
  Heart,
  MessageCircle,
  Play,
  Folder,
  Layers,
} from 'lucide-react';
import { SkeletonMediaGrid } from '../ui/Skeleton';
import EmptyState from '../common/EmptyState';
import ProgressiveImage from '../common/ProgressiveImage';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import { formatCount } from '../../utils';
import reelService from '../../services/reel.service';

export const ProfileSavedTab = ({
  selectedCollection,
  setSelectedCollection,
  collectionTab = 'posts',
  handleSwitchCollectionTab,
  collectionPosts = [],
  loadingCollectionPosts = false,
  collectionReels = [],
  loadingCollectionReels = false,
  handleDeleteCollection,
  handleRemoveFromCollection,
  setAddToCollectionModalOpen,
  savedSubTab = 'all',
  setSavedSubTab,
  setCreateCollectionOpen,
  collections = [],
  loadingCollections = false,
  handleSelectCollection,
  savedReels = [],
  loadingSavedReels = false,
  setSavedReels,
  savedPosts = [],
  loadingSaved = false,
  onSelectPost,
  navigate,
  showSuccess,
  showError,
}) => {
  if (selectedCollection) {
    return (
      <div>
        <div className="collection-detail-header">
          <button
            type="button"
            className="collection-back-btn"
            onClick={() => setSelectedCollection(null)}
          >
            <ArrowLeft size={16} />
            <span>{selectedCollection.name}</span>
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary profile-btn"
              onClick={() => setAddToCollectionModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '6px 12px',
              }}
            >
              <Plus size={15} />
              <span>Add from Saved</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary profile-btn danger"
              onClick={handleDeleteCollection}
              title="Delete Collection"
              aria-label="Delete Collection"
              style={{
                padding: '6px 8px',
                borderColor: 'rgba(237, 73, 86, 0.4)',
                color: '#ed4956',
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div
          className="collection-subtab-bar"
          style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}
        >
          <button
            type="button"
            className={`saved-subtab-btn ${collectionTab === 'posts' ? 'active' : ''}`}
            onClick={() => handleSwitchCollectionTab?.('posts')}
          >
            <Grid size={15} />
            <span>Posts ({collectionPosts.length})</span>
          </button>
          <button
            type="button"
            className={`saved-subtab-btn ${collectionTab === 'reels' ? 'active' : ''}`}
            onClick={() => handleSwitchCollectionTab?.('reels')}
          >
            <Film size={15} />
            <span>Reels ({collectionReels.length})</span>
          </button>
        </div>

        {collectionTab === 'posts' ? (
          loadingCollectionPosts ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <SkeletonMediaGrid count={6} />
            </div>
          ) : collectionPosts.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No posts in this collection"
              description="Save posts or reels to add them here."
              actionLabel="+ Add from Saved"
              onAction={() => setAddToCollectionModalOpen(true)}
            />
          ) : (
            <div className="profile-grid">
              {collectionPosts.map((post) => {
                const media = post.media?.[0];
                const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
                return (
                  <div
                    key={post.id}
                    className="profile-grid-item"
                    onClick={() => onSelectPost?.(post.id)}
                    style={{ position: 'relative' }}
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
                        alt={post.caption || 'Saved post'}
                        className="profile-grid-media"
                        loading="lazy"
                      />
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
                    <button
                      type="button"
                      className="collection-item-remove-btn"
                      title="Remove from collection"
                      aria-label="Remove from collection"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromCollection?.(post.id, null);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : loadingCollectionReels ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        ) : collectionReels.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No reels in this collection"
            description="Save reels from the reels feed into this collection to see them here."
            actionLabel="+ Add from Saved"
            onAction={() => setAddToCollectionModalOpen(true)}
          />
        ) : (
          <div className="profile-reels-grid">
            {collectionReels.map((reel) => (
              <div
                key={reel.id}
                className="profile-reel-item"
                onClick={() => navigate?.(`/reels/${reel.id}`)}
                style={{ position: 'relative' }}
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
                  <div className="overlay-stat">
                    <Heart size={20} fill="#fff" />
                    <span>{formatCount(reel.likeCount || 0)}</span>
                  </div>
                  <div className="overlay-stat">
                    <MessageCircle size={20} fill="#fff" />
                    <span>{formatCount(reel.commentCount || 0)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="collection-item-remove-btn"
                  title="Remove from collection"
                  aria-label="Remove from collection"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromCollection?.(null, reel.id);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="saved-header-row">
        <span className="saved-header-hint">Only you can see what you've saved</span>
        <button
          type="button"
          className="saved-new-collection-btn"
          onClick={() => setCreateCollectionOpen(true)}
        >
          <Plus size={16} />
          <span>New Collection</span>
        </button>
      </div>

      <div className="saved-subtabs-row">
        <button
          type="button"
          className={`saved-subtab-btn ${savedSubTab === 'all' ? 'active' : ''}`}
          onClick={() => setSavedSubTab('all')}
        >
          All Posts
        </button>
        <button
          type="button"
          className={`saved-subtab-btn ${savedSubTab === 'reels' ? 'active' : ''}`}
          onClick={() => setSavedSubTab('reels')}
        >
          Reels ({savedReels.length})
        </button>
        <button
          type="button"
          className={`saved-subtab-btn ${savedSubTab === 'collections' ? 'active' : ''}`}
          onClick={() => setSavedSubTab('collections')}
        >
          Collections ({collections.length})
        </button>
      </div>

      {savedSubTab === 'collections' ? (
        loadingCollections ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No Collections Yet"
            description="Save posts into custom collections to organize them."
            actionLabel="+ New Collection"
            onAction={() => setCreateCollectionOpen(true)}
          />
        ) : (
          <div className="collections-grid">
            {collections.map((coll) => (
              <div
                key={coll.id}
                className="collection-card"
                onClick={() => handleSelectCollection?.(coll)}
              >
                {coll.coverMediaUrl ? (
                  <img
                    src={coll.coverMediaUrl}
                    alt={coll.name}
                    className="collection-card-cover"
                  />
                ) : (
                  <div className="collection-card-placeholder">
                    <Folder size={32} />
                  </div>
                )}
                <div className="collection-card-details">
                  <div className="collection-card-title">{coll.name}</div>
                  <div className="collection-card-count">{coll.itemCount || 0} saved</div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : savedSubTab === 'reels' ? (
        loadingSavedReels ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        ) : savedReels.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No Saved Reels"
            description="Save reels from the reels feed to watch them anytime."
          />
        ) : (
          <div className="profile-reels-grid">
            {savedReels.map((reel) => (
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
                <button
                  type="button"
                  className="profile-reel-unsave-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await reelService.unsaveReel(reel.id);
                      setSavedReels?.((prev) => prev.filter((r) => r.id !== reel.id));
                      showSuccess?.('Reel removed from saved');
                    } catch {
                      showError?.('Failed to remove saved reel');
                    }
                  }}
                  title="Remove from saved"
                  aria-label="Remove from saved"
                >
                  <Bookmark size={15} fill="#fff" color="#fff" />
                </button>
                <div className="profile-grid-overlay">
                  <div className="overlay-stat">
                    <Heart size={20} fill="#fff" />
                    <span>{formatCount(reel.likeCount || 0)}</span>
                  </div>
                  <div className="overlay-stat">
                    <MessageCircle size={20} fill="#fff" />
                    <span>{formatCount(reel.commentCount || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loadingSaved ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <SkeletonMediaGrid count={6} />
        </div>
      ) : savedPosts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Saved Posts"
          description="Only you can see what you've saved."
        />
      ) : (
        <div className="profile-grid">
          {savedPosts.map((post) => {
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
                    alt={post.caption || 'Saved post'}
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
                ) : media?.mediaType === 'VIDEO' ? (
                  <div className="profile-corner-badge" title="Video">
                    <Play size={13} fill="#fff" strokeWidth={0} />
                  </div>
                ) : null}
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
      )}
    </div>
  );
};

export default ProfileSavedTab;
