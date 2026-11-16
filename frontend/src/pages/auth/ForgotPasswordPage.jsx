import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Smartphone,
  Laptop,
  Monitor,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth.service';
import sessionService from '../../services/session.service';
import {
  AuthFlowShell,
  AuthCardBrandHeader,
  AuthLockBadge,
  AuthPasswordStrength,
} from './AuthFlowChrome';
import './LoginPage.css';
import './AuthFlowPages.css';

const STEPS = {
  EMAIL: 'EMAIL',
  OTP: 'OTP',
  ACCOUNTS: 'ACCOUNTS',
  PASSWORD: 'PASSWORD',
  SESSIONS: 'SESSIONS',
};

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState(STEPS.EMAIL);

  // Form states
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetTicket, setResetTicket] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Password step states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Session management states
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState(null);
  const [revokingAllOther, setRevokingAllOther] = useState(false);

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // OTP input refs
  const otpInputRefs = useRef([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Load sessions when entering SESSIONS step
  useEffect(() => {
    if (currentStep === STEPS.SESSIONS) {
      loadActiveSessions();
    }
  }, [currentStep]);

  const loadActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await sessionService.getActiveSessions();
      const list = Array.isArray(res) ? res : res?.data || [];
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // ==================== STEP 1: REQUEST OTP ====================
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Email is required.');
      return;
    }

    if (cleanEmail.length > 150) {
      setErrorMessage('Email cannot exceed 150 characters.');
      return;
    }

    const localPart = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
    if (/[^a-z0-9.]/.test(localPart) || /[!#$%^&*()_+=\[\]{};':"\\|,<>\/?~`]/.test(cleanEmail)) {
      setErrorMessage('Special characters are not allowed in email.');
      return;
    }

    if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      setErrorMessage('Email cannot start, end with, or contain consecutive dots.');
      return;
    }

    const emailRegex = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@(?!.*\.\.)[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await authService.requestForgotPasswordOtp(cleanEmail);
      setCooldown(60);
      setCurrentStep(STEPS.OTP);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send security code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== STEP 2: VERIFY OTP ====================
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal.slice(-1);
    setOtpDigits(newDigits);
    setErrorMessage('');

    // Auto-advance to next box
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter the full 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await authService.verifyForgotPasswordOtp(email, code);
      const data = res?.data || res;
      setResetTicket(data.resetTicket);

      const userAccounts = data.accounts || [];
      setAccounts(userAccounts);

      if (userAccounts.length > 1) {
        // Multi-account: Show selection screen
        setCurrentStep(STEPS.ACCOUNTS);
      } else if (userAccounts.length === 1) {
        // Single account: auto-select and go directly to password reset
        setSelectedAccount(userAccounts[0]);
        setCurrentStep(STEPS.PASSWORD);
      } else {
        throw new Error('No accounts found for this email address.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== STEP 3: ACCOUNT SELECTION ====================
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setErrorMessage('');
    setCurrentStep(STEPS.PASSWORD);
  };

  // ==================== STEP 4: SET NEW PASSWORD ====================
  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(newPassword);
  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!selectedAccount?.id) {
      setErrorMessage('Account selection error. Please start over.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await authService.resetPasswordWithTicket({
        resetTicket,
        userId: selectedAccount.id,
        newPassword,
      });

      const authData = res?.data || res;
      if (authData?.accessToken) {
        login(authData);
      }

      setSuccessMessage('Password changed successfully! You are now logged in on this device.');
      // Move to interactive sessions management step!
      setCurrentStep(STEPS.SESSIONS);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== STEP 5: GRANULAR SESSIONS MANAGEMENT ====================
  const handleRevokeSingleSession = async (sessionId) => {
    try {
      setRevokingSessionId(sessionId);
      await sessionService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => (s.sessionId || s.id) !== sessionId));
    } catch {
      setErrorMessage('Could not log out of this device');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      setRevokingAllOther(true);
      await sessionService.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.current || s.isCurrentSession));
    } catch {
      setErrorMessage('Could not log out of other devices');
    } finally {
      setRevokingAllOther(false);
    }
  };

  const handleContinueToInstagram = () => {
    navigate('/', { replace: true });
  };

  const getDeviceIcon = (deviceInfo = '') => {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) {
      return <Smartphone size={18} />;
    }
    if (lower.includes('mac') || lower.includes('laptop')) {
      return <Laptop size={18} />;
    }
    return <Monitor size={18} />;
  };

  return (
    <AuthFlowShell footerLinks="compact" languageLabel="English (UK)">
      <AuthCardBrandHeader />

      {/* Header Lock / Shield Badge */}
      {currentStep === STEPS.SESSIONS ? (
        <div className="ig-neon-badge-box is-emerald" aria-hidden="true">
          <ShieldCheck size={22} strokeWidth={1.9} />
        </div>
      ) : (
        <AuthLockBadge
          icon={
            currentStep === STEPS.OTP ? (
              <Mail size={20} strokeWidth={1.8} />
            ) : (
              <Lock size={20} strokeWidth={1.8} />
            )
          }
        />
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div className="ig-auth-banner ig-auth-banner-error" role="alert">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Message Box */}
      {successMessage && currentStep === STEPS.SESSIONS && (
        <div className="ig-auth-banner ig-auth-banner-success">
          <CheckCircle2 size={15} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ==============================================================
          STEP 1: ENTER EMAIL
      ============================================================== */}
      {currentStep === STEPS.EMAIL && (
        <>
          <h1 className="ig-auth-card-title">Trouble logging in?</h1>
          <p className="ig-auth-card-subtitle">
            Enter your verified email address and we'll send you a 6-digit security code to reset your password.
          </p>

          <form className="ig-auth-flow-form" onSubmit={handleRequestOtp}>
            <div className="ig-glass-field ig-auth-glass-field">
              <Mail size={16} className="ig-field-lead-icon" />
              <div className="ig-field-stack">
                <input
                  type="email"
                  name="email"
                  className="ig-glass-input"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="ig-neon-gradient-btn"
              disabled={isSubmitting || !email.trim()}
            >
              {isSubmitting ? 'Sending Code...' : 'Send Security Code'}
            </button>
          </form>
        </>
      )}

      {/* ==============================================================
          STEP 2: ENTER 6-DIGIT OTP
      ============================================================== */}
      {currentStep === STEPS.OTP && (
        <>
          <h1 className="ig-auth-card-title">Enter 6-Digit Code</h1>
          <p className="ig-auth-card-subtitle">
            We sent a confirmation code to <strong>{email}</strong>. Enter it below to confirm your identity.
          </p>

          <form className="ig-auth-flow-form" onSubmit={handleVerifyOtp}>
            <div className="ig-otp-inputs-row" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="ig-otp-digit-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            <button
              type="submit"
              className="ig-neon-gradient-btn"
              disabled={isSubmitting || otpDigits.join('').length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Confirm Code'}
            </button>

            <button
              type="button"
              className="ig-auth-secondary-btn"
              onClick={handleRequestOtp}
              disabled={cooldown > 0 || isSubmitting}
            >
              <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
              <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}</span>
            </button>
          </form>
        </>
      )}

      {/* ==============================================================
          STEP 3: MULTI-ACCOUNT SELECTOR
      ============================================================== */}
      {currentStep === STEPS.ACCOUNTS && (
        <>
          <h1 className="ig-auth-card-title">Choose Account</h1>
          <p className="ig-auth-card-subtitle">
            Multiple accounts are associated with this email. Select which account you want to reset:
          </p>

          <div className="ig-account-selector-list">
            {accounts.map((acc, index) => (
              <div
                key={acc.id}
                className="ig-account-select-card"
                onClick={() => handleSelectAccount(acc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectAccount(acc);
                  }
                }}
              >
                <div className="ig-account-card-left">
                  <div className="ig-account-avatar-frame">
                    <Avatar src={acc.avatarUrl} alt={acc.username} size={44} />
                  </div>
                  <div className="ig-account-card-info">
                    <div className="ig-account-username-row">
                      <span className="ig-account-card-username">@{acc.username}</span>
                      <span className="ig-account-slot-pill">Account {index + 1}</span>
                    </div>
                    <span className="ig-account-card-name">{acc.displayName || acc.username}</span>
                  </div>
                </div>
                <div className="ig-account-card-right">
                  <span className="ig-account-select-btn-text">Select</span>
                  <ChevronRight size={18} className="ig-account-chevron" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ==============================================================
          STEP 4: SET NEW PASSWORD
      ============================================================== */}
      {currentStep === STEPS.PASSWORD && (
        <>
          <h1 className="ig-auth-card-title">Create New Password</h1>
          <p className="ig-auth-card-subtitle">
            Setting password for <strong>@{selectedAccount?.username}</strong>. Choose a strong password with at least 8 characters.
          </p>

          <form className="ig-auth-flow-form" onSubmit={handleResetPassword}>
            <div className="ig-glass-field ig-auth-glass-field">
              <Lock size={16} className="ig-field-lead-icon" />
              <div className="ig-field-stack">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="ig-glass-input"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              <button
                type="button"
                className="ig-glass-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <AuthPasswordStrength
              password={newPassword}
              strengthScore={strengthScore}
              strengthLabel={strengthLabels[strengthScore]}
            />

            <div className="ig-glass-field ig-auth-glass-field">
              <Lock size={16} className="ig-field-lead-icon" />
              <div className="ig-field-stack">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="ig-glass-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className="ig-neon-gradient-btn"
              disabled={isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </>
      )}

      {/* ==============================================================
          STEP 5: SESSIONS MANAGEMENT ("Where You're Logged In")
      ============================================================== */}
      {currentStep === STEPS.SESSIONS && (
        <div className="ig-sessions-dashboard" style={{ margin: 0 }}>
          <h1 className="ig-auth-card-title" style={{ textAlign: 'center', marginBottom: 4 }}>
            Where You're Logged In
          </h1>
          <p className="ig-auth-card-subtitle" style={{ textAlign: 'center', marginBottom: 6 }}>
            Review active login sessions for <strong>@{selectedAccount?.username}</strong>. You can log out of unrecognized devices now or continue.
          </p>

          {loadingSessions ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9b9cb2', fontSize: '13px' }}>
              Loading active sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '14px 0', color: '#9b9cb2', fontSize: '13px' }}>
              No other devices currently logged in.
            </div>
          ) : (
            <div className="ig-sessions-list-container">
              {sessions.map((sess) => {
                const isCurrent = sess.current || sess.isCurrentSession;
                const sId = sess.sessionId || sess.id;
                return (
                  <div key={sId} className="ig-session-item-row">
                    <div className="ig-session-left-meta">
                      <div className="ig-session-device-icon">
                        {getDeviceIcon(sess.deviceInfo || sess.deviceName)}
                      </div>
                      <div className="ig-session-device-details">
                        <span className="ig-session-device-title">
                          {sess.deviceInfo || sess.deviceName || 'Web Browser'}
                          {isCurrent && (
                            <span className="ig-current-session-badge">Active now</span>
                          )}
                        </span>
                        <span className="ig-session-subtext">
                          {sess.ipAddress ? `${sess.ipAddress} • ` : ''}
                          {sess.location || (isCurrent ? 'This device' : 'Logged in device')}
                        </span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        className="ig-session-remove-btn"
                        onClick={() => handleRevokeSingleSession(sId)}
                        disabled={revokingSessionId === sId}
                        title="Log out this device"
                      >
                        {revokingSessionId === sId ? '...' : 'Log Out'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {sessions.filter((s) => !s.current && !s.isCurrentSession).length > 0 && (
              <button
                type="button"
                className="ig-danger-action-btn"
                onClick={handleRevokeOtherSessions}
                disabled={revokingAllOther}
              >
                <LogOut size={15} />
                <span>{revokingAllOther ? 'Logging out...' : 'Log Out of All Other Devices'}</span>
              </button>
            )}

            <button
              type="button"
              className="ig-neon-gradient-btn"
              onClick={handleContinueToInstagram}
            >
              Continue to Instagram
            </button>
          </div>
        </div>
      )}

      {/* Back / Navigation links */}
      {currentStep !== STEPS.SESSIONS && (
        <div
          style={{
            marginTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '12px',
          }}
        >
          {currentStep !== STEPS.EMAIL ? (
            <button
              type="button"
              className="ig-auth-text-action-btn"
              onClick={() => {
                setErrorMessage('');
                if (currentStep === STEPS.OTP) setCurrentStep(STEPS.EMAIL);
                else if (currentStep === STEPS.ACCOUNTS) setCurrentStep(STEPS.OTP);
                else if (currentStep === STEPS.PASSWORD) {
                  if (accounts.length > 1) setCurrentStep(STEPS.ACCOUNTS);
                  else setCurrentStep(STEPS.OTP);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#d4d4e0',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <Link to="/login" className="ig-auth-link-blue" style={{ fontSize: '13px' }}>
              Back to login
            </Link>
          )}
        </div>
      )}
    </AuthFlowShell>
  );
};

export default ForgotPasswordPage;
