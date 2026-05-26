'use client';

import { useState, useCallback, useEffect } from 'react';

export function useUserCredits() {
  const [credits, setCredits] = useState<number>(0);

  const fetchCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/user/credits');
      const result = await response.json();
      if (result.code === 0) {
        setCredits(result.data.credits);
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const deductCredits = useCallback((amount: number) => {
    setCredits((prev) => Math.max(0, prev - amount));
  }, []);

  return {
    userCredits: credits,
    deductCredits,
    refreshCredits: fetchCredits,
  };
}