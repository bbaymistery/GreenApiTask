import React, { useEffect, useRef } from 'react';
import styles from './ChatWindowPanel.module.css';
import { type Chat, type Message } from '../../../types';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { MessageInput } from '../MessageInput/MessageInput';
import { SearchIcon, MoreVerticalIcon, ArrowLeftIcon } from '../../common/Icons';
import { Avatar } from '../../common/Avatar/Avatar';

export interface ChatWindowPanelProps {
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isSending?: boolean;
  onBack?: () => void;
}

/**
 * ChatWindowPanel Component
 * Main messaging canvas displaying contact header, message stream, empty state, and bottom input bar.
 *
 * 1. Auto-scroll to bottom:
 *    When a new message arrives, `messages` updates and `messagesEndRef` smoothly scrolls the view to the latest message.
 * 2. Empty States:
 *    - When no chat is selected, displays guidance: "Select a conversation to start messaging".
 *    - When a chat is selected but has no messages yet, displays the empty state greeting with mascot icon.
 * 3. Responsive Back Button:
 *    On mobile viewports, displays a back arrow (`ArrowLeftIcon`) in the header to return to the chat list.
 *
 * @property {Chat | null} chat - Currently active conversation (null if none selected)
 * @property {Message[]} messages - Message history for the active conversation
 * @property {(text: string) => void} onSendMessage - Callback invoked when user sends a message
 * @property {boolean} [isSending] - Optional loading state to disable send button during transmission
 * @property {() => void} [onBack] - Mobile back button callback to return to the chat list
 */
export const ChatWindowPanel: React.FC<ChatWindowPanelProps> = React.memo(({ chat, messages, onSendMessage, isSending = false, onBack }) => {

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCount = messages.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageCount]);

  // Render empty state if no chat is currently selected
  if (!chat) {
    return (
      <section className={styles.container} aria-label="No chat selected">
        <div className={styles.noChatSelected}>Select a conversation to start messaging</div>
      </section>
    );
  }

  const displayName = chat.name || chat.phoneNumber;

  return (
    <section className={styles.container} aria-label={`Chat with ${displayName}`}>
      {/* Contact Header: Avatar, Name, Online Status, and Action Buttons */}
      <header className={styles.header}>
        <div className={styles.contactInfo}>
          {/* Mobile Back Button */}
          {onBack && (
            <button type="button" className={styles.backButton} onClick={onBack} title="Back to chats" aria-label="Back to chat list">
              <ArrowLeftIcon size={20} />
            </button>
          )}

          {/* Contact Avatar */}
          <Avatar name={displayName} src={chat.avatarUrl} size="md" />

          {/* Contact Name & Status */}
          <div className={styles.details}>
            <span className={styles.name}>{displayName}</span>
            <span className={styles.status}>last seen recently</span>
          </div>
        </div>

        {/* Header Actions (Search & Options) */}
        <div className={styles.headerActions}>
          <button type="button" className={styles.actionBtn} title="Search in chat" aria-label="Search in chat">
            <SearchIcon size={18} />
          </button>
          <button type="button" className={styles.actionBtn} title="More options" aria-label="More options">
            <MoreVerticalIcon size={18} />
          </button>
        </div>
      </header>

      {/* Messages Canvas */}
      <div className={styles.messagesArea} role="log" aria-live="polite">
        {messages.length > 0 ? (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.mascotIcon} aria-hidden="true">💬</div>
            <div className={styles.emptyTitle}>No messages here yet...</div>
            <div className={styles.emptySubtitle}>
              Send a message or tap below to say hello to <strong>{displayName}</strong>!
            </div>
          </div>
        )}
        {/* Auto-scroll target anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <MessageInput onSendMessage={onSendMessage} disabled={isSending} />
    </section>
  );
});

export const ChatWindow = ChatWindowPanel;
