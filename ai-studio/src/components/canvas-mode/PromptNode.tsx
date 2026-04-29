"use client";

import { useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { 
  FileText, 
  Copy, 
  RefreshCw, 
  Sparkles 
} from "lucide-react";

export default function PromptNode({ data }: NodeProps) {
  const [prompt, setPrompt] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setPrompt("一个赛博朋克风格的未来城市夜景，霓虹灯光，雨雾氛围，高清细节");
      setIsExtracting(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    alert("提示词已复制!");
  };

  return (
    <div className="glass rounded-xl border border-cyber-magenta/30 overflow-hidden w-80">
      <Handle type="target" position={Position.Left} className="!bg-[#00f5ff] !border-white" />
      
      <div className="bg-gradient-to-r from-cyber-magenta/10 to-transparent p-3 border-b border-cyber-magenta/20">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyber-magenta" />
          <span className="text-sm font-medium text-cyber-magenta">提示词节点</span>
        </div>
      </div>

      <div className="p-3">
        {isExtracting ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-8 h-8 border-2 border-cyber-magenta border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-sm text-cyber-magenta">分析中...</span>
          </div>
        ) : prompt ? (
          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 resize-none focus:outline-none focus:border-cyber-magenta/50"
              placeholder="提取到的提示词会显示在这里..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-cyber-magenta border border-cyber-magenta/30 hover:bg-cyber-magenta/10 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
              <button
                onClick={handleExtract}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-cyber-magenta border border-cyber-magenta/30 hover:bg-cyber-magenta/10 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新提取
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleExtract}
            className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-700 hover:border-cyber-magenta/50 rounded-lg transition-colors"
          >
            <Sparkles className="w-8 h-8 text-zinc-500 mb-2" />
            <p className="text-sm text-zinc-400">连接图片节点提取提示词</p>
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#ff00ff] !border-white" />
    </div>
  );
}
