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

  const nodeStyle = {
    width: 300,
    minHeight: 300,
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: selected ? '0 0 20px var(--cyber-cyan)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
  };

  return (
    <div style={nodeStyle} className="gradient-border">
      <div className="p-4 glass h-full flex flex-col">
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--cyber-cyan)' }}>
            提示词节点
          </h3>
        </div>

        <div className="mb-3">
          {inheritImage ? (
            <div className="relative">
              <img
                src={inheritImage}
                alt="Inherited image"
                className="w-full h-32 object-cover rounded-md cursor-pointer"
                onClick={() => setShowFullscreen(true)}
              />
              <button
                onClick={() => setShowFullscreen(true)}
                className="absolute top-2 right-2 p-1 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v4m0 4h4m-4 0l4 4m6-4v-4m0-4h-4m4 0l-4-4m-6 16v-4m0 4h4m-4 0l4-4m6 4v-4m0 4h-4m4 0l-4 4" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-full h-32 bg-black/50 rounded-md flex items-center justify-center">
              <p className="text-sm text-gray-400">未继承图像</p>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">分析指令</label>
          <textarea
            value={analysisInstruction}
            onChange={(e) => setAnalysisInstruction(e.target.value)}
            placeholder="输入分析指令..."
            className="w-full bg-black/50 text-white text-sm px-3 py-2 rounded border border-white/20 focus:outline-none focus:border-cyber-cyan h-20 resize-none"
          />
        </div>

        <div className="mb-3">
          <button
            onClick={handleSubmitPrompt}
            disabled={!inheritImage || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: isAnalyzing ? 'rgba(0, 245, 255, 0.5)' : 'var(--cyber-cyan)',
              color: '#000',
              opacity: (!inheritImage || isAnalyzing) ? 0.5 : 1
            }}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <span>提取提示词</span>
            )}
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">提示词</label>
            <div className="flex gap-1">
              <button
                onClick={handleCopy}
                disabled={!editedPrompt}
                className="p-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4" style={{ color: 'var(--cyber-cyan)' }} /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleRefresh}
                disabled={!inheritImage || isAnalyzing}
                className="p-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            placeholder="提取的提示词将显示在这里..."
            className="w-full bg-black/50 text-white text-sm px-3 py-2 rounded border border-white/20 focus:outline-none focus:border-cyber-cyan h-40 resize-none"
          />
        </div>

        {showFullscreen && inheritImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowFullscreen(false)} />
            <div className="relative z-50">
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-4 right-4 p-2 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={inheritImage}
                alt="Fullscreen image"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptNode;
