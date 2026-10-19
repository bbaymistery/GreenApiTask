import styles from './Avatar.module.css';
import { getInitial } from '../../../utils/chatHelpers';
import React from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'md' | 'lg';
}

/** 
 * Avatar Component
 * Round avatar shared across the chat list and the chat header.
 * Memoized for performance when we click chatlist and chat window re renders.so we don't need to render avatar again on chatlist .
 * @property {string} name - Contact name or phone used for placeholder initial and image alt text
 * @property {string} [src] - Optional image URL; when omitted, a colored circle with the initial is displayed
 * @property {'md' | 'lg'} [size] - 'md' (42px, chat header) or 'lg' (48px, chat list row)
 */
export const Avatar = React.memo(({ name, src, size = 'lg' }: AvatarProps) => (
  <div className={`${styles.avatar} ${styles[size]}`}>
    {src ? <img src={src} alt={name} className={styles.image} /> : getInitial(name)}
  </div>
));
