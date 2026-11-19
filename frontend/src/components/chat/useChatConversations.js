import { useState, useEffect, useCallback } from 'react';
import chatService from '../../services/chat.service';
import stompClient from '../../services/websocket';

export const useChatConversations = ({
  currentUserId,
  currentUsername,
  preferredRouteConvId,
  showError,
  showSuccess,
  locationStateConvId,
}) => {
  const [conversations, setConversations] = useState([]);
  const [requestConversations, setRequestConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [activeInboxTab, setActiveInboxTab] = useState('primary');
  const [convSearchTerm, setConvSearchTerm] = useState('');
  const [convMenuOpenId, setConvMenuOpenId] = useState(null);
  const [handlingRequestAction, setHandlingRequestAction] = useState(false);
  const [deleteChatModalTarget, setDeleteChatModalTarget] = useState(null);
  const [deletingChat, setDeletingChat] = useState(false);
  const [mutedConvs, setMutedConvs] = useState(() => {
    try {
      const saved = localStorage.getItem('instagram_muted_conversations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Helper to identify if a message is from the current user
  const isMyMessage = useCallback(
    (msg) => {
      if (!msg) return false;
      const senderId = msg.sender?.id || msg.sender?.userId;
      const senderUsername = msg.sender?.username;

      if (currentUserId && senderId && currentUserId === senderId) return true;
      if (currentUsername && senderUsername && currentUsername === senderUsername) return true;
      return false;
    },
    [currentUserId, currentUsername]
  );

  // Helper to get other member in conversation
  const getOtherMember = useCallback(
    (conv) => {
      if (!conv) return {};
      const members = conv?.members || [];
      const other = members.find((m) => {
        const mId = m.id || m.userId;
        if (mId && currentUserId) return mId !== currentUserId;
        if (m.username && currentUsername) return m.username !== currentUsername;
        return false;
      });
      return other || members[0] || {};
    },
    [currentUserId, currentUsername]
  );

  // Load conversations & message requests
  const loadConversations = useCallback(
    async (preferredConvId) => {
      try {
        setLoadingConvs(true);
        const [primaryRes, requestsRes] = await Promise.all([
          Promise.resolve(chatService.getConversations(0, 30)),
          Promise.resolve(chatService.getConversations(0, 30, 'REQUESTS')).catch(() => ({
            data: { content: [] },
          })),
        ]);
        const list = primaryRes?.data?.content || primaryRes?.content || primaryRes?.data || [];
        const reqList = requestsRes?.data?.content || requestsRes?.content || requestsRes?.data || [];
        const safePrimary = Array.isArray(list) ? list : [];
        const safeRequests = Array.isArray(reqList) ? reqList : [];

        setConversations(safePrimary);
        setRequestConversations(safeRequests);

        const targetId = preferredConvId || locationStateConvId;
        if (targetId) {
          const foundPrimary = safePrimary.find((c) => c.id === targetId);
          const foundRequest = !foundPrimary ? safeRequests.find((c) => c.id === targetId) : null;
          if (foundPrimary) {
            setActiveConversation(foundPrimary);
            if (foundPrimary.folder === 'GENERAL') {
              setActiveInboxTab('general');
            } else {
              setActiveInboxTab('primary');
            }
          } else if (foundRequest) {
            setActiveConversation(foundRequest);
            setActiveInboxTab('requests');
          } else {
            try {
              const singleRes = await chatService.getConversationById(targetId);
              const singleConv = singleRes?.data || singleRes;
              if (singleConv?.id) {
                setActiveConversation(singleConv);
                if (singleConv.folder === 'REQUESTS') {
                  setRequestConversations((prev) =>
                    prev.some((c) => c.id === singleConv.id) ? prev : [singleConv, ...prev]
                  );
                  setActiveInboxTab('requests');
                } else if (singleConv.folder === 'GENERAL') {
                  setConversations((prev) =>
                    prev.some((c) => c.id === singleConv.id) ? prev : [singleConv, ...prev]
                  );
                  setActiveInboxTab('general');
                } else {
                  setConversations((prev) =>
                    prev.some((c) => c.id === singleConv.id) ? prev : [singleConv, ...prev]
                  );
                  setActiveInboxTab('primary');
                }
              }
            } catch {
              // Ignore single conversation load error
            }
          }
        }
      } catch {
        setConversations([]);
        setRequestConversations([]);
      } finally {
        setLoadingConvs(false);
      }
    },
    [locationStateConvId]
  );

  // Move a conversation from Requests -> Primary Messages locally
  const promoteConversationToPrimary = useCallback(
    (convId, lastMsgOverride = null) => {
      if (!convId) return;
      const inReq = requestConversations.find((c) => c.id === convId);
      const baseConv = inReq || (activeConversation?.id === convId ? activeConversation : null);

      setRequestConversations((prev) => prev.filter((c) => c.id !== convId));
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId);
        if (exists) {
          return prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  folder: 'PRIMARY',
                  ...(lastMsgOverride ? { lastMessage: lastMsgOverride, updatedAt: new Date().toISOString() } : {}),
                }
              : c
          );
        }
        if (!baseConv) return prev;
        return [
          {
            ...baseConv,
            folder: 'PRIMARY',
            ...(lastMsgOverride ? { lastMessage: lastMsgOverride, updatedAt: new Date().toISOString() } : {}),
          },
          ...prev,
        ];
      });
      setActiveConversation((prev) =>
        prev?.id === convId ? { ...prev, folder: 'PRIMARY' } : prev
      );
      if (inReq || activeConversation?.folder === 'REQUESTS') {
        setActiveInboxTab('primary');
      }
    },
    [requestConversations, activeConversation]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Synchronize unseen chats count with global layout badge
  useEffect(() => {
    const unreadChats = conversations.filter((c) => (Number(c.unreadCount) || 0) > 0).length;
    window.dispatchEvent(new CustomEvent('chat:unread-count', { detail: unreadChats }));
  }, [conversations]);

  // Global user inbox subscription for real-time conversation updates
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = stompClient.subscribe(
      `/topic/users/${currentUserId}/messages`,
      (incomingMsg) => {
        if (!incomingMsg || !incomingMsg.id) return;

        const updateConvEntry = (conv, markActiveUnreadZero) => ({
          ...conv,
          lastMessage: incomingMsg,
          unreadCount: markActiveUnreadZero ? 0 : (conv.unreadCount || 0) + 1,
          updatedAt: incomingMsg.createdAt || new Date().toISOString(),
        });

        setConversations((prev) => {
          const convIndex = prev.findIndex((c) => c.id === incomingMsg.conversationId);
          if (convIndex !== -1) {
            const isCurrentlyActive = activeConversation?.id === incomingMsg.conversationId;
            const updatedConv = updateConvEntry(prev[convIndex], isCurrentlyActive);
            const remainder = prev.filter((c) => c.id !== incomingMsg.conversationId);
            return [updatedConv, ...remainder];
          }
          setRequestConversations((reqPrev) => {
            const reqIndex = reqPrev.findIndex((c) => c.id === incomingMsg.conversationId);
            if (reqIndex === -1 || incomingMsg.sender?.id === currentUserId) {
              return reqPrev;
            }
            const isCurrentlyActive = activeConversation?.id === incomingMsg.conversationId;
            const updatedReq = updateConvEntry(reqPrev[reqIndex], isCurrentlyActive);
            return [updatedReq, ...reqPrev.filter((c) => c.id !== incomingMsg.conversationId)];
          });
          loadConversations();
          return prev;
        });
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [currentUserId, activeConversation?.id, loadConversations]);

  // Listen for story replies & reactions sent from StoryViewerModal
  useEffect(() => {
    const handleStoryDmSent = () => {
      loadConversations();
    };
    window.addEventListener('story:dm-sent', handleStoryDmSent);
    return () => window.removeEventListener('story:dm-sent', handleStoryDmSent);
  }, [loadConversations]);

  // Pin / Unpin Conversation
  const handleTogglePin = async (e, convId) => {
    if (e) e.stopPropagation();
    setConvMenuOpenId(null);
    try {
      const res = await chatService.togglePinConversation(convId);
      const updated = res?.data || res;
      setConversations((prev) =>
        prev
          .map((c) => (c.id === convId ? { ...c, isPinned: updated.isPinned } : c))
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
          })
      );
      if (activeConversation?.id === convId) {
        setActiveConversation((prev) => ({ ...prev, isPinned: updated.isPinned }));
      }
      showSuccess?.(updated.isPinned ? 'Chat pinned to top' : 'Chat unpinned');
    } catch (err) {
      showError?.(err.response?.data?.message || err.message || 'Failed to update pin');
    }
  };

  // Mark as unread / read
  const handleToggleUnread = (e, convId) => {
    if (e) e.stopPropagation();
    setConvMenuOpenId(null);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const isUnread = (c.unreadCount || 0) > 0;
          return { ...c, unreadCount: isUnread ? 0 : 1 };
        }
        return c;
      })
    );
  };

  // Move conversation to PRIMARY or GENERAL folder
  const handleMoveConversationFolder = async (e, convId, targetFolder) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setConvMenuOpenId(null);
    try {
      await chatService.updateConversationFolder(convId, targetFolder);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, folder: targetFolder } : c))
      );
      if (activeConversation?.id === convId) {
        setActiveConversation((prev) => ({ ...prev, folder: targetFolder }));
      }
      showSuccess?.(
        `Chat moved to ${targetFolder === 'GENERAL' ? 'General' : 'Primary'}`
      );
    } catch (err) {
      showError?.(err.message || 'Failed to move conversation folder');
    }
  };

  // Toggle Mute / Unmute
  const handleToggleMute = (e, convId) => {
    if (e) e.stopPropagation();
    setConvMenuOpenId(null);
    setMutedConvs((prev) => {
      const next = new Set(prev);
      const isMuted = next.has(convId);
      if (isMuted) {
        next.delete(convId);
        showSuccess?.('Notifications unmuted');
      } else {
        next.add(convId);
        showSuccess?.('Notifications muted');
      }
      try {
        localStorage.setItem('instagram_muted_conversations', JSON.stringify([...next]));
      } catch (err) {
        console.warn('Failed to save muted state', err);
      }
      return next;
    });
  };

  // Delete Conversation
  const handleDeleteConversation = (e, conv) => {
    if (e) e.stopPropagation();
    setConvMenuOpenId(null);
    setDeleteChatModalTarget(conv);
  };

  const handleConfirmDeleteChat = async () => {
    if (!deleteChatModalTarget?.id) return;
    const convId = deleteChatModalTarget.id;
    try {
      setDeletingChat(true);
      await chatService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      setRequestConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
      }
      showSuccess?.('Chat deleted');
      setDeleteChatModalTarget(null);
    } catch (err) {
      showError?.(err.message || 'Failed to delete chat');
    } finally {
      setDeletingChat(false);
    }
  };

  // Start chat with user directly
  const handleStartChatWithUser = async (targetUser) => {
    const targetId = targetUser?.id || targetUser?.userId;
    if (!targetId) return;

    try {
      const res = await chatService.getOrCreateDirectConversation(targetId);
      const conv = res?.data || res;
      await loadConversations(conv.id);
      setActiveConversation(conv);
      if (conv?.folder === 'REQUESTS') {
        setRequestConversations((prev) =>
          prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]
        );
        setActiveInboxTab('requests');
      } else if (conv?.id) {
        setConversations((prev) =>
          prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]
        );
      }
    } catch (err) {
      showError?.(err.message || 'Failed to create conversation');
    }
  };

  // Start Group Chat
  const handleCreateGroupChat = async ({ name, memberIds }) => {
    try {
      const res = await chatService.createGroupConversation({
        name,
        memberIds,
      });
      const conv = res?.data || res;
      await loadConversations(conv.id);
      setActiveConversation(conv);
      showSuccess?.('Group created successfully');
      return conv;
    } catch (err) {
      showError?.(err.message || 'Failed to create group');
      throw err;
    }
  };

  // Accept or decline a message request
  const handleAcceptMessageRequest = async () => {
    if (!activeConversation?.id || handlingRequestAction) return;
    try {
      setHandlingRequestAction(true);
      await chatService.acceptMessageRequest(activeConversation.id);
      promoteConversationToPrimary(activeConversation.id);
      showSuccess?.('Message request accepted');
    } catch (err) {
      showError?.(err.message || 'Failed to accept message request');
    } finally {
      setHandlingRequestAction(false);
    }
  };

  const handleDeclineMessageRequest = async () => {
    if (!activeConversation?.id || handlingRequestAction) return;
    try {
      setHandlingRequestAction(true);
      const convId = activeConversation.id;
      await chatService.declineMessageRequest(convId);
      setRequestConversations((prev) => prev.filter((c) => c.id !== convId));
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      setActiveConversation(null);
      showSuccess?.('Message request deleted');
    } catch (err) {
      showError?.(err.message || 'Failed to delete message request');
    } finally {
      setHandlingRequestAction(false);
    }
  };

  const filterConversationList = (list) => {
    if (!convSearchTerm.trim()) return list;
    const term = convSearchTerm.trim().toLowerCase();
    return list.filter((conv) => {
      const other = getOtherMember(conv);
      const otherUsername = (other?.username || '').toLowerCase();
      const otherDisplayName = (other?.displayName || '').toLowerCase();
      const groupName = (conv.name || '').toLowerCase();
      const lastMsgText = (conv.lastMessage?.content || '').toLowerCase();
      const membersMatch = (conv.members || []).some(
        (m) =>
          (m.username || '').toLowerCase().includes(term) ||
          (m.displayName || '').toLowerCase().includes(term)
      );

      return (
        otherUsername.includes(term) ||
        otherDisplayName.includes(term) ||
        groupName.includes(term) ||
        membersMatch ||
        lastMsgText.includes(term)
      );
    });
  };

  const filteredConversations = filterConversationList(conversations);
  const filteredRequestConversations = filterConversationList(requestConversations);

  return {
    conversations,
    setConversations,
    requestConversations,
    setRequestConversations,
    activeConversation,
    setActiveConversation,
    loadingConvs,
    activeInboxTab,
    setActiveInboxTab,
    convSearchTerm,
    setConvSearchTerm,
    convMenuOpenId,
    setConvMenuOpenId,
    mutedConvs,
    handlingRequestAction,
    deleteChatModalTarget,
    setDeleteChatModalTarget,
    deletingChat,
    loadConversations,
    promoteConversationToPrimary,
    handleTogglePin,
    handleToggleUnread,
    handleMoveConversationFolder,
    handleToggleMute,
    handleDeleteConversation,
    handleConfirmDeleteChat,
    handleStartChatWithUser,
    handleCreateGroupChat,
    handleAcceptMessageRequest,
    handleDeclineMessageRequest,
    filteredConversations,
    filteredRequestConversations,
    getOtherMember,
    isMyMessage,
  };
};

export default useChatConversations;
