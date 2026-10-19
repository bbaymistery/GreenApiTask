import React, { useState, useMemo } from 'react';
import styles from './ChatListPanel.module.css';
import { type Chat, type NavigationTab } from '../../../types';
import { ChatItem } from '../ChatItem/ChatItem';
import { SearchIcon, PlusIcon } from '../../common/Icons';

export interface ChatListPanelProps {
  chats: Chat[];
  activeChatId: string | null;
  activeTab?: NavigationTab;
  onSelectChat: (chatId: string) => void;
  onNewChatClick: () => void;
}

/**
 * ChatListPanel Component
 * Displays the conversation list or channels preview panel.
 * Memoized with React.memo to prevent unnecessary re-renders when messages update in active chat.
 */
export const ChatListPanel: React.FC<ChatListPanelProps> = React.memo(({ chats, activeChatId, activeTab = 'chats', onSelectChat, onNewChatClick, }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isChannels = activeTab === 'channels';

  // Search filter: returns all chats if query is empty, otherwise performs case-insensitive search
  const filteredChats = useMemo(() => {
    if (isChannels) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }, [chats, searchQuery, isChannels]);

  return (
    <section className={styles.panel} aria-label={isChannels ? 'Channels sidebar' : 'Chats sidebar'}>
      {/* Mobile Top Header: Title and '+' Button (only in chats view) */}
      <div className={styles.mobileHeader}>
        <h1 className={styles.mobileTitle}>{isChannels ? 'Channels' : 'Chats'}</h1>
        {!isChannels && (
          <button type="button" className={styles.newChatButton} onClick={onNewChatClick} title="New Chat" aria-label="Start a new chat" >
            <PlusIcon size={20} />
          </button>
        )}
      </div>

      {/* Search Input Bar (Hidden in channels mode) */}
      {!isChannels && (
        <div className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon} aria-hidden="true">
              <SearchIcon size={18} />
            </span>
            <input type="text" className={styles.searchInput} placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search conversations" />
          </div>
          <button type="button" className={styles.desktopNewChatButton} onClick={onNewChatClick} title="New Chat" aria-label="Start a new chat" >
            <PlusIcon size={20} />
          </button>
        </div>
      )}

      {/* Conversation List / Channels Preview Empty State */}
      <div className={styles.chatList} role="feed" aria-label={isChannels ? 'Channels list' : 'Conversation list'}>
        {isChannels ? (
          <div className={styles.emptyState}>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: 'var(--text-primary)' }}>
              No channels found yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
              This section is for preview purposes only (WhatsApp Channels support can be added in future updates).
            </p>
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onSelect={onSelectChat} />
          ))
        ) : (
          <div className={styles.emptyState}>No conversations found</div>
        )}
      </div>
    </section>
  );
});
