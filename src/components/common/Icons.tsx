import { type ReactNode } from 'react';

/** Props every icon accepts. */
interface IconProps {
  size?: number;
  className?: string;
}

interface BaseIconProps extends IconProps {
  strokeWidth?: number;
  children: ReactNode;
}

/**
 * Shared <svg> wrapper. Every icon below only supplies its own shapes, so the eight
 * identical svg attributes live in exactly one place.
 * `aria-hidden`: icons are decorative; the buttons that contain them carry their own accessible label.
 */
const Icon = ({ size = 20, className, strokeWidth = 2, children }: BaseIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>
);

/** Speech bubble: "Chats" navigation item. */
export const ChatsIcon = ({ size = 22, className }: IconProps) => (
  <Icon size={size} className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>
);

/** Megaphone: "Channels" navigation item. */
export const ChannelsIcon = ({ size = 22, className }: IconProps) => (
  <Icon size={size} className={className}><path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></Icon>
);


/** Cog: "Settings" navigation item. */
export const SettingsIcon = ({ size = 22, className }: IconProps) => (
  <Icon size={size} className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></Icon>
);

/** Sun: shown in dark mode, switches to light. */
export const SunIcon = ({ size = 22, className }: IconProps) => (
  <Icon size={size} className={className}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></Icon>
);

/** Moon: shown in light mode, switches to dark. */
export const MoonIcon = ({ size = 22, className }: IconProps) => (
  <Icon size={size} className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Icon>
);

/** Magnifier: chat search field. */
export const SearchIcon = ({ size = 18, className }: IconProps) => (
  <Icon size={size} className={className}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
);

/** Plus: "new chat" button. */
export const PlusIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className} strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
);

/** Paper plane: send message. */
export const SendIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Icon>
);

/** Single tick: message sent. */
export const CheckIcon = ({ size = 16, className }: IconProps) => (
  <Icon size={size} className={className}><polyline points="20 6 9 17 4 12" /></Icon>
);

/** Double tick: message delivered / read. */
export const CheckCheckIcon = ({ size = 16, className }: IconProps) => (
  <Icon size={size} className={className}><polyline points="18 6 7 17 2 12" /><polyline points="22 10 13 19 10 16" /></Icon>
);

/** Cross: close dialogs. */
export const CloseIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
);

/** Smile: opens the emoji picker. */
export const SmileIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></Icon>
);

/** Left arrow: "back to chat list" on small screens. */
export const ArrowLeftIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Icon>
);

/** Eye: show password / token. */
export const EyeIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Icon>
);

/** Eye off: hide password / token. */
export const EyeOffIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></Icon>
);

/** Three vertical dots: more options menu. */
export const MoreVerticalIcon = ({ size = 20, className }: IconProps) => (
  <Icon size={size} className={className}><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="19" r="1.5" /></Icon>
);

/** Alert circle: indicates message delivery failure or quota warning. */
export const AlertCircleIcon = ({ size = 16, className }: IconProps) => (
  <Icon size={size} className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></Icon>
);

