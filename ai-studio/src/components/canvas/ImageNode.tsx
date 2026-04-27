import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Upload, Download, Edit, RefreshCw, Image as ImageIcon, X, Crop, PenTool, Settings, Maximize2, Minimize2 } from 'lucide-react';

interface ImageNodeProps {
  id: string;
  data: {
    image: string | null;
    prompt: string;
    inheritImage?: string | null;
  };
  selected: boolean;
  position: { x: number; y: number };
}

const ImageNode: React.FC<ImageNodeProps> = ({ id, data, selected, position }) => {
  const [image, setImage] = useState(data.image);
  const [prompt, setPrompt] = useState(data.prompt);
  const [inheritImage, setInheritImage] = useState(data.inheritImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [resolution, setResolution] = useState('1024x1024');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [strength, setStrength] = useState(0.7);
  const [cropMode, setCropMode] = useState(false);
  const [annotateMode, setAnnotateMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [annotations, setAnnotations] = useState<{ x: number; y: number; text: string }[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState({ x: 0, y: 0 });
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        setIsUploading(false);
        updateNodeInternals(id);
      };
      reader.readAsDataURL(file);
    }
  }, [id, updateNodeInternals]);

  const handleGenerate = useCallback(async () => {
    if (!prompt) return;
    setIsGenerating(true);
    // 这里将集成现有的API调用逻辑
    // 暂时使用模拟数据
    setTimeout(() => {
      const mockImage = `https://picsum.photos/seed/${Math.random()}/512/512`;
      setImage(mockImage);
      setIsGenerating(false);
      updateNodeInternals(id);
    }, 2000);
  }, [prompt, id, updateNodeInternals]);

  const handleCrop = useCallback(() => {
    // 实现裁剪功能
    setCropMode(true);
  }, []);

  const handleAnnotate = useCallback(() => {
    // 实现标注功能
    setAnnotateMode(true);
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (annotateMode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setAnnotationPosition({ x, y });
      setShowAnnotationInput(true);
    }
  }, [annotateMode]);

  const handleAddAnnotation = useCallback(() => {
    if (currentAnnotation) {
      setAnnotations([...annotations, { ...annotationPosition, text: currentAnnotation }]);
      setCurrentAnnotation('');
      setShowAnnotationInput(false);
    }
  }, [currentAnnotation, annotationPosition, annotations]);

  const handleApplyCrop = useCallback(() => {
    // 实现裁剪应用功能
    setCropMode(false);
  }, []);

  const handleDownload = useCallback(() => {
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = `image-${Date.now()}.png`;
      link.click();
    }
  }, [image]);

  const handleRefresh = useCallback(() => {
    // 实现刷新功能
    if (image) {
      setImage(`${image}?t=${Date.now()}`);
    }
  }, [image]);

  const nodeStyle = useMemo(() => {
    return {
      width: 300,
      minHeight: 300,
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: selected ? '0 0 20px var(--cyber-cyan)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    };
  }, [selected]);

  return (
    <div style={nodeStyle} className="gradient-border">
      <div className="p-4 glass h-full flex flex-col">
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--cyber-cyan)' }}>
            图像节点
          </h3>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {showMenu && (
          <div className="glass p-2 rounded-lg mb-3 space-y-1">
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-white/10 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>上传图片</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!image}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>下载图片</span>
            </button>
            <button
              onClick={handleCrop}
              disabled={!image}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Crop className="w-4 h-4" />
              <span>裁剪图片</span>
            </button>
            <button
              onClick={handleAnnotate}
              disabled={!image}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <PenTool className="w-4 h-4" />
              <span>标注图片</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={!image}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新图片</span>
            </button>
          </div>
        )}

        <div className="flex-1 mb-3">
          {isUploading ? (
            <div className="w-full h-48 bg-black/50 rounded-md flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isGenerating ? (
            <div className="w-full h-48 bg-black/50 rounded-md flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-cyber-magenta border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-300">生成中...</p>
              <p className="text-xs text-gray-400 mt-1">预计需要 2-3 秒</p>
            </div>
          ) : image ? (
            <div className="relative">
              <img
                ref={imageRef}
                src={image}
                alt="Uploaded or generated image"
                className="w-full h-48 object-cover rounded-md cursor-pointer"
                onClick={handleImageClick}
              />
              {annotateMode && annotations.map((annotation, index) => (
                <div
                  key={index}
                  className="absolute bg-black/70 text-white text-xs px-2 py-1 rounded"
                  style={{
                    left: annotation.x,
                    top: annotation.y,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  {annotation.text}
                </div>
              ))}
              {showAnnotationInput && (
                <div
                  className="absolute bg-black/70 p-2 rounded-md"
                  style={{
                    left: annotationPosition.x,
                    top: annotationPosition.y,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <input
                    type="text"
                    value={currentAnnotation}
                    onChange={(e) => setCurrentAnnotation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAnnotation()}
                    className="bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/20 w-40"
                    placeholder="输入标注"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={handleAddAnnotation}
                      className="text-xs px-2 py-1 bg-cyber-cyan text-black rounded"
                    >
                      确定
                    </button>
                    <button
                      onClick={() => setShowAnnotationInput(false)}
                      className="text-xs px-2 py-1 bg-white/20 text-white rounded"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowFullscreen(true)}
                className="absolute top-2 right-2 p-1 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          ) : inheritImage ? (
            <div className="w-full h-48 bg-black/50 rounded-md flex flex-col items-center justify-center">
              <img
                src={inheritImage}
                alt="Inherited image"
                className="w-24 h-24 object-cover rounded-md mb-2"
              />
              <p className="text-sm text-gray-300">继承自父节点</p>
            </div>
          ) : (
            <div
              className="w-full h-48 bg-black/50 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-300">点击上传图片</p>
              <p className="text-xs text-gray-400 mt-1">或拖拽图片到此处</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">提示词</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入提示词..."
            className="w-full bg-black/50 text-white text-sm px-3 py-2 rounded border border-white/20 focus:outline-none focus:border-cyber-cyan"
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {showAdvanced ? '收起高级设置' : '展开高级设置'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: isGenerating ? 'rgba(255, 0, 255, 0.5)' : 'var(--cyber-magenta)',
              color: '#000',
              opacity: (!prompt || isGenerating) ? 0.5 : 1
            }}
          >
            {isGenerating ? '生成中...' : '生成'}
          </button>
        </div>

        {showAdvanced && (
          <div className="glass p-3 rounded-lg space-y-3 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">分辨率</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-black/50 text-white text-sm px-3 py-2 rounded border border-white/20 focus:outline-none focus:border-cyber-cyan"
              >
                <option value="512x512">512x512</option>
                <option value="1024x1024">1024x1024</option>
                <option value="1024x1536">1024x1536</option>
                <option value="1536x1024">1536x1024</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">图片比例</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-black/50 text-white text-sm px-3 py-2 rounded border border-white/20 focus:outline-none focus:border-cyber-cyan"
              >
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">保留度: {Math.round(strength * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={strength}
                onChange={(e) => setStrength(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {cropMode && image && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80" onClick={() => setCropMode(false)} />
            <div className="glass p-6 rounded-lg z-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--cyber-cyan)' }}>
                  裁剪图片
                </h3>
                <button
                  onClick={() => setCropMode(false)}
                  className="p-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative mb-4">
                <img
                  src={image}
                  alt="Image to crop"
                  className="max-w-full max-h-[60vh] object-contain"
                />
                {/* 这里可以添加裁剪区域选择功能 */}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCropMode(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="px-4 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--cyber-cyan)', color: '#000' }}
                >
                  应用
                </button>
              </div>
            </div>
          </div>
        )}

        {showFullscreen && image && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowFullscreen(false)} />
            <div className="relative z-50">
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-4 right-4 p-2 rounded-md bg-black/50 hover:bg-black/70 transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <img
                src={image}
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

export default ImageNode;
