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
import {
  ProfilePostsTab,
  ProfileReelsTab,
  ProfileSavedTab,
  ProfileTaggedTab,
  ProfileArchivedTab,
  ProfileRecentlyDeletedTab,
  ProfileHeader,
  ProfileHighlights,
  ProfileNavTabs,
  ProfileEditForm,
  ProfileModals,
} from '../../components/profile';
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
  const [addToCollectionOpen, setAddToCollectionModalOpen] = useState(false);

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

  const handleDeleteCollection = async () => {
    if (!selectedCollection?.id) return;
    if (!window.confirm(`Delete collection "${selectedCollection.name}"? Saved posts won't be deleted.`)) return;
    try {
      await collectionService.deleteCollection(selectedCollection.id);
      showSuccess('Collection deleted');
      setSelectedCollection(null);
      loadCollections();
    } catch (err) {
      showError(err.message || 'Failed to delete collection');
    }
  };

  const handleRemoveFromCollection = async (postId, reelId) => {
    if (!selectedCollection?.id) return;
    try {
      await collectionService.removeItem(selectedCollection.id, postId, reelId);
      showSuccess('Removed from collection');
      if (postId) {
        setCollectionPosts((prev) => prev.filter((p) => p.id !== postId));
      }
      if (reelId) {
        setCollectionReels((prev) => prev.filter((r) => r.id !== reelId));
      }
      loadCollections();
    } catch (err) {
      showError(err.message || 'Failed to remove item');
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
      return (
        <ProfilePostsTab
          posts={posts}
          loadingPosts={loadingPosts}
          activePostUploads={activePostUploads}
          isOwnProfile={isOwnProfile}
          isViewerAdmin={isViewerAdmin}
          myUserId={myUserId}
          profile={profile}
          gridMenuPost={gridMenuPost}
          setGridMenuPost={setGridMenuPost}
          onSelectPost={setSelectedPostId}
          onTogglePin={handleTogglePinGridPost}
          onDeletePost={handleDeleteGridPost}
          onToggleArchive={handleToggleArchiveGridPost}
          showSuccess={showSuccess}
        />
      );
    }

    if (activeTab === 'reels') {
      return (
        <ProfileReelsTab
          reels={reels}
          activeReelUploads={activeReelUploads}
          isOwnProfile={isOwnProfile}
          isViewerAdmin={isViewerAdmin}
          myUserId={myUserId}
          gridMenuReel={gridMenuReel}
          setGridMenuReel={setGridMenuReel}
          onTogglePinReel={handleTogglePinGridReel}
          onDeleteReel={handleDeleteGridReel}
          onToggleArchiveReel={handleToggleArchiveGridReel}
          navigate={navigate}
          showSuccess={showSuccess}
        />
      );
    }

    if (activeTab === 'saved') {
      return (
        <ProfileSavedTab
          selectedCollection={selectedCollection}
          setSelectedCollection={setSelectedCollection}
          collectionTab={collectionTab}
          handleSwitchCollectionTab={handleSwitchCollectionTab}
          collectionPosts={collectionPosts}
          loadingCollectionPosts={loadingCollectionPosts}
          collectionReels={collectionReels}
          loadingCollectionReels={loadingCollectionReels}
          handleDeleteCollection={handleDeleteCollection}
          handleRemoveFromCollection={handleRemoveFromCollection}
          setAddToCollectionModalOpen={setAddToCollectionModalOpen}
          savedSubTab={savedSubTab}
          setSavedSubTab={setSavedSubTab}
          setCreateCollectionOpen={setCreateCollectionOpen}
          collections={collections}
          loadingCollections={loadingCollections}
          handleSelectCollection={handleSelectCollection}
          savedReels={savedReels}
          loadingSavedReels={loadingSavedReels}
          setSavedReels={setSavedReels}
          savedPosts={savedPosts}
          loadingSaved={loadingSaved}
          onSelectPost={setSelectedPostId}
          navigate={navigate}
          showSuccess={showSuccess}
          showError={showError}
        />
      );
    }

    if (activeTab === 'tagged') {
      return (
        <ProfileTaggedTab
          taggedPosts={taggedPosts}
          loadingTagged={loadingTagged}
          onSelectPost={setSelectedPostId}
        />
      );
    }

    if (activeTab === 'archived') {
      return (
        <ProfileArchivedTab
          archivedSubTab={archivedSubTab}
          setArchivedSubTab={setArchivedSubTab}
          archivedPosts={archivedPosts}
          loadingArchived={loadingArchived}
          archivedReels={archivedReels}
          loadingArchivedReels={loadingArchivedReels}
          archivedStories={archivedStories}
          loadingArchivedStories={loadingArchivedStories}
          onSelectPost={setSelectedPostId}
          handleUnarchivePost={handleUnarchivePost}
          handleUnarchiveReel={handleUnarchiveReel}
          handleReshareStory={handleReshareStory}
          navigate={navigate}
        />
      );
    }

    if (activeTab === 'recently_deleted') {
      return (
        <ProfileRecentlyDeletedTab
          deletedSubTab={deletedSubTab}
          setDeletedSubTab={setDeletedSubTab}
          recentlyDeletedPosts={recentlyDeletedPosts}
          loadingRecentlyDeleted={loadingRecentlyDeleted}
          recentlyDeletedReels={recentlyDeletedReels}
          loadingDeletedReels={loadingDeletedReels}
          handleRestorePost={handleRestorePost}
          handlePermanentDeletePost={handlePermanentDeletePost}
          handleRestoreReel={handleRestoreReel}
          handlePermanentDeleteReel={handlePermanentDeleteReel}
        />
      );
    }

    return null;
  };

  return (
    <div className="profile-page-container">
      {/* Header Section */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isViewerAdmin={isViewerAdmin}
        activeNote={activeNote}
        hasActiveStory={hasActiveStory}
        uploadingStory={uploadingStory}
        userStories={userStories}
        avatarInputRef={avatarInputRef}
        handleAvatarClick={handleAvatarClick}
        handleAvatarFile={handleAvatarFile}
        setNoteModalOpen={setNoteModalOpen}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        setActiveTab={setActiveTab}
        setCreateHighlightOpen={setCreateHighlightOpen}
        setCloseFriendsModalOpen={setCloseFriendsModalOpen}
        setGearMenuOpen={setGearMenuOpen}
        isBlockedByMe={isBlockedByMe}
        setUnblockModalOpen={setUnblockModalOpen}
        isFollowing={isFollowing}
        isRequested={isRequested}
        handleFollowToggle={handleFollowToggle}
        handleMessageUser={handleMessageUser}
        handleDeleteUserProfile={handleDeleteUserProfile}
        moreMenuOpen={moreMenuOpen}
        setMoreMenuOpen={setMoreMenuOpen}
        isMuted={isMuted}
        handleToggleMute={handleToggleMute}
        setReportModalOpen={setReportModalOpen}
        handleBlockUser={handleBlockUser}
        postsCount={profile.postCount || profile.postsCount || posts.length || 0}
        followersCount={followersCount}
        followingCount={followingCount}
        setFollowModalType={setFollowModalType}
        setFollowModalOpen={setFollowModalOpen}
      />

      {/* Edit Profile Form (Inline) */}
      <ProfileEditForm
        isEditing={isEditing}
        isOwnProfile={isOwnProfile}
        handleSaveEdit={handleSaveEdit}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        setIsEditing={setIsEditing}
        savingEdit={savingEdit}
      />

      {/* Story Highlights Tray */}
      <ProfileHighlights
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isViewerAdmin={isViewerAdmin}
        highlights={highlights}
        highlightMenuId={highlightMenuId}
        setHighlightMenuId={setHighlightMenuId}
        setCreateHighlightOpen={setCreateHighlightOpen}
        handleOpenHighlight={handleOpenHighlight}
        setEditingHighlightId={setEditingHighlightId}
        handleDeleteHighlightFromProfile={handleDeleteHighlightFromProfile}
      />

      {/* Navigation Tabs */}
      <ProfileNavTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOwnProfile={isOwnProfile}
        activePostUploads={activePostUploads}
        activeReelUploads={activeReelUploads}
      />

      {/* Content Grid */}
      {renderTabContent()}



      {/* Modals */}
      <ProfileModals
        selectedPostId={selectedPostId}
        setSelectedPostId={setSelectedPostId}
        loadUserPosts={loadUserPosts}
        activeTab={activeTab}
        loadSavedPosts={loadSavedPosts}
        followModalOpen={followModalOpen}
        setFollowModalOpen={setFollowModalOpen}
        effectiveUserId={effectiveUserId}
        followModalType={followModalType}
        reportModalOpen={reportModalOpen}
        setReportModalOpen={setReportModalOpen}
        userId={userId}
        navigate={navigate}
        blockModalOpen={blockModalOpen}
        setBlockModalOpen={setBlockModalOpen}
        profile={profile}
        handleBlockSuccess={handleBlockSuccess}
        unblockModalOpen={unblockModalOpen}
        setUnblockModalOpen={setUnblockModalOpen}
        handleUnblockSuccess={handleUnblockSuccess}
        createHighlightOpen={createHighlightOpen}
        setCreateHighlightOpen={setCreateHighlightOpen}
        fetchHighlights={fetchHighlights}
        editingHighlightId={editingHighlightId}
        setEditingHighlightId={setEditingHighlightId}
        createCollectionOpen={createCollectionOpen}
        setCreateCollectionOpen={setCreateCollectionOpen}
        loadCollections={loadCollections}
        addToCollectionOpen={addToCollectionOpen}
        setAddToCollectionModalOpen={setAddToCollectionModalOpen}
        selectedCollection={selectedCollection}
        collectionPosts={collectionPosts}
        collectionReels={collectionReels}
        savedPosts={savedPosts}
        savedReels={savedReels}
        handleSelectCollection={handleSelectCollection}
        closeFriendsModalOpen={closeFriendsModalOpen}
        setCloseFriendsModalOpen={setCloseFriendsModalOpen}
        qrModalOpen={qrModalOpen}
        setQrModalOpen={setQrModalOpen}
        currentUser={currentUser}
        noteModalOpen={noteModalOpen}
        setNoteModalOpen={setNoteModalOpen}
        activeNote={activeNote}
        setActiveNote={setActiveNote}
        gearMenuOpen={gearMenuOpen}
        setGearMenuOpen={setGearMenuOpen}
        setMetaVerifiedOpen={setMetaVerifiedOpen}
        metaVerifiedOpen={metaVerifiedOpen}
        logout={logout}
        storyViewerOpen={storyViewerOpen}
        setStoryViewerOpen={setStoryViewerOpen}
        effectiveStoryGroups={effectiveStoryGroups}
        activeHighlightGroup={activeHighlightGroup}
        setActiveHighlightGroup={setActiveHighlightGroup}
      />
    </div>
  );
};

export default ProfilePage;
