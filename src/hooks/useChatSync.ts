import { useEffect, useRef } from 'react';
import { getChatHistory, getLastIncomingMessages } from '../api';
import { type GreenApiCredentials, type Message, type MessageSender, type MessageStatus } from '../types';
import { CHAT_HISTORY_FETCH_COUNT } from '../constants';
import { type IncomingMessageEvent } from './useGreenApiPolling';

export interface UseChatSyncOptions {
  activeChatId: string | null;
  credentials: GreenApiCredentials;
  mergeHistoryMessages: (chatId: string, messages: Message[]) => void;
  updateLastMessage: (chatId: string, text: string, timestamp?: number, unreadDelta?: number) => void;
  onIncomingMessage?: (event: IncomingMessageEvent) => void;
}

const KNOWN_STATUSES: readonly MessageStatus[] = ['pending', 'sent', 'delivered', 'read', 'failed'];

/** Validates a raw GREEN-API status string instead of blindly casting it. */
const toMessageStatus = (raw: string | undefined, isOutgoing: boolean): MessageStatus | undefined => {
  const known = KNOWN_STATUSES.find((s) => s === raw);
  if (known) return known;
  return isOutgoing ? 'delivered' : undefined;
};

/**
 * WhatsApp Chat History & Multi-Conversation Synchronization
 *
 * 1. Active Chat Synchronization:
 *    Fetches messages for the open conversation and keeps it synced in the background.
 * 2. Multi-Chat Inbound Delta Sync:
 *    Polls recent incoming journal messages across all chats every 3s. If a message arrives
 *    for an inactive conversation, immediately triggers unread badges and snippet previews.
 * 3. Seed Deduplication:
 *    Keeps track of processed message IDs in a ref, preventing duplicate unread increments.
 */
export const useChatSync = ({ activeChatId, credentials, mergeHistoryMessages, updateLastMessage, onIncomingMessage, }: UseChatSyncOptions): void => {
  const credentialsRef = useRef(credentials);
  useEffect(() => {
    credentialsRef.current = credentials;
  }, [credentials]);

  const onIncomingMessageRef = useRef(onIncomingMessage);
  useEffect(() => {
    onIncomingMessageRef.current = onIncomingMessage;
  }, [onIncomingMessage]);

  const hasCredentials = Boolean(credentials.idInstance.trim() && credentials.apiTokenInstance.trim());

  // Track processed message IDs so we only increment unread counts on fresh messages
  const processedIdsRef = useRef<Set<string>>(new Set());
  const isFirstJournalSyncRef = useRef(true);

  useEffect(() => {
    if (!hasCredentials) return;

    let isCancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;

    const syncCycle = async () => {
      if (isCancelled) return;
      abortController = new AbortController();

      try {
        const creds = credentialsRef.current;

        // 1. Sync active chat history if a chat is currently open
        if (activeChatId) {
          const history = await getChatHistory(
            creds,
            { chatId: activeChatId, count: CHAT_HISTORY_FETCH_COUNT },
            abortController.signal
          );

          if (!isCancelled && Array.isArray(history) && history.length > 0) {
            const messages: Message[] = history
              .filter((item) => item.textMessage || item.extendedTextMessage?.text || item.typeMessage)
              .map((item) => {
                const isOutgoing = item.type === 'outgoing';
                const sender: MessageSender = isOutgoing ? 'me' : 'them';
                if (item.idMessage) {
                  processedIdsRef.current.add(item.idMessage);
                }
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
        }

        // 2. Multi-chat inbound delta sync: check for any incoming messages across ALL chats (last 2 minutes)
        if (!isCancelled && onIncomingMessageRef.current) {
          const recentIncoming = await getLastIncomingMessages(creds, 2, abortController.signal);

          if (!isCancelled && Array.isArray(recentIncoming)) {
            if (isFirstJournalSyncRef.current) {
              // Seed existing IDs on initial load so old messages don't falsely bump unread counts
              for (const item of recentIncoming) {
                if (item.idMessage) processedIdsRef.current.add(item.idMessage);
              }
              isFirstJournalSyncRef.current = false;
            } else {
              for (const item of recentIncoming) {
                if (!item.idMessage || processedIdsRef.current.has(item.idMessage)) continue;

                processedIdsRef.current.add(item.idMessage);
                const text =
                  item.textMessage ||
                  item.extendedTextMessage?.text ||
                  (item.typeMessage ? `[${item.typeMessage}]` : '');

                if (text && item.chatId) {
                  onIncomingMessageRef.current({
                    chatId: item.chatId,
                    senderName: item.senderName || item.senderContactName,
                    text,
                    timestamp: item.timestamp ? item.timestamp * 1000 : Date.now(),
                    sender: 'them',
                    idMessage: item.idMessage,
                  });
                }
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      } finally {
        if (!isCancelled) {
          timerId = setTimeout(syncCycle, 3000);
        }
      }
    };

    syncCycle();

    return () => {
      isCancelled = true;
      if (timerId !== null) clearTimeout(timerId);
      if (abortController) abortController.abort();
    };
  }, [activeChatId, hasCredentials, mergeHistoryMessages, updateLastMessage]);
};
