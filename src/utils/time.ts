/**
 * Date/time formatting. Timestamps are stored as numbers (ms) and formatted only for display.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// Intl formatters are comparatively expensive to create, so they are built once and reused for every render.
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** Time of day for a message bubble, e.g. "18:42". */
export const formatMessageTime = (timestamp: number): string => timeFormat.format(timestamp);

/**
 * Compact time label for the chat list: "18:42" today, "Yesterday", otherwise "17 Oct".
 * @param now - Injectable "current time" so the function stays deterministic in tests
 */
export const formatChatTime = (timestamp: number, now: number = Date.now()): string => {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (timestamp >= startOfToday) return timeFormat.format(timestamp);
  if (timestamp >= startOfToday - DAY_MS) return 'Yesterday';
  return dateFormat.format(timestamp);
};
