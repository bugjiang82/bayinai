import React, { useState, useCallback } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Copy, RefreshCw, X, Check } from 'lucide-react';

interface PromptNodeProps {
  id: string;
  data: {
    inheritImage: string | null;
    extractedPrompt: string;
    editedPrompt: string;
  };
  selected: boolean;
  position: { x: number; y: number };
}

const PromptNode: React.FC<PromptNodeProps> = ({ id, data, selected, position }) => {
  const [inheritImage, setInheritImage] = useState(data.inheritImage || null);
  const [extractedPrompt, setExtractedPrompt] = useState(data.extractedPrompt);
  const [editedPrompt, setEditedPrompt] = useState(data.editedPrompt || '');
  const [analysisInstruction, setAnalysisInstruction] = useState('详细描述图片的内容、风格、色彩、构图等特征');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();

  const handleSubmitPrompt = useCallback(async () => {
    if (!inheritImage) return;
    setIsAnalyzing(true);
    // 这里将集成现有的API调用逻辑
    // 暂时使用模拟数据
    setTimeout(() => {
      const mockPrompt = "A futuristic cyberpunk cityscape at night, with neon lights, flying vehicles, and towering skyscrapers. The scene is dominated by blues and purples, with a dark, moody atmosphere. The composition is dynamic, with leading lines drawing the eye into the distance."
      setExtractedPrompt(mockPrompt);
      setEditedPrompt(mockPrompt);
      setIsAnalyzing(false);
      updateNodeInternals(id);
    }, 2000);
  }, [inheritImage, id, updateNodeInternals]);

  const handleCopy = useCallback(() => {
    if (editedPrompt) {
      navigator.clipboard.writeText(editedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editedPrompt]);

  const handleRefresh = useCallback(() => {
    handleSubmitPrompt();
  }, [handleSubmitPrompt]);

  const floatingMenu = (
    <div
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 glass px-2 py-1.5 rounded-xl flex gap-1 items-center whitespace-nowrap"
      style={{ animation: 'fadeInUp 0.2s ease-out' }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setShowFullscreen(true); }}
        disabled={!inheritImage}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyber-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="全屏查看"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
      </button>
    </div>
  );

  return (
    <div 
      className={`w-72 glass rounded-xl relative transition-all duration-300 ${isAnalyzing ? 'border-cyber-cyan shadow-[0_0_30px_rgba(0,245,255,0.3)]' : 'hover:shadow-[0_0_20px_rgba(0,245,255,0.2)]'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="h-full flex flex-col">
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-5 !h-5 !-left-2.5 !z-50 !bg-cyber-magenta !border-[3px] !border-white !shadow-[0_0_15px_#ff00ff] hover:!scale-150 hover:!shadow-[0_0_25px_#ff00ff] !transition-all !duration-200"
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-5 !h-5 !-right-2.5 !z-50 !bg-cyber-cyan !border-[3px] !border-white !shadow-[0_0_15px_#00f5ff] hover:!scale-150 hover:!shadow-[0_0_25px_#00f5ff] !transition-all !duration-200 cursor-crosshair"
        />

        {/* 悬浮菜单 */}
        {hover && inheritImage && floatingMenu}

        {/* 节点头部 */}
        <div className="px-4 py-3 bg-gradient-to-r from-cyber-cyan/10 to-transparent border-b border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 bg-cyber-cyan rounded-full shadow-[0_0_8px_#00f5ff] animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-cyber-cyan">
            NODE {id.slice(-4).toUpperCase()}
          </span>
          {isAnalyzing && (
            <div className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-cyber-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* 节点主体 */}
        <div className="p-4">
          {/* 图片区域 */}
          <div
            className={`w-full h-32 bg-black/30 rounded-lg overflow-hidden relative border transition-all duration-300 ${inheritImage ? 'border-white/10' : 'border-dashed border-white/20 hover:border-cyber-cyan hover:bg-cyber-cyan/5'}`}
          >
            {inheritImage ? (
              <div className="relative">
                <img
                  src={inheritImage}
                  alt="Inherited image"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => setShowFullscreen(true)}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-black/50 rounded-md flex flex-col items-center justify-center">
                <p className="text-sm text-gray-400">未继承图像</p>
              </div>
            )}
          </div>

          {/* 分析指令 */}
          <div className="mt-3">
            <label className="text-[10px] text-white/50 uppercase tracking-wider">分析指令</label>
            <textarea
              value={analysisInstruction}
              onChange={(e) => setAnalysisInstruction(e.target.value)}
              placeholder="输入分析指令..."
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm outline-none resize-none focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.2)] placeholder:text-white/30 h-20"
            />
          </div>

          {/* 提取按钮 */}
          <div className="mt-3">
            <button
              onClick={handleSubmitPrompt}
              disabled={!inheritImage || isAnalyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-md bg-gradient-to-br from-cyber-cyan/20 to-cyber-cyan/5 border border-cyber-cyan/30 text-cyber-cyan hover:from-cyber-cyan/40 hover:to-cyber-cyan/10 hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
                  分析中
                </span>
              ) : '提取提示词'}
            </button>
          </div>

          {/* 提示词输出 */}
          <div className="mt-3 flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">提示词</label>
              <div className="flex gap-1">
                <button
                  onClick={handleCopy}
                  disabled={!editedPrompt}
                  className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-cyber-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="复制"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={!inheritImage || isAnalyzing}
                  className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-cyber-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="刷新"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="提取的提示词将显示在这里..."
              className="w-full bg-black/30 border border-white/10 rounded-md text-white text-sm outline-none resize-none focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.2)] placeholder:text-white/30 h-40"
            />
          </div>
        </div>

        {/* 图片预览弹窗 */}
        {showFullscreen && inheritImage && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowFullscreen(false)}
          >
            <div className="relative max-w-[95vw] max-h-[95vh]">
              <img
                src={inheritImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,245,255,0.3)]"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-cyber-cyan transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="px-4 py-2 bg-black/70 rounded-full text-sm text-cyber-cyan">
                  点击任意处关闭预览
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptNode;
