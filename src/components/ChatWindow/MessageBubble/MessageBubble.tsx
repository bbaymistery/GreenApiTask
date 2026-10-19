import React from 'react';
import styles from './MessageBubble.module.css';
import { type Message } from '../../../types';
import { AlertCircleIcon, CheckCheckIcon, CheckIcon } from '../../common/Icons';
import { formatMessageTime } from '../../../utils/time';


export interface MessageBubbleProps {
  message: Message;
}

/**
 * MessageBubble Component
 * Renders an incoming or outgoing chat message bubble with timestamp and delivery status.
 */
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
  const isMe = message.sender === 'me';
  // Formats timestamp into "14:20" time string
  const timeStr = formatMessageTime(message.timestamp);

  return (
    <div className={`${styles.row} ${isMe ? styles.me : styles.them}`}>
      <div className={styles.bubble}>
        {/* Message Text */}
        <div className={styles.text}>{message.text}</div>

        {/* Timestamp and Delivery Status */}
        <div className={styles.meta}>
          <span className={styles.time}>{timeStr}</span>
          {isMe && (
            <span className={styles.statusIcon} title={message.status ?? 'sent'}>
              {message.status === 'failed' ? (
                <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center' }} title="Göndərilmədi (Limiti və ya interneti yoxlayın)">
                  <AlertCircleIcon size={14} />
                </span>
              ) : message.status === 'sent' ? (
                <CheckIcon size={14} />
              ) : (
                <CheckCheckIcon size={14} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
