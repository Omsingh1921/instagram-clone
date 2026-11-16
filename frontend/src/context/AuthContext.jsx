import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import followService from '../services/follow.service';
import useFeedStore from '../store/useFeedStore';
import useNotificationStore from '../store/useNotificationStore';

export const AuthContext = createContext(null);

const normalizeUserData = (userData, tokenString) => {
  if (!userData) return null;
  const normalized = { ...userData };
  if (normalized.userId && !normalized.id) {
    normalized.id = normalized.userId;
  }
  if (normalized.id && !normalized.userId) {
    normalized.userId = normalized.id;
  }
  const avatar = normalized.avatarUrl || normalized.profilePictureUrl;
  if (avatar) {
    normalized.avatarUrl = avatar;
    normalized.profilePictureUrl = avatar;
  }
  const rawToken = tokenString || (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
  if (rawToken && rawToken.includes('.')) {
    try {
      const payload = JSON.parse(atob(rawToken.split('.')[1]));
      if (!normalized.role && payload.role) {
        normalized.role = payload.role;
      }
      if (!normalized.email && payload.email) {
        normalized.email = payload.email;
      }
    } catch {
      // ignore token decode
    }
  }
  if (!normalized.role && normalized.username?.toLowerCase() === 'admin') {
    normalized.role = 'ROLE_ADMIN';
  }
  return normalized;
};

const persistCachedUser = (userData) => {
  try {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  } catch {
    // ignore storage errors
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? normalizeUserData(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem('access_token') && !localStorage.getItem('user'));
    } catch {
      return true;
    }
  });
  const [followingSet, setFollowingSet] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('following_ids') || '[]');
      return new Set(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
      return new Set();
    }
  });

  const [savedAccounts, setSavedAccounts] = useState([]);

  // Immediately purge any saved_accounts from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('saved_accounts');
    } catch {
      // ignore
    }
  }, []);

  const persistAccount = useCallback(() => {
    try {
      localStorage.removeItem('saved_accounts');
    } catch {
      // ignore
    }
  }, []);

  const loadFollowing = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await followService.getFollowing(userId, 0, 25);
      const followingList = res?.data?.content || res?.content || res?.data || [];
      const idList = followingList
        .map((item) => String(item.id || item.userId || ''))
        .filter(Boolean);

      setFollowingSet(new Set(idList));
      localStorage.setItem('following_ids', JSON.stringify(idList));
    } catch {
      // Ignore
    }
  }, []);

  const isFollowing = useCallback(
    (targetUserId) => {
      if (!targetUserId) return false;
      return followingSet.has(String(targetUserId));
    },
    [followingSet]
  );

  const setFollowStatus = useCallback((targetUserId, isFollowed) => {
    if (!targetUserId) return;
    const key = String(targetUserId);
    setFollowingSet((prev) => {
      const alreadyHas = prev.has(key);
      if (Boolean(isFollowed) === alreadyHas) {
        return prev;
      }
      const next = new Set(prev);
      if (isFollowed) {
        next.add(key);
      } else {
        next.delete(key);
      }
      try {
        localStorage.setItem('following_ids', JSON.stringify([...next]));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const toggleFollow = useCallback(
    async (targetUserId) => {
      if (!targetUserId) return false;
      const key = String(targetUserId);
      const currentlyFollowing = followingSet.has(key);
      const newStatus = !currentlyFollowing;

      setFollowStatus(key, newStatus);

      try {
        if (newStatus) {
          await followService.followUser(key);
        } else {
          await followService.unfollowUser(key);
        }
        return true;
      } catch {
        setFollowStatus(key, currentlyFollowing);
        return false;
      }
    },
    [followingSet, setFollowStatus]
  );

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await userService.getCurrentUser();
      const rawUser = response?.data || response;
      const userData = normalizeUserData(rawUser);
      setUser(userData);
      persistCachedUser(userData);
      if (userData?.id) {
        loadFollowing(userData.id);
        persistAccount(userData, localStorage.getItem('access_token'), localStorage.getItem('refresh_token'));
      }
      return userData;
    } catch (err) {
      if (err?.status === 401 || err?.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        persistCachedUser(null);
        localStorage.removeItem('following_ids');
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadFollowing, persistAccount]);

  useEffect(() => {
    const resetStores = () => {
      useFeedStore.getState().reset();
      useNotificationStore.getState().reset();
    };

    const handleForcedLogout = () => {
      const currentUserId = user?.id || user?.userId;
      setUser(null);
      setToken(null);
      setFollowingSet(new Set());
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      persistCachedUser(null);
      localStorage.removeItem('following_ids');
      localStorage.removeItem('instagram_muted_conversations');
      localStorage.removeItem('ig_fcm_token');
      localStorage.removeItem('ig_push_enabled');

      setSavedAccounts([]);
      try {
        localStorage.removeItem('saved_accounts');
      } catch {
        // ignore
      }

      resetStores();
      setIsLoading(false);
    };

    window.addEventListener('auth:logout', handleForcedLogout);

    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('auth:logout', handleForcedLogout);
    };
  }, [fetchCurrentUser]);

  const login = (authData) => {
    const accessToken = authData.accessToken;
    const refreshToken = authData.refreshToken;
    const userData = normalizeUserData(authData.user, accessToken);

    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    setToken(accessToken);
    setUser(userData);
    persistCachedUser(userData);
    setIsLoading(false);
    if (userData?.id) {
      loadFollowing(userData.id);
      persistAccount(userData, accessToken, refreshToken);
    }
  };

  const switchAccount = useCallback(async (targetUserId) => {
    const target = savedAccounts.find((acc) => String(acc.id) === String(targetUserId));
    if (!target || !target.accessToken) return false;

    localStorage.setItem('access_token', target.accessToken);
    if (target.refreshToken) {
      localStorage.setItem('refresh_token', target.refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }

    const switchedUser = {
      id: target.id,
      userId: target.id,
      username: target.username,
      displayName: target.displayName,
      avatarUrl: target.avatarUrl,
      profilePictureUrl: target.avatarUrl,
    };
    setToken(target.accessToken);
    setUser(switchedUser);
    persistCachedUser(switchedUser);

    useFeedStore.getState().reset();
    useNotificationStore.getState().reset();

    try {
      await fetchCurrentUser();
      return true;
    } catch {
      return false;
    }
  }, [savedAccounts, fetchCurrentUser]);

  const removeSavedAccount = useCallback((targetUserId) => {
    setSavedAccounts((prev) => prev.filter((acc) => String(acc.id) !== String(targetUserId)));
    try {
      localStorage.removeItem('saved_accounts');
    } catch {
      // ignore
    }
  }, []);

  const logout = async () => {
    const currentUserId = user?.id || user?.userId;
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Silently proceed with client cleanup
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      persistCachedUser(null);
      localStorage.removeItem('following_ids');
      localStorage.removeItem('instagram_muted_conversations');
      localStorage.removeItem('ig_fcm_token');
      localStorage.removeItem('ig_push_enabled');

      // Purge this user from saved_accounts so credentials don't linger
      setSavedAccounts([]);
      try {
        localStorage.removeItem('saved_accounts');
      } catch {
        // ignore
      }

      setUser(null);
      setToken(null);
      setFollowingSet(new Set());
      // Reset Zustand stores on explicit logout
      useFeedStore.getState().reset();
      useNotificationStore.getState().reset();
    }
  };

  const updateUser = (updatedProfile) => {
    setUser((prev) => {
      const next = prev ? normalizeUserData({ ...prev, ...updatedProfile }) : normalizeUserData(updatedProfile);
      persistCachedUser(next);
      if (next?.id) {
        persistAccount(next, localStorage.getItem('access_token'), localStorage.getItem('refresh_token'));
      }
      return next;
    });
  };

  const isAdmin = Boolean(
    user?.role === 'ROLE_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.username?.toLowerCase() === 'admin' ||
    user?.authorities?.some(
      (a) => a.authority === 'ROLE_ADMIN' || a === 'ROLE_ADMIN'
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        isAdmin,
        isFollowing,
        setFollowStatus,
        toggleFollow,
        login,
        logout,
        updateUser,
        reloadUser: fetchCurrentUser,
        savedAccounts,
        switchAccount,
        removeSavedAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
