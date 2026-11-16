import api from './api';

export const authService = {
  requestSignupOtp: async (email) => {
    return await api.post('/auth/signup/request-otp', { email });
  },

  verifySignupOtp: async (email, code) => {
    return await api.post('/auth/signup/verify-otp', { email, code });
  },

  resendSignupOtp: async (email) => {
    return await api.post('/auth/signup/resend-otp', { email });
  },

  verifyLegacyOtp: async (email, code) => {
    return await api.post('/auth/verify-otp', { email, code });
  },

  resendLegacyOtp: async (email) => {
    return await api.post('/auth/resend-otp', { email });
  },

  verifyEmailLink: async (token) => {
    return await api.post('/auth/verify-email', { token });
  },

  confirmEmailChange: async (token) => {
    return await api.post('/auth/confirm-email-change', { token });
  },

  register: async (registerData) => {
    return await api.post('/auth/register', registerData);
  },

  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  requestForgotPasswordOtp: async (email) => {
    return await api.post('/auth/forgot-password/request-otp', { email });
  },

  verifyForgotPasswordOtp: async (email, code) => {
    return await api.post('/auth/forgot-password/verify-otp', { email, code });
  },

  resetPasswordWithTicket: async (resetData) => {
    const res = await api.post('/auth/forgot-password/reset', resetData);
    const data = res?.data || res;
    if (data?.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    }
    return res;
  },

  resetPassword: async (token, newPassword) => {
    return await api.post('/auth/reset-password', { token, newPassword });
  },

  refreshToken: async (refreshToken) => {
    return await api.post('/auth/refresh', { refreshToken });
  },

  logout: async (refreshToken) => {
    try {
      return await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore network errors during logout
      return null;
    }
  },
};

export default authService;
