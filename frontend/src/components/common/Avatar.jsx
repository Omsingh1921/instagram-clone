import React, { useState, useEffect } from 'react';
import './Avatar.css';

export const Avatar = ({
  src,
  alt = 'User',
  size = 'md',
  hasStory = false,
  storyViewed = false,
  isCloseFriends = false,
  isUploading = false,
  onClick,
  className = '',
  style = {},
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const ringClass = isUploading
    ? 'avatar-ring-uploading'
    : hasStory
    ? isCloseFriends
      ? 'avatar-ring-close-friends'
      : storyViewed
      ? 'avatar-ring-viewed'
      : 'avatar-ring-unseen'
    : '';

  const isNamedSize = typeof size === 'string' && ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(size);
  const sizeClass = isNamedSize ? `avatar-${size}` : '';
  const inlineSize = !isNamedSize
    ? {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        minWidth: typeof size === 'number' ? `${size}px` : size,
        minHeight: typeof size === 'number' ? `${size}px` : size,
        maxWidth: typeof size === 'number' ? `${size}px` : size,
        maxHeight: typeof size === 'number' ? `${size}px` : size,
        fontSize: typeof size === 'number' ? `${Math.max(10, Math.round(size * 0.38))}px` : undefined,
      }
    : {};

  return (
    <div
      className={`avatar-wrapper ${sizeClass} ${ringClass} ${className}`.trim()}
      style={{ ...inlineSize, ...style }}
      onClick={onClick}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="avatar-image"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="avatar-fallback" aria-label={alt}>
          {getInitials(alt)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
