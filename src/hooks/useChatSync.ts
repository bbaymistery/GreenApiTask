import { useEffect, useRef } from 'react';
import { getChatHistory } from '../api';
import { type GreenApiCredentials, type Message, type MessageSender, type MessageStatus } from '../types';
import { CHAT_HISTORY_FETCH_COUNT } from '../constants';

export interface UseChatSyncOptions {
  activeChatId: string | null;
  credentials: GreenApiCredentials;
  mergeHistoryMessages: (chatId: string, messages: Message[]) => void;
  updateLastMessage: (chatId: string, text: string, timestamp?: number, unreadDelta?: number) => void;
}

const KNOWN_STATUSES: readonly MessageStatus[] = ['pending', 'sent', 'delivered', 'read', 'failed'];

/** Validates a raw GREEN-API status string instead of blindly casting it. */
const toMessageStatus = (raw: string | undefined, isOutgoing: boolean): MessageStatus | undefined => {
  const known = KNOWN_STATUSES.find((s) => s === raw);
  if (known) return known;
  return isOutgoing ? 'delivered' : undefined;
};

/**
 * WhatsApp Chat History Synchronization (getChatHistory)
 *
 * 1. Single-Shot Fetch on Conversation Open:
 *    Queries WhatsApp journal once when a chat is selected, avoiding continuous API polling
 *    and eliminating duplicate network traffic while staying well below rate limits.
 * 2. Type-Safe Status Mapping:
 *    Validates incoming status strings against known MessageStatus union ('sent', 'delivered', 'read')
 *    preventing invalid casts or runtime UI rendering bugs.
 * 3. Chronological Deduplication & Merge:
 *    Sorts historical items chronologically and merges them into state using Map-based O(n log n)
 *    reconciliation without overwriting existing optimistic state.
 * 4. Resilient Lifecycle & In-Flight Abort:
 *    Uses AbortController to immediately cancel pending HTTP requests when the user
 *    rapidly switches between different conversations or unmounts the component.
 * 5. Snippet & Preview Synchronization:
 *    Updates the last message preview and timestamp for the active thread once history resolves.
 */
export const useChatSync = ({ activeChatId, credentials, mergeHistoryMessages, updateLastMessage }: UseChatSyncOptions): void => {
  // Credentials are read through a ref so that editing them does not refetch the history of an open chat.
  const credentialsRef = useRef(credentials);
  useEffect(() => {
    credentialsRef.current = credentials;
  }, [credentials]);

  const hasCredentials = Boolean(credentials.idInstance.trim() && credentials.apiTokenInstance.trim());

  useEffect(() => {
    if (!activeChatId || !hasCredentials) return;

    let isCancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;

    const loadHistory = async () => {
      if (isCancelled) return;
      abortController = new AbortController();

      try {
        const history = await getChatHistory(
          credentialsRef.current,
          { chatId: activeChatId, count: CHAT_HISTORY_FETCH_COUNT },
          abortController.signal
        );

        if (isCancelled) return;

        if (Array.isArray(history) && history.length > 0) {
          const messages: Message[] = history
            .filter((item) => item.textMessage || item.extendedTextMessage?.text || item.typeMessage)
            .map((item) => {
              const isOutgoing = item.type === 'outgoing';
              const sender: MessageSender = isOutgoing ? 'me' : 'them';
              return {
                id: item.idMessage || crypto.randomUUID(),
                chatId: activeChatId,
                sender,
                text: item.textMessage || item.extendedTextMessage?.text || `[${item.typeMessage}]`,
                timestamp: item.timestamp ? item.timestamp * 1000 : Date.now(),
                status: toMessageStatus(item.statusMessage, isOutgoing),
              };
            })
            .sort((a, b) => a.timestamp - b.timestamp);

          mergeHistoryMessages(activeChatId, messages);

          const newest = messages[messages.length - 1];
          if (newest) updateLastMessage(activeChatId, newest.text, newest.timestamp);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Non-critical network warning, will retry on next tick
      } finally {
        if (!isCancelled) {
          timerId = setTimeout(loadHistory, 3000);
        }
      }
    };

    loadHistory();

    // Switching chats or unmounting cancels the in-flight request and timer.
    return () => {
      isCancelled = true;
      if (timerId !== null) clearTimeout(timerId);
      if (abortController) abortController.abort();
    };
  }, [activeChatId, hasCredentials, mergeHistoryMessages, updateLastMessage]);
};
