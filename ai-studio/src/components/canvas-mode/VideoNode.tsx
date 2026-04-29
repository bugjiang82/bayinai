import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

interface VideoNodeData {
  prompt: string;
  output?: string;
  inheritImage?: string;
  isGenerating?: boolean;
  duration?: string;
}

const VideoNodeComponent: React.FC<NodeProps<Node<VideoNodeData>>> = ({ id, data }) => {
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [output, setOutput] = useState(data.output || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [duration, setDuration] = useState(data.duration || '5s');

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const url = 'https://cdn.pixabay.com/video/2019/04/23/23011-332306786_large.mp4';
    setOutput(url);
    data.output = url;
    setIsGenerating(false);
  };

  return (
    <div className="w-72 glass rounded-xl relative transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-5 !h-5 !-left-2.5 !z-50 !bg-emerald-500 !border-[3px] !border-white !shadow-[0_0_15px_#10b981] hover:!scale-150 !transition-all !duration-200"
      />

      <div className="px-4 py-3 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />
        <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
          视频节点
        </span>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="p-4">
        {output ? (
          <div className="w-full aspect-video bg-black/30 rounded-lg overflow-hidden border border-white/10">
            <video
              src={output}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-black/30 rounded-lg flex flex-col items-center justify-center border border-white/10">
            {isGenerating ? (
              <div className="text-white/20">
                <svg className="w-12 h-12 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            ) : (
              <div className="text-white/20">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <span className="text-[9px] text-white/20 mt-2 uppercase tracking-widest">
              {isGenerating ? '生成中...' : '视频预览'}
            </span>
          </div>
        )}

        <textarea
          className="w-full mt-3 px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm outline-none resize-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)] placeholder:text-white/30"
          rows={2}
          placeholder="输入提示词生成视频..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            data.prompt = e.target.value;
          }}
        />

        <div className="flex gap-2 mt-3">
          {['5s', '10s'].map(d => (
            <button
              key={d}
              onClick={() => {
                setDuration(d);
                data.duration = d;
              }}
              className={`flex-1 py-1 px-2 text-[10px] rounded border transition-all ${duration === d ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-md bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/40 hover:to-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
              生成中
            </span>
          ) : '生成'}
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !-right-2.5 !z-50 !bg-emerald-500 !border-[3px] !border-white !shadow-[0_0_15px_#10b981] hover:!scale-150 !transition-all !duration-200 cursor-crosshair"
      />
    </div>
  );
};

VideoNodeComponent.displayName = 'VideoNode';

export const VideoNode = memo(VideoNodeComponent);