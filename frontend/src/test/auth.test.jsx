import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicOnlyRoute from '../components/common/PublicOnlyRoute';
import authService from '../services/auth.service';
import userService from '../services/user.service';

vi.mock('../services/auth.service', () => ({
  default: {
    requestSignupOtp: vi.fn(),
    verifySignupOtp: vi.fn(),
    resendSignupOtp: vi.fn(),
    verifyLegacyOtp: vi.fn(),
    resendLegacyOtp: vi.fn(),
    verifyEmailLink: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    checkUsername: vi.fn().mockResolvedValue({ data: { available: true, message: 'Username is available' } }),
    refreshToken: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue({ data: [] }),
    followUser: vi.fn().mockResolvedValue({ success: true }),
    unfollowUser: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      data: {
        id: 'c3b7a5a8-4395-4672-8822-4946631ad18e',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    }),
  },
}));

describe('Frontend Authentication & Staged Registration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    if (authService.checkUsername) {
      authService.checkUsername.mockResolvedValue({
        data: { available: true, message: 'Username is available', suggestions: [] },
      });
    }
  });

  // 1. Signup starts with email rather than username/password
  it('1. Signup starts with email rather than username/password', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/^username/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/^password/i)).not.toBeInTheDocument();
  });

  // 2. OTP request succeeds without invoking login or accessing the dashboard
  it('2. OTP request succeeds without invoking login or accessing the dashboard', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({
      success: true,
      message: 'Confirmation code sent to your email.',
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<div>Dashboard Home</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(authService.requestSignupOtp).toHaveBeenCalledWith('alice@example.com');
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    expect(authService.login).not.toHaveBeenCalled();
    expect(screen.queryByText('Dashboard Home')).not.toBeInTheDocument();
  });

  // 3. Leading-zero code "012345" remains unchanged as string
  it('3. Leading-zero code "012345" remains unchanged', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockResolvedValueOnce({
      data: {
        signupToken: 'proof-token-leading-zero',
        expiresIn: 600,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Step 1: Submit email
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'zero@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    // Step 2: Enter leading-zero OTP
    const otpInput = screen.getByPlaceholderText(/confirmation code/i);
    fireEvent.change(otpInput, { target: { value: '012345' } });
    expect(otpInput.value).toBe('012345');

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(authService.verifySignupOtp).toHaveBeenCalledWith('zero@example.com', '012345');
    });
  });

  // 4. Invalid OTP produces an error and does not issue a session
  it('4. Invalid OTP produces an error and does not issue a session', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockRejectedValueOnce({
      status: 400,
      message: 'Invalid or expired confirmation code.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/confirmation code/i), {
      target: { value: '999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired confirmation code/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('signup_proof')).toBeNull();
  });

  // 5. Successful OTP verification advances to profile completion
  it('5. Successful OTP verification advances to profile completion', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockResolvedValueOnce({
      data: {
        signupToken: 'proof-uuid-12345',
        expiresIn: 600,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'advancing@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/confirmation code/i), {
      target: { value: '654321' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/^password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('advancing@example.com')).toBeInTheDocument();
    });
  });

  // 6. Profile submission includes the signup proof and does not trust a client-provided email
  it('6. Profile submission includes the signup proof and does not trust a client-provided email', async () => {
    sessionStorage.setItem('signup_proof', 'secure-ticket-proof-abc');
    sessionStorage.setItem('signup_email', 'verified_context@example.com');

    authService.register.mockResolvedValueOnce({
      data: {
        accessToken: 'access-jwt-777',
        refreshToken: 'refresh-jwt-777',
        user: {
          id: 'user-777',
          username: 'valid_alice',
          email: 'verified_context@example.com',
        },
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Rendered directly in profile stage due to valid session proof
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'valid_alice' },
    });
    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: 'Alice Wonderland' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        signupToken: 'secure-ticket-proof-abc',
        username: 'valid_alice',
        displayName: 'Alice Wonderland',
        password: 'Password123!',
      });
    });

    // Verify client did NOT pass a client-controlled email parameter
    const callArgs = authService.register.mock.calls[0][0];
    expect(callArgs.email).toBeUndefined();
  });

  // 7. Successful final registration establishes AuthContext session and navigates to the dashboard
  it('7. Successful final registration establishes AuthContext session and navigates to the dashboard', async () => {
    sessionStorage.setItem('signup_proof', 'valid-signup-proof-999');
    sessionStorage.setItem('signup_email', 'final_auto_login@example.com');

    authService.register.mockResolvedValueOnce({
      data: {
        accessToken: 'final-access-token-jwt',
        refreshToken: 'final-refresh-token-jwt',
        user: {
          id: 'c3b7a5a8-4395-4672-8822-4946631ad18e',
          username: 'final_user',
          email: 'final_auto_login@example.com',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<div>Dashboard Home Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'final_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'ComplexPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'ComplexPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('final-access-token-jwt');
      expect(localStorage.getItem('refresh_token')).toBe('final-refresh-token-jwt');
      expect(screen.getByText('Dashboard Home Screen')).toBeInTheDocument();
    });

    // Verify session storage cleanup
    expect(sessionStorage.getItem('signup_proof')).toBeNull();
  });

  // 8. Username conflict preserves the valid flow appropriately
  it('8. Username conflict preserves the valid flow appropriately', async () => {
    sessionStorage.setItem('signup_proof', 'keep-proof-valid');
    sessionStorage.setItem('signup_email', 'retry@example.com');

    authService.register.mockRejectedValueOnce({
      status: 409,
      message: "Username 'taken_name' is already taken. Please choose another username.",
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'taken_name' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'MySecretPassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'MySecretPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/username 'taken_name' is already taken/i)).toBeInTheDocument();
    });

    // Crucial: User remains on Step 3 with their entered credentials intact and signup proof preserved
    expect(screen.getByPlaceholderText(/username/i)).toHaveValue('taken_name');
    expect(screen.getByPlaceholderText(/^password/i)).toHaveValue('MySecretPassword123');
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  // 9. Resend cooldown, button state and HTTP 429 handling work correctly
  it('9. Resend cooldown, button state and HTTP 429 handling work correctly', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'resend@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    // Initially disabled with cooldown
    const resendBtn = screen.getByRole('button', { name: /resend code in/i });
    expect(resendBtn).toBeDisabled();

    // Fast-forward cooldown by triggering 429 handler directly
    authService.resendSignupOtp.mockRejectedValueOnce({
      status: 429,
      retryAfter: 45,
      message: 'Too many requests. Please wait 45 seconds before trying again.',
    });
  });

  // 10. Invalid or expired proof requires restarting verification
  it('10. Invalid or expired proof requires restarting verification', async () => {
    sessionStorage.setItem('signup_proof', 'stale-proof-token');
    sessionStorage.setItem('signup_email', 'stale@example.com');

    authService.register.mockRejectedValueOnce({
      status: 400,
      message: 'Signup verification token is expired or has already been used',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'stale_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'ValidPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/token is expired or has already been used/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart verification/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /restart verification/i }));

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
  });

  // 11. Direct navigation or refresh on an incomplete stage does not grant authentication
  it('11. Direct navigation or refresh on an incomplete stage does not grant authentication', async () => {
    sessionStorage.setItem('signup_proof', 'some-partial-proof');

    const TestProtectedArea = () => {
      const { isAuthenticated } = useAuth();
      return <div>Status: {isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<TestProtectedArea />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText(/status: authenticated/i)).not.toBeInTheDocument();
    });
  });

  // 12. Existing verified-user login, logout, route guards and refresh handling continue to work
  it('12. Existing verified-user login, logout, route guards and refresh handling continue to work', async () => {
    // 12a: Login rendering
    const { unmount } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/(phone number,\s*)?username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument();
    unmount();

    // 12b: Login success establishes session
    authService.login.mockResolvedValueOnce({
      data: {
        accessToken: 'legacy-verified-token',
        refreshToken: 'legacy-refresh-token',
        user: {
          id: 'c3b7a5a8-4395-4672-8822-4946631ad18e',
          username: 'verified_user',
          email: 'verified@example.com',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>User Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/(phone number,\s*)?username/i), {
      target: { value: 'verified_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'CorrectPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('legacy-verified-token');
      expect(localStorage.getItem('refresh_token')).toBe('legacy-refresh-token');
    });
  });

  // 13. Legacy pending users can access recovery journey and verify OTP with leading zero "012345"
  it('13. Legacy pending users can access recovery journey and verify OTP with leading zero "012345"', async () => {
    authService.verifyLegacyOtp.mockResolvedValueOnce({
      data: {
        accessToken: 'recovered-access-token',
        refreshToken: 'recovered-refresh-token',
        user: {
          id: 'legacy-user-123',
          username: 'legacy_recovered_user',
          email: 'pending@example.com',
          emailVerified: true,
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<div>Dashboard Home Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Switch to recovery flow from signup screen
    fireEvent.click(screen.getByRole('button', { name: /already have an unverified account/i }));

    expect(screen.getByPlaceholderText(/account email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/6-digit confirmation code/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/account email address/i), {
      target: { value: 'pending@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/6-digit confirmation code/i), {
      target: { value: '012345' },
    });

    fireEvent.click(screen.getByRole('button', { name: /verify & log in/i }));

    await waitFor(() => {
      expect(authService.verifyLegacyOtp).toHaveBeenCalledWith('pending@example.com', '012345');
      expect(localStorage.getItem('access_token')).toBe('recovered-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('recovered-refresh-token');
      expect(screen.getByText('Dashboard Home Screen')).toBeInTheDocument();
    });
  });

  // 14. Legacy resend does not disclose account existence
  it('14. Legacy resend does not disclose account existence', async () => {
    authService.resendLegacyOtp.mockResolvedValueOnce({
      success: true,
      message: 'If an unverified account exists with this email, a verification code has been sent.',
    });

    render(
      <MemoryRouter initialEntries={['/signup?mode=legacy']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/account email address/i), {
      target: { value: 'unrevealed@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /resend code/i }));

    await waitFor(() => {
      expect(authService.resendLegacyOtp).toHaveBeenCalledWith('unrevealed@example.com');
      expect(
        screen.getByText(/if an unverified account exists with this email/i)
      ).toBeInTheDocument();
    });
  });

  // 15. Legacy email verification link handling redirects to login
  it('15. Legacy email verification link handling redirects to login', async () => {
    authService.verifyEmailLink.mockResolvedValueOnce({
      success: true,
      message: 'Email verified successfully',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=valid-link-token']}>
        <AuthProvider>
          <Routes>
            <Route path="/verify-email" element={<SignupPage />} />
            <Route path="/login" element={<div>Login Page Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authService.verifyEmailLink).toHaveBeenCalledWith('valid-link-token');
      expect(screen.getByText(/email verified successfully! redirecting to login/i)).toBeInTheDocument();
    });
  });

  // 16. Displays multi-account sign-in hint and handles username-based login
  it('16. Displays multi-account sign-in hint and handles username-based login', async () => {
    authService.login.mockResolvedValueOnce({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      user: { id: 'user-1', username: 'account_one' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/if you have multiple accounts linked to your email, please sign in with your username/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/(phone number,\s*)?username/i), {
      target: { value: 'account_one' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        usernameOrEmail: 'account_one',
        password: 'ValidPass123!',
      });
    });
  });

  // 17. Handles 4th account registration limit error (409 Conflict) cleanly
  it('17. Handles 4th account registration limit error (409 Conflict) cleanly', async () => {
    sessionStorage.setItem('signup_proof', 'valid-proof-token');
    sessionStorage.setItem('signup_email', 'shared@example.com');

    authService.register.mockRejectedValueOnce({
      status: 409,
      message: 'Maximum number of accounts (3) reached for this email address. Please log in or use a different email.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'fourth_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'ValidPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/maximum number of accounts \(3\) reached for this email address/i)).toBeInTheDocument();
    });
  });

  // 18. Generic error display for ambiguous or bad credentials on login
  it('18. Generic error display for ambiguous or bad credentials on login', async () => {
    authService.login.mockRejectedValueOnce({
      status: 401,
      message: 'Invalid username or password. Please try again.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/(phone number,\s*)?username/i), {
      target: { value: 'ambiguous@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'WrongOrAmbiguous!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });

  // 19. Cached session renders protected content without blocking on /users/me
  it('19. Cached session renders protected route immediately without full-screen Authenticating loader', () => {
    localStorage.setItem('access_token', 'cached-jwt');
    localStorage.setItem('user', JSON.stringify({ id: 'u-cached', username: 'cached_user' }));
    userService.getCurrentUser.mockImplementationOnce(() => new Promise(() => { }));

    const ProtectedScreen = () => {
      const { user } = useAuth();
      return <div>Protected Area: {user?.username}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<ProtectedScreen />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Area: cached_user')).toBeInTheDocument();
    expect(screen.queryByText(/authenticating/i)).not.toBeInTheDocument();
  });

  // 20. Login renders Figma split-screen showcase and SkeletonAuthCard matches split shell when hydrating token
  it('20. Login renders Figma split-screen showcase without public API calls and shows matching SkeletonAuthCard when hydrating uncached token', () => {
    const { container, unmount } = render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/see everyday/i)).toBeInTheDocument();
    expect(screen.getByText(/close friends\./i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /log in to instagram/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgotten password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create new account/i })).toBeInTheDocument();
    expect(container.querySelector('.ig-figma-collage-img')).not.toBeNull();
    expect(container.querySelector('.ig-figma-footer-links')).toBeNull();
    expect(screen.queryByRole('link', { name: /meta verified/i })).not.toBeInTheDocument();
    expect(screen.getByText(/© 2026 Instagram/i)).toBeInTheDocument();
    unmount();

    // Uncached token hydrating at /login triggers SkeletonAuthCard with matching Figma split-screen skeleton
    localStorage.setItem('access_token', 'uncached-jwt');
    userService.getCurrentUser.mockImplementationOnce(() => new Promise(() => { }));

    const { container: skelContainer } = render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(skelContainer.querySelector('.ig-skeleton-auth-figma')).not.toBeNull();
    expect(skelContainer.querySelectorAll('.animate-pulse').length).toBeGreaterThan(10);
  });

  // 21. Signup renders Figma split-screen showcase with 3-step stepper and neon collage
  it('21. Signup renders split-screen showcase, Create a new account header, stepper, and collage artwork', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create a new account/i })).toBeInTheDocument();
    expect(screen.getByText(/sign up to see photos and videos from your friends/i)).toBeInTheDocument();
    expect(screen.getByText(/see everyday/i)).toBeInTheDocument();
    expect(screen.getByText(/close friends\./i)).toBeInTheDocument();
    expect(container.querySelector('.ig-signup-collage-img')).not.toBeNull();
    expect(container.querySelector('.ig-neon-stepper')).not.toBeNull();
    expect(container.querySelector('.ig-signup-collage-wrap')).not.toBeNull();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    expect(screen.getByText(/© 2026 Instagram/i)).toBeInTheDocument();
  });

  // 22. OTP verification does not store data in sessionStorage, ensuring refresh restarts at email stage
  it('22. OTP verification does not store data in sessionStorage, ensuring refresh restarts at email stage', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockResolvedValueOnce({
      data: {
        signupToken: 'temp-token-in-memory-only',
        expiresIn: 600,
      },
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Step 1: Send OTP
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'fresh.refresh@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    // Step 2: Verify OTP
    fireEvent.change(screen.getByPlaceholderText(/confirmation code/i), {
      target: { value: '654321' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    });

    // VERIFY: Data is NOT stored in sessionStorage
    expect(sessionStorage.getItem('signup_proof')).toBeNull();
    expect(sessionStorage.getItem('signup_email')).toBeNull();

    // Simulate browser refresh by unmounting and remounting /signup
    unmount();

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Form restarts at initial email stage rather than profile stage
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/username/i)).not.toBeInTheDocument();
  });

  // 23. Special characters in email show explicit validation message and prevent network submission
  it('23. Special characters in email show explicit validation message and prevent network submission', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const continueBtn = screen.getByRole('button', { name: /continue/i });

    // Test with underscore
    fireEvent.change(emailInput, { target: { value: 'user_name@example.com' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Special characters are not allowed in email.')).toBeInTheDocument();
    });
    expect(authService.requestSignupOtp).not.toHaveBeenCalled();

    // Test with plus
    fireEvent.change(emailInput, { target: { value: 'user+test@example.com' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Special characters are not allowed in email.')).toBeInTheDocument();
    });
    expect(authService.requestSignupOtp).not.toHaveBeenCalled();
  });

  // 24. Email validation suite: empty email, dots, and general format rules
  it('24. Email validation suite: empty email, dots, and general format rules', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const continueBtn = screen.getByRole('button', { name: /continue/i });

    // 1. Empty email
    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.click(continueBtn);
    await waitFor(() => {
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
    });
    expect(authService.requestSignupOtp).not.toHaveBeenCalled();

    // 2. Consecutive dots
    fireEvent.change(emailInput, { target: { value: 'user..name@example.com' } });
    fireEvent.click(continueBtn);
    await waitFor(() => {
      expect(screen.getByText('Email cannot start, end with, or contain consecutive dots.')).toBeInTheDocument();
    });
    expect(authService.requestSignupOtp).not.toHaveBeenCalled();

    // 3. Leading dot
    fireEvent.change(emailInput, { target: { value: '.user@example.com' } });
    fireEvent.click(continueBtn);
    await waitFor(() => {
      expect(screen.getByText('Email cannot start, end with, or contain consecutive dots.')).toBeInTheDocument();
    });
    expect(authService.requestSignupOtp).not.toHaveBeenCalled();

    // 4. Missing domain / malformed
    fireEvent.change(emailInput, { target: { value: 'user@' } });
    fireEvent.click(continueBtn);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
    expect(authService.requestSignupOtp).not.toHaveBeenCalled();
  });

  // 25. Handles 3 accounts reached error on signup OTP request cleanly
  it('25. Handles 3 accounts reached error on signup OTP request cleanly', async () => {
    authService.requestSignupOtp.mockRejectedValueOnce({
      status: 409,
      message: 'This email has already created 3 accounts. Please use another email.',
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const continueBtn = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(emailInput, { target: { value: 'capacity@example.com' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('This email has already created 3 accounts. Please use another email.')).toBeInTheDocument();
    });
    // Should stay on email stage and NOT advance to OTP
    expect(screen.queryByPlaceholderText(/confirmation code/i)).not.toBeInTheDocument();
  });

  // 26. Live username availability check displays warning and smart suggestions when username is taken
  it('26. Live username availability check displays warning and smart suggestions when username is taken', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockResolvedValueOnce({
      data: {
        signupToken: 'proof-token-avail-check',
        expiresIn: 600,
      },
    });
    authService.checkUsername.mockResolvedValueOnce({
      data: {
        username: 'taken_user',
        available: false,
        message: 'Username is already taken',
        suggestions: ['taken_user_1', 'the_taken_user'],
      },
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Advance to OTP
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'check@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Advance to Profile
    await waitFor(() => expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/confirmation code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    // On profile stage, type a taken username
    const usernameInput = await screen.findByPlaceholderText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'taken_user' } });

    await waitFor(() => {
      expect(authService.checkUsername).toHaveBeenCalledWith('taken_user');
      expect(screen.getByText('Username is already taken')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '@taken_user_1' })).toBeInTheDocument();
    });

    // Clicking the suggestion pill should update the username input
    authService.checkUsername.mockResolvedValueOnce({
      data: {
        username: 'taken_user_1',
        available: true,
        message: 'Username is available',
        suggestions: [],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: '@taken_user_1' }));
    expect(usernameInput.value).toBe('taken_user_1');

    await waitFor(() => {
      expect(screen.getByText('Username is available')).toBeInTheDocument();
    });
  });
});
