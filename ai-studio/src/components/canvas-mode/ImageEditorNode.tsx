import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { createPortal } from 'react-dom';

interface ImageEditorNodeData {
  image: string | null;
  prompt: string;
  inheritImage?: string;
  isGenerating?: boolean;
  output?: string;
}

const ImageEditorNodeComponent: React.FC<NodeProps<Node<ImageEditorNodeData>>> = ({ id, data }) => {
  const [image, setImage] = useState<string | null>(data.inheritImage || data.image || null);
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hover, setHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.inheritImage && !image) {
      setImage(data.inheritImage);
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

    await new Promise(resolve => setTimeout(resolve, 2000));

    const url = `https://picsum.photos/400/300?random=${Date.now()}`;
    setImage(url);
    data.output = url;
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = `edited-${id}.png`;
      link.click();
    }
  };

  return (
    <div
      className={`w-72 glass rounded-xl relative transition-all duration-300 ${isGenerating ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-5 !h-5 !-left-2.5 !z-50 !bg-amber-500 !border-[3px] !border-white !shadow-[0_0_15px_#f59e0b] hover:!scale-150 !transition-all !duration-200"
      />

      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b] animate-pulse" />
        <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
          图片编辑器
        </span>
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="p-4">
        <div
          className={`w-full h-44 bg-black/30 rounded-lg overflow-hidden relative border transition-all duration-300 group ${image ? 'border-white/10' : 'border-dashed border-white/20 hover:border-amber-500 hover:bg-amber-500/5'}`}
          onClick={() => !image && fileInputRef.current?.click()}
        >
          {image ? (
            <>
              <img
                src={image}
                alt="Edit"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-white/80 text-xs font-medium">编辑图片</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <span className="text-3xl mb-2">✎</span>
              <span className="text-xs">点击上传或连接上级节点</span>
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
          className="w-full mt-3 px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm outline-none resize-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(245,158,11,0.2)] placeholder:text-white/30"
          rows={2}
          placeholder="输入编辑指令..."
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
          disabled={isGenerating || !prompt.trim() || !image}
          className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-md bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 text-amber-400 hover:from-amber-500/40 hover:to-amber-500/10 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
              编辑中
            </span>
          ) : '应用编辑'}
        </button>

        <button
          onClick={handleDownload}
          disabled={!image}
          className="flex-1 py-2 px-4 text-xs font-semibold uppercase tracking-wide rounded-md bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white/70 hover:from-white/20 hover:to-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          下载
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !-right-2.5 !z-50 !bg-amber-500 !border-[3px] !border-white !shadow-[0_0_15px_#f59e0b] hover:!scale-150 !transition-all !duration-200 cursor-crosshair"
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
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(245,158,11,0.3)]"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-amber-400 transition-colors"
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

ImageEditorNodeComponent.displayName = 'ImageEditorNode';

export const ImageEditorNode = memo(ImageEditorNodeComponent);