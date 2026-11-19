import React from 'react';

export const StoryProgressBars = ({
  stories = [],
  storyIdx = 0,
  progress = 0,
  isVideoStory = false,
  isHolding = false,
}) => {
  return (
    <div className="story-progress-container">
      {stories.map((s, idx) => {
        let width = '0%';
        if (idx < storyIdx) width = '100%';
        else if (idx === storyIdx) {
          width = s.isUploading
            ? `${Math.max(8, s.uploadProgress || 10)}%`
            : `${progress}%`;
        }

        const isCurrentVideo = idx === storyIdx && isVideoStory;

        return (
          <div
            key={s.id || idx}
            className={`story-progress-bar ${s.isUploading ? 'uploading-story-progress' : ''}`}
          >
            <div
              className={`story-progress-fill ${s.isUploading ? 'uploading-story-fill' : ''} ${isCurrentVideo ? 'video-sync-fill' : ''}`}
              style={{
                width,
                transition: isCurrentVideo || isHolding ? 'none' : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StoryProgressBars;
