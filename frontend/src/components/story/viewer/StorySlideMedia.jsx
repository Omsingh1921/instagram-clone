import React from 'react';
import { ExternalLink } from 'lucide-react';
import ProgressiveImage from '../../common/ProgressiveImage';
import { getVideoPosterUrl, getAdaptiveVideoUrl } from '../../../utils/mediaUrl';

export const StorySlideMedia = ({
  isVideoStory,
  videoRef,
  currentStory,
  isMuted,
  handleVideoTimeUpdate,
  handleVideoLoadedMetadata,
  handleVideoEnded,
  showViewers,
  showQuestionResponses,
  showInsights,
  showReportModal,
  handlePointerDown,
  handlePointerUp,
  handlePointerCancel,
  floatingReaction,
  onClose,
  navigate,
}) => {
  return (
    <>
      {isVideoStory ? (
        <video
          ref={videoRef}
          key={currentStory.id || currentStory.mediaUrl}
          src={
            currentStory.mediaUrl?.startsWith('blob:')
              ? currentStory.mediaUrl
              : getAdaptiveVideoUrl(currentStory.mediaUrl)
          }
          poster={
            currentStory.mediaUrl?.startsWith('blob:')
              ? undefined
              : getVideoPosterUrl(currentStory.mediaUrl)
          }
          autoPlay
          muted={isMuted}
          playsInline
          loop={Boolean(currentStory.isUploading)}
          className="story-viewer-media"
          onTimeUpdate={handleVideoTimeUpdate}
          onLoadedMetadata={handleVideoLoadedMetadata}
          onEnded={handleVideoEnded}
        />
      ) : (
        <ProgressiveImage
          src={currentStory.mediaUrl}
          alt="Story"
          className="story-viewer-media"
          objectFit="contain"
          loading="eager"
        />
      )}

      {/* Tap & Hold Zones */}
      {!showViewers && !showQuestionResponses && !showInsights && !showReportModal && (
        <>
          <div
            className="story-nav-tap left"
            onPointerDown={(e) => handlePointerDown(e, 'left')}
            onPointerUp={(e) => handlePointerUp(e, 'left')}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
          />
          <div
            className="story-nav-tap right"
            onPointerDown={(e) => handlePointerDown(e, 'right')}
            onPointerUp={(e) => handlePointerUp(e, 'right')}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
          />
        </>
      )}

      {/* Floating Reaction Micro-Animation */}
      {floatingReaction && (
        <div className="floating-reaction-badge">
          <span>{floatingReaction}</span>
          <span>Reaction sent</span>
        </div>
      )}

      {/* Shared Content Preview Cards */}
      {currentStory.sharedPostId && (
        <div
          className="story-shared-preview-pill"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
            navigate?.(`/post/${currentStory.sharedPostId}`);
          }}
        >
          <span>📷 View Post</span>
          <ExternalLink size={12} />
        </div>
      )}

      {currentStory.sharedReelId && (
        <div
          className="story-shared-preview-pill"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
            navigate?.(`/reels/${currentStory.sharedReelId}`);
          }}
        >
          <span>🎬 View Reel</span>
          <ExternalLink size={12} />
        </div>
      )}
    </>
  );
};

export default StorySlideMedia;
