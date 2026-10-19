import React from 'react';
import styles from './AppSidebar.module.css';
import { type ThemeMode } from '../../types';
import { SunIcon, MoonIcon } from '../common/Icons';

/**
 * Props definition for ThemeToggle component
 * @property {ThemeMode} theme - Current active application theme ('dark' | 'light')
 * @property {() => void} onToggle - Callback triggered when the toggle button is clicked
 */
export interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
}

/**
 * ThemeToggle Component
 * Renders a compact toggle button for switching between Dark and Light mode
 * @param {ThemeToggleProps} props - Component properties
 * @returns {React.ReactElement} The theme toggle button
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button type="button" className={styles.navButton} onClick={onToggle} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} aria-label="Toggle theme">
      {isDark ? <SunIcon size={22} /> : <MoonIcon size={22} />}
      <span className={styles.navLabel}>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
};
