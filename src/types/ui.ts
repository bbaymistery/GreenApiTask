/**
 * UI state types shared across components.
 */

/** Application colour theme. Applied through the `data-theme` attribute on <html>. */
export type ThemeMode = 'dark' | 'light';

/** Destinations of the left navigation strip. */
export type NavigationTab = 'chats' | 'channels' | 'settings';
