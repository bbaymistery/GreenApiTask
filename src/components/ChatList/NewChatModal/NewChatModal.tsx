import { useId, useState, type FormEvent } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import formStyles from '../../common/Modal/ModalForm.module.css';
import { Modal } from '../../common/Modal/Modal';
import { type Chat } from '../../../types';
import { cleanPhoneNumber, isValidPhoneNumber, phoneToChatId } from '../../../utils/chatHelpers';
import { DEFAULT_COUNTRY_CODE } from '../../../constants';

export interface NewChatModalProps {
  onClose: () => void;
  onCreateChat: (chat: Chat) => void;
}

/**
 * Modal dialog enabling users to start a new chat by entering a recipient's phone number
 * with an interactive international country selector (defaults to Azerbaijan +994) and optional contact name.
 *
 * Architectural Note (Shared ModalForm.module.css):
 * - Shares the unified form control styles (`formStyles`) with `AuthCredentialsModal`.
 * - Form fields and action buttons remain direct, explicit JSX without premature micro-abstractions,
 *   allowing each form to manage its unique validation (phone formatting, error states) independently.
 * - Design system consistency across modals is guaranteed through `ModalForm.module.css`.
 *
 * @property onClose - Function to close the modal (also triggered on successful submission)
 * @property onCreateChat - Callback passing the newly created Chat object to the parent upon valid phone entry
 */
export const NewChatModal = ({ onClose, onCreateChat }: NewChatModalProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Unique IDs link each <label> to its corresponding input and ARIA error message
  const id = useId();
  const phoneId = `${id}-phone`;
  const nameId = `${id}-name`;
  const errorId = `${id}-error`;

  /**
   * Validates and cleans the phone number, constructs a new Chat object, and notifies the parent.
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const digits = cleanPhoneNumber(phone);

    if (!isValidPhoneNumber(digits)) {
      setError('Enter a valid international phone number.');
      return;
    }

    onCreateChat({
      id: phoneToChatId(digits),
      phoneNumber: `+${digits}`,
      // Fallback to formatted phone number if no name is provided; initialized with 0 unread count.
      name: name.trim() || `+${digits}`,
      unreadCount: 0,
    });
    onClose();
  };

  return (
    <Modal title="New chat" onClose={onClose}>
      {/* Form Canvas: Directly uses shared ModalForm styles with clean, explicit JSX */}
      <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
        {/* Phone Number Field with International Country Selector */}
        <div className={formStyles.fieldGroup}>
          <label htmlFor={phoneId} className={formStyles.label}>Phone number *</label>
          <PhoneInput
            defaultCountry={DEFAULT_COUNTRY_CODE}
            value={phone}
            onChange={(newPhone) => {
              setPhone(newPhone);
              setError(null);
            }}
            className={formStyles.phoneInputContainer}
            countrySelectorStyleProps={{
              buttonClassName: formStyles.phoneInputCountryButton,
              dropdownStyleProps: {
                className: formStyles.phoneInputDropdown,
              },
            }}
            inputProps={{
              id: phoneId,
              autoFocus: true,
              autoComplete: 'off',
              className: `${formStyles.phoneInputField} ${error ? formStyles.inputError : ''}`,
              'aria-invalid': error !== null,
              'aria-describedby': error ? errorId : undefined,
            }}
          />
          {error && <span id={errorId} role="alert" className={formStyles.errorText}>{error}</span>}
          <span className={formStyles.helperText}>Select your country from the flag dropdown or type directly. Country code and formatting are applied automatically.</span>


        </div>

        {/* Contact Name (Optional) */}
        <div className={formStyles.fieldGroup}>
          <label htmlFor={nameId} className={formStyles.label}>Contact name (optional)</label>
          <input id={nameId} type="text" autoComplete="off" className={formStyles.input} placeholder="e.g. John" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Form Actions (Cancel / Start chat) */}
        <div className={formStyles.actions}>
          <button type="button" className={formStyles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={formStyles.submitBtn}>Start chat</button>
        </div>
      </form>
    </Modal>
  );
};
