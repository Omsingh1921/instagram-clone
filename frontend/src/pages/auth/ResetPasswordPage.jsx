import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/auth.service';
import {
  AuthFlowShell,
  AuthCardBrandHeader,
  AuthLockBadge,
  AuthPasswordStrength,
} from './AuthFlowChrome';
import './LoginPage.css';
import './AuthFlowPages.css';

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const tokenParam = searchParams.get('token');
      if (tokenParam) {
        setToken(tokenParam);
      } else {
        setErrorMessage('No reset token provided in link. Please request a new link.');
      }
    } catch {
      setErrorMessage('Invalid reset link.');
    }
  }, [location]);

  // Calculate password strength score 0..4
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage('Missing password reset token. Please request a new reset link.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFlowShell>
      <AuthCardBrandHeader />

      {isSuccess ? (
        <div className="ig-neon-badge-box is-emerald" aria-hidden="true">
          <CheckCircle2 size={22} strokeWidth={1.9} />
        </div>
      ) : (
        <AuthLockBadge icon={<Lock size={20} strokeWidth={1.8} />} />
      )}

      <h1 className="ig-auth-card-title">Create a Strong Password</h1>
      <p className="ig-auth-card-subtitle">
        Your password must be at least 8 characters and should include a combination of numbers, letters and special characters (!$@%).
      </p>

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

      {!isSuccess ? (
        <form className="ig-auth-flow-form" onSubmit={handleSubmit}>
          <div className="ig-glass-field ig-auth-glass-field">
            <Lock size={16} className="ig-field-lead-icon" />
            <div className="ig-field-stack">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                className="ig-glass-input"
                placeholder="New password (min. 8 characters)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="new-password"
                required
                disabled={isSubmitting || !token}
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
            password={newPassword}
            strengthScore={strengthScore}
            strengthLabel={strengthLabels[strengthScore]}
            prefixLabel="Security"
            hintText="8+ chars with mix of letters & numbers"
          />

          <div className="ig-glass-field ig-auth-glass-field">
            <Lock size={16} className="ig-field-lead-icon" />
            <div className="ig-field-stack">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="ig-glass-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="new-password"
                required
                disabled={isSubmitting || !token}
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
            className="ig-neon-gradient-btn"
            disabled={isSubmitting || !token || !newPassword || !confirmPassword}
          >
            {isSubmitting ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.34)',
            marginBottom: '6px',
            textAlign: 'center',
          }}
        >
          <CheckCircle2 size={34} color="#34d399" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', margin: '0 0 6px' }}>
            Password Reset Successful!
          </h3>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
            Your password has been updated securely. Redirecting you to login...
          </p>
        </motion.div>
      )}

      <div
        style={{
          marginTop: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '12px',
        }}
      >
        <Link
          to="/login"
          className="ig-auth-link-blue"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to login</span>
        </Link>
      </div>
    </AuthFlowShell>
  );
};

export default ResetPasswordPage;
