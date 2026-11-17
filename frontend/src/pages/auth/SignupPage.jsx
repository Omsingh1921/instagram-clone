import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Mail,
  KeyRound,
  RefreshCw,
  Check,
  User,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth.service';
import { InstagramColorGlyph, InstagramLogo } from '../../components/common/InstagramLogo';
import loginHeroCollage from '../../assets/login-hero-collage.webp';
import {
  AuthSingleOtpInput,
  AuthPasswordStrength,
} from './AuthFlowChrome';
import './LoginPage.css';
import './AuthFlowPages.css';

const SignupPhotoCollage = () => (
  <div className="ig-signup-collage-wrap" aria-hidden="true">
    <svg width="148" height="90" viewBox="0 0 168 104" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="igCardSkyMain" x1="48" y1="12" x2="120" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="48%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="igCardSkyLeft" x1="12" y1="20" x2="62" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="igCardSkyRight" x1="106" y1="22" x2="154" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="igHeartBadge" x1="100" y1="68" x2="132" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>

      {/* Left tilted card */}
      <g transform="rotate(-11 40 54)">
        <rect x="14" y="18" width="52" height="68" rx="7" fill="#ffffff" fillOpacity="0.92" />
        <rect x="18" y="22" width="44" height="48" rx="4" fill="url(#igCardSkyLeft)" />
        <path d="M18 62L31 46L42 58L50 50L62 64V70H18V62Z" fill="#1e1b4b" fillOpacity="0.72" />
      </g>

      {/* Right tilted card */}
      <g transform="rotate(11 128 54)">
        <rect x="102" y="18" width="52" height="68" rx="7" fill="#ffffff" fillOpacity="0.92" />
        <rect x="106" y="22" width="44" height="48" rx="4" fill="url(#igCardSkyRight)" />
        <circle cx="136" cy="34" r="5" fill="#fde68a" fillOpacity="0.85" />
        <path d="M106 60L121 45L133 56L141 49L150 61V70H106V60Z" fill="#18122b" fillOpacity="0.78" />
      </g>

      {/* Center hero Polaroid card */}
      <g>
        <rect x="48" y="8" width="72" height="86" rx="9" fill="#ffffff" />
        <rect x="53" y="13" width="62" height="60" rx="5" fill="url(#igCardSkyMain)" />
        <circle cx="84" cy="34" r="10" fill="#fef08a" fillOpacity="0.95" />
        <path d="M53 60L70 43L84 56L97 44L115 62V73H53V60Z" fill="#2e1065" fillOpacity="0.75" />
        <path d="M53 65L66 53L79 65L94 52L115 68V73H53V65Z" fill="#140c29" fillOpacity="0.88" />
      </g>

      {/* Floating Heart Badge */}
      <g>
        <rect x="98" y="65" width="30" height="26" rx="8" fill="url(#igHeartBadge)" />
        <path
          d="M113 84.5C113 84.5 106.5 80.2 106.5 75.8C106.5 73.7 108.1 72 110.2 72C111.5 72 112.5 72.7 113 73.6C113.5 72.7 114.5 72 115.8 72C117.9 72 119.5 73.7 119.5 75.8C119.5 80.2 113 84.5 113 84.5Z"
          fill="#ffffff"
        />
      </g>
    </svg>
  </div>
);

export const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Wizard Stages: 'email' | 'otp' | 'profile' | 'legacy-recover'
  const [stage, setStage] = useState(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('mode') === 'legacy' || searchParams.get('token') || location.pathname.includes('/verify')) {
        return 'legacy-recover';
      }
    } catch {
      // Ignore URL parsing errors
    }
    const savedProof = sessionStorage.getItem('signup_proof');
    const savedEmail = sessionStorage.getItem('signup_email');
    if (savedProof && savedEmail) {
      return 'profile';
    }
    return 'email';
  });

  const [email, setEmail] = useState(() => sessionStorage.getItem('signup_email') || '');
  const [otpCode, setOtpCode] = useState('');
  const [signupToken, setSignupToken] = useState(() => sessionStorage.getItem('signup_proof') || '');

  // Legacy recovery state
  const [legacyEmail, setLegacyEmail] = useState('');
  const [legacyCode, setLegacyCode] = useState('');

  const [profileData, setProfileData] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null, // null | true | false
    message: '',
    suggestions: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle email verification link token or route parameter
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('mode') === 'legacy' || location.pathname.includes('/verify')) {
        setStage('legacy-recover');
      }
      const emailChangeToken = searchParams.get('confirmEmailChange');
      if (emailChangeToken) {
        setStage('legacy-recover');
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('Verifying and updating your email address...');
        authService.confirmEmailChange(emailChangeToken)
          .then(() => {
            setSuccessMessage('Email address updated successfully! Please log in with your new email.');
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 1800);
          })
          .catch((err) => {
            setErrorMessage(err?.message || 'Invalid or expired email change link.');
          })
          .finally(() => {
            setIsSubmitting(false);
          });
        return;
      }

      const tokenParam = searchParams.get('token');
      if (tokenParam) {
        setStage('legacy-recover');
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('Verifying your email token...');
        authService.verifyEmailLink(tokenParam)
          .then(() => {
            setSuccessMessage('Email verified successfully! Redirecting to login...');
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 1200);
          })
          .catch((err) => {
            setErrorMessage(err?.message || 'Invalid or expired verification link.');
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      }
    } catch {
      // Ignore
    }
  }, [location, navigate]);

  // Step 1: Request OTP for Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage('Email is required.');
      return;
    }

    if (normalizedEmail.length > 150) {
      setErrorMessage('Email cannot exceed 150 characters.');
      return;
    }

    // Check for special characters (only letters, numbers, and dot allowed in username part)
    const localPart = normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : normalizedEmail;
    if (/[^a-z0-9.]/.test(localPart) || /[!#$%^&*()_+=\[\]{};':"\\|,<>\/?~`]/.test(normalizedEmail)) {
      setErrorMessage('Special characters are not allowed in email.');
      return;
    }

    if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      setErrorMessage('Email cannot start, end with, or contain consecutive dots.');
      return;
    }

    // Only letters, numbers and non-consecutive dots allowed (no underscore, %, +, or hyphen in username)
    const emailRegex = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@(?!.*\.\.)[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.requestSignupOtp(normalizedEmail);
      setSuccessMessage(res?.message || 'Confirmation code sent to your email.');
      setStage('otp');
      setCooldown(60);
    } catch (err) {
      const msg = err?.message || 'Failed to send confirmation code. Please try again.';
      setErrorMessage(msg);
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setOtpCode(digits);
    if (errorMessage) setErrorMessage('');
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const trimmedCode = otpCode.trim();

    if (trimmedCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.verifySignupOtp(email.trim().toLowerCase(), trimmedCode);
      const data = res?.data || res;
      const token = data?.signupToken;

      if (!token) {
        throw new Error('Verification failed. No signup token received.');
      }

      setSignupToken(token);
      setSuccessMessage('Email verified successfully!');
      setStage('profile');
    } catch (err) {
      const msg = err?.message || 'Invalid or expired confirmation code. Please try again.';
      setErrorMessage(msg);
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending || isSubmitting) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.resendSignupOtp(email.trim().toLowerCase());
      setSuccessMessage(res?.message || 'New confirmation code sent to your email.');
      setCooldown(60);
    } catch (err) {
      const msg = err?.message || 'Failed to resend confirmation code.';
      setErrorMessage(msg);
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    setStage('email');
    setOtpCode('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Step 3: Complete Profile & Register
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSelectUsernameSuggestion = (sug) => {
    setProfileData((prev) => ({ ...prev, username: sug }));
  };

  // Live username availability check
  useEffect(() => {
    const raw = (profileData.username || '').trim();
    if (!raw || stage !== 'profile') {
      setUsernameStatus({ checking: false, available: null, message: '', suggestions: [] });
      return;
    }

    if (raw.length < 3) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Username must be at least 3 characters',
        suggestions: [],
      });
      return;
    }

    setUsernameStatus((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(raw);
        const data = res?.data || res;
        setUsernameStatus({
          checking: false,
          available: Boolean(data?.available),
          message: data?.message || (data?.available ? 'Username is available' : 'Username is already taken'),
          suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
        });
      } catch {
        setUsernameStatus({
          checking: false,
          available: null,
          message: '',
          suggestions: [],
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [profileData.username, stage]);

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(profileData.password);
  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const { username, displayName, password, confirmPassword } = profileData;

    if (!signupToken) {
      setErrorMessage('Your verification proof has expired. Please verify your email again.');
      setStage('email');
      return;
    }

    if (!username.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (usernameStatus.available === false) {
      setErrorMessage(usernameStatus.message || 'Please choose an available username.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const regRes = await authService.register({
        signupToken,
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        password,
      });

      const authData = regRes?.data || regRes;
      setSuccessMessage('Account created successfully! Logging you in...');

      try {
        sessionStorage.removeItem('signup_proof');
        sessionStorage.removeItem('signup_email');
      } catch {
        // Ignore
      }

      login(authData);

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 400);
    } catch (err) {
      const msg = err?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);

      if (err?.status === 400 && (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expired'))) {
        try {
          sessionStorage.removeItem('signup_proof');
          sessionStorage.removeItem('signup_email');
        } catch {
          // Ignore
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy Recovery Handlers
  const handleLegacyOtpSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = legacyEmail.trim().toLowerCase();
    const trimmedCode = legacyCode.trim();

    if (!normalizedEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    if (trimmedCode.length !== 6) {
      setErrorMessage('Please enter your 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.verifyLegacyOtp(normalizedEmail, trimmedCode);
      const authData = res?.data || res;
      setSuccessMessage('Account verified successfully! Logging you in...');
      login(authData);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 400);
    } catch (err) {
      setErrorMessage(err?.message || 'Verification failed. Please check the code and email or request a new code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLegacyResendOtp = async () => {
    const normalizedEmail = legacyEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Please enter your account email address before requesting a code.');
      return;
    }

    if (cooldown > 0 || isResending || isSubmitting) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await authService.resendLegacyOtp(normalizedEmail);
      setSuccessMessage('If an unverified account exists with this email, a verification code has been sent.');
      setCooldown(60);
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to resend confirmation code. Please try again later.');
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="ig-login-page-root ig-signup-figma-root">
      {/* Ambient Violet-Magenta Edge Glows */}
      <div className="ig-signup-glow-bl" aria-hidden="true" />
      <div className="ig-signup-glow-tr" aria-hidden="true" />
      <div className="ig-signup-glow-br" aria-hidden="true" />

      <main className="ig-signup-figma-split">
        {/* Left Hero Showcase Panel */}
        <section className="ig-signup-figma-showcase" aria-hidden="true">
          <div className="ig-signup-corner-brand">
            <InstagramColorGlyph size={34} />
            <InstagramLogo height={28} color="#ffffff" />
          </div>

          <div className="ig-signup-showcase-center">
            <h2 className="ig-signup-hero-headline">
              See everyday
              <br />
              moments from your
              <br />
              <span className="ig-figma-headline-accent">close friends.</span>
            </h2>

            <div className="ig-figma-collage-wrap">
              <img
                src={loginHeroCollage}
                alt=""
                className="ig-signup-collage-img"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* Right Borderless Signup Column */}
        <section className="ig-signup-figma-panel">
          <div className="ig-signup-figma-inner">
            <div className="ig-signup-mobile-brand" aria-hidden="true">
              <InstagramColorGlyph size={32} />
              <InstagramLogo height={28} color="#ffffff" />
            </div>

            {stage === 'email' && (
              <>
                <h1 className="ig-signup-figma-title">Create a new account</h1>
                <p className="ig-signup-step1-lead">
                  Sign up to see photos and videos from your friends.
                </p>
              </>
            )}

            {stage === 'otp' && (
              <>
                <h1 className="ig-signup-figma-title">Enter Confirmation Code</h1>
                <p className="ig-auth-card-subtitle">
                  Enter the 6-digit confirmation code we sent to <strong>{email}</strong>.
                </p>
              </>
            )}

            {stage === 'profile' && (
              <>
                <h1 className="ig-signup-figma-title">Complete Your Profile</h1>
                <p className="ig-auth-card-subtitle">
                  Choose a unique username and strong password to finish signing up.
                </p>
              </>
            )}

            {stage === 'legacy-recover' && (
              <>
                <div className="ig-neon-badge-box" aria-hidden="true">
                  <KeyRound size={20} strokeWidth={1.8} />
                </div>
                <h1 className="ig-signup-figma-title">Verify Existing Account</h1>
                <p className="ig-auth-card-subtitle">
                  Enter your account email and confirmation code to finish verification.
                </p>
              </>
            )}

            {/* 3-Step Neon Progress Indicator */}
            {stage !== 'legacy-recover' && (
              <div className="ig-neon-stepper" aria-label="Signup steps">
                <div className={`ig-step-orb ${stage === 'email' ? 'is-active' : 'is-completed'}`}>
                  {stage !== 'email' ? <Check size={14} strokeWidth={2.5} /> : '1'}
                </div>
                <div
                  className={`ig-step-line ${stage === 'otp' ? 'is-to-active' : stage === 'profile' ? 'is-done' : ''
                    }`}
                />
                <div
                  className={`ig-step-orb ${stage === 'otp' ? 'is-active' : stage === 'profile' ? 'is-completed' : ''
                    }`}
                >
                  {stage === 'profile' ? <Check size={14} strokeWidth={2.5} /> : '2'}
                </div>
                <div className={`ig-step-line ${stage === 'profile' ? 'is-to-active' : ''}`} />
                <div className={`ig-step-orb ${stage === 'profile' ? 'is-active' : ''}`}>3</div>
              </div>
            )}

            {stage === 'email' && <SignupPhotoCollage />}

            {/* Error Banner */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  className="ig-auth-banner ig-auth-banner-error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AlertCircle size={15} />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Banner on non-OTP stages */}
            {stage !== 'otp' && (
              <AnimatePresence mode="wait">
                {successMessage ? (
                  <motion.div
                    className="ig-auth-banner ig-auth-banner-success"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{successMessage}</span>
                  </motion.div>
                ) : stage === 'profile' && !errorMessage ? (
                  <div className="ig-auth-banner ig-auth-banner-success">
                    <CheckCircle2 size={15} />
                    <span>Email verified successfully!</span>
                  </div>
                ) : null}
              </AnimatePresence>
            )}

            {/* STEP 1: Email Form */}
            {stage === 'email' && (
              <motion.form
                key="step-email"
                className="ig-auth-flow-form"
                onSubmit={handleEmailSubmit}
                noValidate
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="ig-glass-field ig-auth-glass-field ig-signup-field">
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
                  className="ig-neon-gradient-btn ig-signup-cta-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending Code...' : 'Continue'}
                </button>

                <button
                  type="button"
                  className="ig-auth-text-action-btn"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setLegacyEmail(email);
                    setStage('legacy-recover');
                  }}
                >
                  Already have an unverified account?{' '}
                  <span className="ig-auth-link-blue">Verify here</span>
                </button>

                <div className="ig-divider-row ig-glass-divider" style={{ margin: '2px 0' }}>
                  <div className="ig-divider-line" />
                  <span className="ig-divider-text">OR</span>
                  <div className="ig-divider-line" />
                </div>

                <div className="ig-auth-bottom-pill-row ig-signup-bottom-pill">
                  <span>
                    Have an account?{' '}
                    <Link to="/login" className="ig-auth-link-blue">
                      Log in
                    </Link>
                  </span>
                </div>
              </motion.form>
            )}

            {/* STEP 2: OTP Verification Form */}
            {stage === 'otp' && (
              <motion.form
                key="step-otp"
                className="ig-auth-flow-form"
                onSubmit={handleOtpSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AuthSingleOtpInput
                  name="code"
                  placeholder="Confirmation code"
                  value={otpCode}
                  onChange={handleOtpChange}
                  disabled={isSubmitting}
                  autoFocus
                  testId="otp-input"
                  ariaLabel="6-digit confirmation code"
                />

                <AnimatePresence mode="wait">
                  {successMessage && (
                    <motion.div
                      className="ig-auth-banner ig-auth-banner-success"
                      style={{ marginBottom: 0 }}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <CheckCircle2 size={15} />
                      <span>{successMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="ig-neon-gradient-btn ig-signup-cta-btn"
                  disabled={isSubmitting || otpCode.length !== 6}
                >
                  {isSubmitting ? 'Verifying...' : 'Confirm'}
                </button>

                <button
                  type="button"
                  className="ig-auth-secondary-btn"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isResending || isSubmitting}
                >
                  <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
                  <span>
                    {isResending
                      ? 'Sending...'
                      : cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : 'Resend code'}
                  </span>
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  <button
                    type="button"
                    className="ig-auth-text-action-btn ig-auth-link-blue"
                    onClick={handleChangeEmail}
                    disabled={isSubmitting}
                  >
                    Change email address
                  </button>

                  <button
                    type="button"
                    className="ig-auth-text-action-btn"
                    onClick={() => {
                      setErrorMessage('');
                      setSuccessMessage('');
                      setLegacyEmail(email);
                      setLegacyCode(otpCode);
                      setStage('legacy-recover');
                    }}
                  >
                    Need to verify an earlier registration?
                  </button>
                </div>

                <div className="ig-auth-bottom-pill-row ig-signup-bottom-pill">
                  <span>
                    Have an account?{' '}
                    <Link to="/login" className="ig-auth-link-blue">
                      Log in
                    </Link>
                  </span>
                </div>
              </motion.form>
            )}

            {/* STEP 3: Complete Profile Form */}
            {stage === 'profile' && (
              <motion.form
                key="step-profile"
                className="ig-auth-flow-form"
                onSubmit={handleProfileSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="ig-auth-email-pill-row">
                  <div className="ig-auth-email-pill-left">
                    <Mail size={15} />
                    <span className="ig-auth-email-pill-value">{email}</span>
                  </div>
                  <span className="ig-verified-chip">
                    <Check size={11} strokeWidth={2.5} />
                    <span>Verified</span>
                  </span>
                </div>

                <div className="ig-glass-field ig-auth-glass-field ig-signup-field">
                  <User size={16} className="ig-field-lead-icon" />
                  <div className="ig-field-stack">
                    <input
                      type="text"
                      name="username"
                      className="ig-glass-input"
                      placeholder="Username (e.g. alex_smith)"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      autoComplete="username"
                      required
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  {usernameStatus.checking && (
                    <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--text-secondary, #94a3b8)', flexShrink: 0, marginRight: '8px' }} />
                  )}
                  {!usernameStatus.checking && usernameStatus.available === true && (
                    <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginRight: '8px' }} />
                  )}
                  {!usernameStatus.checking && usernameStatus.available === false && (
                    <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginRight: '8px' }} />
                  )}
                </div>

                {usernameStatus.message && (
                  <div
                    style={{
                      fontSize: '12px',
                      marginTop: '-6px',
                      marginBottom: '10px',
                      paddingLeft: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: usernameStatus.available === true ? '#10b981' : '#f87171',
                    }}
                  >
                    <span>{usernameStatus.message}</span>
                  </div>
                )}

                {!usernameStatus.checking && usernameStatus.available === false && usernameStatus.suggestions.length > 0 && (
                  <div className="ig-username-suggestions-wrap" style={{ marginTop: '-4px', marginBottom: '14px', paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)', marginBottom: '6px' }}>
                      Suggested available usernames:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {usernameStatus.suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          className="ig-username-pill"
                          onClick={() => handleSelectUsernameSuggestion(sug)}
                        >
                          @{sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ig-glass-field ig-auth-glass-field ig-signup-field">
                  <User size={16} className="ig-field-lead-icon" />
                  <div className="ig-field-stack">
                    <input
                      type="text"
                      name="displayName"
                      className="ig-glass-input"
                      placeholder="Full name (optional)"
                      value={profileData.displayName}
                      onChange={handleProfileChange}
                      autoComplete="name"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="ig-glass-field ig-auth-glass-field ig-signup-field">
                  <Lock size={16} className="ig-field-lead-icon" />
                  <div className="ig-field-stack">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="ig-glass-input"
                      placeholder="Password (min 8 characters)"
                      value={profileData.password}
                      onChange={handleProfileChange}
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <button
                    type="button"
                    className="ig-glass-eye-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <AuthPasswordStrength
                  password={profileData.password}
                  strengthScore={strengthScore}
                  strengthLabel={strengthLabels[strengthScore]}
                />

                <div className="ig-glass-field ig-auth-glass-field ig-signup-field">
                  <Lock size={16} className="ig-field-lead-icon" />
                  <div className="ig-field-stack">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="ig-glass-input"
                      placeholder="Confirm password"
                      value={profileData.confirmPassword}
                      onChange={handleProfileChange}
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <button
                    type="button"
                    className="ig-glass-eye-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="ig-neon-gradient-btn ig-signup-cta-btn"
                  disabled={isSubmitting || !profileData.username || !profileData.password || usernameStatus.available === false}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>

                {errorMessage && errorMessage.toLowerCase().includes('expired') && (
                  <button
                    type="button"
                    className="ig-auth-text-action-btn ig-auth-link-blue"
                    onClick={() => {
                      setStage('email');
                      setSignupToken('');
                      setErrorMessage('');
                    }}
                  >
                    Restart Verification
                  </button>
                )}

                <div className="ig-auth-bottom-pill-row ig-signup-bottom-pill">
                  <span>
                    Have an account?{' '}
                    <Link to="/login" className="ig-auth-link-blue">
                      Log in
                    </Link>
                  </span>
                </div>
              </motion.form>
            )}

            {/* RECOVERY: Legacy Unverified Account Verification Form */}
            {stage === 'legacy-recover' && (
              <motion.form
                key="step-legacy"
                className="ig-auth-flow-form"
                onSubmit={handleLegacyOtpSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="ig-glass-field ig-auth-glass-field ig-signup-field">
                  <Mail size={16} className="ig-field-lead-icon" />
                  <div className="ig-field-stack">
                    <input
                      type="email"
                      name="legacyEmail"
                      className="ig-glass-input"
                      placeholder="Account email address"
                      value={legacyEmail}
                      onChange={(e) => {
                        setLegacyEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoComplete="email"
                      required
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                </div>

                <AuthSingleOtpInput
                  name="legacyCode"
                  placeholder="6-digit confirmation code"
                  value={legacyCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setLegacyCode(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  disabled={isSubmitting}
                />

                <button
                  type="submit"
                  className="ig-neon-gradient-btn ig-signup-cta-btn"
                  disabled={isSubmitting || !legacyEmail.trim() || legacyCode.length !== 6}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Log In'}
                </button>

                <button
                  type="button"
                  className="ig-auth-secondary-btn"
                  onClick={handleLegacyResendOtp}
                  disabled={cooldown > 0 || isResending || isSubmitting || !legacyEmail.trim()}
                >
                  <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
                  <span>
                    {isResending
                      ? 'Sending...'
                      : cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : 'Resend code'}
                  </span>
                </button>

                <button
                  type="button"
                  className="ig-auth-text-action-btn"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setStage('email');
                  }}
                >
                  Back to Sign Up
                </button>

                <div className="ig-auth-bottom-pill-row ig-signup-bottom-pill">
                  <span>
                    Have an account?{' '}
                    <Link to="/login" className="ig-auth-link-blue">
                      Log in
                    </Link>
                  </span>
                </div>
              </motion.form>
            )}
          </div>
        </section>
      </main>

      {/* Minimal Bottom Copyright Strip */}
      <footer className="ig-signup-figma-footer">
        <div className="ig-figma-footer-meta">
          <span className="ig-figma-lang-pill">
            English (UK) <ChevronDown size={12} aria-hidden="true" />
          </span>
          <span className="ig-figma-footer-sep" aria-hidden="true">|</span>
          <span>© 2026 Instagram</span>
        </div>
      </footer>
    </div>
  );
};

export default SignupPage;
