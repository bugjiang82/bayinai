import React from 'react';
import { useEditStore, ToolType } from '@/store/editStore';
import {
  MousePointer2,
  Paintbrush,
  Eraser,
  Lasso,
  Square,
  Circle,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const tools: { type: ToolType; icon: React.ElementType; label: string }[] = [
  { type: 'select', icon: MousePointer2, label: '选择' },
  { type: 'brush', icon: Paintbrush, label: '笔刷' },
  { type: 'eraser', icon: Eraser, label: '橡皮擦' },
  { type: 'lasso', icon: Lasso, label: '套索' },
  { type: 'rect', icon: Square, label: '矩形' },
  { type: 'circle', icon: Circle, label: '圆形' },
];

export const Toolbox: React.FC = () => {
  const {
    tool,
    setTool,
    brushSize,
    setBrushSize,
    clearShapes,
    setSelectionPath,
  } = useEditStore();

  return (
    <aside className="w-16 lg:w-64 bg-editor-sidebar border-r border-white/5 flex flex-col p-4">
      <div className="flex items-center justify-between mb-8 lg:justify-start lg:gap-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-white/40 hidden lg:block">
          工具
        </h2>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {tools.map(({ type, icon: Icon, label }) => {
          const isActive = tool === type;
          return (
            <button
              key={type}
              onClick={() => setTool(type)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${isActive
                ? 'bg-editor-accent/20 border border-editor-accent/30'
                : 'bg-white/5 border border-transparent hover:border-white/10'}
              `}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-editor-accent' : 'text-white/60 group-hover:text-white'}`}
              />
              <span className="text-xs font-medium hidden lg:block">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-white/5 pt-6 mb-6">
        <div className="flex items-center justify-between mb-4 hidden lg:flex">
          <h3 className="text-xs font-mono uppercase tracking-widest text-white/40">
            笔刷设置
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2 hidden lg:flex">
              <label className="text-xs text-white/60">大小</label>
              <span className="text-xs text-editor-accent">{brushSize}px</span>
            </div>
            <Slider
              value={[brushSize]}
              onValueChange={([v]) => setBrushSize(v)}
              min={1}
              max={50}
              step={1}
              className="py-2"
            />
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center gap-2 text-xs text-white/60 hover:text-white border border-white/5 hover:border-white/10"
          onClick={() => {
            clearShapes();
            setSelectionPath(null);
          }}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden lg:inline">清除</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center gap-2 text-xs text-white/60 hover:text-white border border-white/5 hover:border-white/10"
          onClick={() => setSelectionPath(null)}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden lg:inline">重置选区</span>
        </Button>
      </div>
    </aside>
  );
};
