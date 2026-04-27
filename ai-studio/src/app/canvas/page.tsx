'use client';

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Upload, 
  Info, 
  Download, 
  Share2, 
  History, 
  Image as ImageIcon,
  Loader2,
  X,
  Maximize2,
  ChevronRight,
  Banana,
  Layers,
  Palette,
  Brain,
  ShieldAlert,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface ImageGenerationParams {
  prompt: string;
  negativePrompt: string[];
  customNegativePrompt: string;
  aspectRatio: string;
  imageSize: string;
  guidanceScale: number;
  mode: string;
  structureRef?: string;
  structureStrength: number;
  styleRef?: string;
  styleStrength: number;
  useGoogleSearch: boolean;
  useImageSearch: boolean;
}

interface GenerationResult {
  imageUrl: string;
  status: string;
  error?: string;
  revisedPrompt?: string;
  params?: {
    structureStrength: number;
    styleStrength: number;
    guidanceScale: number;
  };
}

interface HistoryItem {
  imageUrl: string;
  revisedPrompt?: string;
  params: {
    structureStrength: number;
    styleStrength: number;
    guidanceScale: number;
  };
}

const NEGATIVE_TAGS = [
  { id: 'messy', label: '拒绝杂乱线条', prompt: 'messy lines, extra lines' },
  { id: 'watermark', label: '去除水印', prompt: 'watermark, text, signature' },
  { id: '2d', label: '拒绝 2D 感', prompt: 'flat, 2d, illustration, cartoon' },
  { id: 'blurry', label: '修复模糊', prompt: 'blurry, low quality, pixelated' },
  { id: 'deform', label: '畸变矫正', prompt: 'deformed, distorted, warped' },
];

const PRESETS: { id: string; label: string; desc: string; defaults: Partial<ImageGenerationParams> }[] = [
  { 
    id: 'generic', 
    label: '标准模式', 
    desc: '通用图像生成', 
    defaults: { structureStrength: 0.5, styleStrength: 0.6, guidanceScale: 7.5 } 
  },
  { 
    id: 'cad_to_3d', 
    label: 'CAD 转 3D', 
    desc: '线稿精准建模', 
    defaults: { structureStrength: 0.8, guidanceScale: 9, negativePrompt: ['messy'] } 
  },
  { 
    id: 'su_render', 
    label: 'SU 高清渲染', 
    desc: '建筑方案表达', 
    defaults: { structureStrength: 0.95, guidanceScale: 7, negativePrompt: ['2d'] } 
  },
  { 
    id: 'furniture_swap', 
    label: '家具替换', 
    desc: '室内局部软装', 
    defaults: { structureStrength: 0.4, styleStrength: 0.8, guidanceScale: 8 } 
  },
];

// Components
const UploadBox = React.forwardRef<HTMLInputElement, { 
  image?: string, 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onClear: () => void 
}>(({ image, onUpload, onClear }, ref) => (
  <div 
    onClick={() => !image && (ref as any).current?.click()}
    className="upload-box h-24 relative group overflow-hidden"
  >
    {image ? (
      <div className="relative w-full h-full">
        <img src={image} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        <button 
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-full">
        <Upload className="w-5 h-5 text-[#666] mb-1" />
        <span className="text-[10px] text-[#666]">点击上传图像</span>
      </div>
    )}
    <input type="file" ref={ref} onChange={onUpload} accept="image/*" className="hidden" />
  </div>
));

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-zinc-800 text-[10px] text-zinc-300 rounded-lg shadow-2xl border border-zinc-700 pointer-events-none leading-relaxed"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-zinc-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CanvasPage() {
  const [params, setParams] = useState<ImageGenerationParams>({
    prompt: "",
    negativePrompt: [],
    customNegativePrompt: "",
    aspectRatio: "1:1",
    imageSize: "1K",
    guidanceScale: 7.5,
    mode: "generic",
    structureRef: undefined,
    structureStrength: 0.9,
    styleRef: undefined,
    styleStrength: 0.6,
    useGoogleSearch: false,
    useImageSearch: false,
  });

  const [result, setResult] = useState<GenerationResult>({
    imageUrl: "",
    status: "idle",
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const structureInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
          const selected = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        }
      } catch (e) {
        console.error("Failed to check API key status", e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (typeof (window as any).aistudio?.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleFileUpload = (type: 'structure' | 'style') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setParams(prev => ({ 
          ...prev, 
          [type === 'structure' ? 'structureRef' : 'styleRef']: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setParams(prev => ({ 
        ...prev, 
        mode: presetId,
        ...preset.defaults 
      }));
    }
  };

  const handleGenerate = async () => {
    if (!params.prompt) return;
    setResult({ ...result, status: "generating", error: undefined });
    try {
      // Mock API call for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockImageUrl = `https://picsum.photos/seed/${Date.now()}/1024/1024`;
      const newResult: GenerationResult = {
        imageUrl: mockImageUrl,
        revisedPrompt: params.prompt,
        status: "success",
        params: {
          structureStrength: params.structureStrength,
          styleStrength: params.styleStrength,
          guidanceScale: params.guidanceScale,
        }
      };
      
      setResult(newResult);
      
      if (newResult.imageUrl && newResult.params) {
        setHistory(prev => [{
          imageUrl: newResult.imageUrl,
          revisedPrompt: newResult.revisedPrompt,
          params: newResult.params!
        }, ...prev.slice(0, 9)]);
      }
    } catch (err: any) {
      const errorMsg = err.message || "";
      if (errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
      setResult({
        ...result,
        status: "error",
        error: errorMsg || "生成失败，请重试。",
      });
    }
  };

  const toggleTag = (tagId: string) => {
    setParams(prev => ({
      ...prev,
      negativePrompt: prev.negativePrompt.includes(tagId)
        ? prev.negativePrompt.filter(id => id !== tagId)
        : [...prev.negativePrompt, tagId]
    }));
  };

  const getFidelityLabel = (val: number) => {
    if (val < 0.4) return "自由创作";
    if (val < 0.8) return "平衡创作";
    return "精准还原";
  };

  const getGuidanceLabel = (val: number) => {
    if (val < 6) return "浪漫创意";
    if (val < 10) return "平衡稳健";
    return "严格遵循";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-zinc-950 text-[#e0e0e0]">
      <AnimatePresence>
        {!hasApiKey && !isCheckingKey && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full glass-card h-auto p-8 text-center space-y-6 border-yellow-500/20">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl mx-auto flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">需要专业版授权</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Nano Banana 2 (Gemini 3.1 Flash Image) 属于高精尖模型，需要您选择一个已开启计费的 API Key 才能释放全部性能。
                </p>
              </div>
              <div className="pt-2">
                <button 
                  onClick={handleSelectKey}
                  className="banana-btn btn-primary w-full py-4 text-base shadow-[0_0_30px_rgba(255,225,53,0.2)]"
                >
                  配合 API Key 以开始
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-block mt-4 text-[10px] text-zinc-600 hover:text-zinc-400 underline underline-offset-4"
                >
                  了解关于计费与 API Key 的详细信息
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-[340px] flex-shrink-0 border-r border-[#2a2a2a] bg-zinc-900 p-5 flex flex-col gap-0 overflow-y-auto overflow-x-hidden">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-bold text-xl">
            B
          </div>
          <h1 className="text-lg font-bold tracking-[1px] text-white uppercase">
            Nano Banana 2
          </h1>
        </header>

        {/* Prompt Input */}
        <section className="mb-4">
          <div className="section-header">输入提示词</div>
          <textarea
            className="input-field min-h-[90px] text-sm"
            placeholder="描述你想看到的景象..."
            value={params.prompt}
            onChange={(e) => setParams(prev => ({ ...prev, prompt: e.target.value }))}
          />
        </section>

        {/* Core Mode Selection */}
        <section className="mb-4">
          <div className="section-header">核心预设模式</div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  params.mode === p.id 
                  ? 'border-yellow-500 bg-yellow-500/10' 
                  : 'border-[#333] bg-[#1e1e1e] hover:border-zinc-500'
                }`}
              >
                <div className={`text-[11px] font-bold ${params.mode === p.id ? 'text-yellow-500' : 'text-zinc-300'}`}>{p.label}</div>
                <div className="text-[9px] text-[#666] leading-tight">{p.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Double Upload Boxes */}
        <section className="mb-4">
          <div className="section-header">图像参考控制</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pr-1">
                <span className="text-[11px] text-[#ccc]">结构/线稿</span>
                <Tooltip text="用于控制几何轮廓。建议上传CAD线稿或SU白模图。">
                  <Info className="w-3 h-3 text-yellow-500 cursor-help" />
                </Tooltip>
              </div>
              <UploadBox 
                ref={structureInputRef} 
                image={params.structureRef} 
                onUpload={handleFileUpload('structure')}
                onClear={() => setParams({...params, structureRef: undefined})}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pr-1">
                <span className="text-[11px] text-[#ccc]">风格参考</span>
                <Tooltip text="用于控制色彩、光影和材质风格。">
                  <Info className="w-3 h-3 text-yellow-500 cursor-help" />
                </Tooltip>
              </div>
              <UploadBox 
                ref={styleInputRef} 
                image={params.styleRef} 
                onUpload={handleFileUpload('style')}
                onClear={() => setParams({...params, styleRef: undefined})}
              />
            </div>
          </div>
        </section>

        {/* Dynamic Sliders */}
        <section className="space-y-4 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[13px] text-[#ccc]">还原度 (Structure)</label>
              <span className="text-[12px] font-mono text-yellow-500">{getFidelityLabel(params.structureStrength)}</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={params.structureStrength} 
              onChange={(e) => setParams({...params, structureStrength: parseFloat(e.target.value)})}
              className="sleek-slider"
            />
            <div className="text-[11px] text-[#666] leading-tight">决定最终生成在多大程度上保留参考图的几何结构。</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[13px] text-[#ccc]">风格浸染 (Style)</label>
              <span className="text-[12px] font-mono text-yellow-500">{Math.round(params.styleStrength * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={params.styleStrength} 
              onChange={(e) => setParams({...params, styleStrength: parseFloat(e.target.value)})}
              className="sleek-slider"
            />
            <div className="text-[11px] text-[#666] leading-tight">决定参考图的色彩和质感对画面的影响深度。</div>
          </div>
        </section>

        {/* Negative Tag Cloud */}
        <section className="mb-4">
          <div className="section-header">一键避雷 (Negative)</div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {NEGATIVE_TAGS.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] border transition-all ${
                  params.negativePrompt.includes(tag.id)
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-[#1e1e1e] border-[#333] text-[#888] hover:border-zinc-500'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </section>

        {/* Advanced Area */}
        <section className="mb-4">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-[11px] text-[#888] hover:text-white transition-colors uppercase tracking-[1px]"
          >
            高级生成参数 (Advanced)
            <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4 pt-3"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[13px] text-[#ccc]">AI 脑洞 (Guidance)</label>
                    <span className="text-[12px] font-mono text-yellow-500">{params.guidanceScale}</span>
                  </div>
                  <input 
                    type="range" min="3" max="15" step="0.5" 
                    value={params.guidanceScale} 
                    onChange={(e) => setParams({...params, guidanceScale: parseFloat(e.target.value)})}
                    className="sleek-slider"
                  />
                  <div className="text-[11px] text-[#666] leading-tight flex justify-between">
                    <span>{getGuidanceLabel(params.guidanceScale)}</span>
                    <span className="font-mono">Range: 3-15</span>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="text-[12px] text-[#ccc]">宽高比选择</div>
                  <div className="flex bg-[#1e1e1e] border border-[#333] rounded-lg p-0.5 gap-0.5">
                    {["1:1", "16:9", "9:16"].map(ratio => (
                      <button 
                        key={ratio}
                        onClick={() => setParams({...params, aspectRatio: ratio})}
                        className={`px-3 py-1 text-[10px] rounded-md transition-all ${params.aspectRatio === ratio ? 'bg-zinc-700 text-white' : 'text-[#666]'}`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] text-[#888]">自定义排除项</label>
                  <input 
                    className="input-field text-[11px] py-1.5" 
                    placeholder="例如：ugly, blurry, lowres..." 
                    value={params.customNegativePrompt}
                    onChange={(e) => setParams({ ...params, customNegativePrompt: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Action Buttons */}
        <section className="mt-auto pt-4 flex gap-2">
          <button
            onClick={() => setParams({
              prompt: "",
              negativePrompt: [],
              customNegativePrompt: "",
              aspectRatio: "1:1",
              imageSize: "1K",
              guidanceScale: 7.5,
              mode: "generic",
              structureStrength: 0.9,
              styleStrength: 0.6,
              useGoogleSearch: false,
              useImageSearch: false,
            })}
            className="banana-btn btn-secondary text-sm"
          >
            重置
          </button>
          <button
            disabled={!params.prompt || result.status === "generating"}
            onClick={handleGenerate}
            className={`banana-btn btn-primary flex-1 flex items-center justify-center gap-2 
              ${(!params.prompt || result.status === "generating") ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {result.status === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                铸造中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                立即生成方案
              </>
            )}
          </button>
        </section>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 bg-zinc-950 flex flex-col p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#1e1e1e_0%,#0f0f0f_100%)]" />
        </div>

        <header className="flex justify-between items-center mb-6 z-10">
          <div className="text-sm text-[#888]">
            渲染分辨率: <span className="text-[#ccc]">{params.imageSize === "1K" ? "1024 x 1024" : "1536 x 1536"}</span> | 
            实时渲染模式: <span className="text-[#ccc] uppercase">{params.mode}</span>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <button 
                onClick={() => setResult({ ...result, status: "idle" })}
                className="banana-btn btn-secondary text-[12px] py-1 px-3"
              >
                新建画布
              </button>
            )}
            {result.imageUrl && (
              <a 
                href={result.imageUrl} 
                download="nano-banana.png"
                className="banana-btn btn-secondary text-[12px] py-1 px-3 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                导出 4K
              </a>
            )}
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center relative z-10 min-h-0">
          <div className="w-[560px] h-[560px] max-w-full max-h-full bg-black rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#2a2a2a] overflow-hidden flex items-center justify-center relative group">
            <AnimatePresence mode="wait">
              {result.status === "idle" ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="text-zinc-800 font-black text-6xl uppercase tracking-tighter opacity-10 rotate-[-30deg] select-none pointer-events-none">
                    Nano Banana
                  </div>
                  <p className="text-[#666] text-xs absolute bottom-1/2 left-0 right-0 translate-y-1/2">等待输入指令以开始渲染...</p>
                </motion.div>
              ) : result.status === "generating" ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-32 h-32 rounded-full border-4 border-zinc-800 border-t-yellow-500 animate-spin" />
                  <p className="text-zinc-500 text-sm animate-pulse">正在实时渲染 72%...</p>
                </motion.div>
              ) : result.imageUrl ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full relative"
                >
                  <img 
                    src={result.imageUrl} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Parameter Labels Overlay */}
                  {result.params && (
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
                      <div className="bg-black/40 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] flex items-center gap-2">
                        <span className="text-zinc-400">还原度</span>
                        <span className="text-yellow-500 font-mono">{Math.round(result.params.structureStrength * 100)}%</span>
                      </div>
                      <div className="bg-black/40 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] flex items-center gap-2">
                        <span className="text-zinc-400">风格浸染</span>
                        <span className="text-yellow-500 font-mono">{Math.round(result.params.styleStrength * 100)}%</span>
                      </div>
                      <div className="bg-black/40 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] flex items-center gap-2">
                        <span className="text-zinc-400">AI 脑洞</span>
                        <span className="text-yellow-500 font-mono">{result.params.guidanceScale}</span>
                      </div>
                    </div>
                  )}

                  {result.revisedPrompt && (
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 backdrop-blur-md border-t border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-zinc-400 mb-1 font-mono uppercase">AI Optimized Context</p>
                      <p className="text-[12px] text-white line-clamp-2">{result.revisedPrompt}</p>
                    </div>
                  )}
                </motion.div>
              ) : result.status === "error" ? (
                <div className="text-center p-6">
                  <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-500 font-bold mb-1">生成失败</p>
                  <p className="text-zinc-500 text-[11px] leading-snug max-w-[240px]">{result.error}</p>
                </div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Status Bar Floating */}
          {result.status === "generating" && (
            <div className="absolute bottom-10 glass-status z-20">
              <div className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_10px_#ffe135]" />
              <span className="max-w-[300px] truncate">正在生成: {params.prompt}</span>
              <span className="text-[#888] ml-2">预估剩余: 4.2s</span>
            </div>
          )}
        </section>

        {/* History Strip */}
        <footer className="mt-8 z-10">
          {history.length > 0 && (
            <>
              <div className="section-header !mt-0 !mb-4">历史创作足迹</div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                {history.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => setResult({ 
                      imageUrl: item.imageUrl, 
                      revisedPrompt: item.revisedPrompt,
                      params: item.params,
                      status: "success" 
                    })}
                    className="w-20 h-20 rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-yellow-500 transition-all flex-shrink-0 bg-black group"
                  >
                    <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </>
          )}
        </footer>
      </main>
    </div>
  );
}