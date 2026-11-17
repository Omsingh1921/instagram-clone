import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Send, Trash2, MessageSquare, MoreHorizontal, User, RotateCw } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import ReportModal from './ReportModal';
import ShareModal from './ShareModal';
import LikesModal from './LikesModal';
import postService from '../../services/post.service';
import reelService from '../../services/reel.service';
import engagementService from '../../services/engagement.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpload } from '../../context/UploadContext';
import { timeAgo, formatCount } from '../../utils';
import './CommentsModal.css';

export const CommentsModal = ({ isOpen, onClose, postId, onPostUpdated, isReel = false }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [repliesMap, setRepliesMap] = useState({});
  const [showTags, setShowTags] = useState(false);

  const { user: currentUser, isAdmin } = useAuth();
  const uploadCtx = useUpload();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const commentsEndRef = useRef(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const myId = String(currentUser?.id || currentUser?.userId || '').trim().toLowerCase();
  const authorId = String(
    post?.author?.id ||
    post?.author?.userId ||
    post?.userId ||
    post?.user?.id ||
    post?.authorId ||
    ''
  ).trim().toLowerCase();
  const isViewerAdmin = Boolean(
    isAdmin ||
    currentUser?.role === 'ROLE_ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.username?.toLowerCase() === 'admin'
  );
  const isPostAuthor = Boolean(myId && authorId && myId === authorId);
  const canDeletePost = isPostAuthor || isViewerAdmin;

  const handleDeletePost = async () => {
    const itemType = isReel ? 'reel' : 'post';
    if (!window.confirm(`Are you sure you want to delete this ${itemType}?`)) return;
    try {
      if (isReel) {
        await reelService.deleteReel(postId);
        showSuccess('Reel deleted successfully');
        window.dispatchEvent(new CustomEvent('reel:refresh'));
      } else {
        await postService.deletePost(postId);
        showSuccess('Post deleted successfully');
        window.dispatchEvent(new CustomEvent('post:refresh'));
        window.dispatchEvent(new CustomEvent('feed:refresh'));
      }
      setOptionsOpen(false);
      onClose();
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || `Failed to delete ${itemType}`);
    }
  };

  useEffect(() => {
    if (!isOpen || !postId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        if (String(postId).startsWith('uploading-post-')) {
          const activeUpload = uploadCtx?.uploads?.find(
            (u) => `uploading-post-${u.id}` === postId || u.id === postId
          );
          if (activeUpload) {
            const isVid = activeUpload.mediaType === 'VIDEO' || activeUpload.mediaItems?.[0]?.type === 'VIDEO';
            const mediaItems = Array.isArray(activeUpload.mediaItems) && activeUpload.mediaItems.length > 0
              ? activeUpload.mediaItems.map((m, idx) => ({
                  id: `upload-media-${idx}`,
                  mediaUrl: m.previewUrl,
                  mediaType: m.type || (isVid ? 'VIDEO' : 'IMAGE'),
                }))
              : [{
                  id: 'upload-media-0',
                  mediaUrl: activeUpload.thumbnail || activeUpload.mediaUrl,
                  mediaType: isVid ? 'VIDEO' : 'IMAGE',
                }];

            const uploadingPostObj = {
              id: postId,
              isUploading: true,
              uploadProgress: activeUpload.progress || 10,
              uploadStatusMessage: activeUpload.statusMessage || 'Sharing post to feed...',
              caption: activeUpload.caption || '',
              location: activeUpload.location || null,
              createdAt: new Date().toISOString(),
              author: {
                id: currentUser?.id,
                username: currentUser?.username || 'You',
                avatarUrl: currentUser?.avatarUrl || currentUser?.profilePictureUrl,
              },
              media: mediaItems,
              videoUrl: isVid ? mediaItems[0]?.mediaUrl : null,
              thumbnailUrl: activeUpload.thumbnail || activeUpload.mediaUrl,
              likeCount: 0,
              commentCount: 0,
              likedByCurrentUser: false,
              savedByCurrentUser: false,
            };
            setPost(uploadingPostObj);
            setComments([]);
            setLoading(false);
            return;
          }
        }
        let p, c;
        if (isReel) {
          const [reelRes, commentsRes] = await Promise.all([
            reelService.getReelById(postId),
            reelService.getComments(postId),
          ]);
          p = reelRes?.data || reelRes;
          c = commentsRes?.data?.content || commentsRes?.content || commentsRes?.data || [];
        } else {
          const [postRes, commentsRes] = await Promise.all([
            postService.getPostById(postId),
            engagementService.getComments(postId),
          ]);
          p = postRes?.data || postRes;
          c = commentsRes?.data?.content || commentsRes?.content || commentsRes?.data || [];
        }

        setPost(p);
        setComments(c);
        setIsLiked(p.likedByCurrentUser || false);
        setLikeCount(p.likeCount || 0);
        setIsSaved(p.savedByCurrentUser || false);
      } catch (err) {
        showError(err.message || 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, postId, isReel]);

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (isReel) {
        await reelService.toggleLike(postId);
      } else {
        await engagementService.toggleLike(postId);
      }
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsLiked(!nextState);
      setLikeCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleSave = async () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      if (isReel) {
        await reelService.toggleSaveReel(postId);
      } else {
        await engagementService.toggleSave(postId);
      }
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsSaved(!nextState);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      let newComment;
      if (isReel) {
        const res = await reelService.addComment(postId, { text: commentText.trim() });
        newComment = res?.data || res;
      } else {
        const payload = {
          text: commentText.trim(),
          parentCommentId: replyTo ? replyTo.id : null,
        };
        const res = await engagementService.addComment(postId, payload);
        newComment = res?.data || res;
      }

      if (replyTo) {
        setRepliesMap((prev) => ({
          ...prev,
          [replyTo.id]: [...(prev[replyTo.id] || []), newComment],
        }));
        showSuccess('Reply posted!');
      } else {
        setComments((prev) => [...prev, newComment]);
        showSuccess('Comment posted!');
      }

      setCommentText('');
      setReplyTo(null);
      if (onPostUpdated) onPostUpdated();
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId, parentId = null) => {
    try {
      if (isReel) {
        await reelService.deleteComment(commentId);
      } else {
        await engagementService.deleteComment(commentId);
      }
      if (parentId) {
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: prev[parentId].filter((r) => r.id !== commentId),
        }));
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      showSuccess('Comment deleted');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to delete comment');
    }
  };

  const handleLoadReplies = async (commentId) => {
    if (repliesMap[commentId]) {
      setRepliesMap((prev) => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
      return;
    }

    try {
      const res = await engagementService.getCommentReplies(commentId);
      const replies = res?.data?.content || res?.content || res?.data || [];
      setRepliesMap((prev) => ({ ...prev, [commentId]: replies }));
    } catch (err) {
      showError(err.message || 'Failed to load replies');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={true}>
        <div className="comments-dialog-layout">
          <div
            className="comments-media-pane"
            style={{ position: 'relative' }}
            onClick={() => {
              if (post?.media?.[0]?.tags?.length > 0 && post?.media?.[0]?.mediaType !== 'VIDEO') {
                setShowTags((prev) => !prev);
              }
            }}
          >
            {(isReel || post?.videoUrl) && post?.videoUrl ? (
              <video
                src={post?.videoUrl}
                poster={post?.thumbnailUrl}
                controls
                autoPlay
                className="dialog-media-item"
              />
            ) : post?.media?.[0]?.mediaType === 'VIDEO' ? (
              <video
                src={post.media[0].mediaUrl}
                controls
                className="dialog-media-item"
              />
            ) : post?.media?.[0]?.mediaUrl ? (
              <img
                src={post.media[0].mediaUrl}
                alt={post.caption || 'Post image'}
                className="dialog-media-item"
              />
            ) : (
              <div className="dialog-media-empty">No media</div>
            )}

            {/* User Tag Indicator Pill */}
            {post?.media?.[0]?.tags?.length > 0 && (
              <button
                type="button"
                className={`post-tag-indicator-btn ${showTags ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTags((prev) => !prev);
                }}
                aria-label={showTags ? 'Hide tagged accounts' : 'Show tagged accounts'}
                title={showTags ? 'Hide tagged accounts' : 'Show tagged accounts'}
              >
                <User size={12} fill="#fff" color="#fff" />
              </button>
            )}

            {/* Floating Tag Bubbles */}
            {post?.media?.[0]?.tags?.length > 0 && showTags && (
              <div className="post-tags-container" onClick={(e) => e.stopPropagation()}>
                {post.media[0].tags.map((tag) => (
                  <div
                    key={tag.id || tag.taggedUserId}
                    className="post-tag-bubble"
                    style={{
                      left: `${Math.min(88, Math.max(12, tag.xPercent ?? 50))}%`,
                      top: `${Math.min(88, Math.max(12, tag.yPercent ?? 50))}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      navigate(`/profile/${tag.taggedUsername || tag.taggedUserId}`);
                    }}
                    title={`View @${tag.taggedUsername}'s profile`}
                  >
                    <div className="post-tag-pointer" />
                    <span className="post-tag-username">@{tag.taggedUsername}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="comments-info-pane">
            <div className="comments-header comments-header-desktop">
              <div className="comments-author-row">
                <Avatar
                  src={(post?.author?.avatarUrl || post?.author?.profilePictureUrl)}
                  alt={post?.author?.username || 'User'}
                  size="sm"
                />
                <span className="comments-author-username">{post?.author?.username}</span>
              </div>
              <button
                type="button"
                className="comments-opts-btn"
                onClick={() => setOptionsOpen(true)}
                title="Options"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="comments-stream">
              {loading ? (
                <SkeletonUserRows count={4} compact />
              ) : (
                <>
                  {post?.caption && (
                    <div className="comment-row caption-row">
                      <Avatar
                        src={(post.author?.avatarUrl || post.author?.profilePictureUrl)}
                        alt={post.author?.username}
                        size="sm"
                      />
                      <div className="comment-body">
                        <span className="comment-username">{post.author?.username}</span>
                        <span className="comment-text">{post.caption}</span>
                        <div className="comment-meta">
                          <span>{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {comments.length === 0 && !post?.caption ? (
                    <div className="comments-empty-state">
                      <MessageSquare size={32} />
                      <p>No comments yet.</p>
                      <span>Start the conversation.</span>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isCommentAuthor = currentUser?.id === comment.author?.id;
                      const isPostAuthor = currentUser?.id === post?.author?.id;
                      const hasReplies = comment.replyCount > 0 || (repliesMap[comment.id]?.length > 0);

                      return (
                        <div key={comment.id} className="comment-block">
                          <div className="comment-row">
                            <Avatar
                              src={(comment.author?.avatarUrl || comment.author?.profilePictureUrl)}
                              alt={comment.author?.username}
                              size="sm"
                            />
                            <div className="comment-body">
                              <span className="comment-username">{comment.author?.username}</span>
                              <span className="comment-text">{comment.text}</span>
                              <div className="comment-meta">
                                <span>{timeAgo(comment.createdAt)}</span>
                                <button
                                  type="button"
                                  className="comment-reply-btn"
                                  onClick={() => setReplyTo({ id: comment.id, username: comment.author?.username })}
                                >
                                  Reply
                                </button>
                                {(isCommentAuthor || isPostAuthor) && (
                                  <button
                                    type="button"
                                    className="comment-delete-btn"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    title="Delete comment"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {hasReplies && (
                            <button
                              type="button"
                              className="view-replies-toggle"
                              onClick={() => handleLoadReplies(comment.id)}
                            >
                              <div className="reply-line" />
                              <span>
                                {repliesMap[comment.id]
                                  ? 'Hide replies'
                                  : `View replies (${comment.replyCount || repliesMap[comment.id]?.length || 1})`}
                              </span>
                            </button>
                          )}

                          {repliesMap[comment.id]?.map((reply) => (
                            <div key={reply.id} className="comment-row nested-reply-row">
                              <Avatar
                                src={(reply.author?.avatarUrl || reply.author?.profilePictureUrl)}
                                alt={reply.author?.username}
                                size="xs"
                              />
                              <div className="comment-body">
                                <span className="comment-username">{reply.author?.username}</span>
                                <span className="comment-text">{reply.text}</span>
                                <div className="comment-meta">
                                  <span>{timeAgo(reply.createdAt)}</span>
                                  {(currentUser?.id === reply.author?.id || isPostAuthor) && (
                                    <button
                                      type="button"
                                      className="comment-delete-btn"
                                      onClick={() => handleDeleteComment(reply.id, comment.id)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>

            <div className="comments-actions-bar">
              <div className="comments-buttons-row">
                <button
                  type="button"
                  className={`action-icon-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                  aria-label="Like"
                >
                  <Heart size={22} fill={isLiked ? 'var(--color-error)' : 'none'} />
                </button>
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={() => setShareModalOpen(true)}
                  aria-label="Share"
                >
                  <Send size={20} />
                </button>
                <button
                  type="button"
                  className={`action-icon-btn ${isSaved ? 'saved' : ''}`}
                  onClick={handleSave}
                  aria-label="Save"
                >
                  <Bookmark size={22} fill={isSaved ? 'var(--text-primary)' : 'none'} />
                </button>
              </div>
              <div
                className={`comments-likes-count ${likeCount > 0 ? 'clickable-likes' : ''}`}
                onClick={() => likeCount > 0 && setLikesModalOpen(true)}
                style={{ cursor: likeCount > 0 ? 'pointer' : 'default' }}
                title={likeCount > 0 ? 'View likes' : undefined}
                role={likeCount > 0 ? 'button' : undefined}
                tabIndex={likeCount > 0 ? 0 : undefined}
              >
                <strong>{formatCount(likeCount)}</strong> {likeCount === 1 ? 'like' : 'likes'}
              </div>
              <div className="comments-post-time">
                {timeAgo(post?.createdAt)}
              </div>
            </div>

            <form onSubmit={handleSubmitComment} className="comments-input-form">
              {replyTo && (
                <div className="replying-banner">
                  <span>Replying to @{replyTo.username}</span>
                  <button type="button" onClick={() => setReplyTo(null)}>×</button>
                </div>
              )}
              <div className="input-with-button">
                <input
                  type="text"
                  className="comment-input-field"
                  placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Add a comment...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? '...' : <Send size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

            {/* Post/Reel Options Action Sheet */}
      {optionsOpen && (
        <div className="comments-options-backdrop" onClick={() => setOptionsOpen(false)}>
          <div className="comments-options-dialog" onClick={(e) => e.stopPropagation()}>
            {canDeletePost && (
              <button
                type="button"
                className="comments-option-item danger"
                onClick={handleDeletePost}
              >
                <Trash2 size={16} />
                <span>Delete {isReel ? 'Reel' : 'Post'}</span>
              </button>
            )}
            {!isPostAuthor && (
              <button
                type="button"
                className="comments-option-item danger"
                onClick={() => {
                  setOptionsOpen(false);
                  setReportOpen(true);
                }}
              >
                <span>Report</span>
              </button>
            )}
            <button
              type="button"
              className="comments-option-item"
              onClick={() => {
                const url = window.location.origin + '/' + (isReel ? 'reels' : 'p') + '/' + postId;
                navigator.clipboard.writeText(url);
                showSuccess('Link copied to clipboard');
                setOptionsOpen(false);
              }}
            >
              <span>Copy link</span>
            </button>
            <button
              type="button"
              className="comments-option-item cancel"
              onClick={() => setOptionsOpen(false)}
            >
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType={isReel ? 'REEL' : 'POST'}
        targetId={postId}
      />

      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          post={{ ...post, isReel }}
        />
      )}

      {likesModalOpen && (
        <LikesModal
          isOpen={likesModalOpen}
          onClose={() => setLikesModalOpen(false)}
          targetId={postId}
          targetType={isReel ? 'reel' : 'post'}
        />
      )}
    </>
  );
};

export default CommentsModal;
