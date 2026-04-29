import React from 'react';
import { NodeProps, useReactFlow, Node } from '@xyflow/react';
import { BaseNode, NodeData } from './BaseNode';
import { Video, Film, PlayCircle, Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VideoNode: React.FC<NodeProps<Node<NodeData>>> = (props) => {
  const { setNodes, getNodes } = useReactFlow<Node<NodeData>>();
  const data = props.data;

  const handleGenerate = async () => {
    if (data.isGenerating) return;

    setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, isGenerating: true } } : n));
    
    setTimeout(() => {
       setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, output: 'https://cdn.pixabay.com/video/2019/04/23/23011-332306786_large.mp4', isGenerating: false } } : n));
    }, 3000);
  };

  const updateConfig = (update: Partial<NodeData['config']>) => {
    setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...update } } } : n));
  };

  return (
    <BaseNode 
      {...props} 
      onGenerate={handleGenerate}
      renderConfig={() => (
        <div className="flex items-center gap-2">
           <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors cursor-pointer capitalize">
            1080P
          </div>

          <div className="w-px h-3 bg-white/10 mx-1" />

          <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
            {(['5s', '10s'] as const).map(d => (
              <button 
                key={d}
                onClick={() => updateConfig({ duration: d })}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all uppercase", 
                  data.config.duration === d 
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    >
      <div className="w-full aspect-video bg-black relative group/video overflow-hidden">
        {data.output ? (
          <video 
            src={data.output} 
            className="w-full h-full object-cover" 
            autoPlay 
            loop 
            muted 
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/5">
            {data.isGenerating ? (
               <RefreshCw size={48} className="animate-spin mb-2" />
            ) : (
              <Film size={48} className="mb-2" />
            )}
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Stream Inactive</span>
          </div>
        )}
        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
            <PlayCircle size={48} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
        </div>
      </div>
    </BaseNode>
  );
};