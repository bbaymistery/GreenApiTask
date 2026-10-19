import React from 'react';
import styles from './ChatItem.module.css';
import { type Chat } from '../../../types';
import { Avatar } from '../../common/Avatar/Avatar';
import { formatChatTime } from '../../../utils/time';

export interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (chatId: string) => void;
}

/**
 * ChatItem Component
 * Renders an individual conversation row in the chat list.
 *
 * 1. React.memo Optimization: The `onSelect` callback is passed down from the parent
 *    (`ChatListPanel`) as a stable reference. `() => onSelect(chat.id)` is resolved on click.
 *    This ensures that when a new message arrives or selection changes, unchanged `ChatItem` instances do not re-render.
 * 2. Time Formatting: `chat.lastMessageAt` is stored as a millisecond timestamp and formatted
 *    only during render via `formatChatTime` ("14:20" if today, "Yesterday", or "17 Oct").
 *
 * @property {Chat} chat - Conversation item data (id, phone, name, lastMessage, unreadCount, lastMessageAt)
 * @property {boolean} isActive - Whether this conversation is currently selected
 * @property {(chatId: string) => void} onSelect - Selection callback (stable reference)
 */
export const ChatItem: React.FC<ChatItemProps> = React.memo(({ chat, isActive, onSelect }) => {
  // Determine display name using contact name or phone number fallback
  const displayName = chat.name || chat.phoneNumber;

  // Format last message timestamp into a human-readable string if present
  const formattedTime = chat.lastMessageAt ? formatChatTime(chat.lastMessageAt) : null;

  return (
    <button type="button" className={`${styles.chatItem} ${isActive ? styles.active : ''}`} onClick={() => onSelect(chat.id)} aria-selected={isActive} aria-label={`${displayName}, ${chat.lastMessage || 'No messages yet'}`}>
      {/* Profile Avatar: renders image if provided, otherwise displays colored circle with initial */}
      <Avatar name={displayName} src={chat.avatarUrl} size="lg" />

      {/* Conversation Text & Details Canvas */}
      <div className={styles.chatInfo}>
        <div className={styles.headerRow}>
          <span className={styles.name}>{displayName}</span>
          {formattedTime && <span className={styles.time}>{formattedTime}</span>}
        </div>
        <div className={styles.messageRow}>
          <span className={styles.lastMessage}>{chat.lastMessage || 'No messages yet'}</span>
          {/* Unread Badge: only visible when unreadCount > 0 */}
          {chat.unreadCount > 0 && <span className={styles.badge}>{chat.unreadCount}</span>}
        </div>
      </div>
    </button>
  );
});
