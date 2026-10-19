import { type Message } from '../types';
import { MIN_PHONE_DIGITS, MAX_PHONE_DIGITS } from '../constants';

/**
 * Pure helpers for phone numbers and chat display.
 * Kept free of React so they are trivial to unit test.
 */

/**
 * Strips all non-digit characters from the input phone string.
 * Supported by the international PhoneInput selector, this reliably extracts
 * the complete E.164 numerical digits (including international country dialing code)
 * without hardcoding or altering foreign country codes.
 *
 * Examples:
 * - "+994 (50) 633-01-35" -> "994506330135" (Azerbaijan)
 * - "+90 (532) 123-45-67" -> "905321234567" (Turkey)
 * - "+1 (202) 555-0123"   -> "12025550123"  (USA)
 *
 * @param phone - Raw phone input from user or PhoneInput component
 * @returns Clean numerical string containing only digits
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Checks that the input looks like an international number (10-15 digits, country code included).
 * Accepts raw or already cleaned input.
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const digits = cleanPhoneNumber(phone);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
};

/**
 * Converts a phone number into the chat id format GREEN-API expects: "994501234567@c.us".
 * Accepts raw or already cleaned input.
 */
export const phoneToChatId = (phone: string): string => `${cleanPhoneNumber(phone)}@c.us`;

/**
 * Checks if two chat IDs represent the same conversation.
 * Handles cases with/without country codes (e.g. 506300135 and 994506300135),
 * while safely isolating group chats (@g.us).
 */
export const isSameChat = (id1?: string | null, id2?: string | null): boolean => {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;

  const isGroup1 = id1.includes('@g.us');
  const isGroup2 = id2.includes('@g.us');
  if (isGroup1 || isGroup2) {
    return isGroup1 === isGroup2 && id1 === id2;
  }

  const digits1 = id1.replace(/\D/g, '');
  const digits2 = id2.replace(/\D/g, '');
  if (digits1 === digits2) return true;
  if (digits1.length >= 9 && digits2.length >= 9) {
    return digits1.slice(-9) === digits2.slice(-9);
  }
  return false;
};

/**
 * First letter or digit of a name, upper-cased, for avatar placeholders.
 * Skips leading symbols so "+994..." yields "9" instead of "+".
 */
export const getInitial = (name: string): string => (name.match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase();

const TEMP_ID_PREFIX = 'temp-';
const OPTIMISTIC_MATCH_WINDOW_MS = 45_000;

const isTempMessage = (m: Message): boolean => m.id.startsWith(TEMP_ID_PREFIX);

/** Same sender + text within a short window: an optimistic message and its confirmed server copy. */
const isSameOptimisticPair = (a: Message, b: Message): boolean =>
  a.sender === b.sender &&
  a.text.trim() === b.text.trim() &&
  Math.abs(a.timestamp - b.timestamp) < OPTIMISTIC_MATCH_WINDOW_MS;

/**
 * Removes duplicate messages and returns them oldest-first. Runs in O(n log n).
 * 1. Messages with the same id are merged (a missing status is filled in).
 * 2. A local optimistic message (`temp-...`) is dropped once its confirmed server copy exists.
 *    Two real messages with identical text (e.g. "ok", "?") are never merged: their ids differ.
 */
export const deduplicateMessages = (messages: Message[]): Message[] => {
  const byId = new Map<string, Message>();
  for (const msg of messages) {
    const existing = byId.get(msg.id);
    if (!existing) {
      byId.set(msg.id, msg);
    } else if (msg.status && !existing.status) {
      byId.set(msg.id, { ...existing, status: msg.status });
    }
  }

  const unique = [...byId.values()];
  const confirmed = unique.filter((m) => !isTempMessage(m));
  const result = unique.filter((m) => !isTempMessage(m) || !confirmed.some((real) => isSameOptimisticPair(real, m)));

  return result.sort((a, b) => a.timestamp - b.timestamp);
};
