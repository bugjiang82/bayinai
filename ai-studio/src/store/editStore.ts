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
  
  // 重置状态
  reset: () => void;
}

export const useEditStore = create<EditState>((set) => ({
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
  clearShapes: () => set({ shapes: [] }),
  
  // 选择相关
  selectionPath: null,
  setSelectionPath: (path) => set({ selectionPath: path }),
  
  // 重置状态
  reset: () => set({
    currentImage: null,
    tool: 'select',
    brushColor: '#ffffff',
    brushSize: 5,
    shapes: [],
    selectionPath: null
  })
}));
