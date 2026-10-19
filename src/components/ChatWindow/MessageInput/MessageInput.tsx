import React, { useState, useRef, useEffect } from 'react';
import styles from './MessageInput.module.css';
import { SmileIcon, SendIcon } from '../../common/Icons';

const QUICK_EMOJIS = ['😀', '😂', '😊', '❤️', '👍', '🔥', '🙏', '🎉', '🚀', '✨', '👏', '😎', '🥳', '💯'];

/**
 * Props definition for MessageInput component
 * @property {(text: string) => void} onSendMessage - Handler invoked when a message is sent
 * @property {boolean} [disabled] - Optional disabled state during API call
 */
export interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

/**
 * MessageInput Component
 * Renders the bottom message input field with functional emoji picker and send action.
 * @param {MessageInputProps} props - Component properties
 * @returns {React.ReactElement} The message input bar
 */
export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEmojiPicker(false);
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEmojiPicker]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.inputBar}>
      {/* Functional Emoji Picker Popup */}
      {showEmojiPicker && (
        <div ref={pickerRef} className={styles.emojiPicker}>
          {QUICK_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" className={styles.emojiBtn} onClick={() => handleInsertEmoji(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Toggle Button */}
      <button type="button" className={`${styles.iconBtn} ${showEmojiPicker ? styles.active : ''}`} onClick={() => setShowEmojiPicker((prev) => !prev)} title="Emoji"  >
        <SmileIcon size={20} />
      </button>

      {/* Input Field */}
      <div className={styles.inputWrapper}>
        <input ref={inputRef} type="text" className={styles.textInput} placeholder="Write a message..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} />

      </div>

      {/* Send Action Button */}
      <button type="button" className={styles.sendBtn} onClick={handleSend} disabled={!text.trim() || disabled} title="Send Message"  >
        <SendIcon size={18} />
      </button>
    </div>
  );
};
