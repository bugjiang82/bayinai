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
  const [resolution, setResolution] = useState('1k');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [strength, setStrength] = useState(0.75);
  const [cropMode, setCropMode] = useState(false);
  const [annotateMode, setAnnotateMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [annotations, setAnnotations] = useState<{ x: number; y: number; text: string }[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState({ x: 0, y: 0 });
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);
  const [hover, setHover] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [showAnnotate, setShowAnnotate] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [cropDragging, setCropDragging] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropRef = useRef(null);
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

  const getResolutionLabel = (res: string) => {
    const labels: { [key: string]: string } = { '1k': '1K (1024)', '2k': '2K (2048)', '4k': '4K (4096)' };
    return labels[res] || res;
  };

  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = cropRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCropDragging(true);
    setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCropRect({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: 0, h: 0 });
  }, []);

  const handleCropMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cropDragging || !cropStart) return;
    const rect = cropRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropRect(prev => ({
      ...prev,
      w: Math.max(10, x - (cropStart as any).x),
      h: Math.max(10, y - (cropStart as any).y)
    }));
  }, [cropDragging, cropStart]);

  const handleCropMouseUp = useCallback(() => {
    setCropDragging(false);
  }, []);

  const applyCrop = useCallback(() => {
    if (!image || !cropRect || !cropRef.current) return;
    
    const img = new window.Image();
    img.onload = () => {
      const container = cropRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const scaleX = img.naturalWidth / containerRect.width;
      const scaleY = img.naturalHeight / containerRect.height;

      const canvas = document.createElement('canvas');
      canvas.width = (cropRect as any).w * scaleX;
      canvas.height = (cropRect as any).h * scaleY;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, (cropRect as any).x * scaleX, (cropRect as any).y * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

      const cropped = canvas.toDataURL('image/png');
      setImage(cropped);
      (data as any).image = cropped;
      setShowCrop(false);
      setCropRect(null);
      setCropStart(null);
    };
    img.src = image;
  }, [image, cropRect]);

  const floatingMenu = (
    <div
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 glass px-2 py-1.5 rounded-xl flex gap-1 items-center whitespace-nowrap"
      style={{ animation: 'fadeInUp 0.2s ease-out' }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setShowCrop(true); }}
        disabled={!image}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyber-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="裁剪"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21V7.7l-1.4 1A2 2 0 017 4h10a2 2 0 011.4 3.4L17 8v13" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setIsGenerating(true); handleGenerate(); }}
        disabled={!image || isGenerating}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyber-yellow transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="重绘"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setShowAnnotate(true); }}
        disabled={!image}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyber-magenta transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="标注"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <div className="w-px h-5 bg-white/20" />
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
        onClick={(e) => { e.stopPropagation(); setShowFullscreen(true); }}
        disabled={!image}
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
      className={`w-72 glass rounded-xl relative transition-all duration-300 ${isGenerating ? 'border-cyber-magenta shadow-[0_0_30px_rgba(255,0,255,0.3)]' : 'hover:shadow-[0_0_20px_rgba(0,245,255,0.2)]'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setShowCrop(false); setShowAnnotate(false); }}
    >
      <div className="h-full flex flex-col">
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-6 !h-6 !-left-3 !z-50 !bg-cyber-magenta !border-[3px] !border-white !shadow-[0_0_15px_#ff00ff] hover:!scale-150 hover:!shadow-[0_0_25px_#ff00ff] !transition-all !duration-200 flex items-center justify-center text-white font-bold text-xs"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          +
        </Handle>
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-6 !h-6 !-right-3 !z-50 !bg-cyber-cyan !border-[3px] !border-white !shadow-[0_0_15px_#00f5ff] hover:!scale-150 hover:!shadow-[0_0_25px_#00f5ff] !transition-all !duration-200 cursor-crosshair flex items-center justify-center text-white font-bold text-xs"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          +
        </Handle>

        {/* 悬浮菜单 */}
        {hover && image && floatingMenu}

        {/* 节点头部 */}
        <div className="px-4 py-3 bg-gradient-to-r from-cyber-cyan/10 to-transparent border-b border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 bg-cyber-cyan rounded-full shadow-[0_0_8px_#00f5ff] animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-cyber-cyan">
            NODE {id.slice(-4).toUpperCase()}
          </span>
          {isGenerating && (
            <div className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* 节点主体 */}
        <div className="p-4">

        {/* 图片区域 */}
        <div
          className={`w-full h-44 bg-black/30 rounded-lg overflow-hidden relative border transition-all duration-300 group ${image ? 'border-white/10' : 'border-dashed border-white/20 hover:border-cyber-cyan hover:bg-cyber-cyan/5'}`}
          onClick={() => !image && inputRef.current?.click()}
          ref={cropRef}
          onMouseMove={handleCropMouseMove}
          onMouseUp={handleCropMouseUp}
        >
          {image ? (
            <>
              <img
                ref={imageRef}
                src={image}
                alt="Uploaded or generated image"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {/* 替换图片悬浮层 */}
              <div
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
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
          ) : inheritImage ? (
            <div className="w-full h-full bg-black/50 rounded-md flex flex-col items-center justify-center">
              <img
                src={inheritImage}
                alt="Inherited image"
                className="w-24 h-24 object-cover rounded-md mb-2"
              />
              <p className="text-sm text-gray-300">继承自父节点</p>
            </div>
          ) : (
            <div
              className="w-full h-full bg-black/50 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <span className="text-3xl mb-2">⊕</span>
              <span className="text-xs">点击上传图片</span>
            </div>
          )}

          {/* 进度条 */}
          {isGenerating && (
            <>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-black/50">
                <div
                  className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-magenta shadow-[0_0_10px_#00f5ff] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {estimatedTime > 0 && (
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-[10px] text-cyber-cyan">
                  预计 {estimatedTime}s
                </div>
              )}
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        >
        </input>

        {/* 提示词输入 */}
        <textarea
          className="w-full mt-3 px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm outline-none resize-none focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.2)] placeholder:text-white/30"
          rows={2}
          placeholder="输入提示词生成新图像..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            (data as any).prompt = e.target.value;
          }}
        />

        {/* 设置折叠面板 */}
        <div className="mt-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-cyber-cyan transition-colors"
          >
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
            <span>高级设置</span>
            <span className="ml-2 text-[10px] opacity-60">
              {getResolutionLabel(resolution)} | {aspectRatio} | 强度 {Math.round(strength * 100)}%
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/5 space-y-3">
              {/* 分辨率选择 */}
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wider">分辨率</label>
                <div className="flex gap-2 mt-1">
                  {['1k', '2k', '4k'].map((res) => (
                    <button
                      key={res}
                      onClick={() => {
                        setResolution(res);
                        (data as any).resolution = res;
                      }}
                      className={`flex-1 py-1 px-2 text-[10px] rounded border transition-all ${resolution === res ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
                    >
                      {res.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* 图片比例选择 */}
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wider">图片比例</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { value: '1:1', label: '1:1' },
                    { value: '4:3', label: '4:3' },
                    { value: '16:9', label: '16:9' },
                    { value: '9:16', label: '9:16' }
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => {
                        setAspectRatio(ratio.value);
                        (data as any).aspectRatio = ratio.value;
                      }}
                      className={`flex-1 py-1 px-2 text-[10px] rounded border transition-all ${aspectRatio === ratio.value ? 'bg-cyber-magenta/20 border-cyber-magenta text-cyber-magenta' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 强度滑块 */}
              <div>
                <div className="flex justify-between">
                  <label className="text-[10px] text-white/50 uppercase tracking-wider">保留度</label>
                  <span className="text-[10px] text-cyber-cyan">{Math.round(strength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={strength * 100}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) / 100;
                    setStrength(val);
                    (data as any).strength = val;
                  }}
                  className="w-full mt-2 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyber-cyan [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_#00f5ff] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
                <div className="flex justify-between text-[9px] text-white/30 mt-1">
                  <span>创新</span>
                  <span>保留</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 节点底部 */}
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

        {/* 裁剪面板 */}
        {showCrop && image && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyber-cyan">裁剪图片</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCrop(false); setCropRect(null); setCropStart(null); }}
                  className="px-3 py-1 text-[10px] rounded-lg bg-white/10 text-white/60 hover:text-white transition-all"
                >
                  取消
                </button>
                <button
                  onClick={applyCrop}
                  disabled={!cropRect || (cropRect as any).w < 5}
                  className="px-3 py-1 text-[10px] rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  应用
                </button>
              </div>
            </div>
            <div
              className="flex-1 relative overflow-hidden rounded-lg cursor-crosshair"
              onMouseDown={handleCropMouseDown}
              onMouseUp={handleCropMouseUp}
              onMouseMove={handleCropMouseMove}
            >
              <img
                src={image}
                alt="Crop"
                className="w-full h-full object-contain"
              />
              {cropRect && (cropRect as any).w >= 5 && (cropRect as any).h >= 5 && (
                <div
                  className="absolute border-2 border-cyber-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                  style={{
                    left: (cropRect as any).x,
                    top: (cropRect as any).y,
                    width: (cropRect as any).w,
                    height: (cropRect as any).h,
                    boxShadow: '0 0 10px rgba(0,245,255,0.5)',
                    pointerEvents: 'none'
                  }}
                >
                  <div
                    className="absolute inset-0 bg-black/40"
                    style={{ clipPath: 'inset(0)' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 标注面板 */}
        {showAnnotate && image && <AnnotatePanel image={image} onDone={(img) => { setImage(img); (data as any).image = img; setShowAnnotate(false); }} onCancel={() => setShowAnnotate(false)} />}

        {/* 图片预览弹窗 */}
        {showFullscreen && image && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowFullscreen(false)}
          >
            <div className="relative max-w-[95vw] max-h-[95vh]">
              <img
                src={image}
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

// ========== 标注面板组件 ==========

function AnnotatePanel({ image, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const [annotations, setAnnotations] = useState([]);
  const [text, setText] = useState('');
  const [textPos, setTextPos] = useState(null);
  const [color, setColor] = useState('#ff00ff');

  // 画初始化图片
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = image;
  }, [image]);

  // 绘制已有标注
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 重绘图片
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      annotations.forEach(a => {
        if (a.type === 'text') {
          ctx.font = `bold ${a.size || 24}px sans-serif`;
          ctx.fillStyle = a.color;
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 4;
          ctx.fillText(a.text, a.x, a.y);
          ctx.shadowBlur = 0;
        }
      });
    };
    img.src = image;
  }, [annotations, image]);

  const handleCanvasClick = (e) => {
    if (!text.trim() || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setAnnotations(prev => [...prev, { type: 'text', text, x, y, color, size: Math.max(canvas.width / 30, 16) }]);
    setText('');
    setTextPos(null);
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    onDone(canvasRef.current.toDataURL('image/png'));
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-cyber-magenta">标注模式</span>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入标注文字..."
            className="px-3 py-1 text-xs bg-black/30 border border-white/10 rounded-lg text-white outline-none focus:border-cyber-magenta w-40"
          />
          <button
            onClick={handleExport}
            className="px-3 py-1 text-[10px] rounded-lg bg-cyber-magenta/20 border border-cyber-magenta/30 text-cyber-magenta hover:bg-cyber-magenta/30 transition-all"
          >
            完成
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 text-[10px] rounded-lg bg-white/10 text-white/60 hover:text-white transition-all"
          >
            取消
          </button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden rounded-lg" onClick={handleCanvasClick}>
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
        <div className="absolute bottom-2 left-2 text-[10px] text-white/30">
          点击图片添加标注
        </div>
      </div>
    </div>
  );
}

export default ImageNode;
