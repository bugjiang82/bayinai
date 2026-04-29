import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from '@xyflow/react';
import { createPortal } from 'react-dom';

interface ImageNodeData {
  image: string | null;
  prompt: string;
  inheritImage?: string;
  isGenerating?: boolean;
  progress?: number;
  status?: string;
}

const ImageNodeComponent: React.FC<NodeProps<Node<ImageNodeData>>> = ({ id, data }) => {
  const [image, setImage] = useState<string | null>(data.image || null);
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    if (data.inheritImage && !image && !data.image) {
      setImage(data.inheritImage);
      data.image = data.inheritImage;
    }
  }, [data.inheritImage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        data.image = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setProgress(30);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const url = `https://picsum.photos/400/300?random=${Date.now()}`;
    setProgress(100);
    setImage(url);
    data.image = url;
    setIsGenerating(false);
    setProgress(0);
  };

  const handleDownload = () => {
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = `node-${id}.png`;
      link.click();
    }
  };

  const floatingMenu = (
    <div
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 glass px-2 py-1.5 rounded-xl flex gap-1 items-center whitespace-nowrap"
      style={{ animation: 'fadeInUp 0.2s ease-out' }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setIsGenerating(true); handleGenerate() }}
        disabled={!image || isGenerating}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyber-yellow transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="重绘"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={handleDownload}
        disabled={!image}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyber-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="下载"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setShowPreview(true) }}
        disabled={!image}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyber-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="全屏查看"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );

  return (
    <div
      className={`w-72 glass rounded-xl relative transition-all duration-300 ${isGenerating ? 'border-cyber-magenta shadow-[0_0_30px_rgba(255,0,255,0.3)]' : 'hover:shadow-[0_0_20px_rgba(0,245,255,0.2)]'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-5 !h-5 !-left-2.5 !z-50 !bg-cyber-magenta !border-[3px] !border-white !shadow-[0_0_15px_#ff00ff] hover:!scale-150 hover:!shadow-[0_0_25px_#ff00ff] !transition-all !duration-200"
      />

      {hover && image && floatingMenu}

      <div className="px-4 py-3 bg-gradient-to-r from-cyber-cyan/10 to-transparent border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-cyber-cyan rounded-full shadow-[0_0_8px_#00f5ff] animate-pulse" />
        <span className="text-xs font-semibold tracking-wider uppercase text-cyber-cyan">
          图片节点
        </span>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="p-4">
        <div
          className={`w-full h-44 bg-black/30 rounded-lg overflow-hidden relative border transition-all duration-300 group ${image ? 'border-white/10' : 'border-dashed border-white/20 hover:border-cyber-cyan hover:bg-cyber-cyan/5'}`}
          onClick={() => !image && fileInputRef.current?.click()}
        >
          {image ? (
            <>
              <img
                src={image}
                alt="Generated"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/80 text-xs font-medium">替换图片</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <span className="text-3xl mb-2">⊕</span>
              <span className="text-xs">点击上传图片</span>
            </div>
          )}

          {isGenerating && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/50">
              <div
                className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-magenta shadow-[0_0_10px_#00f5ff] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <textarea
          className="w-full mt-3 px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm outline-none resize-none focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.2)] placeholder:text-white/30"
          rows={2}
          placeholder="输入提示词生成新图像..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            data.prompt = e.target.value;
          }}
        />
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-md bg-gradient-to-br from-cyber-cyan/20 to-cyber-cyan/5 border border-cyber-cyan/30 text-cyber-cyan hover:from-cyber-cyan/40 hover:to-cyber-cyan/10 hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
              生成中
            </span>
          ) : '生成'}
        </button>

        <button
          onClick={handleDownload}
          disabled={!image}
          className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-md bg-gradient-to-br from-cyber-magenta/20 to-cyber-magenta/5 border border-cyber-magenta/30 text-cyber-magenta hover:from-cyber-magenta/40 hover:to-cyber-magenta/10 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          下载
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !-right-2.5 !z-50 !bg-cyber-cyan !border-[3px] !border-white !shadow-[0_0_15px_#00f5ff] hover:!scale-150 hover:!shadow-[0_0_25px_#00f5ff] !transition-all !duration-200 cursor-crosshair"
      />

      {showPreview && image && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <img
              src={image}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,245,255,0.3)]"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-cyber-cyan transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

ImageNodeComponent.displayName = 'ImageNode';

export const ImageNode = memo(ImageNodeComponent);