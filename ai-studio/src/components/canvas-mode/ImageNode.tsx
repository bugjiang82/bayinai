"use client";

import { useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { 
  Image, 
  Crop, 
  Wand2, 
  Download, 
  Maximize2, 
  X, 
  Plus 
} from "lucide-react";

export default function ImageNode({ data }: NodeProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="glass rounded-xl border border-cyber-cyan/30 overflow-hidden w-80">
      <Handle type="target" position={Position.Left} className="!bg-[#ff00ff] !border-white" />
      
      <div className="bg-gradient-to-r from-cyber-cyan/10 to-transparent p-3 border-b border-cyber-cyan/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-cyber-cyan" />
            <span className="text-sm font-medium text-cyber-cyan">图像节点</span>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-xs text-zinc-500 hover:text-cyber-cyan transition-colors"
          >
            {showMenu ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-3">
        {!imageSrc ? (
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-cyber-cyan/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id={`upload-${data.id}`}
            />
            <label htmlFor={`upload-${data.id}`} className="cursor-pointer">
              <Image className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">点击上传图片</p>
            </label>
          </div>
        ) : (
          <div className="relative">
            <img 
              src={imageSrc} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-sm text-cyber-cyan">处理中...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {showMenu && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={handleGenerate}
              disabled={!imageSrc || isProcessing}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-cyber-cyan/10 hover:text-cyber-cyan rounded-lg transition-colors disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              重新生成
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-cyber-cyan/10 hover:text-cyber-cyan rounded-lg transition-colors">
              <Crop className="w-4 h-4" />
              裁剪图片
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-cyber-cyan/10 hover:text-cyber-cyan rounded-lg transition-colors">
              <Maximize2 className="w-4 h-4" />
              全屏预览
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-cyber-cyan/10 hover:text-cyber-cyan rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              下载图片
            </button>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-[#00f5ff] !border-white" />
    </div>
  );
}
