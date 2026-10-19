import { useState, useCallback } from 'react';
import { type Message, type MessageSender, type MessageStatus } from '../types';
import { isSameChat, deduplicateMessages } from '../utils/chatHelpers';
import { STORAGE_KEYS } from '../constants';
import { useDebouncedStorage } from './useDebouncedStorage';

/**
 * Loads stored messages from LocalStorage, automatically purging any historical duplicates.
 */
const loadStoredMessages = (): Record<string, Message[]> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.messages);
    if (!raw) return {};
    const parsed: Record<string, Message[]> = JSON.parse(raw);
    const cleaned: Record<string, Message[]> = {};
    for (const [chatId, list] of Object.entries(parsed)) {
      if (Array.isArray(list)) {
        cleaned[chatId] = deduplicateMessages(list);
      }
    }
    return cleaned;
  } catch {
    return {};
  }
};

const NO_MESSAGES: Message[] = [];

/**
 * Manages message history grouped by `chatId`.
 * Persists message data in LocalStorage so user conversations survive page refreshes.
 * Guarantees zero duplicate messages via ID matching and temporal fuzzy deduplication.
 */
export const useMessages = () => {
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>(loadStoredMessages);

  useDebouncedStorage(STORAGE_KEYS.messages, messagesByChat);

  /**
   * Retrieves messages for the specified `chatId`.
   * Uses smart `isSameChat` matching so chats with or without country code resolve the same history.
   */
  const getMessages = useCallback((chatId: string | null): Message[] => {
    if (!chatId) return NO_MESSAGES;
    if (messagesByChat[chatId]) return messagesByChat[chatId];
    const matchingKey = Object.keys(messagesByChat).find((key) => isSameChat(key, chatId));
    return matchingKey ? messagesByChat[matchingKey] : NO_MESSAGES;
  },
    [messagesByChat]
  );

  /**
   * Appends or updates a message in the conversation.
   * If a matching message already exists (by ID or same content within 30s), upgrades it without duplicating.
   */
  const addMessage = useCallback((chatId: string, text: string, sender: MessageSender = 'me', timestamp: number = Date.now(), idMessage?: string, status?: MessageStatus): Message => {
    const messageId = idMessage || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const message: Message = {
      id: messageId,
      chatId,
      sender,
      text,
      timestamp,
      status: status || (sender === 'me' ? 'sent' : undefined),
    };

    setMessagesByChat((prev) => {
      const key = Object.keys(prev).find((k) => isSameChat(k, chatId)) ?? chatId;
      const currentList = prev[key] ?? NO_MESSAGES;
      return {
        ...prev,
        [key]: deduplicateMessages([...currentList, message]),
      };
    });

    return message;
  },
    []
  );

  /**
   * Updates an optimistic temporary message ID with the confirmed GREEN-API idMessage once dispatched.
   */
  const updateMessageId = useCallback((chatId: string, tempId: string, realId: string, status: MessageStatus = 'delivered') => {
    setMessagesByChat((prev) => {
      const key = Object.keys(prev).find((k) => isSameChat(k, chatId)) ?? chatId;
      const currentList = prev[key];
      if (!currentList) return prev;

      const updated = currentList.map((m) => m.id === tempId ? { ...m, id: realId, status } : m);
      return {
        ...prev,
        [key]: deduplicateMessages(updated),
      };
    });
  },
    []
  );

  /**
   * Updates an existing message's status (e.g. marking failed on network/quota error)
   */
  const updateMessageStatus = useCallback((chatId: string, messageId: string, status: MessageStatus) => {
    setMessagesByChat((prev) => {
      const key = Object.keys(prev).find((k) => isSameChat(k, chatId)) ?? chatId;
      const currentList = prev[key];
      if (!currentList) return prev;

      const updated = currentList.map((m) => m.id === messageId ? { ...m, status } : m);
      return {
        ...prev,
        [key]: updated,
      };
    });
  }, []);

  /**
   * Merges historical messages (e.g. from getChatHistory) without duplicates,
   * keeping messages sorted chronologically.
   */
  const mergeHistoryMessages = useCallback((chatId: string, history: Message[]) => {
    if (!history.length) return;
    setMessagesByChat((prev) => {
      const key = Object.keys(prev).find((k) => isSameChat(k, chatId)) ?? chatId;
      const currentList = prev[key] ?? NO_MESSAGES;
      const merged = deduplicateMessages([...currentList, ...history]);

      const lengthCheck = currentList.length === merged.length
      const everyCheck = currentList.every((m, i) => m.id === merged[i].id && m.status === merged[i].status && m.text === merged[i].text)

      // If merged list is identical to currentList, bail out without re-rendering
      if (lengthCheck && everyCheck) {
        return prev;
      }

      return {
        ...prev,
        [key]: merged,
      };
    });
  }, []);

  return { getMessages, addMessage, updateMessageId, updateMessageStatus, mergeHistoryMessages };
};
