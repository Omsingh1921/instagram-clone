import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth.service';
import { InstagramColorGlyph } from '../../components/common/InstagramLogo';
import loginHeroCollage from '../../assets/login-hero-collage.webp';
import './LoginPage.css';

export const LoginPage = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usernameOrEmail.trim() || !formData.password) {
      setErrorMessage('Please enter both username/email and password');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await authService.login({
        usernameOrEmail: formData.usernameOrEmail.trim(),
        password: formData.password,
      });

      const authData = response?.data || response;
      login(authData);

      const userRole = authData?.user?.role;
      const isAdminUser =
        userRole === 'ROLE_ADMIN' ||
        userRole === 'ADMIN' ||
        authData?.user?.username?.toLowerCase() === 'admin' ||
        formData.usernameOrEmail.trim().toLowerCase() === 'admin';

      if (isAdminUser) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.message || '';
      const displayMsg =
        msg === 'INVALID_CREDENTIALS'
          ? 'Invalid username or password'
          : msg || 'Sorry, your password was incorrect. Please double-check your password.';
      setErrorMessage(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.usernameOrEmail.trim().length > 0 && formData.password.length >= 6;

  return (
    <div className="ig-login-page-root ig-login-figma">
      <main className="ig-figma-split">
        {/* Left Hero Showcase Panel */}
        <section className="ig-figma-showcase" aria-hidden="true">
          <div className="ig-figma-corner-brand">
            <InstagramColorGlyph size={38} />
          </div>

          <div className="ig-figma-showcase-center">
            <h1 className="ig-figma-headline">
              See everyday
              <br />
              moments from your
              <br />
              <span className="ig-figma-headline-accent">close friends.</span>
            </h1>

            <div className="ig-figma-collage-wrap">
              <img
                src={loginHeroCollage}
                alt=""
                className="ig-figma-collage-img"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* Right Elevated Auth Panel */}
        <section className="ig-figma-auth-panel">
          <div className="ig-figma-auth-inner">
            <div className="ig-figma-mobile-brand" aria-hidden="true">
              <InstagramColorGlyph size={44} />
            </div>

            <h2 className="ig-figma-form-title">Log in to Instagram</h2>

            {errorMessage && (
              <div className="ig-auth-error-box ig-figma-error-alert" role="alert">
                <AlertCircle size={16} className="ig-error-icon" />
                <div className="ig-error-text">
                  <span>{errorMessage}</span>
                  {errorMessage.toLowerCase().includes('verify') && (
                    <div style={{ marginTop: '4px' }}>
                      <Link to="/verify" className="ig-inline-link">
                        Verify your account here
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="ig-figma-account-hint">
              If you have multiple accounts linked to your email, please sign in with your username.
            </p>

            <form className="ig-figma-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="usernameOrEmail"
                className="ig-figma-input"
                placeholder="Mobile number, username or email address"
                aria-label="Mobile number, username or email address"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                required
                disabled={isSubmitting}
              />

              <div className="ig-figma-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="ig-figma-input ig-figma-password-input"
                  placeholder="Password"
                  aria-label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="ig-figma-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                className="ig-figma-login-btn"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </button>

              <Link to="/forgot-password" className="ig-figma-forgot-link">
                Forgotten password?
              </Link>
            </form>

            <Link to="/signup" className="ig-figma-create-btn">
              Create new account
            </Link>
          </div>
        </section>
      </main>

      {/* Bottom Footer Strip */}
      <footer className="ig-figma-footer">
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

export default LoginPage;
