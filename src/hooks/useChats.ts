import { useState, useCallback, useRef, useEffect } from 'react';
import { type Chat } from '../types';
import { isSameChat } from '../utils/chatHelpers';
import { STORAGE_KEYS } from '../constants';
import { useDebouncedStorage } from './useDebouncedStorage';

const loadStoredChats = (): Chat[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chats);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Conversation List & Active Chat State Management
 *
 * 1. Stable In-Place List Ordering:
 *    Updates conversation previews, timestamps, and badges in-place via `.map()`,
 *    preventing contacts from erratically jumping rows during active messaging.
 * 2. Asynchronous Debounced Persistence:
 *    Uses `useDebouncedStorage` (500ms) with `pagehide` auto-flush, preventing excessive
 *    LocalStorage serializations on rapid incoming message bursts.
 * 3. Context-Aware Unread Counting:
 *    Differentiates between incoming and outgoing (self-sent) messages; increments
 *    unread badge only for incoming messages in inactive conversations.
 * 4. Active Chat Selection & Clearance:
 *    Clears unread counter automatically when a conversation is opened, maintaining
 *    accurate global badge counts across desktop and mobile views.
 * 5. Safe Multi-Tab & Storage Degradation:
 *    Gracefully handles empty, missing, or corrupted LocalStorage states with safe defaults.
 */
export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>(loadStoredChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const stored = loadStoredChats();
    return stored[0]?.id ?? null;
  });

  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useDebouncedStorage(STORAGE_KEYS.chats, chats);

  /**
   * Opens a conversation and clears its unread message count.
   */
  const selectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);

    setChats((prev) =>
      prev.map((c) => (isSameChat(c.id, chatId) && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  /**
   * Closes active chat.
   */
  const closeChat = useCallback(() => setActiveChatId(null), []);

  /**
   * Creates a new conversation. If the recipient already exists, opens the existing chat
   * preserving original list ordering. If brand new, prepends it to the top.
   */
  const createChat = useCallback((newChat: Chat) => {
    setChats((prev) => {
      const existing = prev.find((c) => isSameChat(c.id, newChat.id));
      if (existing) {
        return prev;
      }
      return [newChat, ...prev];
    });
    selectChat(newChat.id);
  }, [selectChat]);

  /**
   * Updates last message preview and timestamp strictly preserving the original contact order in the list.
   * If unreadDelta is provided, increments the unread badge if the chat is not currently open.
   */
  const updateLastMessage = useCallback((chatId: string, text: string, timestamp: number = Date.now(), unreadDelta: number = 0) => {
    setChats((prev) => {
      const target = prev.find((c) => isSameChat(c.id, chatId));
      if (!target) return prev;

      const isActive = isSameChat(target.id, activeChatIdRef.current);
      const targetUnread = isActive ? 0 : Math.max(0, target.unreadCount + unreadDelta);

      // Bail out if data is identical: zero re-renders
      if (target.lastMessage === text && target.lastMessageAt === timestamp && target.unreadCount === targetUnread) {
        return prev;
      }

      return prev.map((c) => {
        if (!isSameChat(c.id, chatId)) return c;
        return {
          ...c,
          lastMessage: text,
          lastMessageAt: timestamp,
          unreadCount: targetUnread,
        };
      });
    });
  }, []);

  /**
   * Applies a message received through polling to the chat list: updates the preview of an existing
   * chat in place, or adds a newly discovered chat. `isOutgoing` (sent from the phone) never raises the unread badge.
   */
  const handleIncomingChat = useCallback((chatId: string, text: string, senderName?: string, timestamp: number = Date.now(), isOutgoing: boolean = false) => {
    setChats((prev) => {
      const existing = prev.find((c) => isSameChat(c.id, chatId));
      const isCurrentlyActive = isSameChat(chatId, activeChatIdRef.current);
      const unreadIncrement = isOutgoing || isCurrentlyActive ? 0 : 1;
      const digits = chatId.replace('@c.us', '');

      if (existing) {
        const newUnread = isCurrentlyActive ? 0 : existing.unreadCount + unreadIncrement;

        // Bail out if data is identical: zero re-renders
        if (existing.lastMessage === text && existing.lastMessageAt === timestamp && existing.unreadCount === newUnread) {
          return prev;
        }

        return prev.map((c) =>
          isSameChat(c.id, chatId)
            ? {
              ...c,
              lastMessage: text,
              lastMessageAt: timestamp,
              unreadCount: newUnread,
            }
            : c
        );
      }

      const newChat: Chat = {
        id: chatId,
        phoneNumber: `+${digits}`,
        name: senderName?.trim() || `+${digits}`,
        lastMessage: text,
        lastMessageAt: timestamp,
        unreadCount: unreadIncrement,
      };

      return [newChat, ...prev];
    });
  }, []);

  const activeChat = chats.find((c) => isSameChat(c.id, activeChatId)) ?? null;
  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    chats,
    activeChatId,
    activeChat,
    totalUnread,
    selectChat,
    closeChat,
    createChat,
    updateLastMessage,
    handleIncomingChat,
  };
};
