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
import {
  SettingsNavPane,
  ProfileSettingsTab,
  PasswordSettingsTab,
  PrivacySettingsTab,
  SessionsSettingsTab,
  BlockedUsersTab,
  AccountDangerZoneTab,
  NotificationsSettingsTab,
  HiddenWordsTab,
  ProfessionalAccountTab,
  AppsAndWebsitesTab,
  SharingAndRemixesTab,
  TagsAndMentionsTab,
  MutedUsersTab,
  PreferencesTab,
} from '../../components/settings';
import EmptyState from '../../components/common/EmptyState';
import { CloseFriendsPanel } from '../../components/modals/CloseFriendsModal';
import { StoryPrivacyPanel } from '../../components/modals/HideStoryModal';
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
        story_privacy: 'Who can see your content',
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
        { id: 'story_privacy', label: 'Hide story and live', icon: EyeOff },
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
      <SettingsNavPane
          isUserAdmin={isUserAdmin}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          openGroups={openGroups}
          setOpenGroups={setOpenGroups}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredCategories={filteredCategories}
        />

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
        {loading && !['sessions', 'muted', 'password', 'close_friends', 'story_privacy'].includes(activeTab) ? (
          <SkeletonSettingsForm />
        ) : activeTab === 'profile' ? (
          <ProfileSettingsTab
            currentUser={currentUser}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleSaveProfile={handleSaveProfile}
            avatarInputRef={avatarInputRef}
            handleAvatarFile={handleAvatarFile}
            handleRemoveAvatar={handleRemoveAvatar}
            uploadingAvatar={uploadingAvatar}
            saving={saving}
            usernameCooldownDays={usernameCooldownDays}
          />
        ) : activeTab === 'password' ? (
          <PasswordSettingsTab
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            handleChangePassword={handleChangePassword}
            saving={saving}
          />
        ) : activeTab === 'privacy' ? (
          <PrivacySettingsTab
            settingsForm={settingsForm}
            handleSaveSettings={handleSaveSettings}
            setActiveTab={setActiveTab}
          />
        ) : activeTab === 'sessions' ? (
          <SessionsSettingsTab
            sessions={sessions}
            sessionsLoading={sessionsLoading}
            sessionsError={sessionsError}
            loadSessions={loadSessions}
            handleRevokeSession={handleRevokeSession}
            handleRevokeOtherSessions={handleRevokeOtherSessions}
            handleLogoutAll={handleLogoutAll}
            revokingId={revokingId}
            saving={saving}
            showRevokeOtherModal={showRevokeOtherModal}
            setShowRevokeOtherModal={setShowRevokeOtherModal}
            showLogoutAllModal={showLogoutAllModal}
            setShowLogoutAllModal={setShowLogoutAllModal}
          />
        ) : activeTab === 'blocked' ? (
          <BlockedUsersTab
            blockedUsers={blockedUsers}
            unblockTarget={unblockTarget}
            setUnblockTarget={setUnblockTarget}
            setBlockedUsers={setBlockedUsers}
          />
        ) : activeTab === 'account' ? (
          <AccountDangerZoneTab
            currentAccountEmail={currentAccountEmail}
            currentUser={currentUser}
            emailChangeSent={emailChangeSent}
            newEmailInput={newEmailInput}
            setNewEmailInput={setNewEmailInput}
            emailCurrentPassword={emailCurrentPassword}
            setEmailCurrentPassword={setEmailCurrentPassword}
            changingEmail={changingEmail}
            handleInitiateEmailChange={handleInitiateEmailChange}
            handleCancelPendingEmail={handleCancelPendingEmail}
            isUserAdmin={isUserAdmin}
            accountDeletionGraceDays={accountDeletionGraceDays}
            showDeactivateModal={showDeactivateModal}
            setShowDeactivateModal={setShowDeactivateModal}
            handleDeactivateAccount={handleDeactivateAccount}
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            handleDeleteAccount={handleDeleteAccount}
            saving={saving}
          />
        ) : activeTab === 'hidden_words' ? (
          <HiddenWordsTab
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveHiddenWords={handleSaveHiddenWords}
            saving={saving}
          />
        ) : activeTab === 'professional' ? (
          <ProfessionalAccountTab
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleSaveAccountType={handleSaveAccountType}
            saving={saving}
          />
        ) : activeTab === 'apps_and_websites' ? (
          <AppsAndWebsitesTab
            appsSubTab={appsSubTab}
            setAppsSubTab={setAppsSubTab}
          />
        ) : activeTab === 'sharing' ? (
          <SharingAndRemixesTab
            settingsForm={settingsForm}
            handleSaveSettings={handleSaveSettings}
          />
        ) : activeTab === 'tags_mentions' ? (
          <TagsAndMentionsTab
            settingsForm={settingsForm}
            handleSaveSettings={handleSaveSettings}
          />
        ) : activeTab === 'like_counts' ? (
          <PreferencesTab
            tab="like_counts"
            settingsForm={settingsForm}
            handleSaveSettings={handleSaveSettings}
          />
        ) : activeTab === 'muted' ? (
          <MutedUsersTab
            mutedUsers={mutedUsers}
            loadingMuted={loadingMuted}
            handleUnmuteUser={handleUnmuteUser}
          />
        ) : activeTab === 'archiving' ? (
          <PreferencesTab
            tab="archiving"
            settingsForm={settingsForm}
            handleSaveSettings={handleSaveSettings}
          />
        ) : activeTab === 'supervision' ? (
          <PreferencesTab
            tab="supervision"
            settingsForm={settingsForm}
            handleSaveSettings={handleSaveSettings}
          />
        ) : activeTab === 'notifications' ? (
          <NotificationsSettingsTab
            pushEnabled={pushEnabled}
            togglingPush={togglingPush}
            handleTogglePushNotifications={handleTogglePushNotifications}
            settingsForm={settingsForm}
            handleSaveSettings={handleSaveSettings}
          />
        ) : activeTab === 'close_friends' ? (
          <CloseFriendsPanel />
        ) : activeTab === 'story_privacy' ? (
          <StoryPrivacyPanel />
        ) : null}
      </main>
    </div>
    </div>
  );
};

export default SettingsPage;
