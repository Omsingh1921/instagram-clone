import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { InstagramLogo, InstagramGlyph } from '../../components/common/InstagramLogo';

/**
 * Shared dark aurora obsidian canvas + glowing purple-border glass card shell
 * reused across Signup, Forgot Password, and Reset Password flows.
 */
export const AuthFlowShell = ({
  children,
  footerLinks = 'default',
  languageLabel = 'English',
  wide = false,
}) => {
  return (
    <div className="ig-login-page-root ig-login-redesign ig-auth-flow-root">
      <div className="ig-login-aurora-top" aria-hidden="true" />
      <div className="ig-login-aurora-bottom" aria-hidden="true" />
      <div className="ig-auth-aurora-center" aria-hidden="true" />

      <main className="ig-auth-flow-main">
        <div className={`ig-auth-flow-card ${wide ? 'ig-auth-flow-card-wide' : ''}`}>
          {children}
        </div>
      </main>

      <footer className="ig-auth-footer ig-login-footer">
        <div className="ig-footer-links-row">
          <a href="https://about.meta.com" target="_blank" rel="noreferrer">Meta</a>
          <a href="https://about.instagram.com" target="_blank" rel="noreferrer">About</a>
          {footerLinks === 'default' && (
            <>
              <a href="https://about.instagram.com/blog" target="_blank" rel="noreferrer">Blog</a>
              <a href="https://about.instagram.com/about-us/careers" target="_blank" rel="noreferrer">Jobs</a>
            </>
          )}
          <a href="https://help.instagram.com" target="_blank" rel="noreferrer">Help</a>
          <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noreferrer">Privacy</a>
          <a href="https://help.instagram.com/581066165581870" target="_blank" rel="noreferrer">Terms</a>
        </div>
        <div className="ig-footer-copyright-row">
          <span>{languageLabel}</span>
          <span>© 2026 Instagram from Meta</span>
        </div>
      </footer>
    </div>
  );
};

/**
 * Shared compact Instagram gradient badge + white wordmark used at the top of cards.
 */
export const AuthCardBrandHeader = () => (
  <div className="ig-auth-card-brand">
    <InstagramGlyph size={32} />
    <InstagramLogo width={122} height={36} color="#ffffff" />
  </div>
);

/**
 * Shared 6-box visual OTP widget synchronized cleanly over a real accessible input
 * so keyboard input, paste, click-to-focus, and automated tests all work seamlessly.
 */
export const AuthSingleOtpInput = ({
  value,
  onChange,
  placeholder,
  name,
  disabled,
  testId,
  ariaLabel,
  autoFocus = false,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="ig-otp-visual-wrapper">
      <div className="ig-otp-slots-grid" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const char = value[idx] || '';
          const isCurrent = focused && (idx === value.length || (value.length === 6 && idx === 5));
          return (
            <div
              key={idx}
              className={`ig-otp-slot-cell ${char ? 'is-filled' : ''} ${isCurrent ? 'is-current' : ''}`}
            >
              {char || (isCurrent ? <span className="ig-otp-slot-caret" /> : null)}
            </div>
          );
        })}
      </div>

      <input
        type="text"
        name={name}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        className="ig-otp-overlay-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="one-time-code"
        required
        disabled={disabled}
        autoFocus={autoFocus}
        data-testid={testId}
        aria-label={ariaLabel}
      />
    </div>
  );
};

/**
 * Shared dark-glass 4-segment password strength meter.
 */
export const AuthPasswordStrength = ({
  password,
  strengthScore,
  strengthLabel,
  prefixLabel = 'Strength',
  hintText = '8+ chars recommended',
}) => {
  if (!password) return null;

  const activeColor =
    strengthScore <= 1 ? '#ef4444' : strengthScore === 2 ? '#f59e0b' : '#10b981';

  return (
    <div className="ig-dark-strength-wrap">
      <div className="ig-dark-strength-track">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className="ig-dark-strength-seg"
            style={{
              backgroundColor: seg <= strengthScore ? activeColor : undefined,
            }}
          />
        ))}
      </div>
      <div className="ig-dark-strength-meta">
        <span>
          {prefixLabel}: <strong style={{ color: activeColor }}>{strengthLabel}</strong>
        </span>
        <span>{hintText}</span>
      </div>
    </div>
  );
};

/**
 * Reusable lock badge for Password recovery / reset views.
 */
export const AuthLockBadge = ({ icon }) => (
  <div className="ig-neon-badge-box" aria-hidden="true">
    {icon || <Lock size={21} strokeWidth={1.9} />}
  </div>
);

