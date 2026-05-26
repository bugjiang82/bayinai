'use client';

import { useState, useCallback } from 'react';

export interface HistoryItem {
  id: string;
  content: string;
  createdAt: string;
  type: string;
}

export interface HistoryManagerState {
  historyItems: HistoryItem[];
  historyTotal: number;
  historyLoading: boolean;
  historyTab: 'generations' | 'saved';
}

export function useHistoryManager() {
  const [state, setState] = useState<HistoryManagerState>({
    historyItems: [],
    historyTotal: 0,
    historyLoading: false,
    historyTab: 'generations',
  });

  const fetchHistory = useCallback(async (tab: 'generations' | 'saved', page = 1) => {
    setState((prev) => ({ ...prev, historyLoading: true, historyTab: tab }));
    try {
      const response = await fetch(`/api/workflow/history?type=${tab}&page=${page}`);
      const result = await response.json();
      if (result.code === 0) {
        setState((prev) => ({
          ...prev,
          historyItems: result.data.items || [],
          historyTotal: result.data.total || 0,
          historyLoading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, historyLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, historyLoading: false }));
    }
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, historyItems: [], historyTotal: 0 }));
  }, []);

  return {
    historyItems: state.historyItems,
    historyTotal: state.historyTotal,
    historyLoading: state.historyLoading,
    historyTab: state.historyTab,
    fetchHistory,
    clearHistory,
  };
}