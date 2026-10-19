import { useId, useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './AuthCredentialsModal.module.css';
import formStyles from '../../common/Modal/ModalForm.module.css';
import { Modal } from '../../common/Modal/Modal';
import { SettingsIcon, EyeIcon, EyeOffIcon } from '../../common/Icons';
import { DEFAULT_API_URL } from '../../../constants';
import { type GreenApiCredentials } from '../../../types';

/**
 * Props for the AuthCredentialsModal component.
 * @property initialCredentials - Active credentials to pre-fill the form fields
 * @property onSave - Callback triggered when the user saves the form (persisted to localStorage)
 * @property onClose - Callback to close the modal dialog
 */
export interface AuthCredentialsModalProps {
  initialCredentials: GreenApiCredentials;
  onSave: (credentials: GreenApiCredentials) => void;
  onClose: () => void;
}

/**
 * Dialog where the user inputs their GREEN-API instance credentials
 * (idInstance, apiTokenInstance, apiUrl).
 * Opened via the "Settings" gear button in the sidebar.
 *
 * Architecture note (Why shared ModalForm.module.css is used):
 * - Shares the form layout styles (`formStyles`) with `NewChatModal`.
 * - Action buttons are kept directly in JSX rather than split into subcomponents
 *   to avoid premature abstraction and keep code clear and maintainable.
 * - Supports toggling visibility of the `apiTokenInstance` secret key.
 */
export const AuthCredentialsModal = ({ initialCredentials, onSave, onClose }: AuthCredentialsModalProps) => {
  const [form, setForm] = useState<GreenApiCredentials>(initialCredentials);
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = useId();
  const errorId = `${id}-error`;

  /**
   * Type-safe change handler generator for form fields.
   */
  const handleChange = (field: keyof GreenApiCredentials) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  /**
   * Validates form submission; idInstance and apiTokenInstance are required.
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.idInstance.trim() || !form.apiTokenInstance.trim()) {
      setError('idInstance and apiTokenInstance are required.');
      return;
    }
    onSave(form);
    onClose();
  };

  const hasError = error !== null;

  return (
    <Modal title="GREEN-API credentials" icon={<SettingsIcon size={18} />} onClose={onClose}>
      <p className={styles.infoBanner}>
        Find your instance data in the <a href="https://console.green-api.com" target="_blank" rel="noreferrer">GREEN-API console</a>. It is stored only in this browser.
      </p>

      {/* Form container: uses shared ModalForm styles */}
      <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
        {/* idInstance field */}
        <div className={formStyles.fieldGroup}>
          <label htmlFor={`${id}-instance`} className={formStyles.label}>idInstance *</label>
          <input
            id={`${id}-instance`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            className={`${formStyles.input} ${hasError && !form.idInstance.trim() ? formStyles.inputError : ''}`}
            placeholder="e.g. 1101000001"
            value={form.idInstance}
            onChange={handleChange('idInstance')}
          />
        </div>

        {/* apiTokenInstance field with show/hide password toggle button */}
        <div className={formStyles.fieldGroup}>
          <label htmlFor={`${id}-token`} className={formStyles.label}>apiTokenInstance *</label>
          <div className={styles.passwordWrapper}>
            <input
              id={`${id}-token`}
              type={showToken ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              className={`${formStyles.input} ${styles.monospace} ${styles.passwordInput} ${hasError && !form.apiTokenInstance.trim() ? formStyles.inputError : ''}`}
              placeholder="Your instance token"
              value={form.apiTokenInstance}
              onChange={handleChange('apiTokenInstance')}
            />
            <button type="button" className={styles.togglePasswordBtn} onClick={() => setShowToken((prev) => !prev)} aria-label={showToken ? 'Hide token' : 'Show token'} title={showToken ? 'Hide token' : 'Show token'}  >
              {showToken ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        </div>

        {/* apiUrl field (defaults to standard cluster URL if left blank) */}
        <div className={formStyles.fieldGroup}>
          <label htmlFor={`${id}-url`} className={formStyles.label}>API URL</label>
          <input
            id={`${id}-url`}
            type="url"
            autoComplete="off"
            spellCheck={false}
            className={formStyles.input}
            placeholder={DEFAULT_API_URL}
            value={form.apiUrl}
            onChange={handleChange('apiUrl')}
          />
          <span className={formStyles.helperText}>Use the host shown for your instance, e.g. https://7107.api.greenapi.com</span>
        </div>

        {/* Error message */}
        {error && <span id={errorId} role="alert" className={formStyles.errorText}>{error}</span>}

        {/* Action buttons (Cancel / Save) */}
        <div className={formStyles.actions}>
          <button type="button" className={formStyles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={formStyles.submitBtn}>Save</button>
        </div>
      </form>
    </Modal>
  );
};
