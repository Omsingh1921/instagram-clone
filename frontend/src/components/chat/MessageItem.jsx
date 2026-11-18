import React from 'react';
import {
  Heart,
  Pin,
  Edit3,
  Forward,
  Trash2,
  Clock,
  Check,
  CheckCheck,
  Plus,
  Phone,
  PhoneOff,
  Video,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import SharedPostCard from './SharedPostCard';
import VoiceNotePlayer from './VoiceNotePlayer';
import { timeAgo } from '../../utils';

export const MessageItem = ({
  msg,
  mine,
  isLastInSenderSequence,
  doubleRight,
  isSending,
  isGroup,
  currentUserId,
  otherMember,
  groupDisplayName,
  onToggleReaction,
  onTogglePinMessage,
  onStartEditMessage,
  onOpenForwardModal,
  onUnsendMessage,
  onOpenViewOnce,
  onOpenStoryPreview,
  sharedMentionStories = {},
  sharingMentionStoryId,
  onShareMentionedStory,
  onCallBack,
  showDateDivider,
  dateDividerText,
}) => {
  const hasReactions = msg.reactions && msg.reactions.length > 0;
  const hasMyHeart = (msg.reactions || []).some(
    (r) => r.userId === currentUserId && r.emoji === '❤️'
  );

  const sharedLinkMatch = msg.content && typeof msg.content === 'string'
    ? msg.content.match(/(?:https?:\/\/[^\s]+)?\/(p|reels?)\/([0-9a-fA-F-]{36})/)
    : null;
  const isSharedPostOrReel = msg.messageType === 'POST_SHARE' || Boolean(sharedLinkMatch);
  const shareType = sharedLinkMatch ? (sharedLinkMatch[1].startsWith('reel') ? 'reel' : 'post') : 'post';
  const shareId = sharedLinkMatch
    ? sharedLinkMatch[2]
    : (typeof msg.content === 'string' && msg.content.match(/^[0-9a-fA-F-]{36}$/) ? msg.content : null);
  const customNote = sharedLinkMatch
    ? msg.content.replace(/(?:Check this out:\s*)?(?:https?:\/\/[^\s]+)?\/(?:p|reels?)\/[0-9a-fA-F-]{36}/gi, '').trim()
    : '';
  const isCallMessage = msg.messageType === 'CALL' || (typeof msg.mediaUrl === 'string' && msg.mediaUrl.startsWith('call:'));
  const isStoryReply = msg.messageType === 'STORY_REPLY' || msg.messageType === 'STORY_SHARE' ||
    (typeof msg.mediaUrl === 'string' && (msg.mediaUrl.includes('storyId=') || msg.mediaUrl.includes('/stories/')));

  return (
    <React.Fragment key={msg.id}>
      {showDateDivider && (
        <div className="chat-date-divider">
          <span>{dateDividerText}</span>
        </div>
      )}
      <div
        id={`msg-${msg.id}`}
        className={`message-bubble-row ${mine ? 'mine' : 'theirs'} ${msg.isPinnedInChat ? 'pinned-in-chat' : ''}`}
      >
        {/* Avatar on left for incoming (theirs) messages */}
        {!mine && (
          isLastInSenderSequence ? (
            <Avatar
              src={msg.sender?.avatarUrl || otherMember?.avatarUrl || otherMember?.profilePictureUrl}
              alt={msg.sender?.username || groupDisplayName || 'user'}
              size="xs"
              className="chat-bubble-avatar"
              style={{ marginBottom: '2px', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: '24px', flexShrink: 0 }} />
          )
        )}

        {/* For sent (mine) messages, hover actions appear on the left of the bubble */}
        {mine && (
          <div className="message-hover-actions mine">
            <button
              type="button"
              className={`msg-action-btn ${hasMyHeart ? 'active' : ''}`}
              onClick={() => onToggleReaction?.(msg.id, msg.reactions)}
              title="Like message"
            >
              <Heart
                size={14}
                fill={hasMyHeart ? '#ef4444' : 'none'}
                color={hasMyHeart ? '#ef4444' : 'currentColor'}
              />
            </button>
            <button
              type="button"
              className={`msg-action-btn ${msg.isPinnedInChat ? 'active' : ''}`}
              onClick={() => onTogglePinMessage?.(msg.id)}
              title={msg.isPinnedInChat ? 'Unpin message' : 'Pin message'}
            >
              <Pin size={13} fill={msg.isPinnedInChat ? '#a855f7' : 'none'} color={msg.isPinnedInChat ? '#a855f7' : 'currentColor'} />
            </button>
            {!isSending && msg.messageType === 'TEXT' && (
              <button
                type="button"
                className="msg-action-btn"
                onClick={() => onStartEditMessage?.(msg)}
                title="Edit message"
              >
                <Edit3 size={13} />
              </button>
            )}
            {!isSending && (
              <button
                type="button"
                className="msg-action-btn"
                onClick={() => onOpenForwardModal?.(msg)}
                title="Forward message"
              >
                <Forward size={13} />
              </button>
            )}
            {!isSending && (
              <button
                type="button"
                className="msg-action-btn danger"
                onClick={() => onUnsendMessage?.(msg.id)}
                title="Unsend message"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        <div className={`message-bubble ${mine ? 'mine' : 'theirs'} ${isSharedPostOrReel && (shareId || msg.mediaUrl) ? 'has-shared-post' : ''} ${isCallMessage ? 'has-call-history' : ''} ${isStoryReply ? 'has-story-reply' : ''}`}>
          {msg.isForwarded && (
            <div className="message-forwarded-tag">
              <Forward size={11} />
              <span>Forwarded</span>
            </div>
          )}
          {!mine && isGroup && msg.sender?.username && (
            <div className="group-sender-header">
              {msg.sender.username}
            </div>
          )}
          {msg.isViewOnce ? (
            !msg.isOpened ? (
              <div
                className={`view-once-bubble-pill ${mine ? 'mine' : 'theirs'}`}
                onClick={() => onOpenViewOnce?.(msg)}
                title={mine ? 'View once photo sent' : 'Click to view photo'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  background: mine ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#262626',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  1
                </div>
                <span>{msg.messageType === 'VIDEO' ? 'Video' : 'Photo'}</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>(View once)</span>
              </div>
            ) : (
              <div
                className="view-once-bubble-pill opened"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  background: 'transparent',
                  border: '1px dashed #737373',
                  color: '#8e8e8e',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'not-allowed'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '1.5px dashed #8e8e8e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  ✓
                </div>
                <span>Opened</span>
              </div>
            )
          ) : isSharedPostOrReel && (shareId || msg.mediaUrl) ? (
            <div className="shared-post-message-wrapper">
              <SharedPostCard
                id={shareId}
                type={shareType}
                fallbackMediaUrl={msg.mediaUrl}
                mine={mine}
              />
              {customNote && (
                <div className="message-content-text custom-share-note" style={{ marginTop: '6px' }}>
                  {customNote}
                </div>
              )}
            </div>
          ) : isStoryReply ? (
            (() => {
              const rawUrl = msg.mediaUrl || '';
              const [cleanUrl, hash] = rawUrl.split('#');
              const params = new URLSearchParams(hash || '');
              const isVideo = params.get('mediaType') === 'VIDEO' || Boolean(cleanUrl.match(/\.(mp4|webm|mov)(\?|$)/i));
              const isMention = msg.content && (msg.content.toLowerCase().includes('mentioned you') || msg.content.toLowerCase().includes('mention'));
              const storyId = params.get('storyId');
              const isEmoji = msg.content && typeof msg.content === 'string' &&
                /^(\p{Extended_Pictographic}|\u200D|\uFE0F|\u20E3|\u{1F3FB}-\u{1F3FF}){1,5}$/u.test(msg.content.trim());

              return (
                <div className={`story-dm-card ${mine ? 'mine' : 'theirs'}`}>
                  <div className="story-dm-badge-header">
                    <span className="story-dm-gradient-dot" />
                    <span>
                      {isMention
                        ? (mine ? `You mentioned @${otherMember?.username || 'user'} in your story` : 'Mentioned you in their story')
                        : mine
                          ? (isEmoji ? 'Reacted to their story' : 'Replied to story')
                          : (isEmoji ? 'Reacted to your story' : 'Replied to your story')}
                    </span>
                  </div>

                  {cleanUrl && (
                    <div
                      className="story-dm-preview-wrapper"
                      onClick={() => onOpenStoryPreview?.(cleanUrl)}
                      title="Click to view story"
                    >
                      {isVideo ? (
                        <video
                          src={cleanUrl}
                          className="story-dm-preview-media"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={cleanUrl}
                          alt="Story attachment"
                          className="story-dm-preview-media"
                        />
                      )}
                      <div className="story-dm-pill-overlay">
                        <span>Story</span>
                      </div>
                    </div>
                  )}

                  {!mine && isMention && storyId && (
                    <button
                      type="button"
                      className={`story-dm-add-story-btn ${sharedMentionStories[storyId] ? 'shared' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareMentionedStory?.(storyId);
                      }}
                      disabled={sharedMentionStories[storyId] || sharingMentionStoryId === storyId}
                    >
                      {sharedMentionStories[storyId] ? (
                        <>
                          <Check size={13} />
                          <span>Added to your story</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Add this to your story</span>
                        </>
                      )}
                    </button>
                  )}

                  {!isMention && isEmoji ? (
                    <div className="story-dm-emoji-reaction">
                      {msg.content}
                    </div>
                  ) : !isMention && msg.content ? (
                    <div className="story-dm-comment-bubble">
                      {msg.content}
                    </div>
                  ) : null}
                </div>
              );
            })()
          ) : msg.messageType === 'AUDIO' || msg.mediaType === 'AUDIO' || (msg.mediaUrl && msg.mediaUrl.match(/\.(webm|mp3|wav|ogg|m4a)/i)) ? (
            <VoiceNotePlayer src={msg.mediaUrl} mine={mine} />
          ) : msg.messageType === 'IMAGE' && msg.mediaUrl ? (
            <div style={{ maxWidth: '280px', borderRadius: '12px', overflow: 'hidden' }}>
              <img src={msg.mediaUrl} alt="DM attachment" style={{ width: '100%', display: 'block' }} />
              {msg.content && msg.content !== 'Photo' && (
                <div className="message-content-text" style={{ marginTop: '4px' }}>{msg.content}</div>
              )}
            </div>
          ) : msg.messageType === 'VIDEO' && msg.mediaUrl ? (
            <div style={{ maxWidth: '280px', borderRadius: '12px', overflow: 'hidden' }}>
              <video src={msg.mediaUrl} controls style={{ width: '100%', display: 'block' }} />
              {msg.content && msg.content !== 'Video' && (
                <div className="message-content-text" style={{ marginTop: '4px' }}>{msg.content}</div>
              )}
            </div>
          ) : isCallMessage ? (
            (() => {
              const isVideo = msg.mediaUrl?.includes('VIDEO') || msg.content?.toLowerCase().includes('video');
              const isMissed = msg.mediaUrl?.includes('MISSED') || msg.mediaUrl?.includes('REJECTED') || msg.mediaUrl?.includes('BUSY')
                || msg.content?.toLowerCase().includes('missed') || msg.content?.toLowerCase().includes('declined');
              return (
                <div className={`call-history-bubble ${mine ? 'call-bubble-mine' : 'call-bubble-theirs'}`}>
                  <div className={`call-icon-circle ${isMissed ? 'call-icon-missed' : isVideo ? 'call-icon-video' : ''}`}>
                    {isVideo ? <Video size={18} /> : isMissed ? <PhoneOff size={18} /> : <Phone size={18} />}
                  </div>
                  <div className="call-info">
                    <div className="call-title">{msg.content || (isVideo ? 'Video call' : 'Audio call')}</div>
                    <div className="call-subtext">
                      {isMissed ? 'Tap to call back' : (mine ? 'Outgoing call' : 'Incoming call')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="call-back-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCallBack?.(isVideo);
                    }}
                    title={`Call back with ${isVideo ? 'video' : 'audio'}`}
                    aria-label={`Call back with ${isVideo ? 'video' : 'audio'}`}
                  >
                    Call back
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="message-content-text">{msg.content}</div>
          )}
          <span className="message-time">
            <span>{msg.createdAt ? timeAgo(msg.createdAt) : 'Just now'}</span>
            {msg.isEdited && <span className="message-edited-tag">· edited</span>}
            {mine && (
              <span
                className="message-status-indicator"
                title={isSending ? 'Sending...' : doubleRight ? 'Seen' : 'Sent'}
                aria-label={isSending ? 'Sending' : doubleRight ? 'Seen' : 'Sent'}
              >
                {isSending ? (
                  <Clock size={11} className="status-clock" />
                ) : doubleRight ? (
                  <CheckCheck size={13} className="status-check-double" />
                ) : (
                  <Check size={13} className="status-check-single" />
                )}
              </span>
            )}
          </span>

          {/* Floating Reaction Pill */}
          {hasReactions && (
            <div
              className="message-reaction-pill"
              onClick={() => onToggleReaction?.(msg.id, msg.reactions)}
              title="Reactions"
            >
              {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji, idx) => (
                <span key={idx} className="reaction-emoji">{emoji}</span>
              ))}
              {msg.reactions.length > 1 && (
                <span className="reaction-count">{msg.reactions.length}</span>
              )}
            </div>
          )}
        </div>

        {/* For incoming (theirs) messages, hover actions appear on the right of the bubble */}
        {!mine && (
          <div className="message-hover-actions theirs">
            <button
              type="button"
              className={`msg-action-btn ${hasMyHeart ? 'active' : ''}`}
              onClick={() => onToggleReaction?.(msg.id, msg.reactions)}
              title="Like message"
            >
              <Heart
                size={14}
                fill={hasMyHeart ? '#ef4444' : 'none'}
                color={hasMyHeart ? '#ef4444' : 'currentColor'}
              />
            </button>
            <button
              type="button"
              className={`msg-action-btn ${msg.isPinnedInChat ? 'active' : ''}`}
              onClick={() => onTogglePinMessage?.(msg.id)}
              title={msg.isPinnedInChat ? 'Unpin message' : 'Pin message'}
            >
              <Pin size={13} fill={msg.isPinnedInChat ? '#a855f7' : 'none'} color={msg.isPinnedInChat ? '#a855f7' : 'currentColor'} />
            </button>
            <button
              type="button"
              className="msg-action-btn"
              onClick={() => onOpenForwardModal?.(msg)}
              title="Forward message"
            >
              <Forward size={13} />
            </button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default MessageItem;
