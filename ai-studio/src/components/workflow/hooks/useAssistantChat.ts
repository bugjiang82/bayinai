'use client';

import { useState, useCallback } from 'react';
import { chatWithAssistant, type Message } from '../services/aiService';

export interface AssistantChatState {
  messages: Message[];
  input: string;
  isLoading: boolean;
}

export function useAssistantChat() {
  const [state, setState] = useState<AssistantChatState>({
    messages: [],
    input: '',
    isLoading: false,
  });

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const sendMessage = useCallback(async (context?: string) => {
    const userMessage = state.input.trim();
    if (!userMessage) return;

    const newMessages: Message[] = [
      ...state.messages,
      { role: 'user', content: userMessage },
    ];

    setState((prev) => ({
      ...prev,
      messages: newMessages,
      input: '',
      isLoading: true,
    }));

    try {
      const response = await chatWithAssistant(newMessages, context || '');
      setState((prev) => ({
        ...prev,
        messages: [...newMessages, { role: 'model' as const, content: response.text }],
        isLoading: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [state.input, state.messages]);

  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
    }));
  }, []);

  return {
    messages: state.messages,
    assistantInput: state.input,
    isAssistantLoading: state.isLoading,
    setAssistantInput: setInput,
    sendAssistantMessage: sendMessage,
    clearAssistantMessages: clearMessages,
  };
}