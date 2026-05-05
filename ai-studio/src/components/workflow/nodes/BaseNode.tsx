'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps, useReactFlow, Node } from '@xyflow/react';
import { useDragging, useMultiSelect } from '../WorkflowCanvas';
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
  Mic,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { NodeData } from '../types';

// 模型积分消耗配置
const MODEL_COST_MAP: Record<string, { base: number; type: "fixed" | "per-second" }> = {
  // 图片模型
  "gemini-2.5-flash-image": { base: 1, type: "fixed" },
  "gemini-3.1-flash-image-preview": { base: 1, type: "fixed" },
  
  // 文本模型
  "gemini-3-flash-preview": { base: 1, type: "fixed" },
  
  // 视频模型
  "veo-3.1-lite-generate-preview": { base: 50, type: "per-second" },
  "wan2.2-kf2v-flash": { base: 50, type: "per-second" },
};

// 计算积分消耗
const calculateCost = (data: NodeData): number => {
  const modelConfig = MODEL_COST_MAP[data.config.model] || { base: 1, type: "fixed" };
  
  if (modelConfig.type === "per-second" && data.type === "video") {
    const duration = Number(data.config.duration?.replace("s", "") || 5);
    return duration * modelConfig.base;
  }
  
  return modelConfig.base;
};

interface BaseNodeProps extends NodeProps<Node<NodeData>> {
  children?: React.ReactNode;
  onGenerate: () => void;
  renderConfig?: () => React.ReactNode;
  topContent?: React.ReactNode;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  id, 
  data, 
  selected, 
  children, 
  onGenerate,
  renderConfig,
  topContent
}) => {
  const { setNodes, getNodes, setEdges } = useReactFlow<Node<NodeData>>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPickingParent, setIsPickingParent] = useState(false);
  const [showMentions, setShowMentions] = useState<{ x: number; y: number; index: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDragging = useDragging();
  const isMultiSelected = useMultiSelect();
  
  // 计算积分消耗
  const cost = useMemo(() => calculateCost(data), [data.config.model, data.config.duration, data.type]);

  // 引用节点计算 - 使用 useMemo 避免每次渲染都重新计算
  const parentIds = (data.referencedParentIds || []) as string[];
  const referencedNodes = useMemo(() => {
    return parentIds
      .map(parentId => getNodes().find(n => n.id === parentId))
      .filter((n): n is Node<NodeData> => !!n && (!!n.data.output || !!n.data.sourceImage));
  }, [parentIds, getNodes]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastWord = textBeforeCursor.split(/\s/).pop();

    if (lastWord?.startsWith('@')) {
      setShowMentions({ 
        x: 20, 
        y: 0,
        index: selectionStart
      });
    } else {
      setShowMentions(null);
    }
    
    updateNodeData({ prompt: value });
  };

  const insertMention = (node: Node<NodeData>) => {
    if (!showMentions) return;
    const value = data.prompt || '';
    const before = value.substring(0, value.lastIndexOf('@', showMentions.index));
    const after = value.substring(showMentions.index);
    const nodeName = node.data.label || `node_${node.id.slice(0,4)}`;
    const newValue = `${before}@${nodeName} ${after}`;

    updateNodeData({ prompt: newValue });
    setShowMentions(null);
  };

  const handleDownload = () => {
    const downloadUrl = data.sourceImage || data.output;
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl as string;
    link.download = `${data.label || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!isPickingParent) return;

    document.body.classList.add('picking-parent');

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest('.react-flow__node');
      
      if (nodeEl) {
        const pickedId = nodeEl.getAttribute('data-id');
        if (pickedId && pickedId !== id) {
          const pickedNode = getNodes().find(n => n.id === pickedId);
          if (pickedNode && pickedNode.data.output) {
            const currentIds = (data.referencedParentIds || []) as string[];
            if (currentIds.length < 9 && !currentIds.includes(pickedId)) {
              updateNodeData({ referencedParentIds: [...currentIds, pickedId] });
              
              setEdges((eds) => {
                const exists = eds.find(edge => edge.source === pickedId && edge.target === id);
                if (exists) return eds;

                return [
                  ...eds,
                  {
                    id: `e-${pickedId}-${id}`,
                    source: pickedId,
                    sourceHandle: 'right',
                    target: id,
                    targetHandle: 'left',
                    animated: false,
                    style: { strokeWidth: 1, stroke: '#ffffff' },
                    interactionWidth: 30
                  }
                ];
              });
            }

            setIsPickingParent(false);
            document.body.classList.remove('picking-parent');
            e.stopPropagation();
            e.preventDefault();
          }
        }
      } else {
        setIsPickingParent(false);
        document.body.classList.remove('picking-parent');
      }
    };

    window.addEventListener('mousedown', handleGlobalClick, true);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick, true);
      document.body.classList.remove('picking-parent');
    };
  }, [isPickingParent, id, getNodes, setEdges]);

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
        "relative group transition-all duration-300 flex flex-col items-center",
        selected ? "z-50" : "z-10"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {selected && !isDragging && (
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-[84px] flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-full shadow-xl z-[1001]">
          <button onClick={onGenerate} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Redraw">
            <RefreshCw size={14} className={data.isGenerating ? "animate-spin" : ""} />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Upscale">
            <Sparkles size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 nodrag nopan" 
            title="Download"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 nodrag nopan" 
            title="Fullscreen"
          >
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
        </div>
      )}

      <div className="absolute -top-7 left-0 flex items-center gap-2 px-1 z-20">
        {isEditingName ? (
          <input 
            autoFocus
            className="text-[11px] font-black uppercase tracking-[0.2em] bg-transparent border-none outline-none text-white/50 focus:text-white w-32 transition-colors"
            value={data.label}
            onChange={(e) => updateNodeData({ label: e.target.value })}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
          />
        ) : (
          <span 
            className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 truncate cursor-pointer hover:text-white transition-colors"
            onDoubleClick={() => setIsEditingName(true)}
          >
            {data.label}
          </span>
        )}
        {data.isGenerating && (
          <RefreshCw size={10} className="text-indigo-500 animate-spin" />
        )}
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        className={cn(
          "!w-[10px] !h-[10px] !border !border-white !bg-transparent !flex !items-center !justify-center !-left-[5px] transition-all hover:!scale-150 active:!scale-95 !z-[100]",
          (isHovered || selected) ? "!opacity-100" : "!opacity-0"
        )}
      >
        <Plus size={6} className="text-white pointer-events-none" />
      </Handle>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        className={cn(
          "!w-[10px] !h-[10px] !border !border-white !bg-transparent !flex !items-center !justify-center !-right-[5px] transition-all hover:!scale-150 active:!scale-95 !z-[100]",
          (isHovered || selected) ? "!opacity-100" : "!opacity-0"
        )}
      >
        <Plus size={6} className="text-white pointer-events-none" />
      </Handle>

      {selected && !isDragging && topContent}

      <div
        className={cn(
          "bg-[#13141c]/90 backdrop-blur-3xl border rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col items-center",
          selected
            ? "ring-1 ring-white/20 border-white/40"
            : "border-white/10 hover:border-white/20",
          isPickingParent && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#13141c]"
        )}
      >
        <div className={cn(
          "p-0 transition-all duration-300 flex flex-col items-center",
          !selected && data.output && "opacity-90"
        )}>
          {children}
        </div>
      </div>

      {selected && !data.isUploaded && !isDragging && !isMultiSelected && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 w-[720px] bg-[#121212] border border-white/10 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] flex flex-col z-50 overflow-visible"
          style={{ top: 'calc(100% + 4px)' }} 
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors relative">
                <MousePointer2 size={16} />
              </div>
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              
              <div className="flex items-center gap-1.5">
                {referencedNodes.map((node) => (
                  <div key={node.id} className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shadow-lg relative group/preview">
                    <img 
                      src={(node.data.output || node.data.sourceImage) as string} 
                      className="w-full h-full object-cover transition-transform group-hover/preview:scale-110" 
                      alt="Parent Preview"
                    />
                  </div>
                ))}
                
                {parentIds.length < 9 && (
                  <button 
                    onClick={() => setIsPickingParent(!isPickingParent)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all relative overflow-hidden group",
                      isPickingParent ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]" : "bg-white/5 text-slate-400 hover:text-white"
                    )}
                    title={isPickingParent ? "Click a node on the canvas to select as parent" : "Select parent node"}
                  >
                    <Plus size={18} className={cn(isPickingParent && "animate-pulse")} />
                    {isPickingParent && (
                      <div className="absolute inset-0 border border-white/50 rounded-lg animate-pulse pointer-events-none" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pr-2">
              {data.output && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors nodrag nopan"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors nodrag nopan"
                    title="Fullscreen preview"
                  >
                    <Maximize2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-6 py-4 relative border-b border-white/5">
            {showMentions && referencedNodes.length > 0 && (
              <div 
                className="absolute z-[100] w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                style={{ bottom: '100%', left: 24, marginBottom: 12 }}
              >
                <div className="p-3 border-b border-white/5 text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Select reference node</span>
                  <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-600">Referenced Nodes</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {referencedNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => insertMention(node)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                        <img src={(node.data.output || node.data.sourceImage) as string} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                          @{node.data.label || `node_${node.id.slice(0,4)}`}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-black">
                          {node.type === 'image' ? 'Image Node' : 'Video Node'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea
              rows={1}
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              className="w-full bg-transparent text-xl text-slate-200 focus:outline-none active:outline-none transition-all resize-none placeholder:text-slate-600 font-medium leading-relaxed min-h-[56px]"
              placeholder="Describe what you want to generate. Use @ to reference nodes."
              value={data.prompt}
              onChange={handlePromptChange}
            />
          </div>

          <div className="flex items-center justify-between px-4 pb-4 pt-3 relative">
            <div className="flex items-center gap-4">
              <div className="relative group/model">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex flex-col gap-0.5 justify-center">
                    <div className="w-2.5 h-0.5 bg-slate-500 group-hover:bg-indigo-400 transition-colors" />
                    <div className="w-4 h-0.5 bg-slate-500 group-hover:bg-indigo-400 transition-colors" />
                    <div className="w-3 h-0.5 bg-slate-500 group-hover:bg-indigo-400 transition-colors" />
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    {[
                      { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
                      { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image' },
                      { id: 'veo-3.1-lite-generate-preview', name: 'Veo 3.1 Lite' },
                      { id: 'wan2.2-kf2v-flash', name: 'Wanx 2.2' },
                      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
                    ].find(m => m.id === data.config.model)?.name || (data.type === 'video' ? 'Veo 3.1 Lite' : (data.type === 'image' ? 'Gemini 2.5 Flash Image' : 'Gemini 3 Flash'))}
                  </span>
                </div>
                
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1c24] border border-white/10 rounded-xl shadow-2xl scale-0 group-hover/model:scale-100 transition-all origin-bottom-left z-[100] overflow-hidden backdrop-blur-xl">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                    Select Model
                  </div>
                  <div className="p-1">
                    {[
                      { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', type: ['image'] },
                      { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image', type: ['image'] },
                      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', type: ['text'] },
                      { id: 'veo-3.1-lite-generate-preview', name: 'Veo 3.1 Lite', type: ['video'] },
                      { id: 'wan2.2-kf2v-flash', name: 'Wanx 2.2 (首尾帧)', type: ['video'] },
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

              {renderConfig && renderConfig()}
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
                  <span className={cn(
                    "text-sm font-bold",
                    data.credits < cost ? "text-red-400" : "text-slate-300"
                  )}>{cost}</span>
                </div>
                <button 
                  onClick={onGenerate}
                  disabled={data.isGenerating || data.credits < cost}
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
        </div>
      )}

      <AnimatePresence>
        {isFullscreen && data.output && createPortal(
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[10000] bg-[#0a0a0a] flex"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex items-center justify-center p-8 bg-black/40">
              <motion.img 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                src={data.output as string} 
                className="max-w-full max-h-full object-contain shadow-[0_32px_64px_rgba(0,0,0,0.8)] rounded-sm"
                alt="Preview"
              />
            </div>

            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-[400px] border-l border-white/10 flex flex-col p-8 gap-8 bg-[#121212] shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Prompt</h2>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all active:scale-90 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-white/5 rounded-xl p-6 min-h-[200px] border border-white/5">
                <p className="text-slate-300 leading-relaxed font-medium">
                  {data.prompt || "No prompt provided"}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Information</h2>
                <div className="space-y-4 bg-white/5 rounded-xl p-6 border border-white/5">
                  {[
                    { label: "Model", value: data.config.model || "Gemini 2.5 Flash Image" },
                    { label: "Quality", value: data.config.quality === 'hd' ? "2K" : "1K" },
                    { label: "Aspect Ratio", value: data.config.aspectRatio || "1:1" },
                    { label: "File Size", value: "~ 512 KB" },
                    { label: "Date", value: new Date().toLocaleDateString() },
                    { label: "Creator", value: "NexusFlow Team" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">{item.label}:</span>
                      <span className="text-slate-300 font-bold text-sm tracking-tight">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  <Download size={20} />
                  <span>Download</span>
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};