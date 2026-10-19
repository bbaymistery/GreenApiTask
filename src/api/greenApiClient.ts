/**
 * Core Concepts:
 * 1. Separation of Concerns: UI components do not make direct `fetch` calls;
 *    all network protocols, endpoint URL construction, and HTTP error handling
 *    are abstracted in this layer.
 * 2. Secure URL Construction: Generates the standard GREEN-API URL template
 *    `${apiUrl}/waInstance${idInstance}/${method}/${apiTokenInstance}` dynamically and safely.
 * 3. Error Handling: Validates `response.ok` and converts server error responses
 *    into descriptive Error objects.
 */

import {
  type GreenApiCredentials,
  type SendMessagePayload,
  type SendMessageResponse,
  type ReceiveNotificationResponse,
  type DeleteNotificationResponse,
  type GetStateInstanceResponse,
  type GetChatHistoryPayload,
  type GreenApiHistoryMessage,
} from '../types';

/**
 * Helper function to construct standard GREEN-API request URLs.
 *
 * @param {GreenApiCredentials} credentials - idInstance, apiTokenInstance, and apiUrl
 * @param {string} method - Target API method (e.g. "sendMessage", "receiveNotification")
 * @param {string | number} [extraParam] - Optional trailing path parameter (e.g. receiptId for deleteNotification)
 * @returns {string} Fully qualified URL
 */
export const buildApiUrl = (credentials: GreenApiCredentials, method: string, extraParam?: string | number): string => {
  const baseUrl = credentials.apiUrl.replace(/\/+$/, '');
  const path = `${baseUrl}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}`;
  return extraParam !== undefined ? `${path}/${extraParam}` : path;
};

/**
 * 1. Query Instance Authorization State (getStateInstance)
 *
 * Checks whether the WhatsApp account is connected ('authorized'),
 * not connected ('notAuthorized'), or blocked ('blocked').
 *
 * @param {GreenApiCredentials} credentials - Instance credentials
 * @returns {Promise<GetStateInstanceResponse>} Instance authorization status
 */
export const getStateInstance = async (credentials: GreenApiCredentials): Promise<GetStateInstanceResponse> => {
  const url = buildApiUrl(credentials, 'getStateInstance');
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`getStateInstance failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * 2. Send Text Message (sendMessage)
 *
 * Sends a plain text message to the specified WhatsApp recipient.
 *
 * @param {GreenApiCredentials} credentials - Instance credentials
 * @param {SendMessagePayload} payload - Recipient chatId (e.g. "994501234567@c.us") and message text
 * @returns {Promise<SendMessageResponse>} Response containing the unique idMessage
 */
/**
 * Helper to ensure chatId strictly matches WhatsApp format required by GREEN-API ('number@c.us' or 'group@g.us').
 */
const ensureValidChatId = (chatId: string): string => {
  const trimmed = chatId.trim();
  if (trimmed.includes('@')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  return `${digits}@c.us`;
};

export const sendMessage = async (credentials: GreenApiCredentials, payload: SendMessagePayload): Promise<SendMessageResponse> => {
  const url = buildApiUrl(credentials, 'sendMessage');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      chatId: ensureValidChatId(payload.chatId),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`sendMessage failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * 3. Receive Next Notification / Message (receiveNotification)
 *
 * Pulls the next notification from the GREEN-API incoming message queue.
 * Returns `null` if the queue is empty.
 *
 * Note: Once processed, `deleteNotification` must be called to remove it from the queue.
 *
 * @param {GreenApiCredentials} credentials - Instance credentials
 * @param {AbortSignal} [signal] - Optional abort signal to cancel in-flight requests
 * @returns {Promise<ReceiveNotificationResponse | null>} Notification payload or null
 */
export const receiveNotification = async (credentials: GreenApiCredentials, signal?: AbortSignal): Promise<ReceiveNotificationResponse | null> => {
  const url = `${buildApiUrl(credentials, 'receiveNotification')}?receiveTimeout=10`;
  const response = await fetch(url, { method: 'GET', signal });

  if (!response.ok) {
    // 408 is a standard long-poll timeout indicating queue was empty during the server wait window
    if (response.status === 408) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(`receiveNotification failed (${response.status}): ${errorText}`);
  }

  const text = await response.text();
  if (!text || text === 'null') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * 4. Delete Processed Notification (deleteNotification)
 *
 * Removes a received notification from the server queue using its receiptId.
 * This prevents the same notification from being received in subsequent polling cycles.
 *
 * @param {GreenApiCredentials} credentials - Instance credentials
 * @param {number} receiptId - Receipt identifier of the notification to delete
 * @param {AbortSignal} [signal] - Optional abort signal to cancel in-flight requests
 * @returns {Promise<DeleteNotificationResponse>} Deletion result ({ result: true })
 */
export const deleteNotification = async (credentials: GreenApiCredentials, receiptId: number, signal?: AbortSignal): Promise<DeleteNotificationResponse> => {
  const url = buildApiUrl(credentials, 'deleteNotification', receiptId);
  const response = await fetch(url, { method: 'DELETE', signal });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`deleteNotification failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * 5. Get Chat Message History (getChatHistory)
 *
 * Fetches recent message history for a given chatId directly from WhatsApp.
 *
 * @param {GreenApiCredentials} credentials - Instance credentials
 * @param {GetChatHistoryPayload} payload - Target chatId and optional message count
 * @param {AbortSignal} [signal] - Optional abort signal to cancel in-flight requests
 * @returns {Promise<GreenApiHistoryMessage[]>} Array of messages sorted newest to oldest
 */
export const getChatHistory = async (credentials: GreenApiCredentials, payload: GetChatHistoryPayload, signal?: AbortSignal): Promise<GreenApiHistoryMessage[]> => {
  const url = buildApiUrl(credentials, 'getChatHistory');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: ensureValidChatId(payload.chatId),
      count: payload.count ?? 50,
    }),
    signal,
  });

  if (!response.ok) {
    // 429: GREEN-API rate limiter (max 1 req/sec). Return empty list gracefully so app backs off.
    if (response.status === 429) {
      return [];
    }
    const errorText = await response.text();
    throw new Error(`getChatHistory failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * 6. Get Recent Incoming Messages (lastIncomingMessages)
 *
 * Fast journal method to sync recent incoming messages across all conversations.
 *
 * @param {GreenApiCredentials} credentials - Instance credentials
 * @param {number} [minutes=2] - Time range in minutes to query
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<GreenApiHistoryMessage[]>} List of recent incoming messages
 */
export const getLastIncomingMessages = async (credentials: GreenApiCredentials, minutes: number = 2, signal?: AbortSignal): Promise<import('../types').GreenApiIncomingJournalItem[]> => {
  const url = `${buildApiUrl(credentials, 'lastIncomingMessages')}?minutes=${minutes}`;
  const response = await fetch(url, { method: 'GET', signal });

  if (!response.ok) {
    return [];
  }

  const text = await response.text();
  if (!text || text === 'null') {
    return [];
  }

  try {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
