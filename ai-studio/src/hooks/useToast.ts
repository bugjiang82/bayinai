'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast({ type, message });
    timerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast };
}