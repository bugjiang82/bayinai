import { create } from "zustand";

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  model?: string;
  style?: string;
  referenceImage?: string | null;
  mode?: "text-to-image" | "image-to-image" | "video" | "edit";
}

export interface GenerationResult {
  id: string;
  url: string;
  prompt: string;
  params: GenerationParams;
  createdAt: Date;
}

interface GenerationState {
  currentParams: GenerationParams;
  isGenerating: boolean;
  progress: number;
  results: GenerationResult[];
  history: GenerationResult[];

  setParams: (params: Partial<GenerationParams>) => void;
  resetParams: () => void;
  startGeneration: () => void;
  updateProgress: (progress: number) => void;
  completeGeneration: (result: GenerationResult) => void;
  failGeneration: () => void;
  addResults: (results: GenerationResult[]) => void;
  clearResults: () => void;
  loadHistory: (history: GenerationResult[]) => void;
  reset: () => void;
}

const defaultParams: GenerationParams = {
  prompt: "",
  negativePrompt: "",
  width: 1024,
  height: 1024,
  steps: 30,
  guidanceScale: 7.5,
  seed: -1,
  model: "default",
  style: "auto",
  referenceImage: null,
  mode: "text-to-image",
};

export const useGenerationStore = create<GenerationState>((set) => ({
  currentParams: { ...defaultParams },
  isGenerating: false,
  progress: 0,
  results: [],
  history: [],

  setParams: (params) =>
    set((state) => ({
      currentParams: { ...state.currentParams, ...params },
    })),

  resetParams: () =>
    set({
      currentParams: { ...defaultParams },
    }),

  startGeneration: () =>
    set({
      isGenerating: true,
      progress: 0,
    }),

  updateProgress: (progress) =>
    set({ progress: Math.min(100, Math.max(0, progress)) }),

  completeGeneration: (result) =>
    set((state) => ({
      isGenerating: false,
      progress: 100,
      results: [result, ...state.results],
      history: [result, ...state.history],
    })),

  failGeneration: () =>
    set({
      isGenerating: false,
      progress: 0,
    }),

  addResults: (results) =>
    set((state) => ({
      results: [...results, ...state.results],
    })),

  clearResults: () =>
    set({ results: [] }),

  loadHistory: (history) =>
    set({ history }),

  reset: () =>
    set({
      currentParams: { ...defaultParams },
      isGenerating: false,
      progress: 0,
      results: [],
    }),
}));
