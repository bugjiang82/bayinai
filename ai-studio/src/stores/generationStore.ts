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
  mode?: "text-to-image" | "image-to-image" | "video" | "edit" | "architecture";
  aspectRatio?: string;
  imageSize?: string;
  thinkingLevel?: string;
  referenceImages?: string[];
  referenceWeight?: number;
  transformType?: string;
}

export interface GenerationResult {
  id: string;
  url: string;
  prompt: string;
  params: GenerationParams;
  createdAt: Date;
  type?: string;
  inputUrl?: string;
  favorited?: boolean;
}

export type GenerationStatus = "idle" | "generating" | "completed" | "failed";

interface GenerationState {
  // 状态管理
  status: GenerationStatus;
  progress: number;
  error: string | null;
  
  // 数据管理
  currentParams: GenerationParams;
  results: GenerationResult[];
  history: GenerationResult[];
  
  // 参数管理
  setParams: (params: Partial<GenerationParams>) => void;
  resetParams: () => void;
  
  // 生成流程管理
  startGeneration: () => void;
  updateProgress: (progress: number) => void;
  completeGeneration: (result: GenerationResult) => void;
  failGeneration: (error?: string) => void;
  resetStatus: () => void;
  
  // 结果管理
  addResults: (results: GenerationResult[]) => void;
  clearResults: () => void;
  loadHistory: (history: GenerationResult[]) => void;
  addToHistory: (result: GenerationResult) => void;
  
  // 全局重置
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
  aspectRatio: "1:1",
  imageSize: "1K",
  thinkingLevel: "minimal",
  referenceImages: [],
  referenceWeight: 0.7,
  transformType: "style-transfer",
};

export const useGenerationStore = create<GenerationState>((set) => ({
  // 初始状态
  status: "idle",
  progress: 0,
  error: null,
  currentParams: { ...defaultParams },
  results: [],
  history: [],

  // 参数管理
  setParams: (params) =>
    set((state) => ({
      currentParams: { ...state.currentParams, ...params },
    })),

  resetParams: () =>
    set({
      currentParams: { ...defaultParams },
    }),

  // 生成流程管理
  startGeneration: () =>
    set({
      status: "generating",
      progress: 0,
      error: null,
    }),

  updateProgress: (progress) =>
    set({ progress: Math.min(100, Math.max(0, progress)) }),

  completeGeneration: (result) =>
    set((state) => ({
      status: "completed",
      progress: 100,
      error: null,
      results: [result, ...state.results],
      history: [result, ...state.history],
    })),

  failGeneration: (error = "生成失败") =>
    set({
      status: "failed",
      progress: 0,
      error,
    }),

  resetStatus: () =>
    set({
      status: "idle",
      progress: 0,
      error: null,
    }),

  // 结果管理
  addResults: (results) =>
    set((state) => ({
      results: [...results, ...state.results],
    })),

  clearResults: () =>
    set({ results: [] }),

  loadHistory: (history) =>
    set({ history }),

  addToHistory: (result) =>
    set((state) => ({
      history: [result, ...state.history],
    })),

  // 全局重置
  reset: () =>
    set({
      status: "idle",
      progress: 0,
      error: null,
      currentParams: { ...defaultParams },
      results: [],
    }),
}));

// 辅助钩子，方便在组件中使用
export const useGenerationStatus = () => useGenerationStore((state) => state.status);
export const useIsGenerating = () => useGenerationStore((state) => state.status === "generating");
export const useGenerationProgress = () => useGenerationStore((state) => state.progress);
export const useGenerationError = () => useGenerationStore((state) => state.error);
export const useGenerationResults = () => useGenerationStore((state) => state.results);
export const useGenerationHistory = () => useGenerationStore((state) => state.history);
export const useGenerationParams = () => useGenerationStore((state) => state.currentParams);
