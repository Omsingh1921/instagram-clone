import React from 'react';
import { Grid, Film, Bookmark, Tag, Archive, Trash2, RotateCw } from 'lucide-react';

export const ProfileNavTabs = ({
  activeTab = 'posts',
  setActiveTab,
  isOwnProfile = false,
  activePostUploads = [],
  activeReelUploads = [],
}) => {
  return (
    <nav className="profile-tabs-bar">
      <button
        type="button"
        className={`profile-tab-item ${activeTab === 'posts' ? 'active' : ''}`}
        onClick={() => setActiveTab?.('posts')}
      >
        <Grid size={14} />
        <span>Posts</span>
        {activePostUploads.length > 0 && (
          <span className="profile-tab-upload-badge" title="Uploading post...">
            <RotateCw size={11} className="story-upload-spinning-icon" />
          </span>
        )}
      </button>

      <button
        type="button"
        className={`profile-tab-item ${activeTab === 'reels' ? 'active' : ''}`}
        onClick={() => setActiveTab?.('reels')}
      >
        <Film size={14} />
        <span>Reels</span>
        {activeReelUploads.length > 0 && (
          <span className="profile-tab-upload-badge" title="Uploading reel...">
            <RotateCw size={11} className="story-upload-spinning-icon" />
          </span>
        )}
      </button>

      {isOwnProfile && (
        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab?.('saved')}
        >
          <Bookmark size={14} />
          <span>Saved</span>
        </button>
      )}

      <button
        type="button"
        className={`profile-tab-item ${activeTab === 'tagged' ? 'active' : ''}`}
        onClick={() => setActiveTab?.('tagged')}
      >
        <Tag size={14} />
        <span>Tagged</span>
      </button>

      {isOwnProfile && (
        <>
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => setActiveTab?.('archived')}
            title="Archived posts"
          >
            <Archive size={14} />
            <span>Archived</span>
          </button>

          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'recently_deleted' ? 'active' : ''}`}
            onClick={() => setActiveTab?.('recently_deleted')}
            title="Recently deleted posts"
          >
            <Trash2 size={14} />
            <span>Recently Deleted</span>
          </button>
        </>
      )}
    </nav>
  );
};

export default ProfileNavTabs;
