"use client";

import { X, Image, FileText, Sparkles, Layers } from "lucide-react";

interface NodeTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

export function NodeTypeModal({ isOpen, onClose, onSelect }: NodeTypeModalProps) {
  if (!isOpen) return null;

  const nodeTypes = [
    {
      type: "imageNode",
      name: "图像节点",
      icon: Image,
      color: "cyber-cyan",
      description: "上传、生成和处理图片",
    },
    {
      type: "promptNode",
      name: "提示词节点",
      icon: FileText,
      color: "cyber-magenta",
      description: "从图片中提取提示词",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in">
      <div className="glass rounded-2xl w-full max-w-md mx-4 border border-cyber-cyan/30 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-100">选择节点类型</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {nodeTypes.map((node) => (
            <button
              key={node.type}
              onClick={() => onSelect(node.type)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-700 hover:border-${node.color}/50 hover:bg-${node.color}/10 transition-all text-left`}
            >
              <div className={`p-3 rounded-lg bg-${node.color}/20`}>
                <node.icon className={`w-6 h-6 text-${node.color}`} />
              </div>
              <div>
                <h3 className={`font-medium text-${node.color}`}>{node.name}</h3>
                <p className="text-sm text-zinc-400">{node.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
