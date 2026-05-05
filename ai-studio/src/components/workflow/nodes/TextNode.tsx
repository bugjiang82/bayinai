'use client';

import React from 'react';
import { NodeProps, useReactFlow, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { NodeData } from '../types';
import { generateText } from '../services/aiService';
import { FileText, RefreshCw } from 'lucide-react';

export const TextNode: React.FC<NodeProps<Node<NodeData>>> = (props) => {
  const { setNodes, getNodes } = useReactFlow<Node<NodeData>>();
  const data = props.data;

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
      <div className="w-[180px] h-[180px] p-5 bg-slate-950 text-slate-300 text-xs font-sans leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30 relative overflow-y-auto nowheel custom-scrollbar">
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