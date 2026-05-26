'use client';

import { createContext, useContext } from 'react';

export interface CanvasInteractionState {
  isDragging: boolean;
  isMultiSelect: boolean;
}

export const DraggingContext = createContext<boolean>(false);

export const MultiSelectContext = createContext<boolean>(false);

export function useDragging(): boolean {
  return useContext(DraggingContext);
}

export function useMultiSelect(): boolean {
  return useContext(MultiSelectContext);
}