import React from 'react';
import styles from './AppSidebar.module.css';
import { type NavigationTab, type ThemeMode } from '../../types';
import { ThemeToggle } from './ThemeToggle';
import { ChatsIcon, ChannelsIcon, SettingsIcon } from '../common/Icons';

export interface AppSidebarProps {
  activeTab: NavigationTab;
  theme: ThemeMode;
  unreadCount?: number;
  onTabChange: (tab: NavigationTab) => void;
  onToggleTheme: () => void;
  onOpenSettings?: () => void;
}

/**
 * AppSidebar Component
 * Manages the vertical navigation strip with 'All' (chats), 'channels', and bottom 'settings' tabs.
 * Controls which tab is highlighted via `activeTab`.
 *
 * @property {NavigationTab} activeTab - Currently active left navigation tab ('chats' | 'channels' | 'settings')
 * @property {ThemeMode} theme - Application color theme mode ('dark' | 'light')
 * @property {number} [unreadCount] - Badge count for unread messages
 * @property {(tab: NavigationTab) => void} onTabChange - Callback triggered when switching tabs
 * @property {() => void} onToggleTheme - Function to toggle between dark and light themes
 * @property {() => void} [onOpenSettings] - Callback to open the settings/credentials modal
 */
export const AppSidebar: React.FC<AppSidebarProps> = React.memo(({ activeTab, theme, unreadCount = 0, onTabChange, onToggleTheme, onOpenSettings }) => {
  const isChatsActive = activeTab === 'chats';
  const isChannelsActive = activeTab === 'channels';
  const isSettingsActive = activeTab === 'settings';

  return (
    <aside className={styles.sidebarNav} aria-label="Main Navigation">
      <div className={styles.topSection}>
        {/* All Chats Tab */}
        <button type="button" className={`${styles.navButton} ${isChatsActive ? styles.active : ''}`} onClick={() => onTabChange('chats')} title="All Chats" aria-label="All Chats">
          <ChatsIcon size={22} />
          <span className={styles.navLabel}>All</span>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </button>

        {/* Channels Tab */}
        <button type="button" className={`${styles.navButton} ${isChannelsActive ? styles.active : ''}`} onClick={() => onTabChange('channels')} title="Channels" aria-label="Channels">
          <ChannelsIcon size={22} />
          <span className={styles.navLabel}>channels</span>
        </button>
      </div>

      <div className={styles.bottomSection}>
        {/* Light / Dark Mode Toggle */}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        {/* Settings & Credentials Button */}
        <button type="button" className={`${styles.navButton} ${isSettingsActive ? styles.active : ''}`} onClick={() => (onOpenSettings ? onOpenSettings() : onTabChange('settings'))} title="Settings & Credentials" aria-label="Settings and API credentials">
          <SettingsIcon size={22} />
          <span className={styles.navLabel}>Settings</span>
        </button>
      </div>
    </aside>
  );
});
