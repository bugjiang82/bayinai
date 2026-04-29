import React, { useRef } from 'react';
import { NodeProps, useReactFlow, Node } from '@xyflow/react';
import { BaseNode, NodeData } from './BaseNode';
import { ImageIcon, Layout, Zap, Monitor, Smartphone, Square, RefreshCw, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ImageNode: React.FC<NodeProps<Node<NodeData>>> = (props) => {
  const { setNodes, getNodes } = useReactFlow<Node<NodeData>>();
  const data = props.data;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (data.isGenerating) return;

    let resolvedPrompt = data.prompt;
    const nodes = getNodes();
    const matches = data.prompt.match(/@([\w\s]+)/g);
    if (matches) {
      matches.forEach(match => {
        const name = match.slice(1).trim();
        const refNode = nodes.find((n: any) => n.data.label.toLowerCase() === name.toLowerCase());
        if (refNode && refNode.data.output) {
          const outputStr = String(refNode.data.output);
          resolvedPrompt = resolvedPrompt.replace(match, `[Context from ${name}: ${outputStr.slice(0, 50)}...]`);
        }
      });
    }

    setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, isGenerating: true } } : n));
    
    try {
      const url = `https://picsum.photos/400/300?random=${Date.now()}`;
      await new Promise(resolve => setTimeout(resolve, 2000));
      setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, output: url || undefined, isGenerating: false } } : n));
    } catch (error) {
       setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, isGenerating: false } } : n));
    }
  };

  const updateConfig = (update: Partial<NodeData['config']>) => {
     setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...update } } } : n));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNodes((nds) => nds.map((n) => n.id === props.id ? { 
          ...n, 
          data: { 
            ...n.data, 
            output: base64String,
            sourceImage: base64String 
          } 
        } : n));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const ratios = [
    { label: '1:1', value: '1:1' as const, icon: Square },
    { label: '16:9', value: '16:9' as const, icon: Monitor },
    { label: '9:16', value: '9:16' as const, icon: Smartphone },
    { label: '4:3', value: '4:3' as const, icon: Layout },
  ];

  const qualities = [
    { label: 'Standard (1K)', value: 'standard' as const },
    { label: 'HD (2K)', value: 'hd' as const },
  ];

  return (
    <BaseNode 
      {...props} 
      onGenerate={handleGenerate}
      renderConfig={() => (
        <div className="flex items-center gap-2">
          <div className="relative group/config">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                {data.config.quality === 'hd' ? '2K' : '1K'}
              </span>
              <div className="w-px h-3 bg-white/10 mx-0.5" />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 uppercase">
                {data.config.aspectRatio}
              </span>
            </div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-[#1a1c24] border border-white/10 rounded-2xl shadow-2xl scale-0 group-hover/config:scale-100 transition-all origin-bottom z-[100] overflow-hidden backdrop-blur-xl">
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">图片质量</div>
                  <div className="grid grid-cols-2 gap-2">
                    {qualities.map(q => (
                      <button
                        key={q.value}
                        onClick={() => updateConfig({ quality: q.value })}
                        className={cn(
                          "px-3 py-2 text-xs font-bold rounded-lg border transition-all text-center",
                          data.config.quality === q.value 
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-400" 
                            : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                        )}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">图片比例</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ratios.map(r => (
                      <button
                        key={r.value}
                        onClick={() => updateConfig({ aspectRatio: r.value })}
                        className={cn(
                          "px-3 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2",
                          data.config.aspectRatio === r.value 
                            ? "bg-amber-600/20 border-amber-500 text-amber-400" 
                            : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                        )}
                      >
                        <r.icon size={12} />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <div className="w-full h-full min-h-[320px] bg-slate-950 relative group/image overflow-hidden">
        {data.inheritImage && !data.output && !data.sourceImage && (
          <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center space-y-3">
             <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/20 shadow-2xl transform -rotate-3">
                <img src={data.inheritImage as string} className="w-full h-full object-cover opacity-50" alt="Inherited" />
             </div>
             <div className="space-y-1">
               <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">继承上级节点</div>
               <p className="text-xs text-slate-400">我们将基于此图进行重绘或提取</p>
             </div>
          </div>
        )}

        {data.output ? (
          <>
            <img 
              src={data.output} 
              alt="AI Output" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={triggerUpload}
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105"
              >
                <RefreshCw size={14} />
                替换图片
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
              {data.isGenerating ? (
                 <RefreshCw size={32} className="animate-spin text-indigo-500/50" />
              ) : (
                <ImageIcon size={32} className="text-slate-700" />
              )}
            </div>
            {!data.isGenerating && (
              <button 
                onClick={triggerUpload}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all shadow-xl shadow-indigo-600/20"
              >
                <Upload size={14} />
                上传图片
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
};