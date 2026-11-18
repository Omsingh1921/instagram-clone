import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Settings,
  Grid,
  Bookmark,
  Globe,
  Camera,
  Heart,
  MessageCircle,
  Film,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  Send,
  Lock,
  Clock,
  Play,
  Layers,
  Plus,
  Pin,
  BellOff,
  Briefcase,
  Folder,
  ArrowLeft,
  QrCode,
  Tag,
  Star,
  Archive,
  Trash2,
  Copy,
  RotateCcw,
  RotateCw,
  BadgeCheck,
  Mail,
  Phone,
  Sparkles,
  Link2,
  MoreVertical,
  Edit2,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import CommentsModal from '../../components/modals/CommentsModal';
import FollowListModal from '../../components/modals/FollowListModal';
import ReportModal from '../../components/modals/ReportModal';
import CreateHighlightModal from '../../components/modals/CreateHighlightModal';
import EditHighlightModal from '../../components/modals/EditHighlightModal';
import CreateCollectionModal from '../../components/modals/CreateCollectionModal';
import CloseFriendsModal from '../../components/modals/CloseFriendsModal';
import ProfileQrModal from '../../components/modals/ProfileQrModal';
import NoteModal from '../../components/modals/NoteModal';
import ProfileGearMenuModal from '../../components/modals/ProfileGearMenuModal';
import MetaVerifiedModal from '../../components/modals/MetaVerifiedModal';
import BlockUserModal from '../../components/modals/BlockUserModal';
import UnblockUserModal from '../../components/modals/UnblockUserModal';
import { SkeletonProfileHeader, SkeletonMediaGrid } from '../../components/ui/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import userService from '../../services/user.service';
import noteService from '../../services/note.service';
import postService from '../../services/post.service';
import mediaService from '../../services/media.service';
import reelService from '../../services/reel.service';
import followService from '../../services/follow.service';
import chatService from '../../services/chat.service';
import storyService from '../../services/story.service';
import settingsService from '../../services/settings.service';
import collectionService from '../../services/collection.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import StoryViewerModal from '../../components/story/StoryViewerModal';
import { formatCount } from '../../utils';
import ProgressiveImage from '../../components/common/ProgressiveImage';
import { getVideoPosterUrl } from '../../utils/mediaUrl';
import './ProfilePage.css';

export const ProfilePage = () => {
  const { userId } = useParams();
    const { user: currentUser, updateUser, logout, isFollowing: checkIsFollowing, toggleFollow, setFollowStatus, isAdmin } = useAuth();

  const isViewerAdmin = Boolean(
    isAdmin ||
    currentUser?.role === 'ROLE_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.username?.toLowerCase() === 'admin'
  );
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [highlights, setHighlights] = useState([]);
  const [createHighlightOpen, setCreateHighlightOpen] = useState(false);
  const [editingHighlightId, setEditingHighlightId] = useState(null);
  const [highlightMenuId, setHighlightMenuId] = useState(null);
  const [activeHighlightGroup, setActiveHighlightGroup] = useState(null);
  const uploadCtx = useUpload();
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [userStories, setUserStories] = useState([]);

  useEffect(() => {
    if (!highlightMenuId) return;
    const handleClickOutside = () => setHighlightMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [highlightMenuId]);

  const [profile, setProfile] = useState(null);
  const myUserId = String(currentUser?.id || currentUser?.userId || '').toLowerCase();
  const isOwnProfile = Boolean(
    !userId ||
    userId === 'me' ||
    (currentUser && profile && (
      String(currentUser.id || currentUser.userId || '').toLowerCase() === String(profile.id || profile.userId || '').toLowerCase() ||
      String(currentUser.username || '').toLowerCase() === String(profile.username || '').toLowerCase()
    )) ||
    (currentUser && (
      String(currentUser.id || '').toLowerCase() === String(userId || '').toLowerCase() ||
      String(currentUser.userId || '').toLowerCase() === String(userId || '').toLowerCase() ||
      String(currentUser.username || '').toLowerCase() === String(userId || '').toLowerCase()
    ))
  );
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['posts', 'reels', 'saved', 'tagged', 'archived', 'recently_deleted'].includes(tabParam.toLowerCase())
      ? tabParam.toLowerCase()
      : 'posts';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['posts', 'reels', 'saved', 'tagged', 'archived', 'recently_deleted'].includes(tabParam.toLowerCase())) {
      setActiveTab(tabParam.toLowerCase());
    }
  }, [searchParams]);

  // Tab content
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [archivedReels, setArchivedReels] = useState([]);
  const [archivedStories, setArchivedStories] = useState([]);
  const [archivedSubTab, setArchivedSubTab] = useState('posts');
  const [recentlyDeletedPosts, setRecentlyDeletedPosts] = useState([]);
  const [recentlyDeletedReels, setRecentlyDeletedReels] = useState([]);
  const [deletedSubTab, setDeletedSubTab] = useState('posts');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingSavedReels, setLoadingSavedReels] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [loadingArchivedReels, setLoadingArchivedReels] = useState(false);
  const [loadingArchivedStories, setLoadingArchivedStories] = useState(false);
  const [loadingRecentlyDeleted, setLoadingRecentlyDeleted] = useState(false);
  const [loadingDeletedReels, setLoadingDeletedReels] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Collections state
  const [savedSubTab, setSavedSubTab] = useState('all');
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionPosts, setCollectionPosts] = useState([]);
  const [loadingCollectionPosts, setLoadingCollectionPosts] = useState(false);
  const [collectionTab, setCollectionTab] = useState('posts'); // 'posts' | 'reels'
  const [collectionReels, setCollectionReels] = useState([]);
  const [loadingCollectionReels, setLoadingCollectionReels] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);

  // Modals
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [closeFriendsModalOpen, setCloseFriendsModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [gearMenuOpen, setGearMenuOpen] = useState(false);
  const [metaVerifiedOpen, setMetaVerifiedOpen] = useState(false);
  const [gridMenuPost, setGridMenuPost] = useState(null);
  const [gridMenuReel, setGridMenuReel] = useState(null);

  // Tagged tab state
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [loadingTagged, setLoadingTagged] = useState(false);

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    bio: '',
    websiteUrl: '',
    category: '',
    pronouns: '',
    gender: 'PREFER_NOT_TO_SAY',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const avatarInputRef = useRef(null);

  // Load Profile Details
  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      setUserStories([]);
      let res;
      if (isOwnProfile) {
        res = await userService.getCurrentUser();
      } else {
        res = await userService.getUserById(userId);
      }

      const rawData = res?.data || res;
      const data = {
        ...rawData,
        id: rawData?.id || rawData?.userId,
        userId: rawData?.userId || rawData?.id,
      };
      setProfile(data);
      if (isOwnProfile) {
        updateUser(data);
      }
      setFollowersCount(data.followersCount || data.followerCount || 0);
      setFollowingCount(data.followingCount || 0);
      const followed = Boolean(data.followedByCurrentUser ?? data.followingByCurrentUser ?? false);
      setIsFollowing(followed);
      setIsRequested(Boolean(data.followRequestedByCurrentUser));

      setEditFormData({
        displayName: data.displayName || data.fullName || '',
        bio: data.bio || '',
        websiteUrl: data.websiteUrl || '',
        category: data.category || '',
        pronouns: data.pronouns || '',
        gender: data.gender || 'PREFER_NOT_TO_SAY',
      });

      if (!isOwnProfile && data.id) {
        settingsService.isUserMuted(data.id)
          .then((mRes) => setIsMuted(Boolean(mRes?.data ?? mRes)))
          .catch(() => {});

        settingsService.getBlockStatus(data.id)
          .then((bRes) => {
            const bData = bRes?.data?.data || bRes?.data || bRes;
            setIsBlockedByMe(Boolean(bData?.hasBlocked));
          })
          .catch(() => {});
      }

      if (data?.id) {
        storyService.getUserStories(data.id)
          .then((sRes) => {
            const sData = sRes?.data?.data || sRes?.data || sRes;
            if (sData?.stories && Array.isArray(sData.stories)) {
              setUserStories(sData.stories);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      showError(err.message || 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [isOwnProfile, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load user's active Note
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await noteService.getActiveNotesFeed();
        const list = res?.data || res || [];
        const targetId = isOwnProfile ? currentUser?.id : (userId || profile?.id);
        const found = list.find(
          (n) =>
            (targetId && String(n.user?.id || n.userId) === String(targetId)) ||
            (isOwnProfile && (n.isOwnNote ?? n.ownNote))
        );
        if (found) {
          setActiveNote(found);
        } else if (isOwnProfile) {
          setActiveNote(null);
        }
      } catch {
        // Silently ignore if note service is empty
      }
    };
    fetchNote();
  }, [isOwnProfile, userId, currentUser?.id, profile?.id]);

  const fetchHighlights = useCallback(async () => {
    const targetId = isOwnProfile ? currentUser?.id : userId;
    if (!targetId) return;
    try {
      const res = await storyService.getUserHighlights(targetId);
      const list = res?.data || res || [];
      setHighlights(Array.isArray(list) ? list : []);
    } catch {
      setHighlights([]);
    }
  }, [isOwnProfile, currentUser?.id, userId]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  // Load User Posts
  const loadUserPosts = useCallback(async () => {
    const targetId = isOwnProfile ? currentUser?.id : userId;
    if (!targetId) return;

    if (!isOwnProfile && profile?.isPrivate && !isFollowing && !isViewerAdmin) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    try {
      setLoadingPosts(true);
      const res = await postService.getUserPosts(targetId, 0, 30);
      const list = res?.data?.content || res?.content || res?.data || [];
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [isOwnProfile, currentUser?.id, userId, profile?.isPrivate, isFollowing]);

  // Load User Reels
  const loadUserReels = useCallback(async () => {
    const targetId = isOwnProfile ? currentUser?.id : userId;
    if (!targetId) return;

    if (!isOwnProfile && profile?.isPrivate && !isFollowing && !isViewerAdmin) {
      setReels([]);
      return;
    }

    try {
      const res = await reelService.getUserReels(targetId, 0, 30);
      const list = res?.data?.content || res?.content || res?.data || [];
      setReels(list);
    } catch {
      setReels([]);
    }
  }, [isOwnProfile, currentUser?.id, userId, profile?.isPrivate, isFollowing]);

  // Load Saved Posts (Only for own profile)
  const loadSavedPosts = useCallback(async () => {
    if (!isOwnProfile) return;

    try {
      setLoadingSaved(true);
      const res = await postService.getSavedPosts(0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setSavedPosts(list);
    } catch {
      setSavedPosts([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [isOwnProfile]);

  // Load Collections
  const loadCollections = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      setLoadingCollections(true);
      const res = await collectionService.getCollections();
      const list = res?.data || res || [];
      setCollections(Array.isArray(list) ? list : []);
    } catch {
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  }, [isOwnProfile]);

  const handleSelectCollection = async (coll) => {
    try {
      setSelectedCollection(coll);
      setCollectionTab('posts');
      setCollectionReels([]);
      setLoadingCollectionPosts(true);
      const res = await collectionService.getCollectionPosts(coll.id);
      const list = res?.data?.content || res?.content || res?.data || [];
      setCollectionPosts(Array.isArray(list) ? list : []);
    } catch {
      setCollectionPosts([]);
    } finally {
      setLoadingCollectionPosts(false);
    }
  };

  const handleSwitchCollectionTab = async (tab) => {
    setCollectionTab(tab);
    if (!selectedCollection?.id) return;
    if (tab === 'reels' && collectionReels.length === 0) {
      try {
        setLoadingCollectionReels(true);
        const res = await collectionService.getCollectionReels(selectedCollection.id);
        const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
        setCollectionReels(Array.isArray(list) ? list : []);
      } catch {
        setCollectionReels([]);
      } finally {
        setLoadingCollectionReels(false);
      }
    }
  };

  // Load Tagged Posts
  const loadTaggedPosts = useCallback(async () => {
    const targetId = isOwnProfile ? currentUser?.id : (userId || profile?.id);
    if (!targetId) return;
    if (!isOwnProfile && profile?.isPrivate && !isFollowing && !isViewerAdmin) return;
    try {
      setLoadingTagged(true);
      const res = await postService.getUserTaggedPosts(targetId, 0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setTaggedPosts(list);
    } catch {
      setTaggedPosts([]);
    } finally {
      setLoadingTagged(false);
    }
  }, [isOwnProfile, currentUser?.id, userId, profile?.id, profile?.isPrivate, isFollowing]);

  // Load Archived Posts (Only for own profile)
  const loadArchivedPosts = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      setLoadingArchived(true);
      const res = await postService.getArchivedPosts(0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setArchivedPosts(list);
    } catch {
      setArchivedPosts([]);
    } finally {
      setLoadingArchived(false);
    }
  }, [isOwnProfile]);

  // Load Recently Deleted Posts (Only for own profile)
  const loadRecentlyDeletedPosts = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      setLoadingRecentlyDeleted(true);
      const res = await postService.getRecentlyDeletedPosts(0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setRecentlyDeletedPosts(list);
    } catch {
      setRecentlyDeletedPosts([]);
    } finally {
      setLoadingRecentlyDeleted(false);
    }
  }, [isOwnProfile]);

  // Load Archived Reels (Only for own profile)
  const loadArchivedReels = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      setLoadingArchivedReels(true);
      const res = await reelService.getArchivedReels(0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setArchivedReels(list);
    } catch {
      setArchivedReels([]);
    } finally {
      setLoadingArchivedReels(false);
    }
  }, [isOwnProfile]);

  // Load Archived Stories (Only for own profile)
  const loadArchivedStories = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      setLoadingArchivedStories(true);
      const res = await storyService.getStoryArchive(0, 50);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setArchivedStories(list);
    } catch {
      setArchivedStories([]);
    } finally {
      setLoadingArchivedStories(false);
    }
  }, [isOwnProfile]);

  // Load Recently Deleted Reels (Only for own profile)
  const loadRecentlyDeletedReels = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      setLoadingDeletedReels(true);
      const res = await reelService.getRecentlyDeletedReels(0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setRecentlyDeletedReels(list);
    } catch {
      setRecentlyDeletedReels([]);
    } finally {
      setLoadingDeletedReels(false);
    }
  }, [isOwnProfile]);

  // Load Saved Reels (Only for own profile)
  const loadSavedReels = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      setLoadingSavedReels(true);
      const res = await reelService.getSavedReels(0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setSavedReels(list);
    } catch {
      setSavedReels([]);
    } finally {
      setLoadingSavedReels(false);
    }
  }, [isOwnProfile]);

  const handleUnarchivePost = async (e, postId) => {
    e.stopPropagation();
    try {
      await postService.toggleArchivePost(postId);
      showSuccess('Post unarchived and restored to your profile');
      loadArchivedPosts();
      loadUserPosts();
    } catch (err) {
      showError(err.message || 'Failed to unarchive post');
    }
  };

  const handleUnarchiveReel = async (e, reelId) => {
    e.stopPropagation();
    try {
      await reelService.unarchiveReel(reelId);
      showSuccess('Reel unarchived and restored to your profile');
      loadArchivedReels();
      loadUserReels();
    } catch (err) {
      showError(err.message || 'Failed to unarchive reel');
    }
  };

  const handleReshareStory = async (e, storyId) => {
    e.stopPropagation();
    try {
      await storyService.reshareArchivedStory(storyId);
      showSuccess('Archived memory reshared to your story! 🌟');
      window.dispatchEvent(new CustomEvent('story:refresh'));
    } catch (err) {
      showError(err.message || 'Failed to reshare archived story');
    }
  };

  const handleRestorePost = async (e, postId) => {
    e.stopPropagation();
    try {
      await postService.restorePost(postId);
      showSuccess('Post restored to your profile grid');
      loadRecentlyDeletedPosts();
      loadUserPosts();
    } catch (err) {
      showError(err.message || 'Failed to restore post');
    }
  };

  const handleRestoreReel = async (e, reelId) => {
    e.stopPropagation();
    try {
      await reelService.restoreReel(reelId);
      showSuccess('Reel restored to your profile grid');
      loadRecentlyDeletedReels();
      loadUserReels();
    } catch (err) {
      showError(err.message || 'Failed to restore reel');
    }
  };

  const handlePermanentDeletePost = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) {
      return;
    }
    try {
      await postService.permanentlyDeletePost(postId);
      showSuccess('Post permanently deleted');
      loadRecentlyDeletedPosts();
    } catch (err) {
      showError(err.message || 'Failed to permanently delete post');
    }
  };

  const handlePermanentDeleteReel = async (e, reelId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this reel? This cannot be undone.')) {
      return;
    }
    try {
      await reelService.permanentlyDeleteReel(reelId);
      showSuccess('Reel permanently deleted');
      loadRecentlyDeletedReels();
    } catch (err) {
      showError(err.message || 'Failed to permanently delete reel');
    }
  };

  const hasProfile = Boolean(profile);

  useEffect(() => {
    if (loadingProfile || !hasProfile) return;
    if (activeTab === 'posts') {
      loadUserPosts();
    } else if (activeTab === 'reels') {
      loadUserReels();
    } else if (activeTab === 'saved') {
      loadSavedPosts();
      loadSavedReels();
      loadCollections();
    } else if (activeTab === 'tagged') {
      loadTaggedPosts();
    } else if (activeTab === 'archived') {
      loadArchivedPosts();
      loadArchivedReels();
      loadArchivedStories();
    } else if (activeTab === 'recently_deleted') {
      loadRecentlyDeletedPosts();
      loadRecentlyDeletedReels();
    }
  }, [
    loadingProfile,
    hasProfile,
    activeTab,
    loadUserPosts,
    loadUserReels,
    loadSavedPosts,
    loadSavedReels,
    loadCollections,
    loadTaggedPosts,
    loadArchivedPosts,
    loadArchivedReels,
    loadArchivedStories,
    loadRecentlyDeletedPosts,
    loadRecentlyDeletedReels,
  ]);

  // Follow / Requested / Unfollow
  const handleDeleteUserProfile = async () => {
    if (!profile?.id) return;
    const username = profile?.username || 'user';
    if (!window.confirm(`Are you sure you want to delete user @${username}? This will soft-delete their account and revoke active sessions.`)) {
      return;
    }
    try {
      await userService.deleteUser(profile.id);
      showSuccess(`User @${username} deleted successfully`);
      navigate('/admin');
    } catch (err) {
      showError(err.message || 'Failed to delete user');
    }
  };

  const handleFollowToggle = async () => {
    const targetId = userId || profile?.userId || profile?.id;
    if (!targetId) return;

    try {
      if (isRequested) {
        // Cancel pending follow request
        await followService.cancelFollowRequest(targetId);
        setIsRequested(false);
        showSuccess('Follow request cancelled');
        return;
      }

      if (isFollowing) {
        // Unfollow user
        await followService.unfollowUser(targetId);
        setIsFollowing(false);
        if (setFollowStatus) setFollowStatus(targetId, false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        showSuccess('Unfollowed user');
        return;
      }

      // Send follow request or follow directly
      const res = await followService.followUser(targetId);
      const followData = res?.data || res;
      if (followData?.requested || profile?.isPrivate) {
        setIsRequested(true);
        setIsFollowing(false);
        showSuccess('Follow request sent');
      } else {
        setIsFollowing(true);
        setIsRequested(false);
        if (setFollowStatus) setFollowStatus(targetId, true);
        setFollowersCount((prev) => prev + 1);
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  // Start Direct Chat
  const handleMessageUser = async () => {
    try {
      const res = await chatService.getOrCreateDirectConversation(userId);
      const conv = res?.data || res;
      navigate('/messages', { state: { conversationId: conv.id } });
    } catch (err) {
      showError(err.message || 'Failed to start message');
    }
  };

  // Block / Unblock user
  const handleBlockUser = () => {
    setMoreMenuOpen(false);
    setBlockModalOpen(true);
  };

  const handleBlockSuccess = () => {
    setIsBlockedByMe(true);
    setIsFollowing(false);
    setIsRequested(false);
    setFollowersCount((prev) => Math.max(0, prev - 1));
  };

  const handleUnblockSuccess = () => {
    setIsBlockedByMe(false);
  };

  // Toggle mute user
  const handleToggleMute = async () => {
    const targetId = userId || profile?.id;
    if (!targetId) return;
    try {
      setMoreMenuOpen(false);
      if (isMuted) {
        await settingsService.unmuteUser(targetId);
        setIsMuted(false);
        showSuccess(`Unmuted @${profile.username}`);
      } else {
        await settingsService.muteUser(targetId, true, true);
        setIsMuted(true);
        showSuccess(`Muted @${profile.username}. Their posts won't appear in your feed.`);
      }
    } catch (err) {
      showError(err.message || 'Failed to update mute setting');
    }
  };

  // Avatar Upload
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadRes = await mediaService.uploadMedia(file, 'avatar');
      const mediaUrl = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.url || uploadRes?.data?.url;
      if (!mediaUrl) throw new Error('No media URL returned from server');
      await userService.updateAvatar(mediaUrl);

      setProfile((prev) => ({
        ...prev,
        avatarUrl: mediaUrl,
        profilePictureUrl: mediaUrl,
      }));
      updateUser({
        ...currentUser,
        avatarUrl: mediaUrl,
        profilePictureUrl: mediaUrl,
      });
      showSuccess('Profile photo updated!');
    } catch (err) {
      showError(err.message || 'Failed to update photo');
    }
  };

  const handleDeleteGridPost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(postId);
      showSuccess('Post deleted successfully');
      setGridMenuPost(null);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      window.dispatchEvent(new CustomEvent('post:refresh'));
      window.dispatchEvent(new CustomEvent('feed:refresh'));
    } catch (err) {
      showError(err.message || 'Failed to delete post');
    }
  };

  const handleDeleteGridReel = async (reelId) => {
    if (!window.confirm('Delete this reel? It will be moved to Recently Deleted for 30 days.')) return;
    try {
      await reelService.deleteReel(reelId);
      showSuccess('Reel moved to Recently Deleted');
      setGridMenuReel(null);
      setReels((prev) => prev.filter((r) => r.id !== reelId));
      window.dispatchEvent(new CustomEvent('reel:refresh'));
    } catch (err) {
      showError(err.message || 'Failed to delete reel');
    }
  };

  const handleTogglePinGridPost = async (postId) => {
    try {
      const res = await postService.togglePinPost(postId);
      const isPinned = Boolean(res?.data?.isPinned ?? res?.isPinned);
      showSuccess(isPinned ? 'Post pinned to your profile' : 'Post unpinned from your profile');
      setGridMenuPost(null);
      setPosts((prev) => {
        const updated = prev.map((p) => (p.id === postId ? { ...p, isPinned } : p));
        return [...updated].sort((a, b) => {
          if (Boolean(a.isPinned) === Boolean(b.isPinned)) return 0;
          return a.isPinned ? -1 : 1;
        });
      });
      window.dispatchEvent(new CustomEvent('post:refresh'));
      window.dispatchEvent(new CustomEvent('feed:refresh'));
    } catch (err) {
      showError(err.message || 'Failed to toggle pin post');
    }
  };

  const handleTogglePinGridReel = async (reelId) => {
    try {
      const res = await reelService.togglePinReel(reelId);
      const isPinned = Boolean(res?.data?.isPinned ?? res?.isPinned);
      showSuccess(isPinned ? 'Reel pinned to your profile' : 'Reel unpinned from your profile');
      setGridMenuReel(null);
      setReels((prev) => {
        const updated = prev.map((r) => (r.id === reelId ? { ...r, isPinned } : r));
        return [...updated].sort((a, b) => {
          if (Boolean(a.isPinned) === Boolean(b.isPinned)) return 0;
          return a.isPinned ? -1 : 1;
        });
      });
      window.dispatchEvent(new CustomEvent('reel:refresh'));
    } catch (err) {
      showError(err.message || 'Failed to toggle pin reel');
    }
  };

  const handleToggleArchiveGridPost = async (postId) => {
    try {
      const res = await postService.toggleArchivePost(postId);
      const isArch = Boolean(res?.data?.isArchived ?? res?.isArchived);
      showSuccess(isArch ? 'Post archived' : 'Post unarchived');
      setGridMenuPost(null);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      window.dispatchEvent(new CustomEvent('post:refresh'));
      window.dispatchEvent(new CustomEvent('feed:refresh'));
    } catch (err) {
      showError(err.message || 'Failed to archive post');
    }
  };

  const handleToggleArchiveGridReel = async (reelId) => {
    try {
      const res = await reelService.toggleArchiveReel(reelId);
      const isArch = Boolean(res?.data?.isArchived ?? res?.isArchived);
      showSuccess(isArch ? 'Reel archived' : 'Reel unarchived');
      setGridMenuReel(null);
      setReels((prev) => prev.filter((r) => r.id !== reelId));
      window.dispatchEvent(new CustomEvent('reel:refresh'));
    } catch (err) {
      showError(err.message || 'Failed to archive reel');
    }
  };

  // Save text profile edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const res = await userService.updateProfile({
        displayName: editFormData.displayName.trim(),
        bio: editFormData.bio.trim(),
        websiteUrl: editFormData.websiteUrl.trim(),
        category: editFormData.category?.trim() || null,
        pronouns: editFormData.pronouns?.trim() || null,
        gender: editFormData.gender || null,
      });
      const updated = res?.data || res;
      setProfile((prev) => ({ ...prev, ...updated }));
      updateUser({ ...currentUser, ...updated });
      setIsEditing(false);
      showSuccess('Profile saved');
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setSavingEdit(false);
    }
  };

  const effectiveUserId = isOwnProfile ? currentUser?.id : userId;

  const activePostUploads = isOwnProfile
    ? (uploadCtx?.uploads || []).filter((u) => u.type === 'post' && u.status === 'uploading')
    : [];

  const activeReelUploads = isOwnProfile
    ? (uploadCtx?.uploads || []).filter((u) => u.type === 'reel' && u.status === 'uploading')
    : [];

  const uploadingStory = isOwnProfile
    ? (uploadCtx?.uploads || []).find((u) => u.type === 'story' && u.status === 'uploading')
    : null;

  const hasActiveStory = Boolean(
    uploadingStory ||
    profile?.hasStory ||
    (Array.isArray(userStories) && userStories.length > 0)
  );

  const handleAvatarClick = () => {
    if (hasActiveStory) {
      setStoryViewerOpen(true);
    } else if (isOwnProfile) {
      avatarInputRef.current?.click();
    }
  };

  const effectiveStoryGroups = React.useMemo(() => {
    const allStories = [...userStories];
    if (uploadingStory) {
      allStories.push({
        id: `uploading-story-${uploadingStory.id}`,
        mediaUrl: uploadingStory.mediaUrl || uploadingStory.thumbnail,
        mediaType: uploadingStory.mediaType || 'IMAGE',
        isUploading: true,
        uploadProgress: uploadingStory.progress || 10,
        createdAt: new Date().toISOString(),
        isCloseFriends: uploadingStory.isCloseFriends || false,
        question: uploadingStory.question ? { prompt: uploadingStory.question, totalResponses: 0 } : null,
        poll: uploadingStory.poll,
        quiz: uploadingStory.quiz,
        slider: uploadingStory.slider,
        countdown: uploadingStory.countdown,
        link: uploadingStory.link,
        location: uploadingStory.location,
        hashtag: uploadingStory.hashtag,
        audioTitle: uploadingStory.audioTitle,
        audioArtist: uploadingStory.audioArtist,
        viewCount: 0,
      });
    }

    if (allStories.length === 0) return [];

    return [
      {
        author: {
          id: profile?.id || currentUser?.id,
          username: profile?.username || currentUser?.username,
          displayName: profile?.displayName || currentUser?.displayName,
          avatarUrl: profile?.profilePictureUrl || profile?.avatarUrl || currentUser?.avatarUrl,
        },
        stories: allStories,
        hasUnviewed: allStories.some((s) => !s.viewed),
        isCloseFriends: allStories.some((s) => s.isCloseFriends),
      },
    ];
  }, [userStories, uploadingStory, profile, currentUser]);

  useEffect(() => {
    const handlePostRefresh = () => {
      if (isOwnProfile) loadUserPosts();
    };
    const handleReelRefresh = () => {
      if (isOwnProfile) loadUserReels();
    };
    const handleStoryRefresh = () => {
      if (effectiveUserId) {
        storyService.getUserStories(effectiveUserId)
          .then((sRes) => {
            const sData = sRes?.data?.data || sRes?.data || sRes;
            if (sData?.stories && Array.isArray(sData.stories)) {
              setUserStories(sData.stories);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('post:refresh', handlePostRefresh);
    window.addEventListener('feed:refresh', handlePostRefresh);
    window.addEventListener('reel:refresh', handleReelRefresh);
    window.addEventListener('story:refresh', handleStoryRefresh);

    return () => {
      window.removeEventListener('post:refresh', handlePostRefresh);
      window.removeEventListener('feed:refresh', handlePostRefresh);
      window.removeEventListener('reel:refresh', handleReelRefresh);
      window.removeEventListener('story:refresh', handleStoryRefresh);
    };
  }, [isOwnProfile, effectiveUserId, loadUserPosts, loadUserReels]);

  // Global click outside listener to auto-dismiss post/reel grid dropdown menus
  useEffect(() => {
    if (!gridMenuPost && !gridMenuReel) return;
    const handleClickOutside = () => {
      setGridMenuPost(null);
      setGridMenuReel(null);
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [gridMenuPost, gridMenuReel]);

  const handleOpenHighlight = async (hl) => {
    if (!hl?.id) return;
    try {
      const res = await storyService.getHighlightById(hl.id);
      const detail = res?.data || res;
      const highlightStories = detail?.stories || [];
      if (!Array.isArray(highlightStories) || highlightStories.length === 0) {
        showSuccess(`"${hl.title || 'Highlight'}" has no stories yet`);
        return;
      }
      setActiveHighlightGroup([
        {
          id: `highlight-${detail?.id || hl.id}`,
          isHighlight: true,
          highlightId: detail?.id || hl.id,
          highlightTitle: detail?.title || hl.title || 'Highlight',
          author: {
            id: detail?.author?.id || profile?.id || currentUser?.id,
            username: detail?.author?.username || profile?.username || currentUser?.username,
            displayName: detail?.author?.displayName || profile?.displayName || currentUser?.displayName,
            avatarUrl:
              detail?.author?.avatarUrl ||
              profile?.profilePictureUrl ||
              profile?.avatarUrl ||
              currentUser?.avatarUrl,
          },
          stories: highlightStories,
          hasUnviewed: false,
          isCloseFriends: false,
        },
      ]);
    } catch (err) {
      showError(err?.message || 'Unable to load highlight stories');
    }
  };

  const handleDeleteHighlightFromProfile = async (hlId) => {
    if (!hlId) return;
    const ok = window.confirm('Are you sure you want to delete this highlight?');
    if (!ok) return;
    try {
      await storyService.deleteHighlight(hlId);
      showSuccess('Highlight deleted');
      fetchHighlights();
    } catch (err) {
      showError(err?.message || 'Failed to delete highlight');
    }
  };

  if (loadingProfile) {
    return (
      <div className="w-full max-w-[935px] mx-auto p-4 flex flex-col items-center gap-6">
        <SkeletonProfileHeader />
        <SkeletonMediaGrid count={6} />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={Globe}
        title="User not found"
        description="The link you followed may be broken, or the user profile may have been removed."
        actionLabel="Go to Home"
        onAction={() => navigate('/')}
      />
    );
  }

  const renderTabContent = () => {
    if (!isOwnProfile && profile?.isPrivate && !isFollowing && !isViewerAdmin) {
      return (
        <div className="profile-private-notice">
          <div className="profile-private-lock-icon">
            <Lock size={36} />
          </div>
          <h3 className="profile-private-title">This account is private</h3>
          <p className="profile-private-desc">Follow this account to see their photos and videos.</p>
        </div>
      );
    }

    if (activeTab === 'posts') {
      if (loadingPosts) {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        );
      }
      if (posts.length === 0 && activePostUploads.length === 0) {
        const isProfileAdmin = profile?.role === 'ROLE_ADMIN' || profile?.role === 'ADMIN' || profile?.username?.toLowerCase() === 'admin';
        return (
          <EmptyState
            icon={Camera}
            title={isProfileAdmin ? "System Administrator" : "No Posts Yet"}
            description={
              isProfileAdmin
                ? "Official system administrator account."
                : (isOwnProfile ? "When you share photos and videos, they will appear on your profile." : "This user hasn't posted anything yet.")
            }
            actionLabel={(!isProfileAdmin && isOwnProfile) ? "Share your first photo" : undefined}
            onAction={(!isProfileAdmin && isOwnProfile) ? () => window.dispatchEvent(new CustomEvent('open-create-modal')) : undefined}
          />
        );
      }
      return (
        <div className="profile-grid">
          {/* Optimistic uploading posts */}
          {activePostUploads.map((up) => {
            const isVid = up.mediaType === 'VIDEO' || up.mediaItems?.[0]?.type === 'VIDEO';
            const src = up.thumbnail || up.mediaUrl || up.mediaItems?.[0]?.previewUrl;
            return (
              <div
                key={up.id}
                className="profile-grid-item profile-grid-uploading-item"
                onClick={() => setSelectedPostId(`uploading-post-${up.id}`)}
                title={`Post is uploading (${up.progress || 10}%)...`}
              >
                {isVid ? (
                  <video src={src} className="profile-grid-media" muted autoPlay loop playsInline />
                ) : (
                  <img src={src} alt="Uploading" className="profile-grid-media" />
                )}
                <div className="profile-grid-uploading-overlay">
                  <RotateCw size={22} className="story-upload-spinning-icon" />
                  <span className="profile-grid-uploading-pct">{up.progress || 10}%</span>
                  <div className="profile-grid-uploading-track">
                    <div className="profile-grid-uploading-bar" style={{ width: `${Math.max(10, up.progress || 10)}%` }} />
                  </div>
                  <span className="profile-grid-uploading-msg">{up.statusMessage || 'Sharing...'}</span>
                </div>
              </div>
            );
          })}
          {posts.map((post) => {
            const media = post.media?.[0];
            const postUserId = String(post.userId || post.author?.id || post.author?.userId || '').toLowerCase();
            const isPostOwner = Boolean(
              isOwnProfile ||
              isViewerAdmin ||
              (myUserId && postUserId && myUserId === postUserId)
            );
            return (
              <div
                key={post.id}
                className={`profile-grid-item ${gridMenuPost?.id === post.id ? 'dropdown-active' : ''}`}
                onClick={() => setSelectedPostId(post.id)}
              >
                {media?.mediaType === 'VIDEO' ? (
                  <video
                    src={media.mediaUrl}
                    poster={getVideoPosterUrl(media.mediaUrl, post.thumbnailUrl)}
                    className="profile-grid-media"
                    muted
                    preload="none"
                  />
                ) : (
                  <ProgressiveImage
                    src={media?.mediaUrl}
                    alt={post.caption || 'Post image'}
                    className="profile-grid-media"
                    loading="lazy"
                  />
                )}
                {/* Top-Right Badges Bar: Indicator (Carousel/Pin/Video) + Three-Dot Options Button */}
                <div className="profile-grid-top-badges" onClick={(e) => e.stopPropagation()}>
                  {post.isPinned ? (
                    <div className="profile-corner-badge pinned" title="Pinned to profile">
                      <Pin size={13} color="#fff" />
                    </div>
                  ) : ((post.media?.length || 1) > 1) ? (
                    <div className="profile-corner-badge" title="Carousel">
                      <Layers size={13} color="#fff" />
                    </div>
                  ) : (post.isReel || media?.mediaType === 'VIDEO') ? (
                    <div className="profile-corner-badge" title="Video">
                      <Film size={13} color="#fff" />
                    </div>
                  ) : null}

                  {isPostOwner && (
                    <div className="profile-grid-opts-wrapper" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="profile-grid-item-opts-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGridMenuPost((prev) => (prev?.id === post.id ? null : post));
                        }}
                        aria-label="Post options"
                        title="Post options"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {gridMenuPost?.id === post.id && (
                        <div className="profile-grid-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="profile-dropdown-item"
                            onClick={() => handleTogglePinGridPost(post.id)}
                          >
                            <Pin size={14} />
                            <span>{post.isPinned ? 'Unpin from your profile' : 'Pin to your profile'}</span>
                          </button>
                          <button
                            type="button"
                            className="profile-dropdown-item danger"
                            onClick={() => handleDeleteGridPost(post.id)}
                          >
                            <Trash2 size={14} />
                            <span>Delete post</span>
                          </button>
                          <button
                            type="button"
                            className="profile-dropdown-item"
                            onClick={() => handleToggleArchiveGridPost(post.id)}
                          >
                            <Archive size={14} />
                            <span>{post.isArchived ? 'Show on profile' : 'Archive post'}</span>
                          </button>
                          <button
                            type="button"
                            className="profile-dropdown-item"
                            onClick={() => {
                              const url = `${window.location.origin}/posts/${post.id}`;
                              navigator.clipboard.writeText(url);
                              showSuccess('Link copied to clipboard!');
                              setGridMenuPost(null);
                            }}
                          >
                            <Copy size={14} />
                            <span>Copy link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="profile-grid-overlay">
                  <div className="overlay-stat">
                    <Heart size={20} fill="#fff" />
                    <span>{formatCount(post.likeCount || 0)}</span>
                  </div>
                  <div className="overlay-stat">
                    <MessageCircle size={20} fill="#fff" />
                    <span>{formatCount(post.commentCount || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'reels') {
      if (reels.length === 0 && activeReelUploads.length === 0) {
        return (
          <EmptyState
            icon={Film}
            title="No Reels Yet"
            description="Videos uploaded by this user will appear here."
          />
        );
      }
      return (
        <div className="profile-reels-grid">
          {/* Optimistic uploading reels */}
          {activeReelUploads.map((up) => {
            const src = up.thumbnail || up.videoUrl || up.mediaUrl;
            return (
              <div
                key={up.id}
                className="profile-reel-item profile-reel-uploading-item"
                onClick={() => navigate('/reels')}
                title={`Reel is uploading (${up.progress || 10}%)...`}
              >
                <video src={src} className="profile-reel-media" muted autoPlay loop playsInline />
                <div className="profile-grid-uploading-overlay">
                  <RotateCw size={22} className="story-upload-spinning-icon" />
                  <span className="profile-grid-uploading-pct">{up.progress || 10}%</span>
                  <div className="profile-grid-uploading-track">
                    <div className="profile-grid-uploading-bar" style={{ width: `${Math.max(10, up.progress || 10)}%` }} />
                  </div>
                  <span className="profile-grid-uploading-msg">{up.statusMessage || 'Sharing...'}</span>
                </div>
              </div>
            );
          })}
          {reels.map((reel) => {
            const reelUserId = String(reel.userId || reel.author?.id || reel.author?.userId || '').toLowerCase();
            const isReelOwner = Boolean(
              isOwnProfile ||
              isViewerAdmin ||
              (myUserId && reelUserId && myUserId === reelUserId)
            );
            return (
            <div
              key={reel.id}
              className={`profile-reel-item ${gridMenuReel?.id === reel.id ? 'dropdown-active' : ''}`}
              onClick={() => navigate(`/reels/${reel.id}`)}
            >
              <video
                src={reel.videoUrl}
                poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                className="profile-reel-media"
                muted
                playsInline
                preload="none"
              />
              {/* Top-Right Badges Bar: Reel Options & Pin badge */}
              <div className="profile-grid-top-badges" onClick={(e) => e.stopPropagation()}>
                {reel.isPinned && (
                  <div className="profile-corner-badge pinned" title="Pinned to profile">
                    <Pin size={13} color="#fff" />
                  </div>
                )}
                {isReelOwner && (
                  <div className="profile-grid-opts-wrapper" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="profile-grid-item-opts-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGridMenuReel((prev) => (prev?.id === reel.id ? null : reel));
                      }}
                      aria-label="Reel options"
                      title="Reel options"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {gridMenuReel?.id === reel.id && (
                      <div className="profile-grid-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="profile-dropdown-item"
                          onClick={() => handleTogglePinGridReel(reel.id)}
                        >
                          <Pin size={14} />
                          <span>{reel.isPinned ? 'Unpin from your profile' : 'Pin to your profile'}</span>
                        </button>
                        <button
                          type="button"
                          className="profile-dropdown-item danger"
                          onClick={() => handleDeleteGridReel(reel.id)}
                        >
                          <Trash2 size={14} />
                          <span>Delete reel</span>
                        </button>
                        <button
                          type="button"
                          className="profile-dropdown-item"
                          onClick={() => handleToggleArchiveGridReel(reel.id)}
                        >
                          <Archive size={14} />
                          <span>{reel.isArchived ? 'Show on profile' : 'Archive reel'}</span>
                        </button>
                        <button
                          type="button"
                          className="profile-dropdown-item"
                          onClick={() => {
                            const url = `${window.location.origin}/reels/${reel.id}`;
                            navigator.clipboard.writeText(url);
                            showSuccess('Reel link copied to clipboard!');
                            setGridMenuReel(null);
                          }}
                        >
                          <Copy size={14} />
                          <span>Copy link</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="profile-reel-view-count">
                <Play size={11} fill="#fff" strokeWidth={0} />
                <span>{formatCount(reel.viewCount || 0)}</span>
              </div>
              <div className="profile-grid-overlay">
                <div className="overlay-stat">
                  <Heart size={20} fill="#fff" />
                  <span>{formatCount(reel.likeCount || 0)}</span>
                </div>
                <div className="overlay-stat">
                  <MessageCircle size={20} fill="#fff" />
                  <span>{formatCount(reel.commentCount || 0)}</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'saved') {
      if (selectedCollection) {
        return (
          <div>
            <div className="collection-detail-header">
              <button
                type="button"
                className="collection-back-btn"
                onClick={() => setSelectedCollection(null)}
              >
                <ArrowLeft size={16} />
                <span>{selectedCollection.name}</span>
              </button>
            </div>

            <div className="collection-subtab-bar" style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                className={`saved-subtab-btn ${collectionTab === 'posts' ? 'active' : ''}`}
                onClick={() => handleSwitchCollectionTab('posts')}
              >
                <Grid size={15} />
                <span>Posts ({collectionPosts.length})</span>
              </button>
              <button
                type="button"
                className={`saved-subtab-btn ${collectionTab === 'reels' ? 'active' : ''}`}
                onClick={() => handleSwitchCollectionTab('reels')}
              >
                <Film size={15} />
                <span>Reels ({collectionReels.length})</span>
              </button>
            </div>

            {collectionTab === 'posts' ? (
              loadingCollectionPosts ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : collectionPosts.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No posts in this collection"
                description="Save posts or reels to add them here."
              />
            ) : (
              <div className="profile-grid">
                {collectionPosts.map((post) => {
                  const media = post.media?.[0];
                  const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
                  return (
                    <div
                      key={post.id}
                      className="profile-grid-item"
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      {isVideo ? (
                        <video
                          src={media?.mediaUrl}
                          poster={getVideoPosterUrl(media?.mediaUrl, post.thumbnailUrl)}
                          className="profile-grid-media"
                          muted
                          preload="none"
                        />
                      ) : (
                        <ProgressiveImage
                          src={media?.mediaUrl}
                          alt={post.caption || 'Saved post'}
                          className="profile-grid-media"
                          loading="lazy"
                        />
                      )}
                      <div className="profile-grid-overlay">
                        <div className="overlay-stat">
                          <Heart size={20} fill="#fff" />
                          <span>{formatCount(post.likeCount || 0)}</span>
                        </div>
                        <div className="overlay-stat">
                          <MessageCircle size={20} fill="#fff" />
                          <span>{formatCount(post.commentCount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )) : loadingCollectionReels ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : collectionReels.length === 0 ? (
              <EmptyState
                icon={Film}
                title="No reels in this collection"
                description="Save reels from the reels feed into this collection to see them here."
              />
            ) : (
              <div className="profile-reels-grid">
                {collectionReels.map((reel) => (
                  <div
                    key={reel.id}
                    className="profile-reel-item"
                    onClick={() => navigate(`/reels/${reel.id}`)}
                  >
                    <video
                      src={reel.videoUrl}
                      poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                      className="profile-reel-media"
                      muted
                      playsInline
                      preload="none"
                    />
                    <div className="profile-reel-view-count">
                      <Play size={11} fill="#fff" strokeWidth={0} />
                      <span>{formatCount(reel.viewCount || 0)}</span>
                    </div>
                    <div className="profile-grid-overlay">
                      <div className="overlay-stat">
                        <Heart size={20} fill="#fff" />
                        <span>{formatCount(reel.likeCount || 0)}</span>
                      </div>
                      <div className="overlay-stat">
                        <MessageCircle size={20} fill="#fff" />
                        <span>{formatCount(reel.commentCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <div>
          <div className="saved-header-row">
            <span className="saved-header-hint">Only you can see what you've saved</span>
            <button
              type="button"
              className="saved-new-collection-btn"
              onClick={() => setCreateCollectionOpen(true)}
            >
              <Plus size={16} />
              <span>New Collection</span>
            </button>
          </div>

          <div className="saved-subtabs-row">
            <button
              type="button"
              className={`saved-subtab-btn ${savedSubTab === 'all' ? 'active' : ''}`}
              onClick={() => setSavedSubTab('all')}
            >
              All Posts
            </button>
            <button
              type="button"
              className={`saved-subtab-btn ${savedSubTab === 'reels' ? 'active' : ''}`}
              onClick={() => setSavedSubTab('reels')}
            >
              Reels ({savedReels.length})
            </button>
            <button
              type="button"
              className={`saved-subtab-btn ${savedSubTab === 'collections' ? 'active' : ''}`}
              onClick={() => setSavedSubTab('collections')}
            >
              Collections ({collections.length})
            </button>
          </div>

          {savedSubTab === 'collections' ? (
            loadingCollections ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : collections.length === 0 ? (
              <EmptyState
                icon={Folder}
                title="No Collections Yet"
                description="Save posts into custom collections to organize them."
              />
            ) : (
              <div className="collections-grid">
                {collections.map((coll) => (
                  <div
                    key={coll.id}
                    className="collection-card"
                    onClick={() => handleSelectCollection(coll)}
                  >
                    {coll.coverMediaUrl ? (
                      <img src={coll.coverMediaUrl} alt={coll.name} className="collection-card-cover" />
                    ) : (
                      <div className="collection-card-placeholder">
                        <Folder size={32} />
                      </div>
                    )}
                    <div className="collection-card-details">
                      <div className="collection-card-title">{coll.name}</div>
                      <div className="collection-card-count">{coll.itemCount || 0} saved</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : savedSubTab === 'reels' ? (
            loadingSavedReels ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : savedReels.length === 0 ? (
              <EmptyState
                icon={Film}
                title="No Saved Reels"
                description="Save reels from the reels feed to watch them anytime."
              />
            ) : (
              <div className="profile-reels-grid">
                {savedReels.map((reel) => (
                  <div
                    key={reel.id}
                    className="profile-reel-item"
                    onClick={() => navigate(`/reels/${reel.id}`)}
                  >
                    <video
                src={reel.videoUrl}
                poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                className="profile-reel-media"
                muted
                playsInline
                preload="none"
              />
                    <div className="profile-reel-view-count">
                      <Play size={11} fill="#fff" strokeWidth={0} />
                      <span>{formatCount(reel.viewCount || 0)}</span>
                    </div>
                    <button
                      type="button"
                      className="profile-reel-unsave-btn"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await reelService.unsaveReel(reel.id);
                          setSavedReels((prev) => prev.filter((r) => r.id !== reel.id));
                          showSuccess('Reel removed from saved');
                        } catch {
                          showError('Failed to remove saved reel');
                        }
                      }}
                      title="Remove from saved"
                      aria-label="Remove from saved"
                    >
                      <Bookmark size={15} fill="#fff" color="#fff" />
                    </button>
                    <div className="profile-grid-overlay">
                      <div className="overlay-stat">
                        <Heart size={20} fill="#fff" />
                        <span>{formatCount(reel.likeCount || 0)}</span>
                      </div>
                      <div className="overlay-stat">
                        <MessageCircle size={20} fill="#fff" />
                        <span>{formatCount(reel.commentCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            loadingSaved ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : savedPosts.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="Saved Posts"
                description="Only you can see what you've saved."
              />
            ) : (
              <div className="profile-grid">
                {savedPosts.map((post) => {
                  const media = post.media?.[0];
                  const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
                  return (
                    <div
                      key={post.id}
                      className="profile-grid-item"
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      {isVideo ? (
                        <video
                          src={media?.mediaUrl}
                          poster={getVideoPosterUrl(media?.mediaUrl, post.thumbnailUrl)}
                          className="profile-grid-media"
                          muted
                          preload="none"
                        />
                      ) : (
                        <ProgressiveImage
                          src={media?.mediaUrl}
                          alt={post.caption || 'Saved post'}
                          className="profile-grid-media"
                          loading="lazy"
                        />
                      )}
                      {post.isReel ? (
                        <div className="profile-corner-badge" title="Reel">
                          <Film size={13} color="#fff" />
                        </div>
                      ) : ((post.media?.length || 1) > 1) ? (
                        <div className="profile-corner-badge" title="Carousel">
                          <Layers size={13} color="#fff" />
                        </div>
                      ) : media?.mediaType === 'VIDEO' ? (
                        <div className="profile-corner-badge" title="Video">
                          <Play size={13} fill="#fff" strokeWidth={0} />
                        </div>
                      ) : null}
                      <div className="profile-grid-overlay">
                        <div className="overlay-stat">
                          <Heart size={20} fill="#fff" />
                          <span>{formatCount(post.likeCount || 0)}</span>
                        </div>
                        <div className="overlay-stat">
                          <MessageCircle size={20} fill="#fff" />
                          <span>{formatCount(post.commentCount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      );
    }

    if (activeTab === 'tagged') {
      if (loadingTagged) {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <SkeletonMediaGrid count={6} />
          </div>
        );
      }

      if (taggedPosts.length === 0) {
        return (
          <EmptyState
            icon={Tag}
            title="Photos of you"
            description="When people tag you in photos, they'll appear here."
          />
        );
      }

      return (
        <div className="profile-grid">
          {taggedPosts.map((post) => {
            const media = post.media?.[0];
            const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
            return (
              <div
                key={post.id}
                className="profile-grid-item"
                onClick={() => setSelectedPostId(post.id)}
              >
                {isVideo ? (
                  <video
                    src={media?.mediaUrl}
                    poster={getVideoPosterUrl(media?.mediaUrl, post.thumbnailUrl)}
                    className="profile-grid-media"
                    muted
                    preload="none"
                  />
                ) : (
                  <ProgressiveImage
                    src={media?.mediaUrl}
                    alt={post.caption || 'Tagged post'}
                    className="profile-grid-media"
                    loading="lazy"
                  />
                )}
                {post.isReel ? (
                  <div className="profile-corner-badge" title="Reel">
                    <Film size={13} color="#fff" />
                  </div>
                ) : ((post.media?.length || 1) > 1) ? (
                  <div className="profile-corner-badge" title="Carousel">
                    <Layers size={13} color="#fff" />
                  </div>
                ) : (
                  <div className="profile-corner-badge" title="Tagged">
                    <Tag size={13} color="#fff" />
                  </div>
                )}
                <div className="profile-grid-overlay">
                  <div className="overlay-stat">
                    <Heart size={20} fill="#fff" />
                    <span>{formatCount(post.likeCount || 0)}</span>
                  </div>
                  <div className="overlay-stat">
                    <MessageCircle size={20} fill="#fff" />
                    <span>{formatCount(post.commentCount || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'archived') {
      return (
        <div>
          <div className="tab-info-header">
            <Archive size={16} />
            <span>Only you can see the posts and reels you've archived.</span>
          </div>

          <div className="saved-subtabs-row" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`saved-subtab-btn ${archivedSubTab === 'posts' ? 'active' : ''}`}
              onClick={() => setArchivedSubTab('posts')}
            >
              Posts ({archivedPosts.length})
            </button>
            <button
              type="button"
              className={`saved-subtab-btn ${archivedSubTab === 'reels' ? 'active' : ''}`}
              onClick={() => setArchivedSubTab('reels')}
            >
              Reels ({archivedReels.length})
            </button>
            <button
              type="button"
              className={`saved-subtab-btn ${archivedSubTab === 'stories' ? 'active' : ''}`}
              onClick={() => setArchivedSubTab('stories')}
            >
              Stories ({archivedStories.length})
            </button>
          </div>

          {archivedSubTab === 'posts' ? (
            loadingArchived ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : archivedPosts.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="No Archived Posts"
                description="Posts you archive are hidden from your profile grid and saved here."
              />
            ) : (
              <div className="profile-grid">
                {archivedPosts.map((post) => {
                  const media = post.media?.[0];
                  const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
                  return (
                    <div
                      key={post.id}
                      className="profile-grid-item"
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      {isVideo ? (
                        <video
                          src={media?.mediaUrl}
                          poster={getVideoPosterUrl(media?.mediaUrl, post.thumbnailUrl)}
                          className="profile-grid-media"
                          muted
                          preload="none"
                        />
                      ) : (
                        <ProgressiveImage
                          src={media?.mediaUrl}
                          alt={post.caption || 'Archived post'}
                          className="profile-grid-media"
                          loading="lazy"
                        />
                      )}
                      <div className="profile-grid-overlay">
                        <button
                          type="button"
                          className="profile-overlay-action-btn"
                          onClick={(e) => handleUnarchivePost(e, post.id)}
                          title="Show on profile"
                        >
                          <Archive size={14} />
                          <span>Show on profile</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : archivedSubTab === 'reels' ? (
            loadingArchivedReels ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : archivedReels.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="No Archived Reels"
                description="Reels you archive are hidden from your feed and profile, and saved here."
              />
            ) : (
              <div className="profile-reels-grid">
                {archivedReels.map((reel) => (
                  <div
                    key={reel.id}
                    className="profile-reel-item"
                    onClick={() => navigate(`/reels/${reel.id}`)}
                  >
                    <video
                src={reel.videoUrl}
                poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                className="profile-reel-media"
                muted
                playsInline
                preload="none"
              />
                    <div className="profile-reel-view-count">
                      <Play size={11} fill="#fff" strokeWidth={0} />
                      <span>{formatCount(reel.viewCount || 0)}</span>
                    </div>
                    <div className="profile-grid-overlay">
                      <button
                        type="button"
                        className="profile-overlay-action-btn"
                        onClick={(e) => handleUnarchiveReel(e, reel.id)}
                        title="Show on profile"
                      >
                        <Archive size={14} />
                        <span>Show on profile</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            loadingArchivedStories ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : archivedStories.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="No Archived Stories"
                description="Your stories are automatically saved to your private archive after 24 hours."
              />
            ) : (
              <div className="profile-grid">
                {archivedStories.map((story) => (
                  <div key={story.id} className="profile-grid-item">
                    {story.mediaType === 'VIDEO' ? (
                      <video
                        src={story.mediaUrl}
                        poster={getVideoPosterUrl(story.mediaUrl)}
                        className="profile-grid-media"
                        muted
                        preload="none"
                      />
                    ) : (
                      <ProgressiveImage
                        src={story.mediaUrl}
                        alt="Archived story"
                        className="profile-grid-media"
                        loading="lazy"
                      />
                    )}
                    <div
                      className="profile-corner-badge"
                      title="Date shared"
                      style={{
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#fff',
                      }}
                    >
                      {new Date(story.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="profile-grid-overlay">
                      <button
                        type="button"
                        className="profile-overlay-action-btn"
                        onClick={(e) => handleReshareStory(e, story.id)}
                        title="Reshare memory to story"
                      >
                        <RotateCcw size={14} />
                        <span>Reshare to Story</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      );
    }

    if (activeTab === 'recently_deleted') {
      return (
        <div>
          <div className="tab-info-header warning">
            <Trash2 size={16} />
            <span>Only you can see deleted items. Content is permanently deleted after 30 days.</span>
          </div>

          <div className="saved-subtabs-row" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`saved-subtab-btn ${deletedSubTab === 'posts' ? 'active' : ''}`}
              onClick={() => setDeletedSubTab('posts')}
            >
              Posts ({recentlyDeletedPosts.length})
            </button>
            <button
              type="button"
              className={`saved-subtab-btn ${deletedSubTab === 'reels' ? 'active' : ''}`}
              onClick={() => setDeletedSubTab('reels')}
            >
              Reels ({recentlyDeletedReels.length})
            </button>
          </div>

          {deletedSubTab === 'posts' ? (
            loadingRecentlyDeleted ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : recentlyDeletedPosts.length === 0 ? (
              <EmptyState
                icon={Trash2}
                title="No Recently Deleted Posts"
                description="When you delete a post, it will be kept here for 30 days before being permanently deleted."
              />
            ) : (
              <div className="profile-grid">
                {recentlyDeletedPosts.map((post) => {
                  const media = post.media?.[0];
                  const isVideo = media?.mediaType === 'VIDEO' || Boolean(post.isReel);
                  const daysLeft = post.daysRemainingUntilPermanentDelete ?? 30;
                  return (
                    <div
                      key={post.id}
                      className="profile-grid-item recently-deleted-item"
                    >
                      {isVideo ? (
                        <video
                          src={media?.mediaUrl}
                          poster={getVideoPosterUrl(media?.mediaUrl, post.thumbnailUrl)}
                          className="profile-grid-media"
                          muted
                          preload="none"
                        />
                      ) : (
                        <ProgressiveImage
                          src={media?.mediaUrl}
                          alt={post.caption || 'Deleted post'}
                          className="profile-grid-media"
                          loading="lazy"
                        />
                      )}
                      <div className="days-left-badge">
                        <Clock size={11} />
                        <span>{daysLeft}d left</span>
                      </div>
                      <div className="profile-grid-overlay recently-deleted-overlay">
                        <button
                          type="button"
                          className="profile-overlay-action-btn restore"
                          onClick={(e) => handleRestorePost(e, post.id)}
                          title="Restore post to profile"
                        >
                          <RotateCcw size={14} />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          className="profile-overlay-action-btn danger"
                          onClick={(e) => handlePermanentDeletePost(e, post.id)}
                          title="Delete permanently"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            loadingDeletedReels ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <SkeletonMediaGrid count={6} />
              </div>
            ) : recentlyDeletedReels.length === 0 ? (
              <EmptyState
                icon={Trash2}
                title="No Recently Deleted Reels"
                description="When you delete a reel, it will be kept here for 30 days before being permanently deleted."
              />
            ) : (
              <div className="profile-reels-grid">
                {recentlyDeletedReels.map((reel) => {
                  const daysLeft = reel.daysRemainingUntilPermanentDelete ?? 30;
                  return (
                    <div
                      key={reel.id}
                      className="profile-reel-item recently-deleted-item"
                    >
                      <video
                src={reel.videoUrl}
                poster={getVideoPosterUrl(reel.videoUrl, reel.thumbnailUrl)}
                className="profile-reel-media"
                muted
                playsInline
                preload="none"
              />
                      <div className="days-left-badge">
                        <Clock size={11} />
                        <span>{daysLeft}d left</span>
                      </div>
                      <div className="profile-grid-overlay recently-deleted-overlay">
                        <button
                          type="button"
                          className="profile-overlay-action-btn restore"
                          onClick={(e) => handleRestoreReel(e, reel.id)}
                          title="Restore reel to profile"
                        >
                          <RotateCcw size={14} />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          className="profile-overlay-action-btn danger"
                          onClick={(e) => handlePermanentDeleteReel(e, reel.id)}
                          title="Delete permanently"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="profile-page-container">
      {/* Header Section */}
      <header className="profile-header-section">
        <div className="profile-avatar-column">
          <div className="profile-avatar-note-container">
            {activeNote && (
              <div
                className={`profile-avatar-note-bubble ${isOwnProfile ? 'clickable' : ''}`}
                onClick={() => isOwnProfile && setNoteModalOpen(true)}
                role="button"
                tabIndex={0}
                title={activeNote.text}
              >
                <div className="note-bubble-content">
                  <span className="note-bubble-text">{activeNote.text}</span>
                  {isOwnProfile && <span className="note-bubble-toggle-arrow">↕</span>}
                </div>
                <div className="note-bubble-pointer" />
              </div>
            )}

            <div
              className={`profile-avatar-trigger ${hasActiveStory ? 'has-live-story' : ''}`}
              onClick={handleAvatarClick}
              title={
                uploadingStory
                  ? `Story is uploading (${uploadingStory.progress}%)...`
                  : hasActiveStory
                  ? 'View story'
                  : isOwnProfile
                  ? 'Change photo'
                  : ''
              }
            >
              <Avatar
                src={profile.profilePictureUrl || profile.avatarUrl}
                alt={profile.username}
                size="xxl"
                hasStory={hasActiveStory}
                storyViewed={Boolean(
                  !uploadingStory &&
                  Array.isArray(userStories) &&
                  userStories.length > 0 &&
                  userStories.every((s) => s.viewed)
                )}
                isUploading={Boolean(uploadingStory)}
              />
              {isOwnProfile && (
                <div
                  className="profile-avatar-overlay"
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarInputRef.current?.click();
                  }}
                  title="Change photo"
                >
                  <Camera size={28} />
                </div>
              )}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFile}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            {isOwnProfile && !activeNote && (
              <button
                type="button"
                className="profile-add-note-pill"
                onClick={() => setNoteModalOpen(true)}
              >
                + Share a note
              </button>
            )}
          </div>
        </div>

        <div className="profile-info-column">
          {/* Username & Action Buttons */}
          <div className="profile-username-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="profile-username-title">{profile.username}</h1>
              {(profile.isVerified || profile.verified) && (
                <span title="Verified Account" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <BadgeCheck size={20} color="#ffffff" fill="#0095f6" />
                </span>
              )}
            </div>

            <div className="profile-action-buttons">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit profile'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn"
                    onClick={() => setActiveTab('archived')}
                    title="View archive"
                  >
                    View archive
                  </button>
                  {!(profile?.role === 'ROLE_ADMIN' || profile?.role === 'ADMIN' || profile?.username?.toLowerCase() === 'admin') && (
                    <button
                      type="button"
                      className="btn btn-secondary profile-btn"
                      onClick={() => setCreateHighlightOpen(true)}
                      title="Create story highlight"
                    >
                      <Sparkles size={14} />
                      <span>Highlights</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn profile-icon-btn"
                    onClick={() => setCloseFriendsModalOpen(true)}
                    title="Close Friends"
                    aria-label="Close Friends"
                  >
                    <Star size={16} style={{ color: '#2ecc71', fill: '#2ecc71' }} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn profile-icon-btn"
                    onClick={() => setQrModalOpen(true)}
                    title="QR Code Nametag"
                    aria-label="QR Code"
                  >
                    <QrCode size={17} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn profile-icon-btn profile-gear-btn"
                    onClick={() => setGearMenuOpen(true)}
                    title="Settings"
                    aria-label="Settings"
                  >
                    <Settings size={17} />
                  </button>
                </>
              ) : (
                <>
                  {isBlockedByMe ? (
                    <button
                      type="button"
                      className="btn btn-secondary profile-btn"
                      onClick={() => setUnblockModalOpen(true)}
                    >
                      Unblock
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`btn profile-btn ${isFollowing || isRequested ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={handleFollowToggle}
                      >
                        {isFollowing ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserCheck size={16} /> Following
                          </span>
                        ) : isRequested ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} /> Requested
                          </span>
                        ) : profile?.followsCurrentUser ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserPlus size={16} /> Follow Back
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserPlus size={16} /> Follow
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary profile-btn"
                        onClick={handleMessageUser}
                      >
                        <Send size={16} style={{ marginRight: '6px' }} />
                        Message
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary profile-btn"
                    onClick={() => setQrModalOpen(true)}
                    title="QR Code"
                  >
                    <QrCode size={18} />
                  </button>

                  {isViewerAdmin && (
                    <button
                      type="button"
                      className="btn btn-secondary profile-btn danger"
                      onClick={handleDeleteUserProfile}
                      style={{ borderColor: 'var(--ig-error, #ed4956)', color: 'var(--ig-error, #ed4956)' }}
                      title="Delete User Account"
                    >
                      <Trash2 size={16} style={{ marginRight: '6px' }} />
                      Delete Account
                    </button>
                  )}

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn btn-secondary profile-btn"
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {moreMenuOpen && (
                      <div className="post-options-menu" style={{ right: 0, top: '40px' }}>
                        {!isBlockedByMe && (
                          <button
                            type="button"
                            className="post-menu-item"
                            onClick={handleToggleMute}
                          >
                            <BellOff size={14} />
                            <span>{isMuted ? 'Unmute user' : 'Mute user'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="post-menu-item danger"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setReportModalOpen(true);
                          }}
                        >
                          Report user
                        </button>
                        {isBlockedByMe ? (
                          <button
                            type="button"
                            className="post-menu-item"
                            onClick={() => {
                              setMoreMenuOpen(false);
                              setUnblockModalOpen(true);
                            }}
                          >
                            Unblock user
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="post-menu-item danger"
                            onClick={handleBlockUser}
                          >
                            Block user
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="profile-stats-row">
            <div className="stat-item">
              <span className="stat-num">
                {formatCount(profile.postCount || profile.postsCount || posts.length || 0)}
              </span>
              <span>posts</span>
            </div>
            <div
              className="stat-item clickable"
              onClick={() => {
                setFollowModalType('followers');
                setFollowModalOpen(true);
              }}
            >
              <span className="stat-num">{formatCount(followersCount)}</span>
              <span>followers</span>
            </div>
            <div
              className="stat-item clickable"
              onClick={() => {
                setFollowModalType('following');
                setFollowModalOpen(true);
              }}
            >
              <span className="stat-num">{formatCount(followingCount)}</span>
              <span>following</span>
            </div>
          </div>

          {/* Bio Info */}
          <div className="profile-bio-section">
            {(profile.displayName || profile.fullName || profile.pronouns) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="profile-full-name">{profile.displayName || profile.fullName}</span>
                {profile.pronouns && (
                  <span className="profile-pronouns" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    · {profile.pronouns}
                  </span>
                )}
              </div>
            )}
            {(profile.showCategoryBadge !== false && profile.category) && (
              <span className="profile-category-pill">{profile.category}</span>
            )}
            {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                target="_blank"
                rel="noreferrer noopener"
                className="profile-website-link"
              >
                <Link2 size={14} />
                <span>{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {profile.showContactInfo && (profile.contactEmail || profile.contactPhone) && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '13px', flexWrap: 'wrap' }}>
                {profile.contactEmail && (
                  <a href={`mailto:${profile.contactEmail}`} className="profile-website-link" style={{ gap: '4px' }}>
                    <Mail size={13} /> {profile.contactEmail}
                  </a>
                )}
                {profile.contactPhone && (
                  <a href={`tel:${profile.contactPhone}`} className="profile-website-link" style={{ gap: '4px' }}>
                    <Phone size={13} /> {profile.contactPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Form (Inline) */}
      {isEditing && isOwnProfile && (
        <form onSubmit={handleSaveEdit} className="profile-edit-box">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Edit Profile Information</h3>
          <div className="editor-form-group">
            <label className="editor-label">Display Name</label>
            <input
              type="text"
              className="input"
              value={editFormData.displayName}
              onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
              maxLength={50}
            />
          </div>
          <div className="editor-form-group">
            <label className="editor-label">Pronouns</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. they/them, she/her, he/him"
              value={editFormData.pronouns || ''}
              onChange={(e) => setEditFormData({ ...editFormData, pronouns: e.target.value })}
              maxLength={50}
            />
          </div>
          <div className="editor-form-group">
            <label className="editor-label">Gender</label>
            <select
              className="input"
              value={editFormData.gender || 'PREFER_NOT_TO_SAY'}
              onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
              style={{ background: 'var(--bg-elevated)' }}
            >
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="editor-form-group">
            <label className="editor-label">Category (Creator or Business Title)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Digital Creator, Artist, Photographer, Blogger"
              value={editFormData.category || ''}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="editor-form-group">
            <label className="editor-label">Bio</label>
            <textarea
              rows={3}
              className="input"
              value={editFormData.bio}
              onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
              maxLength={150}
            />
          </div>
          <div className="editor-form-group">
            <label className="editor-label">Website</label>
            <input
              type="text"
              className="input"
              placeholder="https://example.com"
              value={editFormData.websiteUrl}
              onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingEdit}
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Story Highlights Tray */}
      {(!profile?.isPrivate || isOwnProfile || isFollowing || isViewerAdmin) && (
        <div className="profile-highlights-tray">
          {isOwnProfile && !(profile?.role === 'ROLE_ADMIN' || profile?.role === 'ADMIN' || profile?.username?.toLowerCase() === 'admin') && (
            <div
              className="highlight-tray-item highlight-add-item"
              onClick={() => setCreateHighlightOpen(true)}
              role="button"
              tabIndex={0}
            >
              <div className="highlight-new-bubble">
                <Plus size={28} strokeWidth={1.6} />
              </div>
              <span className="highlight-item-label">New</span>
            </div>
          )}

          {highlights.map((hl) => (
            <div
              key={hl.id}
              className="highlight-tray-item"
              onClick={() => handleOpenHighlight(hl)}
              role="button"
              tabIndex={0}
            >
              <div className="highlight-avatar-bubble">
                {hl.coverImageUrl ? (
                  <img src={hl.coverImageUrl} alt={hl.title} className="highlight-cover-thumbnail" />
                ) : (
                  <div className="highlight-cover-placeholder">
                    <Camera size={22} color="var(--text-secondary)" />
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    type="button"
                    className="highlight-tray-menu-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHighlightMenuId(highlightMenuId === hl.id ? null : hl.id);
                    }}
                    title="Highlight options"
                    aria-label="Highlight options"
                  >
                    <MoreVertical size={13} />
                  </button>
                )}
              </div>
              <span className="highlight-item-label" title={hl.title}>
                {hl.title || 'Highlight'}
              </span>

              {isOwnProfile && highlightMenuId === hl.id && (
                <div
                  className="highlight-tray-menu-popover"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="highlight-popover-item"
                    onClick={() => {
                      setHighlightMenuId(null);
                      setEditingHighlightId(hl.id);
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit Highlight</span>
                  </button>
                  <button
                    type="button"
                    className="highlight-popover-item danger"
                    onClick={() => {
                      setHighlightMenuId(null);
                      handleDeleteHighlightFromProfile(hl.id);
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="profile-tabs-bar">
        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid size={14} />
          <span>Posts</span>
          {activePostUploads.length > 0 && (
            <span className="profile-tab-upload-badge" title="Uploading post...">
              <RotateCw size={11} className="story-upload-spinning-icon" />
            </span>
          )}
        </button>

        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'reels' ? 'active' : ''}`}
          onClick={() => setActiveTab('reels')}
        >
          <Film size={14} />
          <span>Reels</span>
          {activeReelUploads.length > 0 && (
            <span className="profile-tab-upload-badge" title="Uploading reel...">
              <RotateCw size={11} className="story-upload-spinning-icon" />
            </span>
          )}
        </button>

        {isOwnProfile && (
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={14} />
            <span>Saved</span>
          </button>
        )}

        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'tagged' ? 'active' : ''}`}
          onClick={() => setActiveTab('tagged')}
        >
          <Tag size={14} />
          <span>Tagged</span>
        </button>

        {isOwnProfile && (
          <>
            <button
              type="button"
              className={`profile-tab-item ${activeTab === 'archived' ? 'active' : ''}`}
              onClick={() => setActiveTab('archived')}
              title="Archived posts"
            >
              <Archive size={14} />
              <span>Archived</span>
            </button>

            <button
              type="button"
              className={`profile-tab-item ${activeTab === 'recently_deleted' ? 'active' : ''}`}
              onClick={() => setActiveTab('recently_deleted')}
              title="Recently deleted posts"
            >
              <Trash2 size={14} />
              <span>Recently Deleted</span>
            </button>
          </>
        )}
      </nav>

      {/* Content Grid */}
      {renderTabContent()}



      {/* Comments Modal for clicked post */}
      {selectedPostId && (
        <CommentsModal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
          onPostUpdated={() => { loadUserPosts(); if (activeTab === "saved") loadSavedPosts(); }}
        />
      )}

      {/* Followers / Following List Modal */}
      {followModalOpen && (
        <FollowListModal
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={effectiveUserId}
          type={followModalType}
        />
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="USER"
          targetId={userId}
          onReportSuccess={() => {
            navigate('/');
          }}
        />
      )}

      {/* Block User Modal */}
      <BlockUserModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        userId={userId || profile?.id}
        username={profile?.username}
        onBlockSuccess={handleBlockSuccess}
      />

      {/* Unblock User Modal */}
      <UnblockUserModal
        isOpen={unblockModalOpen}
        onClose={() => setUnblockModalOpen(false)}
        userId={userId || profile?.id}
        username={profile?.username}
        onUnblockSuccess={handleUnblockSuccess}
      />

      {/* Create Highlight Modal */}
      {createHighlightOpen && (
        <CreateHighlightModal
          isOpen={createHighlightOpen}
          onClose={() => setCreateHighlightOpen(false)}
          onHighlightCreated={() => fetchHighlights()}
        />
      )}

      {/* Create Collection Modal */}
      {createCollectionOpen && (
        <CreateCollectionModal
          isOpen={createCollectionOpen}
          onClose={() => setCreateCollectionOpen(false)}
          onCreated={() => loadCollections()}
        />
      )}

      {/* Close Friends Modal */}
      <CloseFriendsModal
        isOpen={closeFriendsModalOpen}
        onClose={() => setCloseFriendsModalOpen(false)}
      />

      {/* QR Code Nametag Modal */}
      <ProfileQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile?.username || currentUser?.username}
      />

      {/* Note Creator & Viewer Modal */}
      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        currentNote={activeNote}
        onNoteUpdated={(note) => setActiveNote(note)}
      />

      {/* Profile Gear Menu Modal (Action Sheet matching Instagram) */}
      <ProfileGearMenuModal
        isOpen={gearMenuOpen}
        onClose={() => setGearMenuOpen(false)}
        onOpenQr={() => setQrModalOpen(true)}
        onOpenMetaVerified={() => setMetaVerifiedOpen(true)}
        onLogout={logout}
      />

      {/* Meta Verified Benefits Modal */}
      <MetaVerifiedModal
        isOpen={metaVerifiedOpen}
        onClose={() => setMetaVerifiedOpen(false)}
      />

      {/* Edit Highlight Modal */}
      {editingHighlightId && (
        <EditHighlightModal
          isOpen={Boolean(editingHighlightId)}
          onClose={() => setEditingHighlightId(null)}
          highlightId={editingHighlightId}
          onHighlightUpdated={fetchHighlights}
        />
      )}

      {/* Story Viewer Modal (Live Stories or Selected Highlight) */}
      {storyViewerOpen && effectiveStoryGroups.length > 0 && (
        <StoryViewerModal
          isOpen={storyViewerOpen}
          storyGroups={effectiveStoryGroups}
          initialGroupIdx={0}
          initialStoryIdx={0}
          onClose={() => setStoryViewerOpen(false)}
          onHighlightUpdated={fetchHighlights}
        />
      )}

      {activeHighlightGroup && activeHighlightGroup.length > 0 && (
        <StoryViewerModal
          isOpen={true}
          storyGroups={activeHighlightGroup}
          initialGroupIdx={0}
          initialStoryIdx={0}
          onClose={() => setActiveHighlightGroup(null)}
          onHighlightUpdated={fetchHighlights}
        />
      )}
    </div>
  );
};

export default ProfilePage;
