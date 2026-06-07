import { create } from 'zustand';

export type ToolType = 'select' | 'brush' | 'eraser' | 'lasso' | 'rect' | 'circle';

export interface Shape {
  id: string;
  type: 'path' | 'rect' | 'circle';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  stroke: string;
  strokeWidth: number;
  tool?: ToolType;
  isSelection?: boolean;
}

export interface HistoryEntry {
  shapes: Shape[];
  selectionPath: number[] | null;
}

export interface EditState {
  // 图片相关
  currentImage: string | null;
  setCurrentImage: (image: string | null) => void;
  
  // 工具相关
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  
  // 形状相关
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  removeShape: (id: string) => void;
  clearShapes: () => void;
  
  // 选择相关
  selectionPath: number[] | null;
  setSelectionPath: (path: number[] | null) => void;
  
  // 撤销历史
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  
  // 重置状态
  reset: () => void;
}

export const useEditStore = create<EditState>((set, get) => ({
  // 图片相关
  currentImage: null,
  setCurrentImage: (image) => set({ currentImage: image }),
  
  // 工具相关
  tool: 'select',
  setTool: (tool) => set({ tool }),
  brushColor: '#ffffff',
  setBrushColor: (color) => set({ brushColor: color }),
  brushSize: 5,
  setBrushSize: (size) => set({ brushSize: size }),
  
  // 形状相关
  shapes: [],
  addShape: (shape) => set((state) => ({
    shapes: [...state.shapes, shape]
  })),
  updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map((shape) =>
      shape.id === id ? { ...shape, ...updates } : shape
    )
  })),
  removeShape: (id) => set((state) => ({
    shapes: state.shapes.filter((shape) => shape.id !== id)
  })),
  clearShapes: () => set({ shapes: [], selectionPath: null, history: [], historyIndex: -1 }),
  
  // 选择相关
  selectionPath: null,
  setSelectionPath: (path) => set({ selectionPath: path }),
  
  // 撤销历史
  history: [],
  historyIndex: -1,
  pushHistory: () => {
    const { shapes, selectionPath, history, historyIndex } = get();
    // 截断多余的 redo 历史
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      shapes: shapes.map(s => ({ ...s, points: s.points ? [...s.points] : undefined })),
      selectionPath: selectionPath ? [...selectionPath] : null,
    });
    // 限制历史记录数量，最多保留 50 条
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    
    const targetIndex = historyIndex - 1;
    if (targetIndex < 0) {
      // 回退到初始状态（空画布）
      set({ shapes: [], selectionPath: null, historyIndex: -1 });
    } else {
      const entry = history[targetIndex];
      set({
        shapes: entry.shapes.map(s => ({ ...s, points: s.points ? [...s.points] : undefined })),
        selectionPath: entry.selectionPath ? [...entry.selectionPath] : null,
        historyIndex: targetIndex,
      });
    }
  },
  
  // 重置状态
  reset: () => set({
    currentImage: null,
    tool: 'select',
    brushColor: '#ffffff',
    brushSize: 5,
    shapes: [],
    selectionPath: null,
    history: [],
    historyIndex: -1,
  })
}));