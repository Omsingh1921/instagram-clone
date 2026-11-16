import React, { useState, useEffect } from 'react';
import { getAdaptiveImageUrl, getBlurPlaceholderUrl } from '../../utils/mediaUrl';
import './ProgressiveImage.css';

/**
 * Reusable Progressive Image Component.
 * Implements the Blur-Up Low Quality Image Placeholder (LQIP) technique
 * and progressive JPEG/WebP enhancement with zero layout shifts.
 */
export const ProgressiveImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  width = null,
  aspectRatio = null,
  onClick = null,
  onDoubleClick = null,
  loading = 'lazy',
  filterStyle = null,
  objectFit = 'cover',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const placeholderUrl = getBlurPlaceholderUrl(src);
  const highResUrl = getAdaptiveImageUrl(src, {
    ...(width ? { width } : {}),
    format: 'auto',
  });

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    if (!src) return;

    const img = new Image();
    img.src = highResUrl;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => {
      // If high-res fails, keep placeholder or mark error
      setHasError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, highResUrl]);

  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#121212',
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  };

  return (
    <div
      className={`progressive-image-container ${className}`}
      style={containerStyle}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* 1. Low-Quality Blurred Placeholder */}
      {placeholderUrl && !hasError && (
        <img
          src={placeholderUrl}
          alt={alt}
          className={`progressive-placeholder ${isLoaded ? 'fade-out' : ''}`}
          style={{ ...filterStyle, objectFit }}
          aria-hidden="true"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      )}

      {/* 2. Full High-Res Progressive Image */}
      <img
        src={hasError ? src : highResUrl}
        alt={alt}
        className={`progressive-highres ${isLoaded ? 'loaded' : ''}`}
        style={{ ...filterStyle, objectFit }}
        loading={loading}
        decoding="async"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default ProgressiveImage;

