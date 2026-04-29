import React, { useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from '@xyflow/react';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Maximize2, 
  ChevronUp,
  Sparkles,
  Send,
  Trash2,
  Settings2,
  CheckCircle2,
  MousePointer2,
  ArrowUp,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface NodeData {
  label: string;
  type: string;
  prompt: string;
  credits: number;
  isGenerating?: boolean;
  output?: string;
  sourceImage?: string;
  inheritImage?: string;
  inheritPrompt?: string;
  config: {
    model: string;
    quality: string;
    aspectRatio: string;
    duration: string;
    mode: string;
  };
}

interface BaseNodeProps extends NodeProps<Node<NodeData>> {
  children?: React.ReactNode;
  onGenerate: () => void;
  renderConfig?: () => React.ReactNode;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  id, 
  data, 
  selected, 
  children, 
  onGenerate,
  renderConfig 
}) => {
  const { setNodes } = useReactFlow();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const updateNodeData = (newData: Partial<NodeData>) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...newData } };
      }
      return node;
    }));
  };

  return (
    <div 
      className={cn(
        "relative group transition-all duration-300",
        selected ? "z-50" : "z-10"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -48 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-full shadow-xl"
          >
            <button onClick={onGenerate} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Redraw">
              <RefreshCw size={14} className={data.isGenerating ? "animate-spin" : ""} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Upscale">
              <Sparkles size={14} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Download">
              <Download size={14} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Fullscreen">
              <Maximize2 size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button 
              onClick={() => setNodes(nds => nds.filter(n => n.id !== id))}
              className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500" 
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        className="!w-8 !h-8 !border-2 !border-indigo-500 !bg-white !shadow-lg !flex !items-center !justify-center !opacity-0 group-hover:!opacity-100 !-left-4 transition-all hover:!scale-110 active:!scale-95"
      >
        <Plus size={18} className="text-indigo-600 pointer-events-none" />
      </Handle>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        className="!w-8 !h-8 !border-2 !border-indigo-500 !bg-white !shadow-lg !flex !items-center !justify-center !opacity-0 group-hover:!opacity-100 !-right-4 transition-all hover:!scale-110 active:!scale-95"
      >
        <Plus size={18} className="text-indigo-600 pointer-events-none" />
      </Handle>

      <div 
        className={cn(
          "min-w-[320px] bg-[#13141c]/90 backdrop-blur-3xl border rounded-[20px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300",
          selected 
            ? "ring-1 ring-white/20 border-white/40 shadow-[0_0_60px_rgba(99,102,241,0.2)]" 
            : "border-white/10 hover:border-white/20"
        )}
      >
        <div className="px-4 py-2.5 bg-slate-800/50 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Settings2 size={12} className="text-slate-500 flex-shrink-0" />
            {isEditingName ? (
              <input 
                autoFocus
                className="text-[11px] font-black uppercase tracking-wider bg-transparent border-none outline-none text-white w-full"
                value={data.label}
                onChange={(e) => updateNodeData({ label: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              />
            ) : (
              <span 
                className="text-[11px] font-black uppercase tracking-wider text-slate-300 truncate cursor-pointer hover:text-indigo-400 transition-colors"
                onDoubleClick={() => setIsEditingName(true)}
              >
                {data.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {data.isGenerating && (
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            )}
            <span className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500 bg-white/5 px-1.5 py-0.5 rounded leading-none border border-white/5">
              {data.type}
            </span>
          </div>
        </div>

        <div className={cn(
          "p-0 transition-all duration-300",
          !selected && "max-h-[160px] overflow-hidden opacity-80"
        )}>
          {children}
        </div>

        {!selected && data.output && (
          <div className="px-4 py-1.5 bg-black/20 text-[9px] text-slate-500 font-bold uppercase tracking-widest border-t border-white/5 text-center">
             Output View
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 12, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: -10, x: '-50%' }}
            className="absolute top-full left-1/2 w-[720px] bg-[#121212] border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] flex flex-col z-50 overflow-visible"
          >
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors">
                  <MousePointer2 size={16} />
                </div>
                <div className="w-px h-4 bg-white/10 mx-0.5" />
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors">
                  <Plus size={16} />
                </div>
              </div>
              <div className="flex items-center gap-2 pr-2">
                <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-2">
              <textarea 
                rows={1}
                className="w-full bg-transparent border-none text-lg text-slate-200 focus:ring-0 outline-none transition-all resize-none placeholder:text-slate-600 font-medium leading-relaxed p-0 min-h-[48px]"
                placeholder="描述任何你想要生成的内容"
                value={data.prompt}
                onChange={(e) => updateNodeData({ prompt: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between px-4 pb-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="relative group/model">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex flex-col gap-0.5 justify-center">
                      <div className="w-2.5 h-0.5 bg-slate-500 group-hover:bg-indigo-400 transition-colors" />
                      <div className="w-4 h-0.5 bg-slate-500 group-hover:bg-indigo-400 transition-colors" />
                      <div className="w-3 h-0.5 bg-slate-500 group-hover:bg-indigo-400 transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-slate-300">
                      {data.config.model || (data.type === 'image' ? '即梦 5.0 Lite' : 'Veo Vision Pro')}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1c24] border border-white/10 rounded-xl shadow-2xl scale-0 group-hover/model:scale-100 transition-all origin-bottom-left z-[100] overflow-hidden backdrop-blur-xl">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                      选择模型
                    </div>
                    <div className="p-1">
                      {[
                        { id: 'gemini-3.1-flash', name: 'Gemini 3.1 Flash', type: ['text', 'image'] },
                        { id: 'imagen-3', name: 'Imagen 3 (即梦)', type: ['image'] },
                        { id: 'veo-3.1', name: 'Veo 3.1 (视频)', type: ['video'] },
                        { id: 'imagen-3-hd', name: 'Imagen 3 HD', type: ['image'] },
                      ].filter(m => m.type.includes(data.type)).map(m => (
                        <button
                          key={m.id}
                          onClick={() => updateNodeData({ config: { ...data.config, model: m.id } })}
                          className={cn(
                            "w-full px-3 py-2 text-sm text-left rounded-lg transition-all",
                            data.config.model === m.id ? "bg-indigo-600/20 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-px h-4 bg-white/10" />

                {renderConfig && (
                  <div className="flex items-center gap-1">
                    {renderConfig()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-2">
                  <Mic size={16} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
                  <div className="w-px h-4 bg-white/10" />
                  <span className="text-xs font-bold text-slate-400 font-mono">1x</span>
                </div>

                <div className="bg-white/5 p-1 rounded-full flex items-center gap-2 border border-white/5 shadow-inner">
                  <div className="flex items-center gap-1.5 px-4 h-full">
                    <Sparkles size={14} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-300">{data.credits}</span>
                  </div>
                  <button 
                    onClick={onGenerate}
                    disabled={data.isGenerating}
                    className="w-10 h-10 bg-white/10 hover:bg-white text-slate-100 hover:text-slate-900 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {data.isGenerating ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};