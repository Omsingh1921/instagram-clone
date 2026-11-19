import React, { useId } from 'react';
import { Instagram } from 'lucide-react';

/**
 * Authentic Meta Instagram Cursive Wordmark & Glyph Logos.
 * Uses 'Grand Hotel' cursive typography matching real instagram.com.
 */
export const InstagramLogo = ({
  width = 175,
  height = 42,
  color = 'currentColor',
  className = '',
  style = {},
}) => {
  return (
    <span
      className={`ig-cursive-wordmark ${className}`.trim()}
      style={{
        fontFamily: "'Grand Hotel', -apple-system, cursive, sans-serif",
        fontSize: typeof height === 'number' ? `${Math.round(height * 1.05)}px` : '36px',
        lineHeight: 1,
        color,
        letterSpacing: '0.5px',
        display: 'inline-block',
        userSelect: 'none',
        fontWeight: 400,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...style,
      }}
      aria-label="Instagram"
    >
      Instagram
    </span>
  );
};

export const InstagramGlyph = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => {
  return (
    <Instagram
      size={size}
      color={color}
      className={className}
      aria-label="Instagram"
    />
  );
};

export const InstagramColorGlyph = ({
  size = 38,
  className = '',
}) => {
  const gradId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Instagram"
    >
      <defs>
        <radialGradient
          id={gradId}
          cx="30%"
          cy="107%"
          r="150%"
          fx="30%"
          fy="107%"
        >
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="10%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="68%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285aeb" />
        </radialGradient>
      </defs>
      <rect
        x="2.2"
        y="2.2"
        width="19.6"
        height="19.6"
        rx="5.4"
        stroke={`url(#${gradId})`}
        strokeWidth="2.1"
      />
      <circle
        cx="12"
        cy="12"
        r="4.5"
        stroke={`url(#${gradId})`}
        strokeWidth="2.1"
      />
      <circle cx="17.3" cy="6.7" r="1.25" fill={`url(#${gradId})`} />
    </svg>
  );
};

export default InstagramLogo;
