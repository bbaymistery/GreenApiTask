import { useState, useCallback } from 'react';
import { DEFAULT_API_URL, DEFAULT_CREDENTIALS, STORAGE_KEYS } from '../constants';
import { type GreenApiCredentials } from '../types';

/**
 * LocalStorage access may throw in certain privacy modes (Incognito) or when quotas
 * are exceeded. These helpers provide safe read/write with try/catch graceful degradation.
 */
const readStorage = (key: string): string => {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
};

const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Prevent app crashes when storage is unavailable
  }
};

/**
 * Loads stored instance credentials from LocalStorage, falling back to .env or DEFAULT_CREDENTIALS.
 */
const loadCredentials = (): GreenApiCredentials => {
  const envId = (import.meta.env.VITE_GREEN_ID_INSTANCE as string) || '';
  const envToken = (import.meta.env.VITE_GREEN_API_TOKEN_INSTANCE as string) || '';
  const envUrl = (import.meta.env.VITE_GREEN_API_URL as string) || '';

  const storedId = readStorage(STORAGE_KEYS.idInstance);
  const storedToken = readStorage(STORAGE_KEYS.apiTokenInstance);
  const storedUrl = readStorage(STORAGE_KEYS.apiUrl);

  return {
    idInstance: storedId || envId || DEFAULT_CREDENTIALS.idInstance,
    apiTokenInstance: storedToken || envToken || DEFAULT_CREDENTIALS.apiTokenInstance,
    apiUrl: storedUrl || envUrl || DEFAULT_CREDENTIALS.apiUrl,
  };
};

/**

 * Manages user-configured GREEN-API instance credentials (`idInstance`, `apiTokenInstance`, `apiUrl`)
 * and persists them to the browser's LocalStorage.
 *
 * @returns {GreenApiCredentials} credentials - Active credentials
 * @returns {(next: GreenApiCredentials) => void} saveCredentials - Sanitizes and saves updated credentials
 * @returns {boolean} isConfigured - True when both idInstance and apiTokenInstance are set
 */
export const useCredentials = () => {
  // Lazy initializer: executes only once on component mount
  const [credentials, setCredentials] = useState<GreenApiCredentials>(loadCredentials);

  /**
   * Normalizes entered credentials (trims whitespace, cleans trailing slashes) and saves to state and storage.
   */
  const saveCredentials = useCallback((next: GreenApiCredentials) => {
    const normalized: GreenApiCredentials = {
      idInstance: next.idInstance.trim(),
      apiTokenInstance: next.apiTokenInstance.trim(),
      apiUrl: (next.apiUrl.trim() || DEFAULT_API_URL).replace(/\/+$/, ''),
    };

    writeStorage(STORAGE_KEYS.idInstance, normalized.idInstance);
    writeStorage(STORAGE_KEYS.apiTokenInstance, normalized.apiTokenInstance);
    writeStorage(STORAGE_KEYS.apiUrl, normalized.apiUrl);

    setCredentials(normalized);
  }, []);

  const isConfigured = credentials.idInstance !== '' && credentials.apiTokenInstance !== '';

  return { credentials, saveCredentials, isConfigured };
};
