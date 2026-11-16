import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import {
  User, Lock, Bell, Shield, UserX, Check, Laptop, Smartphone, Globe, LogOut,
  AlertTriangle, Camera, Mail, Trash2, Power, EyeOff, Briefcase, Sparkles,
  MessageSquareOff, Search, Share2, Tag, AtSign, Eye, ShieldAlert, ShieldCheck, Users,
  HeartOff, Download, ChevronLeft, ChevronRight, ChevronDown, ExternalLink
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { SkeletonSettingsForm, SkeletonUserRows } from '../../components/ui/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { CloseFriendsPanel } from '../../components/modals/CloseFriendsModal';
import UnblockUserModal from '../../components/modals/UnblockUserModal';
import settingsService from '../../services/settings.service';
import userService from '../../services/user.service';
import mediaService from '../../services/media.service';
import sessionService from '../../services/session.service';
import dynamicConfigService from '../../services/dynamicConfig.service';
import { requestPushPermissionAndRegister, unregisterPush, isPushSupported, getNotificationPermission } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SettingsPage.css';

export const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [openGroups, setOpenGroups] = useState(
    () => new Set(['Admin Settings', 'Your account', 'How you use Instagram'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [appsSubTab, setAppsSubTab] = useState('active');
  const [mutedUsers, setMutedUsers] = useState([]);
  const [loadingMuted, setLoadingMuted] = useState(false);
  const [unblockTarget, setUnblockTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('ig_push_enabled') === 'true' && getNotificationPermission() === 'granted';
  });
  const [togglingPush, setTogglingPush] = useState(false);
  const avatarInputRef = useRef(null);

  // Profile data
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    websiteUrl: '',
    accountType: 'PERSONAL',
    category: '',
    pronouns: '',
    gender: 'PREFER_NOT_TO_SAY',
    showCategoryBadge: true,
    contactEmail: '',
    contactPhone: '',
    showContactInfo: false,
    previousUsername: '',
  });

  // Password data
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Settings data
  const [settingsForm, setSettingsForm] = useState({
    privateAccount: false,
    notifyLikes: true,
    notifyComments: true,
    notifyFollows: true,
    notifyMessages: true,
    filteredKeywords: '',
    hideOffensiveComments: true,
    allowStorySharing: true,
    allowStoryResharing: true,
    hideLikeAndShareCounts: false,
    allowTagsFrom: 'EVERYONE',
    allowMentionsFrom: 'EVERYONE',
    saveStoriesToArchive: true,
  });

  // Account & Danger Zone state
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailChangeSent, setEmailChangeSent] = useState('');
  const [currentAccountEmail, setCurrentAccountEmail] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Sessions data
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [showRevokeOtherModal, setShowRevokeOtherModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [usernameCooldownDays, setUsernameCooldownDays] = useState(14);
  const [accountDeletionGraceDays, setAccountDeletionGraceDays] = useState(15);

  const { user: currentUser, updateUser, logout, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const isUserAdmin =
    isAdmin ||
    currentUser?.role === 'ROLE_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.username?.toLowerCase() === 'admin';

  useEffect(() => {
    const loadSettingsAndProfile = async () => {
      try {
        setLoading(true);
        const [profRes, settRes] = await Promise.all([
          userService.getCurrentUser(),
          settingsService.getSettings(),
        ]);

        const prof = profRes?.data || profRes;
        if (prof?.email) {
          setCurrentAccountEmail(prof.email);
        }
        const sett = settRes?.data || settRes;

        setProfileForm({
          username: prof.username || currentUser?.username || '',
          displayName: prof.displayName || prof.fullName || '',
          bio: prof.bio || '',
          websiteUrl: prof.websiteUrl || '',
          accountType: prof.accountType || 'PERSONAL',
          category: prof.category || '',
          pronouns: prof.pronouns || '',
          gender: prof.gender || 'PREFER_NOT_TO_SAY',
          showCategoryBadge: prof.showCategoryBadge !== false,
          contactEmail: prof.contactEmail || '',
          contactPhone: prof.contactPhone || '',
          showContactInfo: Boolean(prof.showContactInfo),
          previousUsername: prof.previousUsername || '',
        });

        if (sett) {
          setSettingsForm({
            privateAccount: Boolean(sett.privacy?.privateAccount ?? sett.privateAccount ?? false),
            notifyLikes: sett.notifications?.likes ?? sett.likes ?? sett.notifyLikes ?? true,
            notifyComments: sett.notifications?.comments ?? sett.comments ?? sett.notifyComments ?? true,
            notifyFollows: sett.notifications?.followers ?? sett.followers ?? sett.notifyFollows ?? true,
            notifyMessages: sett.notifications?.messages ?? sett.messages ?? sett.notifyMessages ?? true,
            filteredKeywords: sett.filteredKeywords || '',
            hideOffensiveComments: sett.hideOffensiveComments ?? true,
            allowStorySharing: sett.allowStorySharing ?? true,
            allowStoryResharing: sett.allowStoryResharing ?? true,
            hideLikeAndShareCounts: sett.hideLikeAndShareCounts ?? false,
            allowTagsFrom: sett.allowTagsFrom || 'EVERYONE',
            allowMentionsFrom: sett.allowMentionsFrom || 'EVERYONE',
            saveStoriesToArchive: sett.saveStoriesToArchive ?? true,
          });
        }
      } catch {
        // Fallback to local profile values
        if (currentUser) {
          setProfileForm({
            username: currentUser.username || '',
            displayName: currentUser.displayName || currentUser.fullName || '',
            bio: currentUser.bio || '',
            websiteUrl: currentUser.websiteUrl || '',
            accountType: currentUser.accountType || 'PERSONAL',
            category: currentUser.category || '',
            pronouns: currentUser.pronouns || '',
            gender: currentUser.gender || 'PREFER_NOT_TO_SAY',
            showCategoryBadge: currentUser.showCategoryBadge !== false,
            contactEmail: currentUser.contactEmail || '',
            contactPhone: currentUser.contactPhone || '',
            showContactInfo: Boolean(currentUser.showContactInfo),
            previousUsername: currentUser.previousUsername || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettingsAndProfile();
  }, [currentUser]);

  useEffect(() => {
    dynamicConfigService.getPublicConfigMap().then((cfg) => {
      const cooldown = parseInt(cfg['user.username_cooldown_days'], 10);
      const grace = parseInt(cfg['user.account_deletion_grace_days'], 10);
      if (!Number.isNaN(cooldown) && cooldown >= 0) setUsernameCooldownDays(cooldown);
      if (!Number.isNaN(grace) && grace >= 1) setAccountDeletionGraceDays(grace);
    });
  }, []);

  // Load Blocked accounts when tab is active
  useEffect(() => {
    if (activeTab === 'blocked') {
      const loadBlocks = async () => {
        try {
          const res = await settingsService.getBlockedUsers();
          const list = res?.data?.content || res?.content || res?.data || [];
          setBlockedUsers(list);
        } catch {
          setBlockedUsers([]);
        }
      };
      loadBlocks();
    }
  }, [activeTab]);

  // Sync active tab from query parameters (?tab=...)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const targetTab =
        isUserAdmin && !['profile', 'password', 'sessions'].includes(tab) ? 'profile' : tab;
      setActiveTab(targetTab);

      const TAB_TO_GROUP = {
        password: isUserAdmin ? 'Admin Settings' : 'Your account',
        profile: isUserAdmin ? 'Admin Settings' : 'How you use Instagram',
        notifications: 'How you use Instagram',
        privacy: 'Who can see your content',
        close_friends: 'Who can see your content',
        blocked: 'Who can see your content',
        tags_mentions: 'How others can interact with you',
        sharing: 'How others can interact with you',
        hidden_words: 'How others can interact with you',
        muted: 'What you see',
        like_counts: 'What you see',
        archiving: 'Your app and media',
        apps_and_websites: 'Your app and media',
        sessions: isUserAdmin ? 'Admin Settings' : 'Your app and media',
        supervision: 'Family Centre',
        professional: 'For professionals',
        account: 'Account management',
      };
      const ownerGroup = TAB_TO_GROUP[targetTab];
      if (ownerGroup) {
        setOpenGroups((prev) => {
          if (prev.has(ownerGroup)) return prev;
          const next = new Set(prev);
          next.add(ownerGroup);
          return next;
        });
      }
    }
  }, [searchParams, isUserAdmin]);

  useEffect(() => {
    if (isUserAdmin && !['profile', 'password', 'sessions'].includes(activeTab)) {
      setActiveTab('profile');
    }
  }, [isUserAdmin, activeTab]);

  // Load Muted accounts when muted tab is active
  useEffect(() => {
    if (activeTab === 'muted') {
      const loadMuted = async () => {
        try {
          setLoadingMuted(true);
          const res = await settingsService.getMutedUsers();
          const list = res?.data?.content || res?.content || res?.data || [];
          setMutedUsers(Array.isArray(list) ? list : []);
        } catch {
          setMutedUsers([]);
        } finally {
          setLoadingMuted(false);
        }
      };
      loadMuted();
    }
  }, [activeTab]);

  const handleUnmuteUser = async (targetId) => {
    try {
      await settingsService.unmuteUser(targetId);
      setMutedUsers((prev) => prev.filter((u) => (u.userId || u.id) !== targetId));
      showSuccess('User unmuted');
    } catch (err) {
      showError(err.message || 'Failed to unmute user');
    }
  };

  // Load active sessions when tab is active
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const res = await sessionService.getActiveSessions();
      const list = res?.data || res || [];
      setSessions(Array.isArray(list) ? list : []);
    } catch (err) {
      const msg = err.message || 'Failed to load active sessions';
      setSessionsError(msg);
      showError(msg);
    } finally {
      setSessionsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab, loadSessions]);

  const handleRevokeSession = async (sessionId, isCurrent) => {
    if (!sessionId || sessionId === 'undefined') {
      showError('Unable to identify session to revoke');
      return;
    }
    try {
      setRevokingId(sessionId);
      await sessionService.revokeSession(sessionId);
      showSuccess(isCurrent ? 'Logged out of current session' : 'Session logged out successfully');
      if (isCurrent) {
        logout();
      } else {
        await loadSessions();
      }
    } catch (err) {
      showError(err.message || 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      setSaving(true);
      const res = await sessionService.revokeOtherSessions();
      const count = res?.data?.revokedCount ?? res?.revokedCount ?? 0;
      showSuccess(`Logged out of ${count} other session${count === 1 ? '' : 's'}`);
      setShowRevokeOtherModal(false);
      loadSessions();
    } catch (err) {
      showError(err.message || 'Failed to revoke other sessions');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setSaving(true);
      await sessionService.logoutAll();
      showSuccess('All sessions terminated');
      setShowLogoutAllModal(false);
      logout();
    } catch (err) {
      showError(err.message || 'Failed to terminate all sessions');
    } finally {
      setSaving(false);
    }
  };

  const getDeviceIcon = (deviceName) => {
    if (!deviceName) return Globe;
    const lower = deviceName.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('ios') || lower.includes('mobile')) {
      return Smartphone;
    }
    return Laptop;
  };

  const formatSessionTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Avatar upload
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file');
      return;
    }

    try {
      setUploadingAvatar(true);
      const uploadRes = await mediaService.uploadMedia(file, 'avatar');
      const mediaUrl = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.url || uploadRes?.data?.url;
      if (!mediaUrl) throw new Error('No media URL returned from server');

      await userService.updateAvatar(mediaUrl);
      updateUser({
        ...currentUser,
        avatarUrl: mediaUrl,
        profilePictureUrl: mediaUrl,
      });
      showSuccess('Profile photo updated!');
    } catch (err) {
      showError(err.message || 'Failed to update photo');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Remove avatar
  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await userService.deleteAvatar();
      updateUser({
        ...currentUser,
        avatarUrl: null,
        profilePictureUrl: null,
      });
      showSuccess('Profile photo removed!');
    } catch (err) {
      showError(err.message || 'Failed to remove photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        displayName: profileForm.displayName.trim(),
        bio: profileForm.bio.trim(),
        websiteUrl: profileForm.websiteUrl.trim(),
        pronouns: profileForm.pronouns?.trim() || null,
        gender: profileForm.gender || null,
        showCategoryBadge: profileForm.showCategoryBadge,
        contactEmail: profileForm.contactEmail?.trim() || null,
        contactPhone: profileForm.contactPhone?.trim() || null,
        showContactInfo: profileForm.showContactInfo,
      };
      if (profileForm.username && profileForm.username.trim() !== currentUser?.username) {
        payload.username = profileForm.username.trim().toLowerCase();
      }
      const res = await userService.updateProfile(payload);
      const updated = res?.data || res;
      updateUser({ ...currentUser, ...updated });
      showSuccess('Profile updated successfully');
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      await settingsService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      showSuccess('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Update privacy & notifications
  const handleSaveSettings = async (updatedSettings) => {
    setSettingsForm(updatedSettings);
    try {
      await settingsService.updateSettings(updatedSettings);
      showSuccess('Settings updated');
    } catch (err) {
      showError(err.message || 'Failed to save settings');
    }
  };

  // Toggle browser push notifications (FCM)
  const handleTogglePushNotifications = async (checked) => {
    try {
      setTogglingPush(true);
      if (checked) {
        await requestPushPermissionAndRegister();
        setPushEnabled(true);
        showSuccess('Push notifications enabled! Alerts will appear even when the app is in the background.');
      } else {
        await unregisterPush();
        setPushEnabled(false);
        showSuccess('Push notifications disabled.');
      }
    } catch (err) {
      showError(err.message || 'Failed to update push notification settings');
      setPushEnabled(false);
    } finally {
      setTogglingPush(false);
    }
  };

  // Save hidden words & comment filters
  const handleSaveHiddenWords = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.updateSettings({
        filteredKeywords: settingsForm.filteredKeywords?.trim() || null,
        hideOffensiveComments: Boolean(settingsForm.hideOffensiveComments),
      });
      showSuccess('Hidden words preferences saved');
    } catch (err) {
      showError(err.message || 'Failed to save hidden words');
    } finally {
      setSaving(false);
    }
  };

  // Switch Account Type (Personal / Creator / Business)
  const handleSaveAccountType = async (newType, newCategory) => {
    try {
      setSaving(true);
      const res = await userService.updateProfile({
        accountType: newType,
        category: newCategory?.trim() || null,
        showCategoryBadge: profileForm.showCategoryBadge,
        contactEmail: profileForm.contactEmail?.trim() || null,
        contactPhone: profileForm.contactPhone?.trim() || null,
        showContactInfo: profileForm.showContactInfo,
      });
      const updated = res?.data || res;
      setProfileForm((prev) => ({
        ...prev,
        accountType: updated.accountType || newType,
        category: updated.category !== undefined ? updated.category : newCategory,
      }));
      updateUser({ ...currentUser, ...updated });
      showSuccess(`Account switched to ${newType === 'CREATOR' ? 'Creator' : newType === 'BUSINESS' ? 'Business' : 'Personal'}`);
    } catch (err) {
      showError(err.message || 'Failed to update account type');
    } finally {
      setSaving(false);
    }
  };

  // Unblock user
  const handleUnblock = async (blockedUserId) => {
    try {
      await settingsService.unblockUser(blockedUserId);
      setBlockedUsers((prev) =>
        prev.filter((item) => {
          const u = item.blockedUser || item;
          return u.userId !== blockedUserId && u.id !== blockedUserId;
        })
      );
      showSuccess('User unblocked');
    } catch (err) {
      showError(err.message || 'Failed to unblock user');
    }
  };

  // Initiate email change
  const handleInitiateEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }
    try {
      setChangingEmail(true);
      if (emailCurrentPassword) {
        await settingsService.initiateEmailChange(newEmailInput.trim().toLowerCase(), emailCurrentPassword);
      } else {
        await settingsService.initiateEmailChange(newEmailInput.trim().toLowerCase());
      }
      setEmailChangeSent(newEmailInput.trim().toLowerCase());
      showSuccess('Verification link sent to ' + newEmailInput);
      setNewEmailInput('');
      setEmailCurrentPassword('');
    } catch (err) {
      showError(err.message || 'Failed to initiate email change');
    } finally {
      setChangingEmail(false);
    }
  };

  // Cancel pending email change
  const handleCancelPendingEmail = async () => {
    try {
      await settingsService.cancelPendingEmailChange();
      setEmailChangeSent('');
      showSuccess('Pending email change cancelled');
    } catch (err) {
      showError(err.message || 'Failed to cancel email change');
    }
  };

  // Deactivate account
  const handleDeactivateAccount = async () => {
    if (isUserAdmin) {
      showError('Admin accounts cannot be deactivated');
      return;
    }
    try {
      setSaving(true);
      await userService.deactivateCurrentUser();
      showSuccess('Account deactivated. You can reactivate anytime by logging in.');
      setShowDeactivateModal(false);
      logout();
    } catch (err) {
      showError(err.message || 'Failed to deactivate account');
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (isUserAdmin) {
      showError('Admin accounts cannot be deleted');
      return;
    }
    try {
      setSaving(true);
      await userService.deleteCurrentUser();
      showSuccess(`Account deleted with a ${accountDeletionGraceDays}-day recovery window.`);
      setShowDeleteModal(false);
      logout();
    } catch (err) {
      showError(err.message || 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  const navCategories = isUserAdmin
    ? [
        {
          group: 'Admin Settings',
          items: [
            { id: 'profile', label: 'Edit Profile', icon: User },
            { id: 'password', label: 'Change Password', icon: Lock },
            { id: 'sessions', label: 'Login activity (Sessions)', icon: Laptop },
          ],
        },
      ]
    : [
    {
      group: 'Your account',
      items: [
        { id: 'password', label: 'Meta Account (Password & Security)', icon: Lock },
      ],
    },
    {
      group: 'How you use Instagram',
      items: [
        { id: 'profile', label: 'Edit Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ],
    },
    {
      group: 'Who can see your content',
      items: [
        { id: 'privacy', label: 'Account privacy', icon: Shield },
        { id: 'close_friends', label: 'Close Friends', icon: Users },
        { id: 'blocked', label: 'Blocked', icon: UserX },
      ],
    },
    {
      group: 'How others can interact with you',
      items: [
        { id: 'tags_mentions', label: 'Tags and mentions', icon: Tag },
        { id: 'sharing', label: 'Sharing and reuse', icon: Share2 },
        { id: 'hidden_words', label: 'Comments & Hidden words', icon: EyeOff },
      ],
    },
    {
      group: 'What you see',
      items: [
        { id: 'muted', label: 'Muted', icon: Bell },
        { id: 'like_counts', label: 'Like and share counts', icon: HeartOff },
      ],
    },
    {
      group: 'Your app and media',
      items: [
        { id: 'archiving', label: 'Archiving and downloading', icon: Download },
        { id: 'apps_and_websites', label: 'Apps and websites', icon: Globe },
        { id: 'sessions', label: 'Login activity (Sessions)', icon: Laptop },
      ],
    },
    {
      group: 'Family Centre',
      items: [
        { id: 'supervision', label: 'Supervision for Teen Accounts', icon: ShieldAlert },
      ],
    },
    {
      group: 'For professionals',
      items: [
        { id: 'professional', label: 'Professional Account & tools', icon: Briefcase },
      ],
    },
    {
      group: 'Account management',
      items: [
        { id: 'account', label: 'Account & Danger Zone', icon: AlertTriangle },
      ],
    },
  ];

  const filteredCategories = navCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          !searchQuery.trim() ||
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.group.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="settings-page-wrapper">
      <div className="settings-page-layout">
      {/* Settings Navigation Bar */}
      <nav className="settings-nav-pane">
        <h2 className="settings-nav-title">Settings</h2>

        {!isUserAdmin && (
          <div className="settings-search-wrapper">
            <Search size={15} className="settings-search-icon" />
            <input
              type="text"
              className="settings-search-input"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="settings-nav-groups-container">
          {filteredCategories.map((cat) => {
            const isGroupExpanded = Boolean(searchQuery.trim()) || openGroups.has(cat.group);
            return (
              <div key={cat.group} className="settings-nav-group">
                <button
                  type="button"
                  className={`settings-nav-group-trigger ${isGroupExpanded ? 'open' : ''}`}
                  aria-expanded={isGroupExpanded}
                  onClick={() => {
                    setOpenGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat.group)) next.delete(cat.group);
                      else next.add(cat.group);
                      return next;
                    });
                  }}
                >
                  <span className="settings-nav-group-title">{cat.group}</span>
                  <ChevronDown
                    size={14}
                    className="settings-nav-group-chevron"
                    aria-hidden="true"
                  />
                </button>
                <div
                  className={`settings-nav-group-items ${
                    isGroupExpanded ? 'expanded' : 'collapsed'
                  }`}
                >
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        tabIndex={isGroupExpanded ? 0 : -1}
                        className={`settings-nav-button ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setOpenGroups((prev) => {
                            if (prev.has(cat.group)) return prev;
                            const next = new Set(prev);
                            next.add(cat.group);
                            return next;
                          });
                        }}
                      >
                        <ItemIcon size={17} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Main Settings Content */}
      <main className="settings-content-pane">
        {isUserAdmin && (
          <div className="settings-admin-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
              <ShieldCheck size={16} color="#a78bfa" />
              <span>Admin Account &amp; Preferences</span>
            </div>
            <div className="settings-admin-banner-links">
              <NavLink to="/admin" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                Back to Dashboard
              </NavLink>
              <NavLink to="/admin/configs" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                System Configs
              </NavLink>
            </div>
          </div>
        )}
        {loading && !['sessions', 'muted', 'password', 'close_friends'].includes(activeTab) ? (
          <SkeletonSettingsForm />
        ) : activeTab === 'profile' ? (
          <div>
            <h2 className="settings-section-title">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="settings-form">
              {/* Profile Photo Header */}
              <div className="settings-profile-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Avatar
                    src={(currentUser?.avatarUrl || currentUser?.profilePictureUrl)}
                    alt={currentUser?.username}
                    size="lg"
                    hasStory={Boolean(currentUser?.hasActiveStory || currentUser?.hasStory)}
                  />
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>@{currentUser?.username}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{profileForm.displayName || 'No display name set'}</div>
                  </div>
                </div>

                <input
                  type="file"
                  ref={avatarInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleAvatarFile}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    {!uploadingAvatar && <Camera size={14} />}
                    <span>{uploadingAvatar ? 'Uploading...' : 'Change photo'}</span>
                  </button>
                  {(currentUser?.avatarUrl || currentUser?.profilePictureUrl) && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-error)' }}
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Username Field */}
              <div className="editor-form-group">
                <label className="editor-label">Username</label>
                <div className="settings-prefix-input-wrap">
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginRight: '4px' }}>@</span>
                  <input
                    type="text"
                    className="input"
                    style={{ border: 'none', background: 'transparent', padding: '10px 0', width: '100%', boxShadow: 'none' }}
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  3-30 characters. Letters, numbers, underscores, and periods allowed.
                </div>
                {profileForm.previousUsername && (
                  <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '6px', background: 'rgba(0, 149, 246, 0.08)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                    In most cases, you can change your username back to <strong>{profileForm.previousUsername}</strong> for another {usernameCooldownDays} days.
                  </div>
                )}
              </div>

              {/* Display Name Field */}
              <div className="editor-form-group">
                <label className="editor-label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  maxLength={50}
                  placeholder="Your display name"
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Help people discover your account by using the name you're known by.
                </div>
              </div>

              {/* Pronouns Field */}
              <div className="editor-form-group">
                <label className="editor-label">Pronouns</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. they/them, she/her, he/him"
                  value={profileForm.pronouns || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, pronouns: e.target.value })}
                  maxLength={50}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Add pronouns to your profile to let people know how to refer to you.
                </div>
              </div>

              {/* Gender Field */}
              <div className="editor-form-group">
                <label className="editor-label">Gender</label>
                <select
                  className="input"
                  value={profileForm.gender || 'PREFER_NOT_TO_SAY'}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                >
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="CUSTOM">Custom</option>
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  This won't be part of your public profile.
                </div>
              </div>

              {/* Bio Field */}
              <div className="editor-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="editor-label" style={{ margin: 0 }}>Bio</label>
                  <span style={{ fontSize: '11px', color: (profileForm.bio?.length || 0) > 140 ? 'var(--color-error)' : 'var(--text-muted)' }}>
                    {profileForm.bio?.length || 0} / 150
                  </span>
                </div>
                <textarea
                  rows={3}
                  className="input"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  maxLength={150}
                  placeholder="Write a brief bio about yourself..."
                />
              </div>

              {/* Website Field */}
              <div className="editor-form-group">
                <label className="editor-label">Website</label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://example.com"
                  value={profileForm.websiteUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, websiteUrl: e.target.value })}
                  maxLength={200}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || uploadingAvatar}
                style={{ marginTop: '8px', alignSelf: 'flex-start' }}
              >
                {saving ? 'Processing...' : 'Save Profile'}
              </button>
            </form>
          </div>
        ) : activeTab === 'password' ? (
          <div>
            <h2 className="settings-section-title">Change Password</h2>
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="editor-form-group">
                <label className="editor-label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>

              <div className="editor-form-group">
                <label className="editor-label">New Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>

              <div className="editor-form-group">
                <label className="editor-label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ marginTop: '8px', alignSelf: 'flex-start' }}
              >
                {saving ? 'Processing...' : 'Change Password'}
              </button>
            </form>
          </div>
        ) : activeTab === 'privacy' ? (
          <div style={{ maxWidth: '520px' }}>
            <h2 className="settings-section-title">Privacy & Notifications</h2>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Private Account</span>
                <span className="toggle-desc">When your account is private, only approved followers can see your posts and stories.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.privateAccount}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, privateAccount: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Likes Notifications</span>
                <span className="toggle-desc">Receive notifications when someone likes your posts.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyLikes}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyLikes: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Comments Notifications</span>
                <span className="toggle-desc">Receive notifications when someone comments on your posts.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyComments}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyComments: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">New Follower Notifications</span>
                <span className="toggle-desc">Receive notifications when someone starts following you.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyFollows}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyFollows: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Message Notifications</span>
                <span className="toggle-desc">Receive notifications for direct messages.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyMessages}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyMessages: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        ) : activeTab === 'sessions' ? (
          <div className="sessions-container">
            <h2 className="settings-section-title">Login Activity</h2>
            <p className="sessions-header-desc">
              Manage your active sessions and devices where your account is currently signed in.
            </p>

            <div className="sessions-action-bar">
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Active Sessions</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {sessions.length} logged-in device{sessions.length === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  disabled={sessions.filter((s) => !s.current).length === 0 || saving}
                  onClick={() => setShowRevokeOtherModal(true)}
                >
                  Log out other devices
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  disabled={saving}
                  onClick={() => setShowLogoutAllModal(true)}
                >
                  Log out of all
                </button>
              </div>
            </div>

            {sessionsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <SkeletonUserRows count={4} showAction />
              </div>
            ) : sessionsError ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>
                  {sessionsError}
                </p>
                <button type="button" className="btn btn-secondary" onClick={loadSessions}>
                  Retry
                </button>
              </div>
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={Laptop}
                title="No Active Sessions"
                description="No active sessions were found for your account."
              />
            ) : (
              <div className="sessions-list">
                {sessions.map((sess) => {
                  const sessionId = sess.sessionId || sess.id;
                  const isCurrent = sess.current !== undefined ? sess.current : sess.currentSession;
                  const DeviceIcon = getDeviceIcon(sess.deviceName);
                  return (
                    <div
                      key={sessionId || sess.id}
                      className={`session-card ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="session-main-details">
                        <div className="session-icon-box">
                          <DeviceIcon size={20} />
                        </div>
                        <div className="session-info">
                          <div className="session-title-line">
                            <span className="session-device-name">
                              {sess.deviceName || 'Unknown Device'}
                            </span>
                            {isCurrent && (
                              <span className="session-current-badge">This Device</span>
                            )}
                          </div>
                          <div className="session-meta-line">
                            {sess.ipAddress ? `IP: ${sess.ipAddress} • ` : ''}
                            {isCurrent ? 'Active now' : `Last active ${formatSessionTime(sess.lastActivityAt)}`}
                          </div>
                          <div className="session-meta-line" style={{ opacity: 0.75 }}>
                            Signed in {formatSessionTime(sess.createdAt)}
                          </div>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          disabled={revokingId === sessionId || saving}
                          onClick={() => handleRevokeSession(sessionId, isCurrent)}
                        >
                          {revokingId === sessionId ? (
                            'Processing...'
                          ) : (
                            'Log Out'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'blocked' ? (
          <div>
            <h2 className="settings-section-title">Blocked Accounts</h2>
            {blockedUsers.length === 0 ? (
              <EmptyState
                icon={UserX}
                title="No Blocked Accounts"
                description="You haven't blocked anyone yet. Blocked accounts will be listed here."
              />
            ) : (
              <div className="blocked-users-list">
                {blockedUsers.map((item) => {
                  const u = item.blockedUser || item;
                  return (
                    <div key={u.id} className="blocked-user-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar src={(u.avatarUrl || u.profilePictureUrl)} alt={u.username} size="sm" />
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{u.username}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.displayName || u.fullName}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => setUnblockTarget(u)}
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <UnblockUserModal
              isOpen={Boolean(unblockTarget)}
              onClose={() => setUnblockTarget(null)}
              userId={unblockTarget?.userId || unblockTarget?.id}
              username={unblockTarget?.username}
              onUnblockSuccess={() => {
                const targetId = unblockTarget?.userId || unblockTarget?.id;
                setBlockedUsers((prev) =>
                  prev.filter((item) => {
                    const u = item.blockedUser || item;
                    return u.userId !== targetId && u.id !== targetId;
                  })
                );
                setUnblockTarget(null);
              }}
            />
          </div>
        ) : activeTab === 'account' ? (
          <div style={{ maxWidth: '580px' }}>
            <h2 className="settings-section-title">Account & Security</h2>

            {/* Email Address Section */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Mail size={18} color="var(--ig-primary-button)" />
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Email Address</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Current email: <strong style={{ color: 'var(--text-primary)' }}>{currentAccountEmail || currentUser?.email || 'No email associated'}</strong>
              </p>

              {emailChangeSent ? (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-success)', marginBottom: '6px' }}>
                    ✓ Verification email sent to <strong>{emailChangeSent}</strong>. Please check your inbox and click the verification link.
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={handleCancelPendingEmail}
                  >
                    Cancel Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInitiateEmailChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
                  <input
                    type="email"
                    className="input"
                    placeholder="Enter new email address"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    className="input"
                    placeholder="Current password (to verify identity)"
                    value={emailCurrentPassword}
                    onChange={(e) => setEmailCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={changingEmail || !newEmailInput}
                    >
                      {changingEmail ? 'Processing...' : 'Change Email'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {isUserAdmin ? (
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.34)', padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <ShieldCheck size={24} color="#c084fc" />
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>System Administrator Account Protected</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Admin accounts cannot be deactivated or deleted to preserve platform governance and audit consistency.
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Account Deactivation (Temporary) */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Power size={18} color="var(--color-warning)" />
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Temporarily Deactivate Account</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                    Temporarily deactivating your account hides your profile, photos, comments, and likes. You can easily reactivate whenever you want by simply logging back into your account.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeactivateModal(true)}
                  >
                    Deactivate My Account
                  </button>
                </div>

                {/* Danger Zone: Account Deletion (Permanent) */}
                <div style={{ background: 'rgba(237, 73, 86, 0.05)', border: '1px solid rgba(237, 73, 86, 0.3)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Trash2 size={18} color="var(--color-error)" />
                    <strong style={{ fontSize: '15px', color: 'var(--color-error)' }}>Danger Zone: Delete Account</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                    When you delete your account, your profile and content will be scheduled for permanent removal with a {accountDeletionGraceDays}-day recovery grace period. All your active sessions will be terminated immediately.
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'hidden_words' ? (
          <div style={{ maxWidth: '580px' }}>
            <h2 className="settings-section-title">Hidden Words & Filtering</h2>
            <p className="settings-section-subtitle" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Protect yourself from offensive comments and unwanted interactions by automatically hiding inappropriate words and phrases.
            </p>

            <form onSubmit={handleSaveHiddenWords}>
              {/* Offensive words toggle */}
              <div className="settings-toggle-row" style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <div className="toggle-info">
                  <span className="toggle-title">Hide offensive comments</span>
                  <span className="toggle-desc">Comments that may be offensive or abusive will be automatically hidden from your posts and reels.</span>
                </div>
                <label className="switch-control">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.hideOffensiveComments)}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hideOffensiveComments: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* Custom words section */}
              <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <EyeOff size={18} color="var(--color-primary)" />
                  <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Custom words and phrases</strong>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                  Add specific words or phrases to your list separated by commas. Any comment on your posts containing these words will be rejected.
                </p>

                <div className="editor-form-group">
                  <label className="editor-label">Blocked keywords (comma-separated)</label>
                  <textarea
                    rows={4}
                    className="input"
                    placeholder="e.g. spam, scam, fake, promo, follow me"
                    value={settingsForm.filteredKeywords || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, filteredKeywords: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ marginTop: '4px' }}
              >
                {saving ? 'Processing...' : 'Save Hidden Words'}
              </button>
            </form>
          </div>
        ) : activeTab === 'professional' ? (
          <div style={{ maxWidth: '580px' }}>
            <h2 className="settings-section-title">Professional & Creator Account</h2>
            <p className="settings-section-subtitle" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Switch to a Creator or Business account to display category badges, track rich post & reel insights, and unlock professional tools.
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Briefcase size={18} color="var(--color-primary)" />
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Account Type</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                {[
                  { type: 'PERSONAL', label: 'Personal', desc: 'Standard account for everyday sharing' },
                  { type: 'CREATOR', label: 'Creator', desc: 'Best for public figures, content producers & artists' },
                  { type: 'BUSINESS', label: 'Business', desc: 'Best for brands, retailers & organizations' },
                ].map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, accountType: opt.type })}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: profileForm.accountType === opt.type ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: profileForm.accountType === opt.type ? 'rgba(168, 85, 247, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13px', color: profileForm.accountType === opt.type ? '#e9d5ff' : 'var(--text-primary)' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>

              {profileForm.accountType !== 'PERSONAL' && (
                <>
                  <div className="editor-form-group">
                    <label className="editor-label">Category Title</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Digital Creator, Artist, Photographer, Blogger, Fitness"
                      value={profileForm.category || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {['Digital Creator', 'Artist', 'Photographer', 'Gamer', 'Musician', 'Writer', 'Entrepreneur', 'Blogger'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className="location-pill"
                          onClick={() => setProfileForm({ ...profileForm, category: cat })}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show Category Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', margin: '16px 0' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Display category on profile</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show your professional label under your name</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileForm.showCategoryBadge}
                      onChange={(e) => setProfileForm({ ...profileForm, showCategoryBadge: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Contact Options */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>Public Contact Information</div>
                    <div className="editor-form-group">
                      <label className="editor-label">Contact Email</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="business@example.com"
                        value={profileForm.contactEmail || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                      />
                    </div>
                    <div className="editor-form-group">
                      <label className="editor-label">Contact Phone</label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="+1 555-123-4567"
                        value={profileForm.contactPhone || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)' }}>Display contact info on profile</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Allow people to email or call you from your profile</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileForm.showContactInfo}
                        onChange={(e) => setProfileForm({ ...profileForm, showContactInfo: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => handleSaveAccountType(profileForm.accountType, profileForm.category)}
                style={{ marginTop: '12px' }}
              >
                {saving ? 'Processing...' : `Save Account Type (${profileForm.accountType})`}
              </button>
            </div>
          </div>
        ) : activeTab === 'apps_and_websites' ? (
          <div className="settings-apps-websites-pane">
            <h2 className="settings-section-title">Apps and websites</h2>

            <div className="apps-subtabs-bar">
              <button
                type="button"
                className={`apps-subtab-btn ${appsSubTab === 'active' ? 'active' : ''}`}
                onClick={() => setAppsSubTab('active')}
              >
                Active
              </button>
              <button
                type="button"
                className={`apps-subtab-btn ${appsSubTab === 'expired' ? 'active' : ''}`}
                onClick={() => setAppsSubTab('expired')}
              >
                Expired
              </button>
              <button
                type="button"
                className={`apps-subtab-btn ${appsSubTab === 'removed' ? 'active' : ''}`}
                onClick={() => setAppsSubTab('removed')}
              >
                Removed
              </button>
            </div>

            <p className="apps-explanation-text">
              These are apps and websites that you've connected to your Instagram profile. They can access non-public information that you choose to share with them.
            </p>

            <div className="apps-empty-state">
              <p className="apps-empty-text">
                {appsSubTab === 'active'
                  ? 'You have not authorised any applications to access your Instagram profile.'
                  : appsSubTab === 'expired'
                    ? 'These are apps and websites that you connected to your Instagram profile that you may not have used in the last 90 days.'
                    : 'These are apps and websites that are no longer connected to your Instagram profile.'}
              </p>
            </div>
          </div>
        ) : activeTab === 'sharing' ? (
          <div style={{ maxWidth: '540px' }}>
            <h2 className="settings-section-title">Sharing and reuse</h2>
            <p className="settings-section-subtitle" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Control how other people can share your stories, posts, and reels across Instagram.
            </p>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Allow story sharing to messages</span>
                <span className="toggle-desc">Let your story viewers share your stories in direct messages.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.allowStorySharing}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, allowStorySharing: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Allow story resharing</span>
                <span className="toggle-desc">Let people you @mention in your stories add them to their own story.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.allowStoryResharing}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, allowStoryResharing: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        ) : activeTab === 'tags_mentions' ? (
          <div style={{ maxWidth: '540px' }}>
            <h2 className="settings-section-title">Tags and mentions</h2>

            <div style={{ marginBottom: '24px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Who can tag you
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Choose who can tag you in their photos and videos.
              </p>
              <div className="settings-radio-group">
                {['EVERYONE', 'PEOPLE_YOU_FOLLOW', 'NOBODY'].map((opt) => (
                  <label key={opt} className="settings-radio-label">
                    <input
                      type="radio"
                      name="allowTagsFrom"
                      checked={settingsForm.allowTagsFrom === opt}
                      onChange={() => handleSaveSettings({ ...settingsForm, allowTagsFrom: opt })}
                    />
                    <span>
                      {opt === 'EVERYONE'
                        ? 'Allow tags from everyone'
                        : opt === 'PEOPLE_YOU_FOLLOW'
                          ? 'Allow tags from people you follow'
                          : "Don't allow tags"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Who can @mention you
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Choose who can @mention you in their stories, comments, live videos, and captions.
              </p>
              <div className="settings-radio-group">
                {['EVERYONE', 'PEOPLE_YOU_FOLLOW', 'NOBODY'].map((opt) => (
                  <label key={opt} className="settings-radio-label">
                    <input
                      type="radio"
                      name="allowMentionsFrom"
                      checked={settingsForm.allowMentionsFrom === opt}
                      onChange={() => handleSaveSettings({ ...settingsForm, allowMentionsFrom: opt })}
                    />
                    <span>
                      {opt === 'EVERYONE'
                        ? 'Allow mentions from everyone'
                        : opt === 'PEOPLE_YOU_FOLLOW'
                          ? 'Allow mentions from people you follow'
                          : "Don't allow mentions"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'like_counts' ? (
          <div style={{ maxWidth: '540px' }}>
            <h2 className="settings-section-title">Like and share counts</h2>
            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Hide like and share counts</span>
                <span className="toggle-desc" style={{ marginTop: '4px', lineHeight: 1.4 }}>
                  On Instagram, the number of likes and shares on posts from other accounts will be hidden. You can hide the number of likes on your own posts when you create them.
                </span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.hideLikeAndShareCounts}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, hideLikeAndShareCounts: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        ) : activeTab === 'muted' ? (
          <div style={{ maxWidth: '580px' }}>
            <h2 className="settings-section-title">Muted accounts</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Accounts you've muted for posts or stories will appear here. You can unmute them anytime.
            </p>

            {loadingMuted ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <SkeletonUserRows count={4} showAction />
              </div>
            ) : mutedUsers.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No Muted Accounts"
                description="You haven't muted posts or stories from any accounts."
              />
            ) : (
              <div className="blocked-users-list">
                {mutedUsers.map((item) => {
                  const u = item.mutedUser || item;
                  return (
                    <div key={u.userId || u.id} className="blocked-user-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar src={u.profilePictureUrl || u.avatarUrl} alt={u.username} size="sm" />
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{u.username}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.fullName || u.displayName}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => handleUnmuteUser(u.userId || u.id)}
                      >
                        Unmute
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'archiving' ? (
          <div style={{ maxWidth: '540px' }}>
            <h2 className="settings-section-title">Archiving and downloading</h2>
            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Save story to archive</span>
                <span className="toggle-desc">Automatically save photos and videos to your private archive so you don’t need to save them to your phone. Only you can see your archive.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.saveStoriesToArchive}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, saveStoriesToArchive: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        ) : activeTab === 'supervision' ? (
          <div style={{ maxWidth: '540px' }}>
            <h2 className="settings-section-title">Supervision for Teen Accounts</h2>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.09)', padding: '24px', borderRadius: '18px', textAlign: 'center' }}>
              <ShieldAlert size={48} color="#c084fc" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Family Centre</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Supervision allows parents and guardians to support their teens' experience on Instagram. Set daily time limits, schedule breaks, and see who they follow and are followed by.
              </p>
              <button type="button" className="btn btn-primary" style={{ padding: '8px 24px' }}>
                Set Up Supervision
              </button>
            </div>
          </div>
        ) : activeTab === 'notifications' ? (
          <div style={{ maxWidth: '540px' }}>
            <h2 className="settings-section-title">Notifications</h2>

            <div className="settings-toggle-row" style={{ borderBottom: '1px solid var(--border-subtle, #363636)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div className="toggle-info">
                <span className="toggle-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Browser Push Notifications (FCM)</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', fontWeight: 600 }}>Web Push</span>
                </span>
                <span className="toggle-desc">Receive real-time push alerts on your desktop or device even when the browser tab is closed or in the background.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  disabled={togglingPush}
                  onChange={(e) => handleTogglePushNotifications(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Likes Notifications</span>
                <span className="toggle-desc">Receive notifications when someone likes your posts.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyLikes}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyLikes: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Comments Notifications</span>
                <span className="toggle-desc">Receive notifications when someone comments on your posts.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyComments}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyComments: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">New Follower Notifications</span>
                <span className="toggle-desc">Receive notifications when someone starts following you.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyFollows}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyFollows: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Message Notifications</span>
                <span className="toggle-desc">Receive notifications for direct messages.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyMessages}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyMessages: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        ) : activeTab === 'close_friends' ? (
          <CloseFriendsPanel />
        ) : null}
      </main>

      {/* Modal for Deactivate Account */}
      {showDeactivateModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowDeactivateModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Deactivate Account?</h3>
            <p className="modal-body-text">
              Your profile, posts, comments, and likes will be hidden from everyone until you log back in. Are you sure you want to proceed?
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowDeactivateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={handleDeactivateAccount}
              >
                {saving ? 'Processing...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Delete Account */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowDeleteModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: 'var(--color-error)' }}>Permanently Delete Account?</h3>
            <p className="modal-body-text">
              This will immediately sign you out and schedule your profile, posts, reels, and stories for permanent removal. You will have a {accountDeletionGraceDays}-day recovery window to restore your account.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleDeleteAccount}
              >
                {saving ? 'Processing...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Revoke Other Sessions */}
      {showRevokeOtherModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowRevokeOtherModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Log out other devices?</h3>
            <p className="modal-body-text">
              You will be signed out on all other web and mobile devices. You will stay signed in on this device.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowRevokeOtherModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleRevokeOtherSessions}
              >
                {saving ? 'Processing...' : 'Log Out Others'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Logout All Sessions */}
      {showLogoutAllModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowLogoutAllModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Log out of all devices?</h3>
            <p className="modal-body-text">
              You will be signed out everywhere, including this device. You will need to enter your credentials to sign back in.
            </p>
              <div className="modal-action-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={saving}
                  onClick={() => setShowLogoutAllModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={saving}
                  onClick={handleLogoutAll}
                >
                  {saving ? 'Processing...' : 'Log Out All'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
