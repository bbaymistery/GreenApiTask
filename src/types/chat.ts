/**
 * Chat & messaging domain models.
 * These are the shapes the UI works with. Raw GREEN-API payloads will be mapped into
 * these shapes (their own types belong in ./api.ts) so components never depend on the network format.
 */

/** Who wrote a message: the current user ('me') or the other person ('them'). */
export type MessageSender = 'me' | 'them';

/** Delivery state of an outgoing message. Incoming messages have no status. */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/** A single text message inside a conversation. */
export interface Message {
  id: string;
  chatId: string;
  sender: MessageSender;
  text: string;
  /** Unix time in milliseconds. Formatted for display only at render time. */
  timestamp: number;
  status?: MessageStatus;
}

/** A conversation shown in the chat list. */
export interface Chat {
  /** WhatsApp/GREEN-API chat id: digits followed by "@c.us", e.g. "994501234567@c.us". */
  id: string;
  /** Phone number in international format with a leading "+". */
  phoneNumber: string;
  /** Display name. Falls back to the phone number when the user did not provide one. */
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  /** Unix time (ms) of the last message. Stored as a number so the list can be sorted by recency. */
  lastMessageAt?: number;
  unreadCount: number;
}
