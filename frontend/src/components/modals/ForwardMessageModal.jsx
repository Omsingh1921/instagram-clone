import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Check, Forward, Image, Film, Mic, FileText } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { SkeletonUserRows } from '../ui/Skeleton';
import chatService from '../../services/chat.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './ForwardMessageModal.css';

export const ForwardMessageModal = ({
  isOpen,
  onClose,
  message,
  currentConversationId,
  onForwardSuccess,
}) => {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const currentUserId = currentUser?.id || currentUser?.userId;

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setSearchQuery('');
      return;
    }

    const loadConversations = async () => {
      try {
        setLoading(true);
        const res = await chatService.getConversations(0, 40);
        const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
        setConversations(Array.isArray(list) ? list : []);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [isOpen]);

  const getConversationDetails = (conv) => {
    const isGroup = conv.type === 'GROUP' || (conv.members && conv.members.length > 2);
    if (isGroup && conv.name) {
      return {
        title: conv.name,
        subtitle: `${conv.members?.length || 0} members`,
        avatarUrl: conv.avatarUrl || null,
      };
    }

    const otherMember = (conv.members || []).find(
      (m) => String(m.user?.id || m.id) !== String(currentUserId)
    );
    const targetUser = otherMember?.user || otherMember || {};

    return {
      title: targetUser.username || conv.name || 'Direct Message',
      subtitle: targetUser.displayName || targetUser.fullName || '',
      avatarUrl: targetUser.avatarUrl || targetUser.profilePictureUrl || null,
    };
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations
      .filter((c) => String(c.id) !== String(currentConversationId))
      .filter((c) => {
        if (!q) return true;
        const { title, subtitle } = getConversationDetails(c);
        return (
          title.toLowerCase().includes(q) ||
          subtitle.toLowerCase().includes(q)
        );
      });
  }, [conversations, searchQuery, currentConversationId, currentUserId]);

  const toggleSelect = (convId) => {
    setSelectedIds((prev) => {
      if (prev.includes(convId)) {
        return prev.filter((id) => id !== convId);
      }
      if (prev.length >= 10) {
        showError('You can forward to a maximum of 10 chats at a time.');
        return prev;
      }
      return [...prev, convId];
    });
  };

  const handleForward = async () => {
    if (!message?.id || selectedIds.length === 0 || forwarding) return;
    try {
      setForwarding(true);
      const res = await chatService.forwardMessage(
        currentConversationId,
        message.id,
        selectedIds
      );
      showSuccess(
        `Message forwarded to ${selectedIds.length} conversation${
          selectedIds.length > 1 ? 's' : ''
        }`
      );
      if (onForwardSuccess) {
        onForwardSuccess(res?.data || res);
      }
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  const renderPreviewSnippet = () => {
    if (!message) return null;
    let icon = <FileText size={18} className="forward-msg-preview-icon" />;
    let text = message.content || 'Message';

    if (message.messageType === 'IMAGE' || (message.mediaUrl && message.mediaUrl.match(/\.(jpeg|jpg|png|webp|gif)/i))) {
      icon = <Image size={18} className="forward-msg-preview-icon" />;
      text = message.content && message.content !== 'Photo' ? message.content : 'Photo attachment';
    } else if (message.messageType === 'VIDEO' || (message.mediaUrl && message.mediaUrl.match(/\.(mp4|webm|mov)/i))) {
      icon = <Film size={18} className="forward-msg-preview-icon" />;
      text = message.content && message.content !== 'Video' ? message.content : 'Video attachment';
    } else if (message.messageType === 'AUDIO' || (message.mediaUrl && message.mediaUrl.match(/\.(webm|mp3|wav|ogg|m4a)/i))) {
      icon = <Mic size={18} className="forward-msg-preview-icon" />;
      text = 'Voice message';
    }

    return (
      <div className="forward-msg-preview-card">
        {icon}
        <div className="forward-msg-preview-body">
          <span className="forward-msg-preview-label">Forwarding message</span>
          <span className="forward-msg-preview-text">{text}</span>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forward Message" size="sm">
      <div className="forward-msg-modal">
        {/* Message preview summary */}
        {renderPreviewSnippet()}

        {/* Search */}
        <div className="forward-search-wrap">
          <Search size={16} className="forward-search-icon" />
          <input
            type="text"
            className="forward-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="forward-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Chats stream */}
        <div className="forward-chats-list">
          {loading ? (
            <SkeletonUserRows count={4} />
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const { title, subtitle, avatarUrl } = getConversationDetails(conv);
              const isSelected = selectedIds.includes(conv.id);

              return (
                <div
                  key={conv.id}
                  className={`forward-chat-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSelect(conv.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="forward-chat-info">
                    <Avatar src={avatarUrl} alt={title} size="md" />
                    <div className="forward-chat-names">
                      <span className="forward-chat-title">{title}</span>
                      {subtitle && (
                        <span className="forward-chat-subtitle">{subtitle}</span>
                      )}
                    </div>
                  </div>

                  <div className={`forward-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
              {searchQuery ? 'No conversations match your search.' : 'No conversations found.'}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="forward-modal-footer">
          <span className="forward-selected-count">
            {selectedIds.length > 0
              ? `${selectedIds.length} chat${selectedIds.length > 1 ? 's' : ''} selected`
              : 'Select chats to forward'}
          </span>
          <button
            type="button"
            className="forward-submit-btn"
            disabled={selectedIds.length === 0 || forwarding}
            onClick={handleForward}
          >
            <Forward size={15} />
            <span>{forwarding ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ForwardMessageModal;
