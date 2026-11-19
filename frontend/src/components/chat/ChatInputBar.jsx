import React, { useState, useEffect } from 'react';
import { Smile, Mic, Image as ImageIcon, Heart, Send, X, Edit3 } from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👏', '😍', '😢', '🙌', '😮', '👍', '🎉', '😊', '💯', '✨', '🥺'];

export const ChatInputBar = ({
  inputText,
  setInputText,
  inputRef,
  onSendMessage,
  onSendQuickHeart,
  // Voice recording
  isRecording,
  recordingTime,
  onStartRecording,
  onCancelRecording,
  onSendVoiceNote,
  // Media attachment & View-Once
  selectedMediaFile,
  mediaPreviewUrl,
  onSelectMedia,
  onClearMedia,
  isViewOnceMedia,
  setIsViewOnceMedia,
  mediaFileInputRef,
  // Edit mode
  editingMessage,
  onCancelEdit,
  // Group request locked state
  isInRequests,
  isGroup,
  onAcceptRequest,
  handlingRequestAction,
  sending,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.style.height = 'auto';
      if (inputText) {
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
      }
    }
  }, [inputText, inputRef]);

  const handleInsertEmoji = (emoji) => {
    setInputText((prev) => (prev ? prev + emoji : emoji));
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    setShowEmojiPicker(false);
    onSendMessage?.(e);
    if (inputRef?.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  return (
    <>
      {/* Media Upload Preview Bar with View-Once Toggle */}
      {mediaPreviewUrl && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-secondary, #262626)',
          borderTop: '1px solid var(--border-color, #363636)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden' }}>
            {selectedMediaFile?.type?.startsWith('video/') ? (
              <video src={mediaPreviewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={mediaPreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <button
              type="button"
              onClick={onClearMedia}
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Remove attachment"
            >
              <X size={12} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsViewOnceMedia(!isViewOnceMedia)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: isViewOnceMedia ? '2px solid #0095f6' : '1px solid #555',
              background: isViewOnceMedia ? 'rgba(0, 149, 246, 0.2)' : 'transparent',
              color: isViewOnceMedia ? '#0095f6' : 'var(--text-primary, #ffffff)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: isViewOnceMedia ? '#0095f6' : '#555',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800
              }}
            >
              1
            </span>
            {isViewOnceMedia ? 'View Once: ON' : 'Keep in chat'}
          </button>
        </div>
      )}

      {/* Input Bar or Voice Recording Bar */}
      {isInRequests && isGroup ? (
        <div className="chat-request-locked-input-bar">
          <span>Accept this group invitation to send messages and join calls.</span>
          <button
            type="button"
            className="message-request-btn accept"
            onClick={onAcceptRequest}
            disabled={handlingRequestAction}
          >
            Accept
          </button>
        </div>
      ) : isRecording ? (
        <div className="chat-input-bar recording-active">
          <span className="voice-recording-timer">
            <span className="rec-dot"></span> {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
          <span className="voice-recording-label">Recording audio...</span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              className="chat-voice-cancel-btn"
              onClick={onCancelRecording}
              title="Cancel recording"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              className="chat-send-btn"
              onClick={onSendVoiceNote}
              disabled={sending}
              title="Send voice note"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-input-wrapper">
          {showEmojiPicker && (
            <div className="chat-emoji-quick-row" role="toolbar" aria-label="Quick emojis">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="chat-emoji-item-btn"
                  onClick={() => handleInsertEmoji(emoji)}
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          {editingMessage && (
            <div className="chat-editing-banner">
              <div className="chat-editing-info">
                <Edit3 size={14} className="chat-editing-icon" />
                <span>Editing: <strong>{editingMessage.content}</strong></span>
              </div>
              <button
                type="button"
                className="chat-editing-cancel-btn"
                onClick={onCancelEdit}
                title="Cancel edit"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="chat-input-bar-capsule">
            <button
              type="button"
              className={`chat-input-icon-btn emoji-btn ${showEmojiPicker ? 'active' : ''}`}
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              title={showEmojiPicker ? 'Close emoji picker' : 'Add emoji'}
              aria-label={showEmojiPicker ? 'Close emoji picker' : 'Add emoji'}
            >
              <Smile size={24} />
            </button>

            <input
              type="file"
              ref={mediaFileInputRef}
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={onSelectMedia}
            />

            <textarea
              ref={inputRef}
              rows={1}
              className="chat-input-box-clean"
              placeholder={selectedMediaFile ? 'Add a caption...' : 'Message...'}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if ((inputText.trim() || selectedMediaFile) && !sending) {
                    handleSubmit(e);
                  }
                }
              }}
              maxLength={2000}
              autoFocus
              aria-label="Message"
            />

            {!inputText.trim() && !selectedMediaFile ? (
              <div className="chat-input-right-actions">
                <button
                  type="button"
                  className="chat-input-icon-btn"
                  onClick={onStartRecording}
                  title="Voice message"
                  aria-label="Record voice message"
                >
                  <Mic size={22} />
                </button>

                <button
                  type="button"
                  className="chat-input-icon-btn"
                  onClick={() => mediaFileInputRef?.current?.click()}
                  title="Attach photo or video"
                  aria-label="Attach photo or video"
                >
                  <ImageIcon size={22} />
                </button>

                <button
                  type="button"
                  className="chat-input-icon-btn heart-btn"
                  onClick={onSendQuickHeart}
                  title="Send heart"
                  aria-label="Send heart"
                >
                  <Heart size={22} />
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="chat-send-text-btn"
                disabled={(!inputText.trim() && !selectedMediaFile) || sending}
                aria-label="Send message"
                title="Send"
              >
                Send
              </button>
            )}
          </form>
        </div>
      )}
    </>
  );
};

export default ChatInputBar;
