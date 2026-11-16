import React, { useState } from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, MapPin, Film } from 'lucide-react';
import Avatar from '../common/Avatar';
import './UploadingPostCard.css';

export const UploadingPostCard = ({ upload, currentUser }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!upload) return null;

  const isReel = upload.type === 'reel';
  const mediaItems = Array.isArray(upload.mediaItems) && upload.mediaItems.length > 0
    ? upload.mediaItems
    : [{ previewUrl: upload.mediaUrl || upload.thumbnail, type: upload.mediaType || (isReel ? 'VIDEO' : 'IMAGE') }];

  const activeMedia = mediaItems[currentSlide] || mediaItems[0];
  const isVideo = isReel || activeMedia?.type === 'VIDEO';
  const mediaSrc = activeMedia?.previewUrl || upload.mediaUrl || upload.thumbnail;

  const handleNextSlide = (e) => {
    e.stopPropagation();
    if (currentSlide < mediaItems.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <article className="uploading-post-card" aria-label="Uploading post">
      {/* Top Upload Progress Banner */}
      <div className="uploading-post-progress-banner">
        <div className="uploading-post-banner-header">
          <div className="uploading-post-banner-status">
            <RotateCw size={13} className="story-upload-spinning-icon" />
            <span className="uploading-post-banner-title">
              {isReel ? 'Sharing Reel to Feed...' : 'Sharing Post to Feed...'}
            </span>
          </div>
          <span className="uploading-post-banner-pct">{upload.progress || 10}%</span>
        </div>
        <div className="uploading-post-progress-track">
          <div
            className="uploading-post-progress-bar"
            style={{ width: `${Math.max(8, upload.progress || 10)}%` }}
          />
        </div>
        <div className="uploading-post-status-message">
          {upload.statusMessage || 'Optimizing & uploading media...'}
        </div>
      </div>

      {/* Author Header */}
      <div className="uploading-post-header">
        <div className="uploading-post-author">
          <Avatar
            src={currentUser?.avatarUrl || currentUser?.profilePictureUrl}
            alt={currentUser?.username || 'You'}
            size="sm"
            isUploading={true}
          />
          <div className="uploading-post-user-meta">
            <div className="uploading-post-username-row">
              <span className="uploading-post-username">{currentUser?.username || 'You'}</span>
              {isReel && (
                <span className="uploading-post-reel-badge">
                  <Film size={11} /> Reel
                </span>
              )}
            </div>
            {upload.location && (
              <span className="uploading-post-location">
                <MapPin size={10} /> {upload.location}
              </span>
            )}
          </div>
        </div>
        <span className="uploading-post-indicator-pill">
          <RotateCw size={11} className="story-upload-spinning-icon" />
          Uploading
        </span>
      </div>

      {/* Media Canvas */}
      <div className="uploading-post-media-stage">
        {isVideo ? (
          <video
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            className="uploading-post-media"
          />
        ) : (
          <img
            src={mediaSrc}
            alt="Upload preview"
            className="uploading-post-media"
          />
        )}

        {/* Carousel Badges and Navigation */}
        {mediaItems.length > 1 && (
          <>
            <div className="uploading-post-carousel-badge">
              {currentSlide + 1}/{mediaItems.length}
            </div>

            {currentSlide > 0 && (
              <button
                type="button"
                className="uploading-post-nav-btn prev"
                onClick={handlePrevSlide}
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {currentSlide < mediaItems.length - 1 && (
              <button
                type="button"
                className="uploading-post-nav-btn next"
                onClick={handleNextSlide}
                aria-label="Next slide"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Carousel Dots */}
      {mediaItems.length > 1 && (
        <div className="uploading-post-carousel-dots">
          {mediaItems.map((_, idx) => (
            <span
              key={idx}
              className={`uploading-post-dot ${idx === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Action Icons (Muted/Disabled while uploading) */}
      <div className="uploading-post-actions-row">
        <div className="uploading-post-actions-left">
          <button type="button" className="uploading-action-icon" disabled title="Upload in progress">
            <Heart size={24} />
          </button>
          <button type="button" className="uploading-action-icon" disabled title="Upload in progress">
            <MessageCircle size={24} />
          </button>
          <button type="button" className="uploading-action-icon" disabled title="Upload in progress">
            <Send size={24} />
          </button>
        </div>
        <button type="button" className="uploading-action-icon" disabled title="Upload in progress">
          <Bookmark size={24} />
        </button>
      </div>

      {/* Caption & Timestamp */}
      <div className="uploading-post-caption-section">
        {upload.caption ? (
          <p className="uploading-post-caption">
            <span className="uploading-post-username">{currentUser?.username || 'You'}</span>{' '}
            {upload.caption}
          </p>
        ) : null}
        <span className="uploading-post-time">Just now • Finishing upload</span>
      </div>
    </article>
  );
};

export default UploadingPostCard;

