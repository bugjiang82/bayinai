import React from 'react';
import { NodeProps, useReactFlow, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../../types';
import { generateText } from '../../services/aiService';
import { FileText, RefreshCw } from 'lucide-react';

export const TextNode: React.FC<NodeProps<Node<NodeData>>> = (props) => {
  const { setNodes, getNodes } = useReactFlow<Node<NodeData>>();
  const data = props.data;

  const handleGenerate = async () => {
    if (data.isGenerating) return;

    let resolvedPrompt = data.prompt;
    const nodes = getNodes(); 
    // Match @[Node Name] and replace with node output
    const matches = data.prompt.match(/@([\w\s]+)/g);
    if (matches) {
      matches.forEach(match => {
        const name = match.slice(1).trim();
        const refNode = nodes.find((n: any) => n.data.label.toLowerCase() === name.toLowerCase());
        if (refNode && refNode.data.output) {
          const outputStr = String(refNode.data.output);
          resolvedPrompt = resolvedPrompt.replace(match, `[Context from ${name}: ${outputStr.slice(0, 100)}]`);
        }
      });
    }

    setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, isGenerating: true } } : n));
    
    try {
      const text = await generateText(resolvedPrompt, data.inheritImage as string);
      setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, output: text, isGenerating: false } } : n));
    } catch (error) {
       setNodes((nds) => nds.map((n) => n.id === props.id ? { ...n, data: { ...n.data, isGenerating: false } } : n));
    }
  };

  return (
    <BaseNode 
      {...props} 
      onGenerate={handleGenerate}
    >
      <div className="w-full min-h-[140px] p-5 bg-slate-950 text-slate-300 text-xs font-sans leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30 relative">
        {data.inheritImage && !data.output && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center z-10">
             <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/20 mb-3 grayscale opacity-30">
               <img src={data.inheritImage as string} className="w-full h-full object-cover" alt="Parent Context" />
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">基于图片提取提示词</p>
          </div>
        )}
        
        {data.output ? (
          data.output
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-3">
             {data.isGenerating ? (
               <RefreshCw size={32} className="animate-spin opacity-20" />
             ) : (
               <>
                 <FileText size={32} className="opacity-20" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 italic">Initialize Core Data</span>
               </>
             )}
          </div>
        )}
      </div>
    </BaseNode>
  );
};
