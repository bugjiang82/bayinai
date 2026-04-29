import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

interface TextNodeData {
  prompt: string;
  output?: string;
  inheritImage?: string;
  isGenerating?: boolean;
}

const TextNodeComponent: React.FC<NodeProps<Node<TextNodeData>>> = ({ id, data }) => {
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [output, setOutput] = useState(data.output || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const text = `这是生成的文本内容示例。\n\n基于您的提示词 "${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}"，我生成了这段响应。`;
    setOutput(text);
    data.output = text;
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="w-72 glass rounded-xl relative transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-5 !h-5 !-left-2.5 !z-50 !bg-indigo-500 !border-[3px] !border-white !shadow-[0_0_15px_#6366f1] hover:!scale-150 !transition-all !duration-200"
      />

      <div className="px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-transparent border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_#6366f1] animate-pulse" />
        <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400">
          文字节点
        </span>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="p-4">
        <textarea
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm outline-none resize-none focus:border-indigo-500 focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] placeholder:text-white/30"
          rows={3}
          placeholder="输入提示词生成文本..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            data.prompt = e.target.value;
          }}
        />

        {output && (
          <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">生成结果</span>
              <button
                onClick={handleCopy}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                复制
              </button>
            </div>
            <p className="text-xs text-white/70 whitespace-pre-wrap">{output}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-md bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 text-indigo-400 hover:from-indigo-500/40 hover:to-indigo-500/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
              生成中
            </span>
          ) : '生成'}
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !-right-2.5 !z-50 !bg-indigo-500 !border-[3px] !border-white !shadow-[0_0_15px_#6366f1] hover:!scale-150 !transition-all !duration-200 cursor-crosshair"
      />
    </div>
  );
};

TextNodeComponent.displayName = 'TextNode';

export const TextNode = memo(TextNodeComponent);