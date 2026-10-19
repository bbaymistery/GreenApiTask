import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './App.module.css';
import { AppSidebar } from './components/Sidebar/AppSidebar';
import { ChatListPanel, NewChatModal } from './components/ChatList';
import { ChatWindowPanel } from './components/ChatWindow';
import { AuthCredentialsModal } from './components/Auth';
import {
  useCredentials,
  useChats,
  useMessages,
  useGreenApiPolling,
  useChatSync,
  type IncomingMessageEvent,
} from './hooks';
import { sendMessage } from './api';
import { type NavigationTab, type ThemeMode } from './types';
import { POLLING_INTERVAL_MS } from './constants';

/**
 * Application Root Component
 *
 * Architectural Principles:
 * 1. Dynamic Multi-Tab Navigation:
 *    - `activeTab`: Tracks the active content panel ('chats' | 'channels').
 *    - `isSettingsOpen`: Controls whether the credentials/settings modal is open.
 *    - `sidebarTab`: Computed tab passed to AppSidebar (`isSettingsOpen ? 'settings' : activeTab`),
 *      preserving the user's active tab when closing settings.
 * 2. Optimized Hook & Callback Memoization:
 *    - Functions passed to memoized child components (`handleToggleTheme`, `handleTabChange`,
 *      `handleSendMessage`, `handleIncomingMessage`) are protected with `useCallback`.
 *    - `createChat` is passed directly as a stable prop.
 * 3. Background GREEN-API Polling:
 *    - Runs `useGreenApiPolling` asynchronously with recursive `setTimeout` loop.
 *    - Dispatches incoming messages to state without unneeded parent re-renders.
 * 4. Conditional Modal Mounting:
 *    - Modals are unmounted from the DOM when inactive (`{isOpen && <Modal />}`).
 * 5. Responsive Layout:
 *    - Adapts seamlessly between desktop split-view and mobile navigation via CSS utility classes.
 */
export const App: React.FC = () => {
  // Theme state (defaults to dark mode)
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Active navigation tab: 'chats' (all chats) or 'channels'
  const [activeTab, setActiveTab] = useState<NavigationTab>('chats');

  // Modal visibility states
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Visible tab for AppSidebar: 'settings' if modal is open, otherwise the active tab
  const sidebarTab: NavigationTab = isSettingsOpen ? 'settings' : activeTab;

  // Domain state hooks
  const { credentials, saveCredentials } = useCredentials();
  const {
    chats,
    activeChatId,
    activeChat,
    totalUnread,
    selectChat,
    closeChat,
    createChat,
    updateLastMessage,
    handleIncomingChat,
  } = useChats();
  const { getMessages, addMessage, updateMessageId, updateMessageStatus, mergeHistoryMessages } = useMessages();

  /**
   * Handles incoming messages received via background GREEN-API polling.
   */
  const handleIncomingMessage = useCallback(({ chatId, senderName, text, timestamp, sender, idMessage }: IncomingMessageEvent) => {
    addMessage(chatId, text, sender, timestamp, idMessage);
    handleIncomingChat(chatId, text, senderName, timestamp, sender === 'me');
  },
    [addMessage, handleIncomingChat]
  );

  useGreenApiPolling({
    credentials,
    onIncomingMessage: handleIncomingMessage,
    enabled: Boolean(credentials.idInstance.trim() && credentials.apiTokenInstance.trim()),
    pollIntervalMs: POLLING_INTERVAL_MS,
  });

  // Background chat history and multi-conversation inbound sync
  useChatSync({ activeChatId, credentials, mergeHistoryMessages, updateLastMessage, onIncomingMessage: handleIncomingMessage, });

  // Apply theme attribute to root document element for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /** Toggles dark/light theme with a stable callback for the memoized sidebar. */
  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  /**
   * Handles sidebar navigation tab changes.
   * Opens settings modal when 'settings' is selected; otherwise switches active tab and closes settings.
   *  Handles navigation changes and opens or closes the settings modal when necessary.
   */
  const handleTabChange = useCallback((tab: NavigationTab) => {
    if (tab === 'settings') {
      setIsSettingsOpen(true);
    } else {
      setActiveTab(tab);
      setIsSettingsOpen(false);
    }
  }, []);

  /**
   * Opens the credentials and settings modal using a stable callback reference
   */
  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  /**
   * Filters displayed chats based on active tab ('channels' vs 'chats').
   */
  const displayedChats = useMemo(() => {
    if (activeTab === 'channels') {
      return [];
    }
    return chats;
  }, [chats, activeTab]);

  /**
   * Sends a text message: shows it immediately (optimistic, temporary id), then confirms it
   * with the real `idMessage` from GREEN-API or marks it as failed.
   */
  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeChatId || isSending) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    addMessage(activeChatId, text, 'me', Date.now(), tempId, 'sent');
    updateLastMessage(activeChatId, text);

    if (!credentials.idInstance || !credentials.apiTokenInstance) {
      updateMessageStatus(activeChatId, tempId, 'failed');
      setIsSettingsOpen(true);
      return;
    }

    setIsSending(true);
    try {
      const res = await sendMessage(credentials, { chatId: activeChatId, message: text });
      if (res?.idMessage) {
        updateMessageId(activeChatId, tempId, res.idMessage, 'delivered');
      }
    } catch (err: unknown) {
      console.error('Failed to send message via GREEN-API:', err instanceof Error ? err.message : err);
      updateMessageStatus(activeChatId, tempId, 'failed');
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, isSending, credentials, addMessage, updateMessageId, updateMessageStatus, updateLastMessage]);

  const handleOpenNewChatModal = useCallback(() => {
    setIsNewChatOpen(true);
  }, []);

  const handleCloseNewChatModal = useCallback(() => {
    setIsNewChatOpen(false);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return (
    <div className={styles.appContainer}>
      {/* 1. Navigation: Left Sidebar on Desktop / Bottom Navigation Bar on Mobile */}
      <div className={`${styles.sidebarWrapper} ${activeChatId ? styles.hiddenOnMobile : ''}`}>
        <AppSidebar activeTab={sidebarTab} theme={theme} unreadCount={totalUnread} onTabChange={handleTabChange} onToggleTheme={handleToggleTheme} onOpenSettings={handleOpenSettings} />
      </div>

      {/* 2. Chat List Panel (Hidden on mobile when a chat is selected) */}
      <div className={`${styles.chatListWrapper} ${activeChatId ? styles.hiddenOnMobile : ''}`}>
        <ChatListPanel chats={displayedChats} activeChatId={activeChatId} activeTab={activeTab} onSelectChat={selectChat} onNewChatClick={handleOpenNewChatModal} />
      </div>

      {/* 3. Main Messaging Canvas (Hidden on mobile when no chat is selected) */}
      <div className={`${styles.chatWindowWrapper} ${!activeChatId ? styles.hiddenOnMobile : ''}`}>
        <ChatWindowPanel chat={activeChat} messages={getMessages(activeChatId)} onSendMessage={handleSendMessage} onBack={closeChat} isSending={isSending} />
      </div>

      {/* 4. New Chat Modal (Conditional Render) */}
      {isNewChatOpen && (<NewChatModal onClose={handleCloseNewChatModal} onCreateChat={createChat} />)}

      {/* 5. GREEN-API Credentials Modal (Conditional Render) */}
      {isSettingsOpen && (<AuthCredentialsModal initialCredentials={credentials} onClose={handleCloseSettings} onSave={saveCredentials} />)}


    </div>
  );
};

export default App;
