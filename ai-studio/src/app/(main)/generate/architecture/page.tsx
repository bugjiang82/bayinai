"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGenerationStore } from "@/stores/generationStore";
import Canvas from "@/components/generate/Canvas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2, 
  Sparkles, 
  Loader2, 
  Upload, 
  Coins,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
}

export default function ArchitecturePage() {
  const router = useRouter();
  const store = useGenerationStore();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Local state
  const [mode, setMode] = useState<"CAD_TO_3D" | "SU_RENDER" | "INPAINT">('CAD_TO_3D');
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [styleRefImage, setStyleRefImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [baseRendered, setBaseRendered] = useState<string | null>(null);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [credits, setCredits] = useState(100); // Mock credits
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // UI 组件状态
  const [fidelity, setFidelity] = useState(90); // 还原度 (对应 structure_strength)
  const [styleImpact, setStyleImpact] = useState(60); // 风格浸染 (对应 style_strength)
  const [aiCreativity, setAiCreativity] = useState(7.5); // AI 脑洞 (对应 guidance_scale)
  const [avoidFeatures, setAvoidFeatures] = useState<string[]>(['watermark', 'text', 'flat', '2d', 'messy lines']); // 一键避雷
  
  // 预设模式配置
  const modePresets = {
    CAD_TO_3D: { fidelity: 75, styleImpact: 60, aiCreativity: 7.5 },
    SU_RENDER: { fidelity: 95, styleImpact: 50, aiCreativity: 6.0 },
    INPAINT: { fidelity: 85, styleImpact: 70, aiCreativity: 8.0 }
  };
  
  // 当模式改变时，应用预设
  useEffect(() => {
    const preset = modePresets[mode];
    setFidelity(preset.fidelity);
    setStyleImpact(preset.styleImpact);
    setAiCreativity(preset.aiCreativity);
  }, [mode]);

  // File upload handlers
  const handleFileUpload = useCallback((setter: (value: string | null) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target?.result as string;
          setter(base64Data);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  }, []);

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

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !mainImage) return;

    const creditsPerImage = 3; // Architecture generation costs more
    const totalCost = creditsPerImage;

    if (credits < totalCost) return;

    simulateProgress();

    try {
      // 构建负面提示词
      const negativePromptText = negativePrompt || avoidFeatures.join(', ');
      
      // Prepare payload based on mode
      const payload: any = {
        mode,
        prompt: prompt.trim(),
        mainImage: mainImage.split(',')[1], // Remove data URL prefix
        negativePrompt: negativePromptText,
        fidelity: fidelity / 100, // 转换为 0-1
        styleImpact: styleImpact / 100, // 转换为 0-1
        aiCreativity: aiCreativity,
      };

      if (styleRefImage) {
        payload.styleRefImage = styleRefImage.split(',')[1];
      }

      if (mode === 'INPAINT' && maskImage && baseRendered) {
        payload.maskImage = maskImage.split(',')[1];
        payload.baseRendered = baseRendered.split(',')[1];
      }

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
      const resultImages: CanvasImage[] = data.data?.outputUrl
        ? [{
            id: `${Date.now()}`,
            url: data.data.outputUrl,
            prompt: prompt.trim(),
          }]
        : // Mock fallback
          [{
            id: `${Date.now()}`,
            url: `https://picsum.photos/seed/${Date.now()}/1024/1024`,
            prompt: prompt.trim(),
          }];

      setImages(resultImages);

      // Deduct credits
      setCredits((prev) => Math.max(0, prev - totalCost));

    } catch (error) {
      console.error("Generation failed:", error);
      setIsGenerating(false);
    }
  }, [prompt, mainImage, styleRefImage, maskImage, baseRendered, mode, credits, simulateProgress, negativePrompt, avoidFeatures, fidelity, styleImpact, aiCreativity]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">图像生成大冒险：全能渲染引擎</h1>
      </div>

      <div className="flex gap-4 flex-1">
        {/* Left: Canvas area (60%) */}
        <div className="w-[60%] flex flex-col min-w-0">
          <div className="flex-1 min-h-[400px]">
            <Canvas
              images={images}
              isGenerating={isGenerating}
              progress={progress}
              onImageAction={(action, image) => {
                if (action === "use-as-reference") {
                  router.push(`/generate/image-to-image?ref=${encodeURIComponent(image.url)}`);
                }
              }}
            />
          </div>
        </div>

        {/* Right: Param panel (40%) */}
        <div className="w-[40%] flex flex-col min-w-[340px] max-w-[480px]">
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden flex flex-col">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Mode selection */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  渲染模式
                </label>
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                  <TabsList className="w-full grid grid-cols-3 bg-white/[0.04]">
                    <TabsTrigger value="CAD_TO_3D" className="text-xs">
                      CAD转3D
                    </TabsTrigger>
                    <TabsTrigger value="SU_RENDER" className="text-xs">
                      SU高清渲染
                    </TabsTrigger>
                    <TabsTrigger value="INPAINT" className="text-xs">
                      局部材质重绘
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="CAD_TO_3D" className="mt-4">
                    <p className="text-xs text-zinc-400 mb-4">
                      上传CAD平面图，AI将自动转换为3D效果图
                    </p>
                  </TabsContent>
                  <TabsContent value="SU_RENDER" className="mt-4">
                    <p className="text-xs text-zinc-400 mb-4">
                      上传SketchUp白模，AI将进行高清渲染
                    </p>
                  </TabsContent>
                  <TabsContent value="INPAINT" className="mt-4">
                    <p className="text-xs text-zinc-400 mb-4">
                      上传渲染底图和遮罩，AI将重绘指定区域
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Prompt */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  提示词
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想要的效果，越详细越好..."
                  className="min-h-[100px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600"
                />
              </div>

              {/* 图像上传区域 */}
              <div className="space-y-4">
                {/* 结构/线稿 */}
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    结构/线稿
                  </label>
                  <div
                    className="w-full h-24 border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    onClick={() => handleFileUpload(setMainImage)}
                  >
                    {mainImage ? (
                      <div className="relative w-full h-full rounded-lg overflow-hidden">
                        <img 
                          src={mainImage} 
                          alt="结构/线稿" 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-xs text-white">已上传</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                        <span className="text-xs text-zinc-500">点击上传</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 风格参考 */}
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    风格参考（可选）
                  </label>
                  <div
                    className="w-full h-20 border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    onClick={() => handleFileUpload(setStyleRefImage)}
                  >
                    {styleRefImage ? (
                      <div className="relative w-full h-full rounded-lg overflow-hidden">
                        <img 
                          src={styleRefImage} 
                          alt="风格参考" 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-xs text-white">已上传</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                        <span className="text-xs text-zinc-500">点击上传</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inpaint specific inputs */}
                {mode === 'INPAINT' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-300 mb-2 block">
                        遮罩图像
                      </label>
                      <div
                        className="w-full h-20 border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        onClick={() => handleFileUpload(setMaskImage)}
                      >
                        {maskImage ? (
                          <div className="relative w-full h-full rounded-lg overflow-hidden">
                            <img 
                              src={maskImage} 
                              alt="遮罩图像" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-xs text-white">已上传</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                            <span className="text-xs text-zinc-500">点击上传</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-zinc-300 mb-2 block">
                        渲染底图
                      </label>
                      <div
                        className="w-full h-20 border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        onClick={() => handleFileUpload(setBaseRendered)}
                      >
                        {baseRendered ? (
                          <div className="relative w-full h-full rounded-lg overflow-hidden">
                            <img 
                              src={baseRendered} 
                              alt="渲染底图" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-xs text-white">已上传</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-5 h-5 text-zinc-500 mb-1" />
                            <span className="text-xs text-zinc-500">点击上传</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 核心参数设置 */}
              <div className="space-y-4">
                {/* 还原度滑块 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-300">
                      还原度
                    </label>
                    <span className="text-xs text-zinc-400">{fidelity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[fidelity]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setFidelity(value[0])}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>自由创作</span>
                    <span>精准还原</span>
                  </div>
                </div>

                {/* 风格浸染滑块 */}
                {styleRefImage && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-300">
                        风格浸染
                      </label>
                      <span className="text-xs text-zinc-400">{styleImpact}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[styleImpact]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setStyleImpact(value[0])}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      决定你的方案在多大程度上长得像参考图
                    </p>
                  </div>
                )}
              </div>

              {/* Advanced settings */}
              <div>
                <button
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors w-full cursor-pointer"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  高级设置
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    {/* AI 脑洞拨杆 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-zinc-300">
                          AI 脑洞
                        </label>
                        <span className="text-xs text-zinc-400">{aiCreativity}</span>
                      </div>
                      <Slider
                        value={[aiCreativity]}
                        min={3}
                        max={15}
                        step={0.5}
                        onValueChange={(value) => setAiCreativity(value[0])}
                      />
                      <div className="flex justify-between text-xs text-zinc-500 mt-1">
                        <span>浪漫、有创意</span>
                        <span>标准、平衡</span>
                        <span>严格遵循文字</span>
                      </div>
                    </div>

                    {/* 一键避雷 */}
                    <div>
                      <label className="text-sm font-medium text-zinc-300 mb-2 block">
                        一键避雷
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'watermark', label: '拒绝水印' },
                          { value: 'text', label: '去除文字' },
                          { value: 'flat', label: '拒绝 2D 感' },
                          { value: '2d', label: '拒绝 2D 感' },
                          { value: 'messy lines', label: '拒绝杂乱线条' },
                          { value: 'blurry', label: '拒绝模糊' },
                        ].map((item) => (
                          <div key={item.value} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`avoid-${item.value}`}
                              checked={avoidFeatures.includes(item.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAvoidFeatures([...avoidFeatures, item.value]);
                                } else {
                                  setAvoidFeatures(avoidFeatures.filter(f => f !== item.value));
                                }
                              }}
                            />
                            <label 
                              htmlFor={`avoid-${item.value}`} 
                              className="text-xs text-zinc-400 cursor-pointer"
                            >
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 负面提示词 */}
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">
                        自定义负面提示词
                      </label>
                      <Textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="输入不希望出现在图像中的内容..."
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
              <Button
                className={cn(
                  "w-full h-11 text-sm font-semibold rounded-xl transition-all duration-300",
                  "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
                  "text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                )}
                onClick={handleGenerate}
                disabled={!prompt.trim() || !mainImage || (mode === 'INPAINT' && (!maskImage || !baseRendered)) || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    开始渲染
                  </>
                )}
              </Button>
              {!prompt.trim() && (
                <p className="text-xs text-zinc-600 text-center mt-2">
                  请输入提示词后开始生成
                </p>
              )}
              {!mainImage && (
                <p className="text-xs text-zinc-600 text-center mt-2">
                  请上传{mode === 'CAD_TO_3D' ? 'CAD平面图' : mode === 'SU_RENDER' ? 'SU白模' : '底图'}
                </p>
              )}
              {mode === 'INPAINT' && (!maskImage || !baseRendered) && (
                <p className="text-xs text-zinc-600 text-center mt-2">
                  请上传遮罩图像和渲染底图
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
