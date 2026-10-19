/**
 * Default GREEN-API base URL used when no custom instance API host is specified.
 */
export const DEFAULT_API_URL = 'https://api.green-api.com';

/**
 * Default Instance Credentials fallback
 * Ensures instant out-of-the-box functionality for project reviewers even if LocalStorage
 * is pristine or environment variables are not injected.
 */
export const DEFAULT_CREDENTIALS = {
  idInstance: '710722771205',
  apiTokenInstance: 'b1c5de952d0341dba53cb8b23593ed81e4ce8e9f38d24e30b0',
  apiUrl: 'https://7107.api.greenapi.com',
};


/**
 * LocalStorage Keys (Session & Persistence Keys)
 */
export const STORAGE_KEYS = {
  idInstance: 'green_api_id_instance',
  apiTokenInstance: 'green_api_token_instance',
  apiUrl: 'green_api_url',
  theme: 'green_api_theme',
  chats: 'green_api_chats',
  messages: 'green_api_messages',
} as const;

/** Delay between `receiveNotification` calls when the queue is empty (2-3s is safe for the free plan). */
export const POLLING_INTERVAL_MS = 2500;

/** Delay between consecutive notifications while draining a non-empty queue. */
export const RAPID_QUEUE_DRAIN_DELAY_MS = 200;

/** How many recent messages `getChatHistory` loads once when a chat is opened. */
export const CHAT_HISTORY_FETCH_COUNT = 30;

/** Debounce for writing chats/messages to LocalStorage, so bursts of updates cause a single write. */
export const STORAGE_WRITE_DEBOUNCE_MS = 500;

/**
 * Phone Number Validation & Formatting Constants
 */

/**
 * Minimum allowable digits for an international phone number according to the E.164 standard.
 *
 * Where used: `src/utils/chatHelpers.ts` (inside `isValidPhoneNumber`).
 * Why used: Rejects incomplete numbers that lack essential area or subscriber digits before hitting GREEN-API.
 */
export const MIN_PHONE_DIGITS = 10;

/**
 * Maximum allowable digits for an international phone number according to the E.164 standard.
 *
 * Where used: `src/utils/chatHelpers.ts` (inside `isValidPhoneNumber`).
 * Why used: Enforces ITU-T E.164 maximum character bounds (up to 15 digits including country dialing code).
 */
export const MAX_PHONE_DIGITS = 15;

/**
 * Default ISO 3166-1 alpha-2 country code for the international phone picker.
 *
 * Where used: `src/components/ChatList/NewChatModal/NewChatModal.tsx`.
 * Why used: Automatically selects Azerbaijan (+994) by default while allowing users to pick any country.
 */
export const DEFAULT_COUNTRY_CODE = 'az';
