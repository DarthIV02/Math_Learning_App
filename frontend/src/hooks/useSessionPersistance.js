import { useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 1500;

export function useSessionPersistence(sessionKey) {
  const timerRef = useRef(null);

  // Load once on mount
  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [sessionKey]);

  // Debounced save — for in-progress typing
  const timeoutRef = useRef(null);

  const saveDebounced = (data) => {
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      localStorage.setItem(sessionKey, JSON.stringify(data));
    }, 300);
  };

  const cancelPendingSave = () => {
    clearTimeout(timeoutRef.current);
  };

  // Immediate save — for solved problems
  const saveNow = useCallback((data) => {
    clearTimeout(timerRef.current);
    try {
      localStorage.setItem(sessionKey, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage write failed', e);
    }
  }, [sessionKey]);

  // Clean up pending timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return {
    load,
    saveDebounced,
    saveNow,
    cancelPendingSave,
  };
}