import { create } from "zustand";

export type AspectRatioType = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "free" | "custom";

export type HandleType = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderDetails {
  imgX: number;
  imgY: number;
  imgW: number;
  imgH: number;
}

export interface OutpaintState {
  box: BoundingBox;
  setBox: (box: BoundingBox) => void;

  renderDetails: RenderDetails;
  setRenderDetails: (details: RenderDetails) => void;

  prompt: string;
  setPrompt: (p: string) => void;

  aspectRatio: AspectRatioType;
  setAspectRatio: (r: AspectRatioType) => void;

  customRatio: string;
  setCustomRatio: (r: string) => void;

  modelName: string;
  setModelName: (m: string) => void;

  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;

  errorMsg: string | null;
  setErrorMsg: (e: string | null) => void;

  expandLeft: number;
  expandRight: number;
  expandTop: number;
  expandBottom: number;
  setExpandAmounts: (l: number, r: number, t: number, b: number) => void;

  undoStack: BoundingBox[];
  redoStack: BoundingBox[];
  pushHistory: (box: BoundingBox) => void;
  undo: () => void;
  redo: () => void;

  reset: () => void;
}

const initialBox: BoundingBox = { x: 100, y: 100, width: 300, height: 300 };
const initialRenderDetails: RenderDetails = { imgX: 100, imgY: 100, imgW: 300, imgH: 300 };

export const useOutpaintStore = create<OutpaintState>((set, get) => ({
  box: initialBox,
  setBox: (box) => set({ box }),

  renderDetails: initialRenderDetails,
  setRenderDetails: (details) => set({ renderDetails: details }),

  prompt: "",
  setPrompt: (prompt) => set({ prompt }),

  aspectRatio: "1:1",
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),

  customRatio: "",
  setCustomRatio: (customRatio) => set({ customRatio }),

  modelName: "gemini-2.5-flash-image",
  setModelName: (modelName) => set({ modelName }),

  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing }),

  errorMsg: null,
  setErrorMsg: (errorMsg) => set({ errorMsg }),

  expandLeft: 0,
  expandRight: 0,
  expandTop: 0,
  expandBottom: 0,
  setExpandAmounts: (left, right, top, bottom) =>
    set({
      expandLeft: left,
      expandRight: right,
      expandTop: top,
      expandBottom: bottom,
    }),

  undoStack: [],
  redoStack: [],

  pushHistory: (box) => {
    const { undoStack, redoStack } = get();
    const lastBox = undoStack[undoStack.length - 1];
    if (!lastBox || lastBox.x !== box.x || lastBox.y !== box.y || lastBox.width !== box.width || lastBox.height !== box.height) {
      set({
        undoStack: [...undoStack.slice(-49), box],
        redoStack: [],
      });
    }
  },

  undo: () => {
    const { undoStack, box } = get();
    if (undoStack.length < 1) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    set({
      undoStack: newUndoStack,
      redoStack: [...get().redoStack, box],
      box: previous,
    });
  },

  redo: () => {
    const { redoStack, box } = get();
    if (redoStack.length < 1) return;
    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    set({
      redoStack: newRedoStack,
      undoStack: [...get().undoStack, box],
      box: next,
    });
  },

  reset: () =>
    set({
      box: initialBox,
      renderDetails: initialRenderDetails,
      prompt: "",
      aspectRatio: "1:1",
      customRatio: "",
      modelName: "gemini-2.5-flash-image",
      isProcessing: false,
      errorMsg: null,
      expandLeft: 0,
      expandRight: 0,
      expandTop: 0,
      expandBottom: 0,
      undoStack: [],
      redoStack: [],
    }),
}));