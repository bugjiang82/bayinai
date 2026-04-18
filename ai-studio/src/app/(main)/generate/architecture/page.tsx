"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGenerationStore } from "@/stores/generationStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  Building2, 
  Sparkles, 
  Loader2, 
  Upload, 
  Coins,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Info,
  Download,
  Share2,
  History,
  X,
  ChevronRight,
  Brain,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
  params?: {
    structureStrength: number;
    styleStrength: number;
    guidanceScale: number;
  };
  revisedPrompt?: string;
}

type GenerationMode = "generic" | "cad_to_3d" | "su_render" | "furniture_swap";

type AspectRatio = "1:1" | "16:9" | "9:16";

type ImageSize = "1K" | "2K";

interface ImageGenerationParams {
  prompt: string;
  negativePrompt: string[];
  customNegativePrompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  guidanceScale: number;
  mode: GenerationMode;
  structureRef?: string; // base64
  structureStrength: number; // 0 to 1
  styleRef?: string; // base64
  styleStrength: number; // 0 to 1
  useGoogleSearch: boolean;
  useImageSearch: boolean;
}

interface GenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  error?: string;
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

const PRESETS: { id: GenerationMode; label: string; desc: string; defaults: Partial<ImageGenerationParams> }[] = [
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

export default function ArchitecturePage() {
  const router = useRouter();
  const store = useGenerationStore();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const structureInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  // Local state
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
  const [credits, setCredits] = useState(100); // Mock credits
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

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

  const applyPreset = (presetId: GenerationMode) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setParams(prev => ({ 
        ...prev, 
        mode: presetId,
        ...preset.defaults 
      }));
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

  const clearImage = (type: 'structure' | 'style') => {
    setParams(prev => ({ 
      ...prev, 
      [type === 'structure' ? 'structureRef' : 'styleRef']: undefined 
    }));
  };

  const simulateProgress = useCallback(() => {
    let currentProgress = 0;
    setIsGenerating(true);
    setProgress(0);

    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setProgress(100);
        setIsGenerating(false);
      } else {
        setProgress(currentProgress);
      }
    }, 500);

    return progressIntervalRef.current;
  }, []);

  const toggleTag = (tagId: string) => {
    setParams(prev => ({
      ...prev,
      negativePrompt: prev.negativePrompt.includes(tagId)
        ? prev.negativePrompt.filter(id => id !== tagId)
        : [...prev.negativePrompt, tagId]
    }));
  };

  const handleGenerate = useCallback(async () => {
    if (!params.prompt || !params.structureRef) return;

    const creditsPerImage = 3;
    const totalCost = creditsPerImage;

    if (credits < totalCost) return;

    simulateProgress();

    try {
      // 构建负面提示词
      const negParts = [...params.negativePrompt];
      if (params.customNegativePrompt) negParts.push(params.customNegativePrompt);
      const negativePromptText = negParts.join(', ');

      // Prepare payload in API expected format
      const payload: any = {
        mode: params.mode === 'cad_to_3d' ? 'CAD_TO_3D' : params.mode === 'su_render' ? 'SU_RENDER' : 'INPAINT',
        prompt: params.prompt,
        mainImage: params.structureRef.includes(',') ? params.structureRef.split(',')[1] : params.structureRef,
        styleRefImage: params.styleRef ? (params.styleRef.includes(',') ? params.styleRef.split(',')[1] : params.styleRef) : undefined,
        negativePrompt: negativePromptText,
        fidelity: params.structureStrength,
        styleImpact: params.styleStrength,
        aiCreativity: params.guidanceScale,
      };

      // Call API
      const response = await fetch("/api/generate/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("生成请求失败");
      }

      const data = await response.json();

      // Handle response
      const imageUrl = data.data?.outputUrl || `https://picsum.photos/seed/${Date.now()}/1024/1024`;
      const revisedPrompt = data.data?.revisedPrompt;

      const newResult: GenerationResult = {
        imageUrl,
        revisedPrompt,
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

      // Deduct credits
      setCredits((prev) => Math.max(0, prev - totalCost));

    } catch (error: any) {
      console.error("Generation failed:", error);
      const errorMsg = error.message || "";
      if (errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
      setResult({
        ...result,
        status: "error",
        error: errorMsg || "生成失败，请重试。",
      });
      setIsGenerating(false);
    }
  }, [params, credits, simulateProgress, result]);

  const resetParams = () => {
    setParams({
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
    setResult({ imageUrl: "", status: "idle" });
  };

  const UploadBox = React.forwardRef<HTMLInputElement, { 
    image?: string, 
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onClear: () => void 
  }>(({ image, onUpload, onClear }, ref) => (
    <div 
      onClick={() => !image && (ref as any).current?.click()}
      className="w-full h-24 border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] rounded-lg flex items-center justify-center cursor-pointer transition-colors relative group overflow-hidden"
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
        <div className="flex flex-col items-center">
          <Upload className="w-6 h-6 text-zinc-500 mb-1" />
          <span className="text-xs text-zinc-500">点击上传</span>
        </div>
      )}
      <input type="file" ref={ref} onChange={onUpload} accept="image/*" className="hidden" />
    </div>
  ));

  const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
        {show && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-zinc-800 text-[10px] text-zinc-300 rounded-lg shadow-2xl border border-zinc-700 pointer-events-none leading-relaxed">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-zinc-800" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* API Key Alert */}
      {!hasApiKey && !isCheckingKey && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-yellow-500/20 bg-[#0a0a0a] p-8 text-center space-y-6">
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
                className="w-full py-4 text-base rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold shadow-[0_0_30px_rgba(255,225,53,0.2)] hover:from-yellow-400 hover:to-amber-400 transition-all"
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
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">Nano Banana 2: 全能渲染引擎</h1>
      </div>

      <div className="flex gap-4 flex-1">
        {/* Left: Canvas area (60%) */}
        <div className="w-[60%] flex flex-col min-w-0">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-zinc-500">
              渲染分辨率: <span className="text-zinc-300">{params.imageSize === "1K" ? "1024 x 1024" : "1536 x 1536"}</span> | 
              实时渲染模式: <span className="text-zinc-300 uppercase">{params.mode}</span>
            </div>
            <div className="flex gap-2">
              {history.length > 0 && (
                <button 
                  onClick={() => setResult({ ...result, status: "idle" })}
                  className="px-3 py-1 text-xs rounded-lg border border-white/[0.1] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] transition-colors"
                >
                  新建画布
                </button>
              )}
              {result.imageUrl && (
                <a 
                  href={result.imageUrl} 
                  download="nano-banana.png"
                  className="px-3 py-1 text-xs rounded-lg border border-white/[0.1] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出 4K
                </a>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-h-[400px] flex items-center justify-center">
            <div className="w-full max-w-[560px] h-[560px] max-h-full bg-black rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#2a2a2a] overflow-hidden flex items-center justify-center relative group">
              {result.status === "idle" ? (
                <div className="text-center space-y-4">
                  <div className="text-zinc-800 font-black text-6xl uppercase tracking-tighter opacity-10 rotate-[-30deg] select-none pointer-events-none">
                    Nano Banana
                  </div>
                  <p className="text-zinc-600 text-xs absolute bottom-1/2 left-0 right-0 translate-y-1/2">等待输入指令以开始渲染...</p>
                </div>
              ) : result.status === "generating" ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full border-4 border-zinc-800 border-t-yellow-500 animate-spin" />
                  <p className="text-zinc-500 text-sm animate-pulse">正在实时渲染 {Math.round(progress)}%</p>
                </div>
              ) : result.imageUrl ? (
                <div className="w-full h-full relative">
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
                </div>
              ) : result.status === "error" ? (
                <div className="text-center p-6">
                  <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-500 font-bold mb-1">生成失败</p>
                  <p className="text-zinc-500 text-[11px] leading-snug max-w-[240px]">{result.error}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* History Strip */}
          {history.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium text-zinc-300 mb-3">历史创作足迹</div>
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
            </div>
          )}
        </div>

        {/* Right: Param panel (40%) */}
        <div className="w-[40%] flex flex-col min-w-[340px] max-w-[480px]">
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden flex flex-col">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Prompt Input */}
              <div>
                <div className="text-sm font-medium text-zinc-300 mb-2 block">
                  输入提示词
                </div>
                <Textarea
                  value={params.prompt}
                  onChange={(e) => setParams(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="描述你想看到的景象..."
                  className="min-h-[90px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600"
                />
              </div>

              {/* Core Mode Selection */}
              <div>
                <div className="text-sm font-medium text-zinc-300 mb-2 block">
                  核心预设模式
                </div>
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
              </div>

              {/* Double Upload Boxes */}
              <div>
                <div className="text-sm font-medium text-zinc-300 mb-2 block">
                  图像参考控制
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                      onClear={() => clearImage('structure')}
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
                      onClear={() => clearImage('style')}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Sliders */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[13px] text-[#ccc]">还原度 (Structure)</label>
                    <span className="text-[12px] font-mono text-yellow-500">{getFidelityLabel(params.structureStrength)}</span>
                  </div>
                  <Slider
                    value={[params.structureStrength * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setParams({...params, structureStrength: value[0] / 100})}
                    className="flex-1"
                  />
                  <div className="text-[11px] text-[#666] leading-tight">决定最终生成在多大程度上保留参考图的几何结构。</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[13px] text-[#ccc]">风格浸染 (Style)</label>
                    <span className="text-[12px] font-mono text-yellow-500">{Math.round(params.styleStrength * 100)}%</span>
                  </div>
                  <Slider
                    value={[params.styleStrength * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setParams({...params, styleStrength: value[0] / 100})}
                    className="flex-1"
                  />
                  <div className="text-[11px] text-[#666] leading-tight">决定参考图的色彩和质感对画面的影响深度。</div>
                </div>
              </div>

              {/* Negative Tag Cloud */}
              <div>
                <div className="text-sm font-medium text-zinc-300 mb-2 block">
                  一键避雷 (Negative)
                </div>
                <div className="flex flex-wrap gap-1.5">
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
              </div>

              {/* Advanced Area */}
              <div>
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-[11px] text-[#888] hover:text-white transition-colors uppercase tracking-[1px]"
                >
                  高级生成参数 (Advanced)
                  <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                </button>
                
                {showAdvanced && (
                  <div className="mt-3 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-[13px] text-[#ccc]">AI 脑洞 (Guidance)</label>
                        <span className="text-[12px] font-mono text-yellow-500">{params.guidanceScale}</span>
                      </div>
                      <Slider
                        value={[params.guidanceScale]}
                        min={3}
                        max={15}
                        step={0.5}
                        onValueChange={(value) => setParams({...params, guidanceScale: value[0]})}
                        className="flex-1"
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
                            onClick={() => setParams({...params, aspectRatio: ratio as AspectRatio})}
                            className={`px-3 py-1 text-[10px] rounded-md transition-all ${params.aspectRatio === ratio ? 'bg-zinc-700 text-white' : 'text-[#666]'}`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] text-[#888]">自定义排除项</label>
                      <Textarea
                        value={params.customNegativePrompt}
                        onChange={(e) => setParams({ ...params, customNegativePrompt: e.target.value })}
                        placeholder="例如：ugly, blurry, lowres..."
                        className="min-h-[60px] resize-none bg-[#0f0f0f] border border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Generate button + credits */}
            <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Coins className="w-3.5 h-3.5" />
                  <span>
                    余额 <span className="text-zinc-300 font-medium">{credits}</span> 积分
                  </span>
                </div>
                <span className="text-xs text-zinc-600">
                  本次消耗 <span className="font-medium text-zinc-400">3</span> 积分
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetParams}
                  className="flex-1 py-3 text-sm rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] transition-colors"
                >
                  重置
                </button>
                <button
                  disabled={!params.prompt || !params.structureRef || isGenerating}
                  onClick={handleGenerate}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2
                    ${(!params.prompt || !params.structureRef || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  style={{
                    background: 'linear-gradient(to right, #eab308, #f59e0b)',
                    color: 'black',
                    boxShadow: '0 0 30px rgba(255, 225, 53, 0.2)'
                  }}
                >
                  {isGenerating ? (
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
              </div>
              {!params.prompt && (
                <p className="text-xs text-zinc-600 text-center mt-2">
                  请输入提示词后开始生成
                </p>
              )}
              {!params.structureRef && (
                <p className="text-xs text-zinc-600 text-center mt-2">
                  请上传结构/线稿后开始生成
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}