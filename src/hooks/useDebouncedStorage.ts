import { useEffect, useRef } from 'react';
import { STORAGE_WRITE_DEBOUNCE_MS } from '../constants';

/**
 * Persists `value` to LocalStorage as JSON, debounced.
 * Pending writes are flushed when the tab is hidden/closed or the component unmounts,
 * so the last state is never lost.
 */
export const useDebouncedStorage = <T,>(key: string, value: T, delay: number = STORAGE_WRITE_DEBOUNCE_MS): void => {
  const latest = useRef(value);
  const dirty = useRef(false);

  const flush = () => {
    if (!dirty.current) return;
    dirty.current = false;
    try {
      localStorage.setItem(key, JSON.stringify(latest.current));
    } catch {
      // Storage may be full or disabled (private mode); the app keeps working in memory.
    }
  };

  useEffect(() => {
    latest.current = value;
    dirty.current = true;
    const timer = setTimeout(flush, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
