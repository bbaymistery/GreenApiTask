import { useEffect, useId, type ReactNode } from 'react';
import styles from './Modal.module.css';
import { CloseIcon } from '../Icons';

export interface ModalProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Shared dialog shell used by every modal in the app (new chat, credentials).
 * Owns the behaviour that must be identical everywhere: overlay, Escape to close, backdrop click,
 * and the ARIA wiring (role="dialog", aria-modal, aria-labelledby).
 *
 * Mount it conditionally (`{open && <Modal ... />}`): the content then starts with fresh state on every open,
 * so no "reset the form in an effect" code is needed.
  * @property title - Dialog heading; also used as the accessible name of the dialog
 * @property icon - Optional icon shown in a coloured badge before the title
 * @property onClose - Called on Escape, close button and backdrop click
 * @property children - Dialog body (usually a form)
 */
export const Modal = ({ title, icon, onClose, children }: ModalProps) => {
  // useId gives a unique id per instance so aria-labelledby never collides.
  const titleId = useId();

  // Subscribing to the document is synchronising with an external system, which is what effects are for.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    // onMouseDown + target check: closes only when the press STARTS on the backdrop. With onClick, selecting
    // text inside an input and releasing the mouse outside the dialog would close it by accident.
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            {icon && <div className={styles.iconBadge}>{icon}</div>}
            <h2 id={titleId} className={styles.title}>{title}</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close dialog"><CloseIcon size={18} /></button>
        </header>
        {children}
      </div>
    </div>
  );
};
