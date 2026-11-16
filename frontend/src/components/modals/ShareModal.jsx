import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Link2,
  Share2,
  Check,
  Send,
  MessageCircle,
  Plus,
} from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import followService from '../../services/follow.service';
import searchService from '../../services/search.service';
import chatService from '../../services/chat.service';
import engagementService from '../../services/engagement.service';
import reelService from '../../services/reel.service';
import storyService from '../../services/story.service';
import './ShareModal.css';

export const ShareModal = ({
  isOpen,
  onClose,
  post,
  onShareComplete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState({});
  const [copied, setCopied] = useState(false);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const isReel = Boolean(post?.isReel || post?.contentType === 'REEL' || post?.videoUrl || post?.durationMs);
  const shareUrl = post?.id
    ? `${window.location.origin}/${isReel ? 'reels' : 'p'}/${post.id}`
    : window.location.href;

  // Load followed users on open
  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const res = await followService.getFollowing(currentUser.id, 0, 15);
        const list = res?.data?.content || res?.content || res?.data || [];
        setUsers(list);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
    setSentMap({});
    setCopied(false);
    setSearchQuery('');
  }, [isOpen, currentUser]);

  // Handle user search in share sheet
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchService.searchUsers(searchQuery.trim(), 0, 10);
        const list = res?.data?.content || res?.content || res?.data || [];
        setUsers(
          list.filter((u) => String(u.id) !== String(currentUser?.id))
        );
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showSuccess('Link copied to clipboard!');

      // Record share to backend
      if (post?.id) {
        const res = isReel
          ? await reelService.recordShare(post.id, { shareType: 'COPY_LINK' })
          : await engagementService.recordShare(post.id, { shareType: 'COPY_LINK' });
        const updatedCount = res?.data?.shareCount ?? res?.shareCount;
        if (onShareComplete) onShareComplete(updatedCount);
      }

      setTimeout(() => setCopied(false), 2500);
    } catch {
      showError('Failed to copy link');
    }
  };

  const handleSendToUser = async (targetUser) => {
    const userId = targetUser.id;
    if (sentMap[userId]) return;

    try {
      // 1. Send link in DM
      const convRes = await chatService.getOrCreateDirectConversation(userId);
      const conversation = convRes?.data || convRes;
      const convId = conversation.id;

      if (convId) {
        const firstMedia = post?.media?.[0];
        const mediaUrl = firstMedia?.mediaUrl || post?.videoUrl || post?.thumbnailUrl || post?.mediaUrl || null;

        await chatService.sendMessage(convId, {
          content: shareUrl,
          messageType: isReel ? 'REEL_SHARE' : 'POST_SHARE',
          mediaUrl: mediaUrl || undefined,
        });
      }

      // 2. Record share in backend
      let newCount;
      if (post?.id) {
        const shareRes = isReel
          ? await reelService.recordShare(post.id, {
              recipientId: userId,
              shareType: 'DIRECT_MESSAGE',
            })
          : await engagementService.recordShare(post.id, {
              recipientId: userId,
              shareType: 'DIRECT_MESSAGE',
            });
        newCount = shareRes?.data?.shareCount ?? shareRes?.shareCount;
      }

      setSentMap((prev) => ({ ...prev, [userId]: true }));
      showSuccess(`Sent to @${targetUser.username}`);

      if (onShareComplete) {
        onShareComplete(newCount);
      }
    } catch (err) {
      showError(err.message || 'Could not send content');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Instagram',
          text: post?.caption || 'Check out this post on Instagram clone',
          url: shareUrl,
        });

        if (post?.id) {
          const res = isReel
            ? await reelService.recordShare(post.id, { shareType: 'EXTERNAL' })
            : await engagementService.recordShare(post.id, { shareType: 'EXTERNAL' });
          const updatedCount = res?.data?.shareCount ?? res?.shareCount;
          if (onShareComplete) onShareComplete(updatedCount);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareToStory = async () => {
    if (!post?.id) return;
    try {
      if (isReel) {
        await storyService.shareReelToStory(post.id);
      } else {
        await storyService.sharePostToStory(post.id);
      }
      showSuccess(`Added ${isReel ? 'reel' : 'post'} to your story! 🌟`);
      window.dispatchEvent(new CustomEvent('story:refresh'));
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to share to story');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="share-sheet-container">
        {/* Header */}
        <div className="share-sheet-header">
          <span className="share-sheet-title">Share</span>
          <button
            type="button"
            className="share-sheet-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="share-search-bar">
          <Search size={16} className="share-search-icon" />
          <input
            type="text"
            className="share-search-input"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Users List */}
        <div className="share-users-list">
          {loading ? (
            <SkeletonUserRows count={4} compact />
          ) : users.length === 0 ? (
            <div className="share-empty-box">
              <p>No people found</p>
            </div>
          ) : (
            users.map((u) => {
              const isSent = !!sentMap[u.id];
              return (
                <div key={u.id} className="share-user-row">
                  <div className="share-user-left">
                    <Avatar
                      src={u.profilePictureUrl || u.avatarUrl}
                      alt={u.username}
                      size="md"
                    />
                    <div className="share-user-meta">
                      <span className="share-user-uname">{u.username}</span>
                      <span className="share-user-name">
                        {u.displayName || u.fullName || 'Instagram user'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`share-send-btn ${isSent ? 'sent' : ''}`}
                    onClick={() => handleSendToUser(u)}
                    disabled={isSent}
                  >
                    {isSent ? (
                      <>
                        <Check size={14} /> Sent
                      </>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Tray */}
        <div className="share-bottom-tray">
          <button
            type="button"
            className="share-tray-action"
            onClick={handleShareToStory}
          >
            <div
              className="share-tray-icon-bubble"
              style={{
                background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
                color: '#fff',
              }}
            >
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <span>Add to story</span>
          </button>

          <button
            type="button"
            className="share-tray-action"
            onClick={handleCopyLink}
          >
            <div className="share-tray-icon-bubble">
              {copied ? <Check size={20} color="#00ba7c" /> : <Link2 size={20} />}
            </div>
            <span>{copied ? 'Copied' : 'Copy link'}</span>
          </button>

          <button
            type="button"
            className="share-tray-action"
            onClick={handleNativeShare}
          >
            <div className="share-tray-icon-bubble">
              <Share2 size={20} />
            </div>
            <span>Share via...</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
