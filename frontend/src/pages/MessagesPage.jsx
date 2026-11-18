import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import { SkeletonChatThreadPane } from '../components/ui/Skeleton';
import chatService from '../services/chat.service';
import userService from '../services/user.service';
import followService from '../services/follow.service';
import mediaService from '../services/media.service';
import stompClient from '../services/websocket';
import storyService from '../services/story.service';
import {
  ThemePickerModal,
  CHAT_THEMES,
  ViewOnceModal,
  StoryPreviewModal,
  DeleteChatModal,
  GroupDetailsModal,
  NewChatModal,
  ChatHeader,
  ChatInputBar,
  ConversationSidebar,
  MessageStream,
} from '../components/chat';
import ForwardMessageModal from '../components/modals/ForwardMessageModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCall } from '../context/CallContext';
import callService from '../services/call.service';
import { timeAgo } from '../utils';
import './MessagesPage.css';
import '../components/modals/BlockUserModal.css';

const MESSAGES_PAGE_SIZE = 15;

export const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [requestConversations, setRequestConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [handlingRequestAction, setHandlingRequestAction] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesPage, setMessagesPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [convSearchTerm, setConvSearchTerm] = useState('');
  const [activeInboxTab, setActiveInboxTab] = useState('primary');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [forwardMessageTarget, setForwardMessageTarget] = useState(null);

  // Modals state
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [deleteChatModalTarget, setDeleteChatModalTarget] = useState(null);
  const [deletingChat, setDeletingChat] = useState(false);
  const [groupDetailsModalOpen, setGroupDetailsModalOpen] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Media Attachment & View-Once state
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [isViewOnceMedia, setIsViewOnceMedia] = useState(false);
  const [viewOnceModalData, setViewOnceModalData] = useState(null);
  const [viewOnceCountdown, setViewOnceCountdown] = useState(10);
  const [storyPreviewModalUrl, setStoryPreviewModalUrl] = useState(null);
  const [sharedMentionStories, setSharedMentionStories] = useState({});
  const [sharingMentionStoryId, setSharingMentionStoryId] = useState(null);
  const mediaFileInputRef = useRef(null);
  const viewOnceTimerRef = useRef(null);

  // Conversation 3-dots Context Menu State (Instagram Web parity)
  const [convMenuOpenId, setConvMenuOpenId] = useState(null);
  const [mutedConvs, setMutedConvs] = useState(() => {
    try {
      const saved = localStorage.getItem('instagram_muted_conversations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Close context menu on outside click
  useEffect(() => {
    if (!convMenuOpenId) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.conv-context-menu') && !e.target.closest('.conv-options-btn')) {
        setConvMenuOpenId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [convMenuOpenId]);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { startCall, startGroupCall } = useCall();
  const [activeGroupCallBanner, setActiveGroupCallBanner] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const inputRef = useRef(null);

  // Per-conversation state & scroll tracking (Instagram parity)
  const openedConversationsRef = useRef(new Set()); // Tracks conversations that have performed initial bottom scroll
  const scrollPositionsRef = useRef(new Map()); // Stores scrollTop per conversationId
  const convCacheRef = useRef(new Map()); // Stores { messages, page, hasMore } per conversationId
  const isPrependingOlderRef = useRef(false);
  const scrollAnchorRef = useRef({ prevScrollHeight: 0, prevScrollTop: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const currentUserId = currentUser?.id || currentUser?.userId;
  const currentUsername = currentUser?.username;

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

        const targetId = preferredConvId || location.state?.conversationId;
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
    [location.state?.conversationId]
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
    if (activeConversation) {
      document.body.classList.add('in-active-chat');
    } else {
      document.body.classList.remove('in-active-chat');
    }
    return () => {
      document.body.classList.remove('in-active-chat');
    };
  }, [activeConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Synchronize unseen chats count with global layout badge (ONLY FRONTEND)
  useEffect(() => {
    const unreadChats = conversations.filter((c) => (Number(c.unreadCount) || 0) > 0).length;
    window.dispatchEvent(new CustomEvent('chat:unread-count', { detail: unreadChats }));
  }, [conversations]);

  // Connect STOMP WebSocket
  useEffect(() => {
    stompClient.connect();
    return () => {
      // Keep persistent connection
    };
  }, []);

  // Global user inbox subscription for real-time conversation updates
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = stompClient.subscribe(
      `/topic/users/${currentUserId}/messages`,
      (incomingMsg) => {
        if (!incomingMsg || !incomingMsg.id) return;

        // Update sidebar conversations / requests lists and bump to top
        const updateConvEntry = (conv, markActiveUnreadZero) => ({
          ...conv,
          lastMessage: incomingMsg,
          unreadCount: markActiveUnreadZero
            ? 0
            : (conv.unreadCount || 0) + 1,
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

  // Fetch pinned messages for active conversation
  useEffect(() => {
    if (!activeConversation?.id) {
      setPinnedMessages([]);
      setEditingMessage(null);
      return;
    }
    if (typeof chatService.getPinnedMessages === 'function') {
      chatService.getPinnedMessages(activeConversation.id)
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

    // Check if this conversation already has cached messages in this session
    const cached = convCacheRef.current.get(convId);
    if (cached) {
      setMessages(cached.messages);
      setMessagesPage(cached.page);
      setHasMoreMessages(cached.hasMore);
      setLoadingMsgs(false);
    } else {
      // First time loading this conversation
      const loadMessages = async () => {
        try {
          setLoadingMsgs(true);
          setMessagesPage(0);
          isInitialLoadRef.current = true;
          const res = await chatService.getMessages(convId, 0, MESSAGES_PAGE_SIZE);
          const list = res?.data?.content || res?.content || res?.data || [];
          const isLast = res?.data?.last ?? (list.length < MESSAGES_PAGE_SIZE);
          setHasMoreMessages(!isLast);

          // Backend returns DESC (newest first). Reverse to render chronologically.
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
          showError(err.message || 'Failed to load messages');
        } finally {
          setLoadingMsgs(false);
        }
      };

      loadMessages();
    }

    // Subscribe to live messages and read receipts for this conversation
    const unsubscribe = stompClient.subscribe(
      `/topic/conversations/${convId}`,
      (incomingMsg) => {
        if (!incomingMsg) return;

        // Handle real-time unsend / message deletion
        if (incomingMsg.eventType === 'MESSAGE_DELETED') {
          setMessages((prev) => {
            const updated = prev.filter((m) => m.id !== incomingMsg.messageId);
            const cur = convCacheRef.current.get(convId);
            if (cur) convCacheRef.current.set(convId, { ...cur, messages: updated });
            return updated;
          });
          return;
        }

        // Handle real-time emoji reactions
        if (incomingMsg.eventType === 'MESSAGE_REACTION') {
          setMessages((prev) => {
            const updated = prev.map((m) => {
              if (m.id !== incomingMsg.messageId) return m;
              const existing = m.reactions || [];
              const withoutUser = existing.filter((r) => r.userId !== incomingMsg.userId);
              return {
                ...m,
                reactions: [...withoutUser, { userId: incomingMsg.userId, emoji: incomingMsg.emoji }],
              };
            });
            const cur = convCacheRef.current.get(convId);
            if (cur) convCacheRef.current.set(convId, { ...cur, messages: updated });
            return updated;
          });
          return;
        }

        // Handle real-time read receipts from the other user
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

          // If incoming message was sent by me, replace the optimistic message
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

          // If message is from the other party, mark our previous messages as delivered/seen
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
  }, [activeConversation?.id, showError, isMyMessage, currentUserId, currentUsername]);

  // Group active call status checker and real-time subscriber
  useEffect(() => {
    if (!activeConversation?.id || activeConversation.type !== 'GROUP') {
      setActiveGroupCallBanner(null);
      return;
    }

    const convId = activeConversation.id;

    // Check if there is an active call right now
    callService.getActiveGroupCall(convId)
      .then((res) => {
        const session = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
        if (session && session.id && session.status !== 'ENDED' && session.status !== 'MISSED') {
          setActiveGroupCallBanner(session);
        } else {
          setActiveGroupCallBanner(null);
        }
      })
      .catch(() => setActiveGroupCallBanner(null));

    // Subscribe to group call status events on this conversation
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

    // Helper to scroll chat to bottom when user explicitly sends a message
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

  // INSTAGRAM PARITY SCROLL MANAGER:
  // 1. "ONLY ONE TIME END SE START": Jab conversation pehli baar open ho, bottom se start hoga.
  // 2. "BAKI TIME JAHA PER SCROLL THA WAHI": Har baar jahan user ne scroll chhoda tha, wahi restore hoga.
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const convId = activeConversation?.id;
    if (!container || !convId) return;

    // Case 1: Upward pagination prepending older messages -> preserve exact scroll anchor
    if (isPrependingOlderRef.current) {
      const { prevScrollHeight, prevScrollTop } = scrollAnchorRef.current;
      const heightDiff = container.scrollHeight - prevScrollHeight;
      const newScroll = prevScrollTop + heightDiff;
      container.scrollTop = newScroll;
      scrollPositionsRef.current.set(convId, newScroll);
      isPrependingOlderRef.current = false;
      return;
    }

    // Case 2: FIRST TIME OPEN -> Start at the end (bottom) ONLY ONCE
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

    // Case 3: ALREADY OPENED BEFORE -> Restore exact position where scroll was ("jaha per scroll tha wahi")
    if (openedConversationsRef.current.has(convId) && !loadingMsgs && messages.length > 0) {
      const savedScroll = scrollPositionsRef.current.get(convId);
      if (typeof savedScroll === 'number') {
        container.scrollTop = savedScroll;
      }
    }
  }, [messages, loadingMsgs, activeConversation?.id]);

  // Handle incoming new messages: ONLY scroll down if user was already viewing the very bottom
  const prevLastMsgIdRef = useRef(null);
  useEffect(() => {
    if (!messages.length || !messagesContainerRef.current || loadingMsgs) return;

    const lastMsg = messages[messages.length - 1];
    const isNewLastMessage = lastMsg && lastMsg.id !== prevLastMsgIdRef.current;
    prevLastMsgIdRef.current = lastMsg?.id;

    if (isNewLastMessage && !isPrependingOlderRef.current && activeConversation?.id && openedConversationsRef.current.has(activeConversation.id)) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
      if (isAtBottom) {
        scrollToBottom(false);
        scrollPositionsRef.current.set(activeConversation.id, container.scrollHeight);
      }
    }
  }, [messages, loadingMsgs, scrollToBottom, activeConversation?.id]);

  // Load older messages (upward pagination on scroll up)
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

  // Scroll event listener: Saves scroll position dynamically & triggers upward infinite scroll
  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !activeConversation?.id) return;

    // Save scroll position for this conversation dynamically
    scrollPositionsRef.current.set(activeConversation.id, container.scrollTop);

    // Trigger loading previous messages when user scrolls near top (within 80px)
    if (container.scrollTop < 80 && hasMoreMessages && !loadingOlderMessages && !loadingMsgs) {
      loadOlderMessages();
    }
  }, [activeConversation?.id, hasMoreMessages, loadingOlderMessages, loadingMsgs, loadOlderMessages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (selectedMediaFile) {
      return handleSendMediaMessage();
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
          prev.map((m) => (m.id === targetMsgId ? { ...m, content: updated.content, isEdited: true } : m))
        );
        showSuccess('Message edited');
      } catch (err) {
        showError(err.message || 'Failed to edit message');
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

    // Optimistically show message immediately
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
        scrollPositionsRef.current.set(activeConversation.id, messagesContainerRef.current.scrollHeight);
      }
    });

    try {
      setSending(true);
      const res = await chatService.sendMessage(activeConversation.id, {
        content,
        messageType: 'TEXT',
      });
      const sentMsg = res?.data || res;

      // Mark message as confirmed/sent (SINGLE RIGHT TICK ?).
      // Will ONLY become double tick (??) when recipient actually views or replies!
      const confirmedMsg = { ...sentMsg, status: 'sent', isSeen: false };

      setMessages((prev) => {
        // If the real message with sentMsg.id was already added/replaced by WebSocket
        const alreadyHasRealId = prev.some((m) => m.id === sentMsg.id);
        if (alreadyHasRealId) {
          // Just remove the optimistic placeholder to avoid duplicate
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

      // Update sidebar conversations list & promote out of Requests if applicable
      promoteConversationToPrimary(activeConversation.id, confirmedMsg);
    } catch (err) {
      showError(err.message || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(content);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Media Attachment & View-Once handlers
  const handleSelectMedia = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedMediaFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
    setIsViewOnceMedia(false);
  };

  const handleClearSelectedMedia = () => {
    setSelectedMediaFile(null);
    setMediaPreviewUrl('');
    setIsViewOnceMedia(false);
    if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
  };

  const handleSendMediaMessage = async () => {
    if (!selectedMediaFile || !activeConversation?.id) return;
    try {
      setSending(true);
      const isVideo = selectedMediaFile.type.startsWith('video/');
      const uploadRes = await mediaService.uploadMedia(selectedMediaFile, 'messages');
      const uploadedUrl = uploadRes?.mediaUrl || uploadRes?.data?.mediaUrl || uploadRes?.url || uploadRes?.secureUrl;

      if (!uploadedUrl) {
        throw new Error('Could not upload media');
      }

      const res = await chatService.sendMessage(activeConversation.id, {
        content: isViewOnceMedia ? (isVideo ? 'Video (View once)' : 'Photo (View once)') : (inputText.trim() || (isVideo ? 'Video' : 'Photo')),
        messageType: isVideo ? 'VIDEO' : 'IMAGE',
        mediaUrl: uploadedUrl,
        isViewOnce: isViewOnceMedia,
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
      handleClearSelectedMedia();
      setInputText('');
      promoteConversationToPrimary(activeConversation.id, sentMsg);
    } catch (err) {
      showError(err.message || 'Failed to send media');
    } finally {
      setSending(false);
    }
  };

  const handleOpenViewOnce = async (msg) => {
    if (msg.isOpened) {
      showError('This media has already been viewed and expired');
      return;
    }

    setViewOnceModalData(msg);
    setViewOnceCountdown(10);

    if (!msg.isOpened && activeConversation?.id) {
      try {
        await chatService.openViewOnceMessage(activeConversation.id, msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isOpened: true, viewedAt: new Date().toISOString() } : m))
        );
      } catch (err) {
        console.error('Failed to notify view-once opened:', err);
      }
    }

    clearInterval(viewOnceTimerRef.current);
    viewOnceTimerRef.current = setInterval(() => {
      setViewOnceCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(viewOnceTimerRef.current);
          setViewOnceModalData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCloseViewOnce = () => {
    clearInterval(viewOnceTimerRef.current);
    setViewOnceModalData(null);
  };

  // Voice Recording handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      showError('Microphone access denied or unavailable in browser');
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const handleSendVoiceNote = async () => {
    if (!mediaRecorderRef.current || !activeConversation?.id) return;
    clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      try {
        setSending(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        const uploadRes = await mediaService.uploadMedia(audioFile, 'messages');
        const audioUrl = uploadRes?.mediaUrl || uploadRes?.data?.mediaUrl || uploadRes?.url;

        if (!audioUrl) {
          throw new Error('Could not upload voice note');
        }

        const payload = {
          conversationId: activeConversation.id,
          content: 'Voice note',
          messageType: 'AUDIO',
          mediaUrl: audioUrl,
        };

        stompClient.send('/app/chat.sendMessage', payload);
        promoteConversationToPrimary(activeConversation.id, {
          ...payload,
          sender: user,
          createdAt: new Date().toISOString(),
        });
        setIsRecording(false);
        setRecordingTime(0);
      } catch (err) {
        showError(err.message || 'Failed to send voice note');
      } finally {
        setSending(false);
      }
    };

    try {
      mediaRecorderRef.current.stop();
    } catch {}
  };

  const handleTogglePinMessage = async (messageId) => {
    if (!activeConversation?.id || !messageId) return;
    try {
      const res = await chatService.togglePinMessage(activeConversation.id, messageId);
      const updated = res?.data || res;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinnedInChat: updated.isPinnedInChat } : m))
      );
      if (updated.isPinnedInChat) {
        setPinnedMessages((prev) => [...prev.filter((p) => p.id !== messageId), updated]);
        showSuccess('Message pinned to chat');
      } else {
        setPinnedMessages((prev) => prev.filter((p) => p.id !== messageId));
        showSuccess('Message unpinned');
      }
    } catch (err) {
      showError(err.message || 'Failed to toggle pin');
    }
  };

  const handleSelectTheme = async (themeId) => {
    if (!activeConversation?.id) return;
    try {
      await chatService.updateConversationTheme(activeConversation.id, themeId);
      setActiveConversation((prev) => ({ ...prev, theme: themeId }));
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, theme: themeId } : c))
      );
      setThemeModalOpen(false);
      showSuccess(`Chat theme updated to ${themeId}`);
    } catch (err) {
      showError(err.message || 'Failed to update chat theme');
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

  const handleOpenForwardModal = (msg) => {
    setForwardMessageTarget(msg);
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-pulse');
      setTimeout(() => el.classList.remove('highlight-pulse'), 1500);
    }
  };

  // Unsend message
  const handleUnsendMessage = async (messageId) => {
    if (!activeConversation?.id) return;
    try {
      await chatService.unsendMessage(activeConversation.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showSuccess('Message unsent');
    } catch (err) {
      showError(err.message || 'Failed to unsend message');
    }
  };

  // React to message with heart emoji
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
      showError(err.message || 'Failed to react');
    }
  };

  // Toggle user selection for Direct or Group chat
  const handleToggleSelectUser = (user) => {
    const uid = user.id || user.userId;
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => (u.id || u.userId) === uid);
      if (exists) {
        return prev.filter((u) => (u.id || u.userId) !== uid);
      } else {
        return [...prev, user];
      }
    });
  };

  // Start 1:1 or Group Chat
  const handleCreateGroupChat = async ({ name, memberIds }) => {
    try {
      const res = await chatService.createGroupConversation({
        name,
        memberIds,
      });
      const conv = res?.data || res;
      setNewChatModalOpen(false);
      await loadConversations(conv.id);
      setActiveConversation(conv);
      showSuccess('Group created successfully');
    } catch (err) {
      showError(err.message || 'Failed to create group');
    }
  };

  const handleOpenGroupDetails = () => {
    setGroupDetailsModalOpen(true);
  };

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
      showSuccess(updated.isPinned ? 'Chat pinned to top' : 'Chat unpinned');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to update pin');
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
      showSuccess(
        `Chat moved to ${targetFolder === 'GENERAL' ? 'General' : 'Primary'}`
      );
    } catch (err) {
      showError(err.message || 'Failed to move conversation folder');
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
        showSuccess('Notifications unmuted');
      } else {
        next.add(convId);
        showSuccess('Notifications muted');
      }
      try {
        localStorage.setItem('instagram_muted_conversations', JSON.stringify([...next]));
      } catch (err) {
        console.warn('Failed to save muted state', err);
      }
      return next;
    });
  };

  // Delete Conversation Modal & Confirmation
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
      showSuccess('Chat deleted');
      setDeleteChatModalTarget(null);
    } catch (err) {
      showError(err.message || 'Failed to delete chat');
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
      setNewChatModalOpen(false);
      setUserSearchTerm('');
      setSelectedUsers([]);
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
      showError(err.message || 'Failed to create conversation');
    }
  };

  // Accept or decline a message request
  const handleAcceptMessageRequest = async () => {
    if (!activeConversation?.id || handlingRequestAction) return;
    try {
      setHandlingRequestAction(true);
      await chatService.acceptMessageRequest(activeConversation.id);
      promoteConversationToPrimary(activeConversation.id);
      showSuccess('Message request accepted');
    } catch (err) {
      showError(err.message || 'Failed to accept message request');
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
      showSuccess('Message request deleted');
    } catch (err) {
      showError(err.message || 'Failed to delete message request');
    } finally {
      setHandlingRequestAction(false);
    }
  };

  const filterConversationList = (list) => {
    if (!convSearchTerm.trim()) return list;
    const term = convSearchTerm.trim().toLowerCase();
    return list.filter((conv) => {
      const other = getOtherMember(conv);
      const isGroup = conv.type === 'GROUP';
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

    // Date divider helpers matching Instagram UI
  const formatDateDivider = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

  // Quick Heart message sender
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
      showError(err.message || 'Failed to send heart');
    } finally {
      setSending(false);
    }
  };

  const otherMember = activeConversation ? getOtherMember(activeConversation) : null;
  const isGroup = activeConversation?.type === 'GROUP';
  const isInRequests =
    activeConversation?.folder === 'REQUESTS' ||
    requestConversations.some((c) => c.id === activeConversation?.id);
  const groupDisplayName = isGroup
    ? (activeConversation.name || (activeConversation.members || []).map((m) => m.username).join(', ') || 'Group Chat')
    : ((otherMember?.displayName && otherMember.displayName.toLowerCase() !== currentUsername?.toLowerCase())
        ? otherMember.displayName
        : (otherMember?.username || otherMember?.displayName || 'User'));

  // Find index of latest message received from other party
  const lastTheirsIndex = messages.map((m) => !isMyMessage(m)).lastIndexOf(true);

  // Determine whether message should display double checkmark (double right)
  const isDoubleRight = (msg, index) => {
    if (msg.status === 'sending') return false;
    // Explicitly verified seen by recipient (via real-time read receipt)
    if (msg.isSeen === true || msg.status === 'delivered') return true;
    // Recipient sent a message at or after this message
    if (lastTheirsIndex !== -1 && index <= lastTheirsIndex) return true;
    // Recipient has not viewed yet -> SINGLE RIGHT TICK
    return false;
  };

  return (
    <div className="messages-page-layout">
      {/* Conversations Column */}
      {/* Conversations Sidebar */}
      <ConversationSidebar
        activeConversation={activeConversation}
        currentUser={currentUser}
        currentUsername={currentUsername}
        loadingConvs={loadingConvs}
        activeInboxTab={activeInboxTab}
        setActiveInboxTab={setActiveInboxTab}
        convSearchTerm={convSearchTerm}
        setConvSearchTerm={setConvSearchTerm}
        requestConversations={requestConversations}
        filteredConversations={filteredConversations}
        filteredRequestConversations={filteredRequestConversations}
        onSelectConversation={setActiveConversation}
        onOpenNewChat={() => setNewChatModalOpen(true)}
        onSelectUserForChat={handleStartChatWithUser}
        convMenuOpenId={convMenuOpenId}
        setConvMenuOpenId={setConvMenuOpenId}
        mutedConvs={mutedConvs}
        onToggleUnread={handleToggleUnread}
        onTogglePin={handleTogglePin}
        onMoveFolder={handleMoveConversationFolder}
        onToggleMute={handleToggleMute}
        onDeleteConversation={handleDeleteConversation}
        getOtherMember={getOtherMember}
        isMyMessage={isMyMessage}
        navigate={navigate}
      />

      {/* Chat Thread Column */}
      <section
        className={`chat-window ${!activeConversation ? 'hidden-mobile' : ''}`}
      >
        {!activeConversation && loadingConvs && location.state?.conversationId ? (
          <SkeletonChatThreadPane />
        ) : !activeConversation ? (
          <div className="chat-empty-selection">
            <div className="chat-empty-icon-circle">
              <Send size={40} strokeWidth={1.6} className="chat-empty-send-icon" />
            </div>
            <h2>Your Messages</h2>
            <p>Send private photos and messages to a friend or group.</p>
            <button
              type="button"
              className="send-msg-cta-btn"
              onClick={() => setNewChatModalOpen(true)}
            >
              <Send size={15} />
              <span>Send Message</span>
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <ChatHeader
              activeConversation={activeConversation}
              isGroup={isGroup}
              groupDisplayName={groupDisplayName}
              otherMember={otherMember}
              isInRequests={isInRequests}
              onBack={() => setActiveConversation(null)}
              onOpenDetails={() => {
                if (isGroup) {
                  handleOpenGroupDetails();
                } else {
                  const targetId = otherMember?.id || otherMember?.userId;
                  if (targetId) navigate(`/profile/${targetId}`);
                }
              }}
              onOpenThemePicker={() => setThemeModalOpen(true)}
              onTogglePin={handleTogglePin}
              onMoveFolder={handleMoveConversationFolder}
              onVoiceCall={() => {
                if (isInRequests) {
                  showError(isGroup ? 'Please accept the group invitation first' : 'Please accept the message request first');
                  return;
                }
                if (isGroup) {
                  startGroupCall(activeConversation, 'AUDIO');
                } else if (otherMember) {
                  startCall(otherMember, 'AUDIO', activeConversation?.id);
                }
              }}
              onVideoCall={() => {
                if (isInRequests) {
                  showError(isGroup ? 'Please accept the group invitation first' : 'Please accept the message request first');
                  return;
                }
                if (isGroup) {
                  startGroupCall(activeConversation, 'VIDEO');
                } else if (otherMember) {
                  startCall(otherMember, 'VIDEO', activeConversation?.id);
                }
              }}
            />

            {/* Messages Stream */}
            <MessageStream
              messages={messages}
              activeConversation={activeConversation}
              pinnedMessages={pinnedMessages}
              activeGroupCallBanner={activeGroupCallBanner}
              loadingMsgs={loadingMsgs}
              loadingOlderMessages={loadingOlderMessages}
              hasMoreMessages={hasMoreMessages}
              otherMember={otherMember}
              groupDisplayName={groupDisplayName}
              isGroup={isGroup}
              currentUserId={currentUserId}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              onScroll={handleMessagesScroll}
              onStartGroupCall={startGroupCall}
              onTogglePinMessage={handleTogglePinMessage}
              scrollToMessage={scrollToMessage}
              isMyMessage={isMyMessage}
              isDoubleRight={isDoubleRight}
              shouldShowDivider={shouldShowDivider}
              formatDateDivider={formatDateDivider}
              onToggleReaction={handleToggleReaction}
              onStartEditMessage={handleStartEditMessage}
              onOpenForwardModal={handleOpenForwardModal}
              onUnsendMessage={handleUnsendMessage}
              onOpenViewOnce={handleOpenViewOnce}
              onOpenStoryPreview={(url) => setStoryPreviewModalUrl(url)}
              sharedMentionStories={sharedMentionStories}
              sharingMentionStoryId={sharingMentionStoryId}
              onShareMentionedStory={async (storyId) => {
                if (sharedMentionStories[storyId] || sharingMentionStoryId === storyId) return;
                try {
                  setSharingMentionStoryId(storyId);
                  await storyService.shareMentionedStory(storyId);
                  setSharedMentionStories((prev) => ({ ...prev, [storyId]: true }));
                  showSuccess('Added to your story!');
                  window.dispatchEvent(new CustomEvent('story:refresh'));
                } catch (err) {
                  const errorMsg =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to add story to your profile';
                  showError(errorMsg);
                } finally {
                  setSharingMentionStoryId(null);
                }
              }}
              onCallBack={(isVideo) => {
                if (otherMember) {
                  startCall(otherMember, isVideo ? 'VIDEO' : 'AUDIO', activeConversation?.id);
                }
              }}
              navigate={navigate}
            />

            {/* Message Request Accept / Decline Banner */}
            {isInRequests && (
              <div className="message-request-banner" role="region" aria-label="Message request actions">
                <div className="message-request-banner-copy">
                  <span className="message-request-banner-title">
                    {isGroup
                      ? `Accept group invitation to join "${activeConversation?.name || 'this group'}"?`
                      : `Accept message request from ${otherMember?.displayName || otherMember?.username || 'this user'}?`}
                  </span>
                  <span className="message-request-banner-subtitle">
                    {isGroup
                      ? 'You must accept this invitation before you can send messages or receive calls.'
                      : 'Replying will also accept the request and move this chat to Messages.'}
                  </span>
                </div>
                <div className="message-request-banner-actions">
                  <button
                    type="button"
                    className="message-request-btn decline"
                    disabled={handlingRequestAction}
                    onClick={handleDeclineMessageRequest}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="message-request-btn accept"
                    disabled={handlingRequestAction}
                    onClick={handleAcceptMessageRequest}
                  >
                    Accept
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input Bar */}
            <ChatInputBar
              inputText={inputText}
              setInputText={setInputText}
              inputRef={inputRef}
              onSendMessage={handleSendMessage}
              onSendQuickHeart={handleSendQuickHeart}
              isRecording={isRecording}
              recordingTime={recordingTime}
              onStartRecording={handleStartRecording}
              onCancelRecording={handleCancelRecording}
              onSendVoiceNote={handleSendVoiceNote}
              selectedMediaFile={selectedMediaFile}
              mediaPreviewUrl={mediaPreviewUrl}
              onSelectMedia={handleSelectMedia}
              onClearMedia={handleClearSelectedMedia}
              isViewOnceMedia={isViewOnceMedia}
              setIsViewOnceMedia={setIsViewOnceMedia}
              mediaFileInputRef={mediaFileInputRef}
              editingMessage={editingMessage}
              onCancelEdit={() => {
                setEditingMessage(null);
                setInputText('');
              }}
              isInRequests={isInRequests}
              isGroup={isGroup}
              onAcceptRequest={handleAcceptMessageRequest}
              handlingRequestAction={handlingRequestAction}
              sending={sending}
            />
          </>
        )}
      </section>

      {/* New Chat & Group Chat Modal */}
      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        currentUserId={currentUserId}
        onStartDirectChat={handleStartChatWithUser}
        onCreateGroupChat={handleCreateGroupChat}
      />

      {/* Fullscreen View-Once Media Modal */}
      <ViewOnceModal
        mediaData={viewOnceModalData}
        countdown={viewOnceCountdown}
        onClose={handleCloseViewOnce}
      />

      {/* Chat Theme Picker Modal */}
      <ThemePickerModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={activeConversation?.theme || 'DEFAULT'}
        onSelectTheme={handleSelectTheme}
      />

      {/* Group Details Modal */}
      {isGroup && (
        <GroupDetailsModal
          isOpen={groupDetailsModalOpen}
          onClose={() => setGroupDetailsModalOpen(false)}
          conversation={activeConversation}
          currentUser={currentUser}
          onConversationUpdated={(updatedConv) => {
            setActiveConversation(updatedConv);
            setConversations((prev) =>
              prev.map((c) => (c.id === updatedConv.id ? { ...c, ...updatedConv } : c))
            );
          }}
          onLeaveSuccess={(convId) => {
            setConversations((prev) => prev.filter((c) => c.id !== convId));
            setActiveConversation(null);
          }}
          onOpenThemePicker={() => setThemeModalOpen(true)}
        />
      )}

      {/* Fullscreen Story Preview Modal */}
      <StoryPreviewModal
        url={storyPreviewModalUrl}
        onClose={() => setStoryPreviewModalUrl(null)}
      />

      {/* Delete Chat Confirmation Modal */}
      <DeleteChatModal
        isOpen={Boolean(deleteChatModalTarget)}
        onClose={() => setDeleteChatModalTarget(null)}
        onConfirmDelete={handleConfirmDeleteChat}
        isDeleting={deletingChat}
      />


      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={Boolean(forwardMessageTarget)}
        onClose={() => setForwardMessageTarget(null)}
        message={forwardMessageTarget}
        currentConversationId={activeConversation?.id}
        onForwardSuccess={() => {
          setForwardMessageTarget(null);
        }}
      />
    </div>
  );
};

export default MessagesPage;
