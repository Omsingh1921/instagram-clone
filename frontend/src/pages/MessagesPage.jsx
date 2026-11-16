import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  Edit,
  ArrowLeft,
  MessageSquare,
  Search,
  User,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Heart,
  Users,
  X,
  Plus,
  Mic,
  Image as ImageIcon,
  Pin,
  ChevronDown,
  Phone,
  PhoneOff,
  Video,
  Info,
  Smile,
  MoreHorizontal,
  Mail,
  Bell,
  BellOff,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import {
  SkeletonUserRows,
  SkeletonConversationRows,
  SkeletonMessageThread,
  SkeletonChatThreadPane,
} from '../components/ui/Skeleton';
import chatService from '../services/chat.service';
import userService from '../services/user.service';
import followService from '../services/follow.service';
import mediaService from '../services/media.service';
import stompClient from '../services/websocket';
import NotesTray from '../components/notes/NotesTray';
import VoiceNotePlayer from '../components/chat/VoiceNotePlayer';
import SharedPostCard from '../components/chat/SharedPostCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCall } from '../context/CallContext';
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
  const [convSearchTerm, setConvSearchTerm] = useState('');
  const [activeInboxTab, setActiveInboxTab] = useState('messages');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  // New Chat & Group Chat Modal
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]); // Selected recipients for 1:1 or Group
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [deleteChatModalTarget, setDeleteChatModalTarget] = useState(null);
  const [deletingChat, setDeletingChat] = useState(false);

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
  const { startCall } = useCall();
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
                } else {
                  setConversations((prev) =>
                    prev.some((c) => c.id === singleConv.id) ? prev : [singleConv, ...prev]
                  );
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
        setActiveInboxTab('messages');
      }
    },
    [requestConversations, activeConversation]
  );

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

  // Search users for new chat modal (loads following by default when input is empty)
  useEffect(() => {
    if (!newChatModalOpen) return;

    if (!userSearchTerm.trim()) {
      let isSubscribed = true;
      (async () => {
        try {
          setSearchingUsers(true);
          const res = await followService.getFollowing(currentUserId, 0, 20);
          const list = res?.data?.content || res?.content || res?.data || [];
          if (isSubscribed) {
            setSearchResults(
              list
                .map((item) => ({
                  id: item.userId || item.id,
                  userId: item.userId || item.id,
                  username: item.username,
                  displayName: item.displayName || item.fullName,
                  avatarUrl: item.avatarUrl || item.profilePictureUrl,
                }))
                .filter((u) => u.userId !== currentUserId)
            );
          }
        } catch {
          if (isSubscribed) setSearchResults([]);
        } finally {
          if (isSubscribed) setSearchingUsers(false);
        }
      })();
      return () => {
        isSubscribed = false;
      };
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const res = await userService.searchUsers(userSearchTerm.trim(), 0, 15);
        const list = res?.data?.content || res?.content || res?.data || [];
        setSearchResults(
          list.filter((u) => {
            const uid = u.id || u.userId;
            return uid !== currentUserId;
          })
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(searchTimeout);
  }, [userSearchTerm, newChatModalOpen, currentUserId]);

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
  const handleCreateOrOpenChat = async () => {
    if (selectedUsers.length === 0) return;

    if (selectedUsers.length === 1) {
      await handleStartChatWithUser(selectedUsers[0]);
      setSelectedUsers([]);
      return;
    }

    try {
      setCreatingGroup(true);
      const memberIds = selectedUsers.map((u) => u.id || u.userId);
      const res = await chatService.createGroupConversation({
        name: groupName.trim() || undefined,
        memberIds,
      });
      const conv = res?.data || res;
      setNewChatModalOpen(false);
      setUserSearchTerm('');
      setSelectedUsers([]);
      setGroupName('');
      await loadConversations(conv.id);
      setActiveConversation(conv);
      showSuccess('Group created successfully');
    } catch (err) {
      showError(err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
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
  const groupDisplayName = isGroup
    ? (activeConversation.name || (activeConversation.members || []).map((m) => m.username).join(', ') || 'Group Chat')
    : (otherMember?.displayName || otherMember?.username || 'User');

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
      <aside
        className={`conversations-sidebar ${activeConversation ? 'hidden-mobile' : ''}`}
      >
        <div className="conversations-header">
          <button
            type="button"
            className="conversations-username-btn"
            onClick={() => {
              const uid = currentUser?.id || currentUser?.userId;
              if (uid) navigate(`/profile/${uid}`);
            }}
            title="View profile"
          >
            <span className="conversations-username">{currentUser?.username || 'Messages'}</span>
            <ChevronDown size={18} className="conversations-username-chevron" />
          </button>
          <button
            type="button"
            className="new-msg-btn"
            onClick={() => setNewChatModalOpen(true)}
            title="New message"
            aria-label="New message"
          >
            <Edit size={22} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="conversations-search-container">
          <div className="conversations-search-inner">
            <Search size={16} className="conversations-search-icon" />
            <input
              type="text"
              placeholder="Search messages"
              value={convSearchTerm}
              onChange={(e) => setConvSearchTerm(e.target.value)}
              className="conversations-search-input"
            />
            {convSearchTerm && (
              <button
                type="button"
                className="conversations-search-clear"
                onClick={() => setConvSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Instagram Notes Tray */}
        <NotesTray onSelectUserForChat={handleStartChatWithUser} />

        {/* Messages / Requests Subheader */}
        <div className="conversations-subheader" role="tablist" aria-label="Messages filter">
          <button
            type="button"
            role="tab"
            aria-label="Messages"
            aria-selected={activeInboxTab === 'messages'}
            className={`conversations-tab-btn ${activeInboxTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveInboxTab('messages')}
          >
            Messages
          </button>
          <button
            type="button"
            role="tab"
            aria-label="Requests"
            aria-selected={activeInboxTab === 'requests'}
            className={`conversations-tab-btn ${activeInboxTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveInboxTab('requests')}
          >
            <span>Requests</span>
            {requestConversations.length > 0 && (
              <span className="conversations-tab-badge" aria-hidden="true">
                {requestConversations.length}
              </span>
            )}
          </button>
        </div>

        <div className="conversations-list-stream">
          {(() => {
            const isRequestsTab = activeInboxTab === 'requests';
            const visibleConversations = isRequestsTab
              ? filteredRequestConversations
              : filteredConversations;

            if (loadingConvs) {
              return <SkeletonConversationRows count={6} />;
            }

            const hasSearchQuery = Boolean(convSearchTerm.trim());

            if (visibleConversations.length === 0) {
              if (hasSearchQuery) {
                return (
                  <div className="conversations-empty-msg" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Search size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }} />
                    <h3 className="conversations-empty-title">No results found</h3>
                    <p className="conversations-empty-desc">
                      No chat found for "{convSearchTerm}".
                    </p>
                  </div>
                );
              }

              const gradId = isRequestsTab ? 'msgEmptyGradReq' : 'msgEmptyGrad';
              return (
                <div className="conversations-empty-msg">
                  <div className="conversations-empty-icon" aria-hidden="true">
                    <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" stroke={`url(#${gradId})`} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" stroke={`url(#${gradId})`} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="conversations-empty-title">
                    {isRequestsTab ? 'No message requests' : 'No messages yet'}
                  </h3>
                  <p className="conversations-empty-desc">
                    {isRequestsTab
                      ? "Messages from people you don't follow will appear here."
                      : 'Send a direct message to a friend or start a group chat.'}
                  </p>
                </div>
              );
            }

            return visibleConversations.map((conv) => {
              const other = getOtherMember(conv);
              const isActive = activeConversation?.id === conv.id;
              const isConvGroup = conv.type === 'GROUP';
              const title = isConvGroup
                ? (conv.name || (conv.members || []).map((m) => m.username).join(', ') || 'Group Chat')
                : (other.displayName || other.username || 'User');

              return (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  className={`conversation-item ${isActive ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => setActiveConversation(conv)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConvMenuOpenId((prev) => (prev === conv.id ? null : conv.id));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveConversation(conv);
                    }
                  }}
                >
                  {isConvGroup ? (
                    <div className="group-avatar-icon-bubble">
                      <Users size={22} color="#fff" />
                    </div>
                  ) : (
                    <Avatar
                      src={other.avatarUrl || other.profilePictureUrl}
                      alt={title}
                      size="lg"
                    />
                  )}
                  <div className="conversation-meta-box">
                    <div className="conversation-item-header-row">
                      <span className="conversation-recipient-name">
                        {title}
                      </span>
                      {conv.isPinned && (
                        <span className="conversation-pinned-badge" title="Pinned Chat">
                          <Pin size={12} fill="#a855f7" color="#a855f7" />
                        </span>
                      )}
                      {mutedConvs.has(conv.id) && (
                        <span className="conversation-muted-badge" title="Notifications muted">
                          <BellOff size={12} color="#8e8e8e" />
                        </span>
                      )}
                    </div>
                    <span className="conversation-last-msg">
                      {(() => {
                        const last = conv.lastMessage;
                        if (!last) return 'Started a conversation';
                        let text = '';
                        const isCall = last.messageType === 'CALL' || (typeof last.mediaUrl === 'string' && last.mediaUrl.startsWith('call:'));
                        const isStory = last.messageType === 'STORY_REPLY' || last.messageType === 'STORY_SHARE' || (typeof last.mediaUrl === 'string' && (last.mediaUrl.includes('storyId=') || last.mediaUrl.includes('/stories/')));
                        if (isCall) {
                          text = last.content || 'Audio call ended';
                        } else if (isStory) {
                          const mine = isMyMessage(last);
                          const snippet = last.content ? `: ${last.content}` : '';
                          text = mine ? `Replied to story${snippet}` : `Replied to your story${snippet}`;
                        } else if (last.messageType === 'IMAGE' || last.messageType === 'VIDEO' || (last.mediaUrl && !last.mediaUrl.startsWith('call:'))) {
                          const mine = isMyMessage(last);
                          if (mine) {
                            text = 'You sent an attachment.';
                          } else {
                            const senderName = last.sender?.fullName || last.sender?.displayName || last.sender?.username || other.displayName || other.username || 'User';
                            text = `${senderName} sent an attachment.`;
                          }
                        } else if (last.messageType === 'POST_SHARE' || (typeof last.content === 'string' && last.content.match(/(?:https?:\/\/[^\s]+)?\/(?:p|reels?)\/[0-9a-fA-F-]{36}/))) {
                          const isReel = typeof last.content === 'string' && last.content.includes('/reel');
                          text = isReel ? 'Sent a reel' : 'Sent a post';
                        } else if (last.messageType === 'AUDIO') {
                          text = 'Voice message';
                        } else {
                          text = last.content || 'Started a conversation';
                        }
                        const time = last.createdAt ? ` · ${timeAgo(last.createdAt)}` : '';
                        return `${text}${time}`;
                      })()}
                    </span>
                  </div>

                  {/* 3-dots Conversation Actions Menu (Instagram Web Parity) */}
                  <div className="conv-item-actions-wrapper" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`conv-options-btn ${convMenuOpenId === conv.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConvMenuOpenId((prev) => (prev === conv.id ? null : conv.id));
                      }}
                      title="More options"
                      aria-label="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {convMenuOpenId === conv.id && (
                      <div className="conv-context-menu" role="menu">
                        <button
                          type="button"
                          className="conv-context-menu-item"
                          onClick={(e) => handleToggleUnread(e, conv.id)}
                        >
                          <span>{conv.unreadCount > 0 ? 'Mark as read' : 'Mark as unread'}</span>
                          <Mail size={18} />
                        </button>

                        <button
                          type="button"
                          className="conv-context-menu-item"
                          onClick={(e) => handleTogglePin(e, conv.id)}
                        >
                          <span>{conv.isPinned ? 'Unpin' : 'Pin'}</span>
                          <Pin size={18} />
                        </button>

                        <button
                          type="button"
                          className="conv-context-menu-item"
                          onClick={(e) => handleToggleMute(e, conv.id)}
                        >
                          <span>{mutedConvs.has(conv.id) ? 'Unmute' : 'Mute'}</span>
                          {mutedConvs.has(conv.id) ? <Bell size={18} /> : <BellOff size={18} />}
                        </button>

                        <button
                          type="button"
                          className="conv-context-menu-item danger"
                          onClick={(e) => handleDeleteConversation(e, conv)}
                        >
                          <span>Delete</span>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {conv.unreadCount > 0 && <div className="conversation-unread-dot" />}
                </div>
              );
            });
          })()}
        </div>
      </aside>

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
            <div className="chat-header">
              <div className="chat-header-left">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => setActiveConversation(null)}
                  aria-label="Back to conversations"
                  title="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div
                  className="chat-recipient-info"
                  onClick={() => {
                    if (!isGroup) {
                      const targetId = otherMember?.id || otherMember?.userId;
                      if (targetId) navigate(`/profile/${targetId}`);
                    }
                  }}
                >
                  {isGroup ? (
                    <div className="group-avatar-icon-bubble small">
                      <Users size={20} color="#fff" />
                    </div>
                  ) : (
                    <Avatar
                      src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
                      alt={groupDisplayName}
                      size="md"
                      className="chat-header-avatar"
                    />
                  )}
                  <div className="chat-recipient-names">
                    <div className="chat-header-name-row">
                      <span className="chat-recipient-username">
                        {groupDisplayName}
                      </span>
                    </div>
                    <span className="chat-recipient-subtext">
                      {isGroup
                        ? `${(activeConversation.members || []).length} members`
                        : (otherMember?.username ? `${otherMember.username}` : 'Active now')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="chat-header-right-actions">
                <button
                  type="button"
                  className="chat-header-action-btn"
                  onClick={() => {
                    if (isGroup) {
                      showSuccess('Group calling is available for 1:1 direct chats');
                    } else if (otherMember) {
                      startCall(otherMember, 'AUDIO', activeConversation?.id);
                    }
                  }}
                  title="Start audio call"
                  aria-label="Audio call"
                >
                  <Phone size={22} />
                </button>
                <button
                  type="button"
                  className="chat-header-action-btn"
                  onClick={() => {
                    if (isGroup) {
                      showSuccess('Group calling is available for 1:1 direct chats');
                    } else if (otherMember) {
                      startCall(otherMember, 'VIDEO', activeConversation?.id);
                    }
                  }}
                  title="Start video call"
                  aria-label="Video call"
                >
                  <Video size={24} />
                </button>
                <button
                  type="button"
                  className="chat-header-action-btn"
                  onClick={() => {
                    if (!isGroup) {
                      const targetId = otherMember?.id || otherMember?.userId;
                      if (targetId) navigate(`/profile/${targetId}`);
                    }
                  }}
                  title="Conversation details"
                  aria-label="Conversation details"
                >
                  <Info size={24} />
                </button>
                <button
                  type="button"
                  className={`chat-header-pin-btn ${activeConversation?.isPinned ? 'pinned' : ''}`}
                  onClick={(e) => handleTogglePin(e, activeConversation.id)}
                  title={activeConversation?.isPinned ? 'Unpin chat' : 'Pin chat to top'}
                >
                  <Pin
                    size={18}
                    fill={activeConversation?.isPinned ? '#0095f6' : 'none'}
                    color={activeConversation?.isPinned ? '#0095f6' : 'currentColor'}
                  />
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div
              className="chat-messages-container"
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
            >
              {!loadingMsgs && loadingOlderMessages && <SkeletonMessageThread count={3} compact />}
              {loadingMsgs ? (
                <SkeletonMessageThread count={6} />
              ) : messages.length === 0 ? (
                <div className="chat-empty-thread">
                  {isGroup ? (
                    <div className="group-avatar-icon-bubble large">
                      <Users size={32} color="#fff" />
                    </div>
                  ) : (
                    <Avatar
                      src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
                      alt={groupDisplayName}
                      size="lg"
                    />
                  )}
                  <h3>{groupDisplayName}</h3>
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                <>
                  {!hasMoreMessages && messages.length > 0 && (
                    <div className="chat-thread-profile-banner">
                      {isGroup ? (
                        <div className="group-avatar-icon-bubble large" style={{ margin: '0 auto 12px' }}>
                          <Users size={36} color="#fff" />
                        </div>
                      ) : (
                        <Avatar
                          src={otherMember?.avatarUrl || otherMember?.profilePictureUrl}
                          alt={groupDisplayName}
                          size="xl"
                          className="chat-thread-profile-avatar"
                        />
                      )}
                      <h4 className="chat-thread-profile-name">{groupDisplayName}</h4>
                      <p className="chat-thread-profile-username">
                        {isGroup ? `${(activeConversation.members || []).length} members` : `${otherMember?.username || 'user'} · Instagram`}
                      </p>
                      {!isGroup && (
                        <button
                          type="button"
                          className="chat-view-profile-pill-btn"
                          onClick={() => {
                            const uid = otherMember?.id || otherMember?.userId;
                            if (uid) navigate(`/profile/${uid}`);
                          }}
                        >
                          View Profile
                        </button>
                      )}
                      {!isGroup && (
                        <div className="chat-thread-context-note">
                          <span>{otherMember?.username || 'user'} messaged you about a post. </span>
                          <span className="chat-thread-context-link">See post</span>
                        </div>
                      )}
                    </div>
                  )}
                  {messages
                    .filter((msg, idx, arr) => arr.findIndex((m) => m.id === msg.id) === idx)
                    .map((msg, index, filteredMessages) => {
                  const mine = isMyMessage(msg);
                  const doubleRight = mine && isDoubleRight(msg, index);
                  const isSending = mine && msg.status === 'sending';
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

                  const nextMsg = filteredMessages[index + 1];
                  const isLastInSenderSequence = !nextMsg || isMyMessage(nextMsg) !== mine || ((nextMsg.sender?.id || nextMsg.sender?.userId) !== (msg.sender?.id || msg.sender?.userId));
                  const showDateDivider = shouldShowDivider(msg, filteredMessages[index - 1]);


                  return (
                    <React.Fragment key={msg.id}>
                      {showDateDivider && (
                        <div className="chat-date-divider">
                          <span>{formatDateDivider(msg.createdAt)}</span>
                        </div>
                      )}
                      <div
                        className={`message-bubble-row ${mine ? 'mine' : 'theirs'}`}
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
                            onClick={() => handleToggleReaction(msg.id, msg.reactions)}
                            title="Like message"
                          >
                            <Heart
                              size={14}
                              fill={hasMyHeart ? '#ef4444' : 'none'}
                              color={hasMyHeart ? '#ef4444' : 'currentColor'}
                            />
                          </button>
                          {!isSending && (
                            <button
                              type="button"
                              className="msg-action-btn danger"
                              onClick={() => handleUnsendMessage(msg.id)}
                              title="Unsend message"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}

                      <div className={`message-bubble ${mine ? 'mine' : 'theirs'} ${isSharedPostOrReel && (shareId || msg.mediaUrl) ? 'has-shared-post' : ''} ${isCallMessage ? 'has-call-history' : ''} ${isStoryReply ? 'has-story-reply' : ''}`}>
                        {!mine && isGroup && msg.sender?.username && (
                          <div className="group-sender-header">
                            {msg.sender.username}
                          </div>
                        )}
                        {msg.isViewOnce ? (
                          !msg.isOpened ? (
                            <div
                              className={`view-once-bubble-pill ${mine ? 'mine' : 'theirs'}`}
                              onClick={() => handleOpenViewOnce(msg)}
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
                            const isEmoji = msg.content && typeof msg.content === 'string' &&
                              /^(\p{Extended_Pictographic}|\u200D|\uFE0F|\u20E3|\u{1F3FB}-\u{1F3FF}){1,5}$/u.test(msg.content.trim());

                            return (
                              <div className={`story-dm-card ${mine ? 'mine' : 'theirs'}`}>
                                <div className="story-dm-badge-header">
                                  <span className="story-dm-gradient-dot" />
                                  <span>
                                    {mine
                                      ? (isEmoji ? 'Reacted to their story' : 'Replied to story')
                                      : (isEmoji ? 'Reacted to your story' : 'Replied to your story')}
                                  </span>
                                </div>

                                {cleanUrl && (
                                  <div
                                    className="story-dm-preview-wrapper"
                                    onClick={() => setStoryPreviewModalUrl(cleanUrl)}
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

                                {isEmoji ? (
                                  <div className="story-dm-emoji-reaction">
                                    {msg.content}
                                  </div>
                                ) : (
                                  <div className="story-dm-comment-bubble">
                                    {msg.content}
                                  </div>
                                )}
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
                                    if (otherMember) {
                                      startCall(otherMember, isVideo ? 'VIDEO' : 'AUDIO', activeConversation?.id);
                                    }
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
                            onClick={() => handleToggleReaction(msg.id, msg.reactions)}
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
                            onClick={() => handleToggleReaction(msg.id, msg.reactions)}
                            title="Like message"
                          >
                            <Heart
                              size={14}
                              fill={hasMyHeart ? '#ef4444' : 'none'}
                              color={hasMyHeart ? '#ef4444' : 'currentColor'}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                    </React.Fragment>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
            </div>

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
                  {selectedMediaFile?.type.startsWith('video/') ? (
                    <video src={mediaPreviewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={mediaPreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <button
                    type="button"
                    onClick={handleClearSelectedMedia}
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
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* View Once Toggle Button */}
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
                  <span style={{
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
                  }}>
                    1
                  </span>
                  {isViewOnceMedia ? 'View Once: ON' : 'Keep in chat'}
                </button>
              </div>
            )}

            {/* Message Request Accept / Decline Banner */}
            {(activeConversation?.folder === 'REQUESTS' ||
              requestConversations.some((c) => c.id === activeConversation?.id)) && (
              <div className="message-request-banner" role="region" aria-label="Message request actions">
                <div className="message-request-banner-copy">
                  <span className="message-request-banner-title">
                    Accept message request from {otherMember?.displayName || otherMember?.username || 'this user'}?
                  </span>
                  <span className="message-request-banner-subtitle">
                    Replying will also accept the request and move this chat to Messages.
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

            {/* Input Bar or Voice Recording Bar */}
            {isRecording ? (
              <div className="chat-input-bar recording-active">
                <span className="voice-recording-timer">
                  <span className="rec-dot"></span> {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
                <span className="voice-recording-label">Recording audio...</span>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className="chat-voice-cancel-btn"
                    onClick={handleCancelRecording}
                    title="Cancel recording"
                  >
                    <X size={18} />
                  </button>
                  <button
                    type="button"
                    className="chat-send-btn"
                    onClick={handleSendVoiceNote}
                    disabled={sending}
                    title="Send voice note"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="chat-input-wrapper">
                <form onSubmit={handleSendMessage} className="chat-input-bar-capsule">
                  <button
                    type="button"
                    className="chat-input-icon-btn emoji-btn"
                    onClick={() => {
                      setInputText((prev) => prev ? prev + ' 😊' : '😊');
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    title="Add emoji"
                    aria-label="Add emoji"
                  >
                    <Smile size={24} />
                  </button>

                  <input
                    type="file"
                    ref={mediaFileInputRef}
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={handleSelectMedia}
                  />

                  <input
                    ref={inputRef}
                    type="text"
                    className="chat-input-box-clean"
                    placeholder={selectedMediaFile ? 'Add a caption...' : 'Message...'}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    maxLength={2000}
                    autoFocus
                  />

                  {!inputText.trim() && !selectedMediaFile ? (
                    <div className="chat-input-right-actions">
                      <button
                        type="button"
                        className="chat-input-icon-btn"
                        onClick={handleStartRecording}
                        title="Voice message"
                        aria-label="Record voice message"
                      >
                        <Mic size={22} />
                      </button>

                      <button
                        type="button"
                        className="chat-input-icon-btn"
                        onClick={() => mediaFileInputRef.current?.click()}
                        title="Attach photo or video"
                        aria-label="Attach photo or video"
                      >
                        <ImageIcon size={22} />
                      </button>

                      <button
                        type="button"
                        className="chat-input-icon-btn heart-btn"
                        onClick={handleSendQuickHeart}
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
        )}
      </section>

      {/* New Chat & Group Chat Modal */}
      <Modal
        isOpen={newChatModalOpen}
        onClose={() => {
          setNewChatModalOpen(false);
          setUserSearchTerm('');
          setSelectedUsers([]);
          setGroupName('');
        }}
        title="New message"
        size="md"
      >
        <div className="new-chat-dialog-content">
          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="new-chat-selected-chips">
              {selectedUsers.map((u) => (
                <div key={u.id || u.userId} className="new-chat-user-chip">
                  <span>@{u.username}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => handleToggleSelectUser(u)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Group Name Input if 2+ users selected */}
          {selectedUsers.length >= 2 && (
            <div className="new-chat-group-name-row">
              <input
                type="text"
                className="input new-chat-group-input"
                placeholder="Group name (optional)..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          <div className="new-chat-search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search people to add..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="new-chat-search-input"
              autoFocus
            />
          </div>

          <div className="new-chat-results-list">
            {!userSearchTerm.trim() && searchResults.length > 0 && (
              <div
                style={{
                  padding: '10px 16px 4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Suggested
              </div>
            )}
            {searchingUsers ? (
              <SkeletonUserRows count={4} compact />
            ) : searchResults.length === 0 ? (
              <div className="new-chat-no-results">
                {userSearchTerm ? 'No account found.' : 'Search for users to message.'}
              </div>
            ) : (
              searchResults.map((target) => {
                const isSelected = selectedUsers.some(
                  (u) => (u.id || u.userId) === (target.id || target.userId)
                );
                return (
                  <div
                    key={target.id || target.userId}
                    className={`new-chat-user-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleSelectUser(target)}
                  >
                    <Avatar
                      src={target.avatarUrl || target.profilePictureUrl}
                      alt={target.username}
                      size="md"
                    />
                    <div className="new-chat-user-meta">
                      <span className="new-chat-username">{target.username}</span>
                      {target.displayName && (
                        <span className="new-chat-display-name">{target.displayName}</span>
                      )}
                    </div>
                    <div className={`new-chat-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="new-chat-footer-actions">
              <button
                type="button"
                className="btn btn-primary new-chat-confirm-btn"
                onClick={handleCreateOrOpenChat}
                disabled={creatingGroup}
              >
                {creatingGroup ? (
                  'Starting chat...'
                ) : selectedUsers.length >= 2 ? (
                  `Create Group Chat (${selectedUsers.length})`
                ) : (
                  'Chat'
                )}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Fullscreen View-Once Media Modal */}
      {viewOnceModalData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleCloseViewOnce}
        >
          {/* Countdown progress bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
            <div
              style={{
                height: '100%',
                width: `${(viewOnceCountdown / 10) * 100}%`,
                background: '#0095f6',
                transition: 'width 1s linear'
              }}
            />
          </div>

          {/* Header Info */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              zIndex: 10000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0095f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px'
              }}>
                1
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {viewOnceModalData.sender?.username || 'Photo'}
                </div>
                <div style={{ fontSize: '11px', color: '#a8a8a8' }}>
                  Disappears in {viewOnceCountdown}s
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseViewOnce}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Media Viewer */}
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {viewOnceModalData.messageType === 'VIDEO' ? (
              <video
                src={viewOnceModalData.mediaUrl}
                autoPlay
                controls
                style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              />
            ) : (
              <img
                src={viewOnceModalData.mediaUrl}
                alt="Disappearing media"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Story Preview Modal */}
      {storyPreviewModalUrl && (
        <div
          className="story-dm-modal-backdrop"
          onClick={() => setStoryPreviewModalUrl(null)}
        >
          <div className="story-dm-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="story-dm-modal-close"
              onClick={() => setStoryPreviewModalUrl(null)}
              aria-label="Close story preview"
            >
              <X size={24} />
            </button>
            {storyPreviewModalUrl.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
              <video
                src={storyPreviewModalUrl}
                controls
                autoPlay
                className="story-dm-modal-media"
              />
            ) : (
              <img
                src={storyPreviewModalUrl}
                alt="Story full view"
                className="story-dm-modal-media"
              />
            )}
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {deleteChatModalTarget && (
        <Modal
          isOpen={Boolean(deleteChatModalTarget)}
          onClose={() => setDeleteChatModalTarget(null)}
          showCloseButton={false}
          size="sm"
          className="block-user-modal-dialog"
        >
          <div className="block-modal-wrapper">
            <div className="block-modal-header" style={{ paddingBottom: '20px' }}>
              <h3 className="block-modal-title">Delete chat?</h3>
              <p className="block-modal-subtitle">
                Deleting removes the chat from your inbox, but other people in the chat will still be able to see it.
              </p>
            </div>
            <div className="block-modal-actions">
              <button
                type="button"
                className="block-action-btn danger-btn"
                onClick={handleConfirmDeleteChat}
                disabled={deletingChat}
              >
                {deletingChat ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                className="block-action-btn cancel-btn"
                onClick={() => setDeleteChatModalTarget(null)}
                disabled={deletingChat}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MessagesPage;
