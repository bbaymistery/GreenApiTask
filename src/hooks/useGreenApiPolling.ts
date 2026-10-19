import { useEffect, useRef } from 'react';
import { receiveNotification, deleteNotification } from '../api';
import { type GreenApiCredentials, type GreenApiNotificationBody } from '../types';
import { POLLING_INTERVAL_MS, RAPID_QUEUE_DRAIN_DELAY_MS } from '../constants';

/**
 * Payload delivered to the incoming message callback.
 */
export interface IncomingMessageEvent {
  chatId: string;
  senderName?: string;
  text: string;
  timestamp: number;
  sender: 'me' | 'them';
  idMessage?: string;
}

export interface UseGreenApiPollingOptions {
  /** GREEN-API credentials (idInstance, apiTokenInstance, apiUrl) */
  credentials: GreenApiCredentials;
  /** Callback fired whenever a valid incoming text message is received */
  onIncomingMessage: (event: IncomingMessageEvent) => void;
  /** Whether polling is active. Defaults to true. */
  enabled?: boolean;
  /** Delay in milliseconds between poll requests when queue is empty. Defaults to POLLING_INTERVAL_MS (1000ms). */
  pollIntervalMs?: number;
}

/**
 * Safely extracts human-readable text from a GREEN-API notification payload.
 */
const extractMessageText = (body: GreenApiNotificationBody): string | null => {
  if (body.messageData?.textMessageData?.textMessage) {
    return body.messageData.textMessageData.textMessage;
  }
  if (body.messageData?.extendedTextMessageData?.text) {
    return body.messageData.extendedTextMessageData.text;
  }
  // Fallback for media attachments (image, document, audio)
  if (body.messageData?.typeMessage) {
    return `[${body.messageData.typeMessage}]`;
  }
  return null;
};

/**
 * HTTP Polling for GREEN-API Incoming Notifications
 *
 * 1. Recursive `setTimeout` instead of `setInterval`:
 *    Guarantees subsequent requests are only scheduled AFTER the previous request
 *    resolves or fails, eliminating request stampedes, race conditions, and 429 rate limits.
 * 2. Rapid Queue Drain:
 *    When notifications are waiting in the queue, drains them with a minimal delay (200ms)
 *    so multiple messages arrive without a 5-second wait. Once empty, sleeps for `pollIntervalMs`.
 * 3. Zero Unnecessary Re-renders:
 *    Keeps all polling state, timers, and callbacks inside `useRef`. Ticking and polling cycles
 *    do NOT trigger component re-renders; re-renders only occur when a message is dispatched to state.
 * 4. Resilient Lifecycle & Cleanup:
 *    Uses `AbortController` to cancel pending in-flight HTTP requests and `clearTimeout`
 *    on component unmount or when credentials change.
 * 5. Mandatory FIFO Deletion:
 *    Always deletes the processed receiptId via `deleteNotification` to prevent queue head blockage.
 */
export const useGreenApiPolling = ({ credentials, onIncomingMessage, enabled = true, pollIntervalMs = POLLING_INTERVAL_MS, }: UseGreenApiPollingOptions): void => {
  // Store latest callback in a ref to avoid recreating effect on parent re-renders
  const savedCallback = useRef(onIncomingMessage);
  useEffect(() => {
    savedCallback.current = onIncomingMessage;
  }, [onIncomingMessage]);

  // Keep credentials in ref for access in async loop
  const credentialsRef = useRef(credentials);
  useEffect(() => {
    credentialsRef.current = credentials;
  }, [credentials]);

  const { idInstance, apiTokenInstance, apiUrl } = credentials;

  useEffect(() => {

    // Do not poll if credentials are not configured or polling is disabled
    if (!enabled || !idInstance.trim() || !apiTokenInstance.trim()) {
      return;
    }

    let isCancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;

    const poll = async () => {
      if (isCancelled) return;

      const creds = credentialsRef.current;
      abortController = new AbortController();

      try {
        // 1. Fetch next notification from GREEN-API queue
        const notification = await receiveNotification(creds, abortController.signal);

        if (isCancelled) return;

        if (notification && notification.receiptId) {
          const { receiptId, body } = notification;

          // 2. Extract payload and dispatch message (handles both incoming from contact and outgoing from phone)
          const isIncoming = body?.typeWebhook === 'incomingMessageReceived';
          const isOutgoing = body?.typeWebhook === 'outgoingMessageReceived' || body?.typeWebhook === 'outgoingAPIMessageReceived';

          if ((isIncoming || isOutgoing) && body.senderData?.chatId) {
            const text = extractMessageText(body);
            if (text) {
              const timestamp = body.timestamp ? body.timestamp * 1000 : Date.now();
              savedCallback.current({
                chatId: body.senderData.chatId,
                senderName: body.senderData.senderName || body.senderData.chatName,
                text,
                timestamp,
                sender: isIncoming ? 'them' : 'me',
                idMessage: body.idMessage,
              });
            }
          }

          // 3. Immediately delete notification from queue so it doesn't repeat
          try {
            await deleteNotification(creds, receiptId, abortController.signal);
          } catch (deleteErr) {
            console.warn('[useGreenApiPolling] deleteNotification warning:', deleteErr);
          }

          // Rapid drain: check for next message immediately (RAPID_QUEUE_DRAIN_DELAY_MS delay)
          if (!isCancelled) {
            timerId = setTimeout(poll, RAPID_QUEUE_DRAIN_DELAY_MS);
          }
          return;
        }

        // Queue is empty: sleep for normal polling interval
        if (!isCancelled) {
          timerId = setTimeout(poll, pollIntervalMs);
        }
      } catch (err: unknown) {
        if (isCancelled) return;

        // On error or proxy timeout abort, log debug and continue polling
        if (!isCancelled) {
          timerId = setTimeout(poll, pollIntervalMs);
        }
      }
    };

    // Kick off first poll immediately
    poll();

    // Teardown on unmount or credential change
    return () => {
      isCancelled = true;
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, [idInstance, apiTokenInstance, apiUrl, enabled, pollIntervalMs]);
};
