import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import chatService from '../../services/chat.service';
import stompClient from '../../services/websocket';
import callService from '../../services/call.service';

const MESSAGES_PAGE_SIZE = 15;

export const useChatMessages = ({
  activeConversation,
  currentUserId,
  currentUsername,
  showError,
  showSuccess,
  promoteConversationToPrimary,
  setConversations,
  isMyMessage,
}) => {
  const [messages, setMessages] = useState([]);
  const [messagesPage, setMessagesPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [sending, setSending] = useState(false);
  const [activeGroupCallBanner, setActiveGroupCallBanner] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const inputRef = useRef(null);

  // Per-conversation state & scroll tracking
  const openedConversationsRef = useRef(new Set());
  const scrollPositionsRef = useRef(new Map());
  const convCacheRef = useRef(new Map());
  const isPrependingOlderRef = useRef(false);
  const scrollAnchorRef = useRef({ prevScrollHeight: 0, prevScrollTop: 0 });
  const prevLastMsgIdRef = useRef(null);

  // Fetch pinned messages for active conversation
  useEffect(() => {
    if (!activeConversation?.id) {
      setPinnedMessages([]);
      setEditingMessage(null);
      return;
    }
    if (typeof chatService.getPinnedMessages === 'function') {
      chatService
        .getPinnedMessages(activeConversation.id)
        .then((res) => {
          const list = res?.data || res || [];
          setPinnedMessages(Array.isArray(list) ? list : []);
        })
        .catch(() => setPinnedMessages([]));
    }
  }, [activeConversation?.id]);

  // Load messages & subscribe when active conversation changes
  useEffect(() => {
    if (!activeConversation?.id) {
      setMessages([]);
      return;
    }

    const convId = activeConversation.id;
    const cached = convCacheRef.current.get(convId);

    if (cached) {
      setMessages(cached.messages);
      setMessagesPage(cached.page);
      setHasMoreMessages(cached.hasMore);
      setLoadingMsgs(false);
    } else {
      const loadMessages = async () => {
        try {
          setLoadingMsgs(true);
          setMessagesPage(0);
          isInitialLoadRef.current = true;
          const res = await chatService.getMessages(convId, 0, MESSAGES_PAGE_SIZE);
          const list = res?.data?.content || res?.content || res?.data || [];
          const isLast = res?.data?.last ?? (list.length < MESSAGES_PAGE_SIZE);
          setHasMoreMessages(!isLast);

          const chronological = [...list].reverse();
          setMessages(chronological);
          convCacheRef.current.set(convId, {
            messages: chronological,
            page: 0,
            hasMore: !isLast,
          });

          await chatService.markAsRead(convId).catch(() => {});

          stompClient.send(`/topic/conversations/${convId}`, {
            type: 'READ_RECEIPT',
            conversationId: convId,
            readerId: currentUserId,
            readerUsername: currentUsername,
            readAt: new Date().toISOString(),
          });

          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
          );
        } catch (err) {
          showError?.(err.message || 'Failed to load messages');
        } finally {
          setLoadingMsgs(false);
        }
      };

      loadMessages();
    }

    const unsubscribe = stompClient.subscribe(
      `/topic/conversations/${convId}`,
      (incomingMsg) => {
        if (!incomingMsg) return;

        if (incomingMsg.eventType === 'MESSAGE_DELETED') {
          setMessages((prev) => {
            const updated = prev.filter((m) => m.id !== incomingMsg.messageId);
            const cur = convCacheRef.current.get(convId);
            if (cur) convCacheRef.current.set(convId, { ...cur, messages: updated });
            return updated;
          });
          return;
        }

        if (incomingMsg.eventType === 'MESSAGE_REACTION') {
          setMessages((prev) => {
            const updated = prev.map((m) => {
              if (m.id !== incomingMsg.messageId) return m;
              const existing = m.reactions || [];
              const withoutUser = existing.filter((r) => r.userId !== incomingMsg.userId);
              return {
                ...m,
                reactions: [
                  ...withoutUser,
                  { userId: incomingMsg.userId, emoji: incomingMsg.emoji },
                ],
              };
            });
            const cur = convCacheRef.current.get(convId);
            if (cur) convCacheRef.current.set(convId, { ...cur, messages: updated });
            return updated;
          });
          return;
        }

        if (incomingMsg.type === 'READ_RECEIPT') {
          const readerId = incomingMsg.readerId;
          const readerUsername = incomingMsg.readerUsername;

          if (
            (readerId && readerId !== currentUserId) ||
            (readerUsername && readerUsername !== currentUsername)
          ) {
            setMessages((prev) => {
              const updated = prev.map((m) =>
                isMyMessage(m) ? { ...m, isSeen: true, status: 'delivered' } : m
              );
              const cur = convCacheRef.current.get(convId);
              if (cur) convCacheRef.current.set(convId, { ...cur, messages: updated });
              return updated;
            });
          }
          return;
        }

        if (!incomingMsg.id) return;

        const fromOther = !isMyMessage(incomingMsg);

        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;

          if (isMyMessage(incomingMsg)) {
            const tempIndex = prev.findIndex(
              (m) =>
                m.id &&
                typeof m.id === 'string' &&
                (m.id.startsWith('temp-') || m.status === 'sending') &&
                m.content === incomingMsg.content
            );
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = incomingMsg;
              const cur = convCacheRef.current.get(convId);
              if (cur) convCacheRef.current.set(convId, { ...cur, messages: updated });
              return updated;
            }
          }

          const updated = fromOther
            ? prev.map((m) =>
                isMyMessage(m) ? { ...m, isSeen: true, status: 'delivered' } : m
              )
            : prev;

          const nextMsgs = [...updated, incomingMsg];
          const cur = convCacheRef.current.get(convId);
          if (cur) convCacheRef.current.set(convId, { ...cur, messages: nextMsgs });
          return nextMsgs;
        });

        if (fromOther) {
          chatService.markAsRead(convId).catch(() => {});
          stompClient.send(`/topic/conversations/${convId}`, {
            type: 'READ_RECEIPT',
            conversationId: convId,
            readerId: currentUserId,
            readerUsername: currentUsername,
            readAt: new Date().toISOString(),
          });
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: incomingMsg,
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation?.id, showError, isMyMessage, currentUserId, currentUsername, setConversations]);

  // Group active call status checker and real-time subscriber
  useEffect(() => {
    if (!activeConversation?.id || activeConversation.type !== 'GROUP') {
      setActiveGroupCallBanner(null);
      return;
    }

    const convId = activeConversation.id;

    callService
      .getActiveGroupCall(convId)
      .then((res) => {
        const session = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
        if (session && session.id && session.status !== 'ENDED' && session.status !== 'MISSED') {
          setActiveGroupCallBanner(session);
        } else {
          setActiveGroupCallBanner(null);
        }
      })
      .catch(() => setActiveGroupCallBanner(null));

    const unsub = stompClient.subscribe(`/topic/conversations/${convId}/call`, (event) => {
      if (!event || !event.eventType) return;
      if (event.eventType === 'GROUP_CALL_STARTED' || event.eventType === 'PARTICIPANT_JOINED') {
        setActiveGroupCallBanner(event);
      } else if (event.eventType === 'CALL_ENDED' || event.eventType === 'PARTICIPANT_LEFT') {
        if (event.eventType === 'CALL_ENDED' || !event.participants || event.participants.length === 0) {
          setActiveGroupCallBanner(null);
        } else {
          setActiveGroupCallBanner(event);
        }
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [activeConversation?.id, activeConversation?.type]);

  const scrollToBottom = useCallback((instant = true) => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    if (instant) {
      container.scrollTop = container.scrollHeight;
    } else {
      if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const convId = activeConversation?.id;
    if (!container || !convId) return;

    if (isPrependingOlderRef.current) {
      const { prevScrollHeight, prevScrollTop } = scrollAnchorRef.current;
      const heightDiff = container.scrollHeight - prevScrollHeight;
      const newScroll = prevScrollTop + heightDiff;
      container.scrollTop = newScroll;
      scrollPositionsRef.current.set(convId, newScroll);
      isPrependingOlderRef.current = false;
      return;
    }

    if (!openedConversationsRef.current.has(convId) && !loadingMsgs && messages.length > 0) {
      const scrollToBottomInitial = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          scrollPositionsRef.current.set(convId, messagesContainerRef.current.scrollTop);
        }
      };

      scrollToBottomInitial();
      const raf = requestAnimationFrame(scrollToBottomInitial);
      const t1 = setTimeout(scrollToBottomInitial, 40);
      const t2 = setTimeout(scrollToBottomInitial, 120);
      openedConversationsRef.current.add(convId);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (openedConversationsRef.current.has(convId) && !loadingMsgs && messages.length > 0) {
      const savedScroll = scrollPositionsRef.current.get(convId);
      if (typeof savedScroll === 'number') {
        container.scrollTop = savedScroll;
      }
    }
  }, [messages, loadingMsgs, activeConversation?.id]);

  useEffect(() => {
    if (!messages.length || !messagesContainerRef.current || loadingMsgs) return;

    const lastMsg = messages[messages.length - 1];
    const isNewLastMessage = lastMsg && lastMsg.id !== prevLastMsgIdRef.current;
    prevLastMsgIdRef.current = lastMsg?.id;

    if (
      isNewLastMessage &&
      !isPrependingOlderRef.current &&
      activeConversation?.id &&
      openedConversationsRef.current.has(activeConversation.id)
    ) {
      const container = messagesContainerRef.current;
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 60;
      if (isAtBottom) {
        scrollToBottom(false);
        scrollPositionsRef.current.set(activeConversation.id, container.scrollHeight);
      }
    }
  }, [messages, loadingMsgs, scrollToBottom, activeConversation?.id]);

  const loadOlderMessages = useCallback(async () => {
    if (!activeConversation?.id || loadingOlderMessages || !hasMoreMessages || loadingMsgs) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    scrollAnchorRef.current = {
      prevScrollHeight: container.scrollHeight,
      prevScrollTop: container.scrollTop,
    };
    isPrependingOlderRef.current = true;

    try {
      setLoadingOlderMessages(true);
      const nextPage = messagesPage + 1;
      const res = await chatService.getMessages(activeConversation.id, nextPage, MESSAGES_PAGE_SIZE);
      const olderListDesc = res?.data?.content || res?.content || res?.data || [];
      const isLast = res?.data?.last ?? (olderListDesc.length < MESSAGES_PAGE_SIZE);

      const olderChronological = [...olderListDesc].reverse();

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueOlder = olderChronological.filter((m) => !existingIds.has(m.id));
        if (uniqueOlder.length === 0) {
          isPrependingOlderRef.current = false;
          return prev;
        }
        const updated = [...uniqueOlder, ...prev];
        convCacheRef.current.set(activeConversation.id, {
          messages: updated,
          page: nextPage,
          hasMore: !isLast,
        });
        return updated;
      });

      setMessagesPage(nextPage);
      setHasMoreMessages(!isLast);

      requestAnimationFrame(() => {
        if (messagesContainerRef.current && isPrependingOlderRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          const heightDiff = newScrollHeight - scrollAnchorRef.current.prevScrollHeight;
          const newScroll = scrollAnchorRef.current.prevScrollTop + heightDiff;
          messagesContainerRef.current.scrollTop = newScroll;
          scrollPositionsRef.current.set(activeConversation.id, newScroll);
          isPrependingOlderRef.current = false;
        }
      });
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [activeConversation?.id, loadingOlderMessages, hasMoreMessages, loadingMsgs, messagesPage]);

  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !activeConversation?.id) return;

    scrollPositionsRef.current.set(activeConversation.id, container.scrollTop);

    if (container.scrollTop < 80 && hasMoreMessages && !loadingOlderMessages && !loadingMsgs) {
      loadOlderMessages();
    }
  }, [activeConversation?.id, hasMoreMessages, loadingOlderMessages, loadingMsgs, loadOlderMessages]);

  const handleSendMessage = async (e, onSendMedia) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSendMedia) {
      return onSendMedia();
    }
    if (!inputText.trim() || !activeConversation || sending) return;

    if (editingMessage) {
      const newContent = inputText.trim();
      setInputText('');
      const targetMsgId = editingMessage.id;
      setEditingMessage(null);
      try {
        const res = await chatService.editMessage(activeConversation.id, targetMsgId, newContent);
        const updated = res?.data || res;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === targetMsgId ? { ...m, content: updated.content, isEdited: true } : m
          )
        );
        showSuccess?.('Message edited');
      } catch (err) {
        showError?.(err.message || 'Failed to edit message');
      }
      return;
    }

    const content = inputText.trim();
    setInputText('');

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg = {
      id: tempId,
      content,
      messageType: 'TEXT',
      sender: {
        id: currentUserId,
        userId: currentUserId,
        username: currentUsername,
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      isSeen: false,
    };

    setMessages((prev) => {
      const nextMsgs = [...prev, optimisticMsg];
      if (activeConversation?.id) {
        convCacheRef.current.set(activeConversation.id, {
          messages: nextMsgs,
          page: messagesPage,
          hasMore: hasMoreMessages,
        });
      }
      return nextMsgs;
    });
    requestAnimationFrame(() => {
      scrollToBottom(true);
      if (activeConversation?.id && messagesContainerRef.current) {
        scrollPositionsRef.current.set(
          activeConversation.id,
          messagesContainerRef.current.scrollHeight
        );
      }
    });

    try {
      setSending(true);
      const res = await chatService.sendMessage(activeConversation.id, {
        content,
        messageType: 'TEXT',
      });
      const sentMsg = res?.data || res;
      const confirmedMsg = { ...sentMsg, status: 'sent', isSeen: false };

      setMessages((prev) => {
        const alreadyHasRealId = prev.some((m) => m.id === sentMsg.id);
        if (alreadyHasRealId) {
          const filtered = prev.filter((m) => m.id !== tempId);
          if (activeConversation?.id) {
            convCacheRef.current.set(activeConversation.id, {
              messages: filtered,
              page: messagesPage,
              hasMore: hasMoreMessages,
            });
          }
          return filtered;
        }

        const replaced = prev.map((m) => (m.id === tempId ? confirmedMsg : m));
        if (activeConversation?.id) {
          convCacheRef.current.set(activeConversation.id, {
            messages: replaced,
            page: messagesPage,
            hasMore: hasMoreMessages,
          });
        }
        return replaced;
      });

      promoteConversationToPrimary(activeConversation.id, confirmedMsg);
    } catch (err) {
      showError?.(err.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(content);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSendQuickHeart = async () => {
    if (!activeConversation?.id || sending) return;
    try {
      setSending(true);
      const res = await chatService.sendMessage(activeConversation.id, {
        content: '❤️',
        messageType: 'TEXT',
      });
      const sentMsg = res?.data || res;
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        const nextMsgs = [...prev, { ...sentMsg, status: 'sent', isSeen: false }];
        if (activeConversation?.id) {
          convCacheRef.current.set(activeConversation.id, {
            messages: nextMsgs,
            page: messagesPage,
            hasMore: hasMoreMessages,
          });
        }
        return nextMsgs;
      });
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
      promoteConversationToPrimary(activeConversation.id, sentMsg);
    } catch (err) {
      showError?.(err.message || 'Failed to send heart');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePinMessage = async (messageId) => {
    if (!activeConversation?.id || !messageId) return;
    try {
      const res = await chatService.togglePinMessage(activeConversation.id, messageId);
      const updated = res?.data || res;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isPinnedInChat: updated.isPinnedInChat } : m
        )
      );
      if (updated.isPinnedInChat) {
        setPinnedMessages((prev) => [...prev.filter((p) => p.id !== messageId), updated]);
        showSuccess?.('Message pinned to chat');
      } else {
        setPinnedMessages((prev) => prev.filter((p) => p.id !== messageId));
        showSuccess?.('Message unpinned');
      }
    } catch (err) {
      showError?.(err.message || 'Failed to toggle pin');
    }
  };

  const handleSelectTheme = async (themeId) => {
    if (!activeConversation?.id) return;
    try {
      await chatService.updateConversationTheme(activeConversation.id, themeId);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, theme: themeId } : c))
      );
      showSuccess?.(`Chat theme updated to ${themeId}`);
    } catch (err) {
      showError?.(err.message || 'Failed to update chat theme');
    }
  };

  const handleStartEditMessage = (msg) => {
    if (!msg || msg.messageType !== 'TEXT') return;
    setEditingMessage(msg);
    setInputText(msg.content);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-pulse');
      setTimeout(() => el.classList.remove('highlight-pulse'), 1500);
    }
  };

  const handleUnsendMessage = async (messageId) => {
    if (!activeConversation?.id) return;
    try {
      await chatService.unsendMessage(activeConversation.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showSuccess?.('Message unsent');
    } catch (err) {
      showError?.(err.message || 'Failed to unsend message');
    }
  };

  const handleToggleReaction = async (messageId, currentReactions) => {
    if (!activeConversation?.id) return;
    const hasMyReaction = (currentReactions || []).some(
      (r) => r.userId === currentUserId && r.emoji === '❤️'
    );
    try {
      if (hasMyReaction) {
        await chatService.removeReaction(activeConversation.id, messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: (m.reactions || []).filter((r) => r.userId !== currentUserId),
                }
              : m
          )
        );
      } else {
        await chatService.reactToMessage(activeConversation.id, messageId, '❤️');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: [
                    ...(m.reactions || []).filter((r) => r.userId !== currentUserId),
                    { userId: currentUserId, emoji: '❤️' },
                  ],
                }
              : m
          )
        );
      }
    } catch (err) {
      showError?.(err.message || 'Failed to react');
    }
  };

  const lastTheirsIndex = messages.map((m) => !isMyMessage(m)).lastIndexOf(true);

  const isDoubleRight = (msg, index) => {
    if (msg.status === 'sending') return false;
    if (msg.isSeen === true || msg.status === 'delivered') return true;
    if (lastTheirsIndex !== -1 && index <= lastTheirsIndex) return true;
    return false;
  };

  const formatDateDivider = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[d.getMonth()] || '';
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  };

  const shouldShowDivider = (curr, prev) => {
    if (!curr?.createdAt) return false;
    if (!prev?.createdAt) return true;
    const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return diff > 30 * 60 * 1000;
  };

  return {
    messages,
    setMessages,
    messagesPage,
    hasMoreMessages,
    loadingOlderMessages,
    loadingMsgs,
    inputText,
    setInputText,
    pinnedMessages,
    editingMessage,
    setEditingMessage,
    sending,
    setSending,
    activeGroupCallBanner,
    messagesEndRef,
    messagesContainerRef,
    inputRef,
    convCacheRef,
    scrollToBottom,
    loadOlderMessages,
    handleMessagesScroll,
    handleSendMessage,
    handleSendQuickHeart,
    handleTogglePinMessage,
    handleSelectTheme,
    handleStartEditMessage,
    scrollToMessage,
    handleUnsendMessage,
    handleToggleReaction,
    isDoubleRight,
    formatDateDivider,
    shouldShowDivider,
  };
};

export default useChatMessages;
