import React from 'react';
import { Check, AlertCircle, RotateCw, X, Film, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useUpload } from '../../context/UploadContext';
import './BackgroundUploadWidget.css';

export const BackgroundUploadWidget = () => {
  const uploadCtx = useUpload();
  if (!uploadCtx) return null;

  const { uploads, retryUpload, dismissUpload } = uploadCtx;
  if (!uploads || uploads.length === 0) return null;

  return (
    <aside className="ig-bg-upload-container" aria-label="Background Uploads" role="region">
      {uploads.map((item) => {
        const isSuccess = item.status === 'success';
        const isError = item.status === 'error';
        const isVideo =
          item.type === 'reel' ||
          item.type === 'video' ||
          item.mediaType === 'VIDEO' ||
          item.mediaItems?.[0]?.type === 'VIDEO' ||
          (typeof item.thumbnail === 'string' && (item.thumbnail.includes('/video/') || item.thumbnail.endsWith('.mp4')));
        const isStory = item.type === 'story';
        const thumbSrc = item.thumbnail || item.mediaUrl || item.mediaItems?.[0]?.previewUrl;

        return (
          <div
            key={item.id}
            className={`ig-bg-upload-card ${item.status}`}
            role="status"
            aria-live="polite"
          >
            {/* Thumbnail Preview with robust fallback */}
            <div className="ig-bg-upload-thumb-wrap">
              <div className="ig-bg-upload-thumb-fallback">
                {isVideo ? <Film size={18} /> : isStory ? <Sparkles size={18} color="#f09433" /> : <ImageIcon size={18} />}
              </div>
              {thumbSrc && (
                isVideo ? (
                  <video
                    src={thumbSrc}
                    className="ig-bg-upload-thumb"
                    muted
                    autoPlay
                    loop
                    playsInline
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <img
                    src={thumbSrc}
                    alt=""
                    className="ig-bg-upload-thumb"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )
              )}
              {isVideo && (
                <div className="ig-bg-upload-video-badge" title="Video">
                  <Film size={10} />
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="ig-bg-upload-info">
              <div className="ig-bg-upload-header">
                <span className="ig-bg-upload-title">{item.title}</span>
                <span className={`ig-bg-upload-percent ${isSuccess ? 'success-text' : ''}`}>
                  {isSuccess ? '100%' : `${item.progress}%`}
                </span>
              </div>

              <div className="ig-bg-upload-status-row">
                <span className="ig-bg-upload-status-msg">
                  {isError ? item.error : item.statusMessage}
                </span>
              </div>

              {/* Progress Bar Track */}
              <div
                className="ig-bg-upload-progress-track"
                role="progressbar"
                aria-valuenow={item.progress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className={`ig-bg-upload-progress-fill ${isSuccess ? 'success' : ''} ${isError ? 'error' : ''}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="ig-bg-upload-actions">
              {item.status === 'uploading' && (
                <div className="ig-bg-upload-spinner" title="Uploading in background...">
                  <RotateCw size={16} className="spinning" />
                </div>
              )}

              {isSuccess && (
                <div className="ig-bg-upload-success-icon" title="Upload finished">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}

              {isError && (
                <div className="ig-bg-upload-error-actions">
                  <button
                    type="button"
                    onClick={() => retryUpload(item.id)}
                    className="ig-bg-upload-retry-btn"
                    title="Retry upload"
                    aria-label="Retry upload"
                  >
                    <RotateCw size={14} />
                    <span>Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissUpload(item.id)}
                    className="ig-bg-upload-dismiss-btn"
                    title="Dismiss"
                    aria-label="Dismiss upload notification"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
};

export default BackgroundUploadWidget;

