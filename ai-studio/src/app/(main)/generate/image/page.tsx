"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGenerationStore, type GenerationResult as StoreResult } from "@/stores/generationStore";
import Canvas from "@/components/generate/Canvas";
import ParamPanel, { SIZE_OPTIONS, type SizeOption } from "@/components/generate/ParamPanel";
import ImageUploader from "@/components/shared/ImageUploader";
import PromptInput from "@/components/generate/PromptInput";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { ModelType } from "@/components/generate/ModelSelector";

type ImageMode = "text-to-image" | "image-to-image";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
}

type TransformType = "style-transfer" | "inpaint" | "outpaint" | "upscale";

const TRANSFORM_TYPES: { key: TransformType; label: string; desc: string }[] = [
  { key: "style-transfer", label: "风格迁移", desc: "将参考图风格应用到生成结果" },
  { key: "inpaint", label: "局部重绘", desc: "保留部分内容重新生成" },
  { key: "outpaint", label: "扩展画布", desc: "向四周扩展图片内容" },
  { key: "upscale", label: "放大", desc: "提高图片分辨率" },
];

export default function UnifiedImagePage() {
  const router = useRouter();
  const [mode, setMode] = useState<ImageMode>("text-to-image");
  const isGenerating = useGenerationStore(state => state.isGenerating);
  const progress = useGenerationStore(state => state.progress);
  const startGeneration = useGenerationStore(state => state.startGeneration);
  const updateProgress = useGenerationStore(state => state.updateProgress);
  const completeGeneration = useGenerationStore(state => state.completeGeneration);
  const failGeneration = useGenerationStore(state => state.failGeneration);
  const currentParams = useGenerationStore(state => state.currentParams);
  const setParams = useGenerationStore(state => state.setParams);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [prompt, setPrompt] = useState(currentParams.prompt || "");
  const [negativePrompt, setNegativePrompt] = useState(
    currentParams.negativePrompt || ""
  );
  const [model, setModel] = useState<ModelType>(
    currentParams.model === "pro" ? "pro" : "flash"
  );
  const [selectedSize, setSelectedSize] = useState<SizeOption>(() => SIZE_OPTIONS[0]);
  const [resolution, setResolution] = useState("1K");
  const [thinkingLevel, setThinkingLevel] = useState("minimal");
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [credits, setCredits] = useState(100);

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceWeight, setReferenceWeight] = useState(0.7);
  const [transformType, setTransformType] = useState<TransformType>("style-transfer");

  const [history, setHistory] = useState<Array<{
    id: string;
    url: string;
    thumb: string;
    prompt: string;
    model?: string;
    imageSize?: string;
    createdAt?: string;
    type?: string;
    inputUrl?: string;
  }>>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historyPageSize = 18;

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setParams({
      prompt,
      negativePrompt,
      model,
      mode,
    });
  }, [prompt, negativePrompt, model, mode, setParams]);

  useEffect(() => {
    const savedPrompt = localStorage.getItem("unified-image-prompt");
    const savedNegativePrompt = localStorage.getItem("unified-image-negative-prompt");
    const savedReference = localStorage.getItem("unified-image-reference");

    if (savedPrompt) setPrompt(savedPrompt);
    if (savedNegativePrompt) setNegativePrompt(savedNegativePrompt);
    if (savedReference && referenceImages.length === 0) {
      setReferenceImages([savedReference]);
    }
  }, []);

  useEffect(() => {
    async function loadHistory(page = 1) {
      try {
        setLoadingHistory(true);
        const res = await fetch(`/api/generate/history?status=COMPLETED&pageSize=${historyPageSize}&page=${page}`);
        if (res.ok) {
          const json = await res.json();
          if (json.code === 0 && json.data?.list) {
            const newItems = json.data.list.map((item: any) => {
              let modelVal = "flash";
              let imageSize = "1K";
              if (item.params) {
                try {
                  const params = JSON.parse(item.params);
                  modelVal = params.model || "flash";
                  imageSize = params.imageSize || "1K";
                } catch {}
              }
              return {
                id: item.id,
                url: item.outputUrl,
                thumb: item.thumbnailUrl || item.outputUrl,
                prompt: item.prompt,
                model: modelVal,
                imageSize,
                createdAt: item.createdAt,
                type: item.type,
                inputUrl: item.inputUrl,
              };
            });
            setHistory(prev => page === 1 ? newItems : [...prev, ...newItems]);
            setHasMoreHistory(newItems.length === historyPageSize);
          }
        }
      } catch {}
      finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  const simulateProgress = useCallback(() => {
    let currentProgress = 0;
    startGeneration();

    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        updateProgress(100);
      } else {
        updateProgress(currentProgress);
      }
    }, 500);
  }, [startGeneration, updateProgress]);

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setReferenceImages((prev) => [...prev, dataUrl]);
      localStorage.setItem("unified-image-reference", dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    if (index === 0) {
      localStorage.removeItem("unified-image-reference");
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (mode === "image-to-image" && referenceImages.length === 0) return;

    const creditsPerImage = model === "flash" ? 1 : 3;
    const totalCost = creditsPerImage;
    if (credits < totalCost) return;

    simulateProgress();

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        aspectRatio: selectedSize.ratio,
        imageSize: resolution,
        thinkingLevel,
        model: model === "pro" ? "gemini-3-pro-image-preview" : "gemini-3.1-flash-image-preview",
      };

      if (mode === "image-to-image" && referenceImages.length > 0) {
        body.referenceImage = referenceImages[0];
      }

      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("生成请求失败");

      const data = await response.json();
      const resultData = data.data || {};

      const resultImages: CanvasImage[] = Array.isArray(resultData.outputUrl)
        ? resultData.outputUrl.map((url: string, i: number) => ({
            id: `${Date.now()}-${i}`,
            url,
            prompt: prompt.trim(),
          }))
        : resultData.outputUrl
        ? [{ id: `${Date.now()}`, url: resultData.outputUrl, prompt: prompt.trim() }]
        : [{ id: `${Date.now()}`, url: `https://picsum.photos/seed/${Date.now()}/1024/1024`, prompt: prompt.trim() }];

      setImages(resultImages);
      setCredits((prev) => Math.max(0, prev - totalCost));

      setHistory((prev) => {
        const newItems = resultImages.map((img) => ({
          id: img.id,
          url: img.url,
          thumb: img.url,
          prompt: img.prompt || "",
          type: mode,
          inputUrl: mode === "image-to-image" ? referenceImages[0] : undefined,
        }));
        const merged = [...newItems, ...prev];
        return merged.slice(0, 10);
      });

      const storeResult: StoreResult = {
        id: `${Date.now()}`,
        url: resultImages[0]?.url || "",
        prompt: prompt.trim(),
        params: currentParams,
        createdAt: new Date(),
      };
      completeGeneration(storeResult);
    } catch (error) {
      console.error("Generation failed:", error);
      failGeneration();
    }
  }, [
    prompt,
    negativePrompt,
    model,
    selectedSize,
    resolution,
    thinkingLevel,
    credits,
    mode,
    referenceImages,
    referenceWeight,
    transformType,
    currentParams,
    simulateProgress,
    completeGeneration,
    failGeneration,
  ]);

  const handleImageAction = useCallback(
    (action: string, image: CanvasImage) => {
      if (action === "use-as-reference") {
        setMode("image-to-image");
        setReferenceImages([image.url]);
        setImages([]);
      }
    },
    []
  );

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const loadMoreHistory = useCallback(async () => {
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/generate/history?status=COMPLETED&pageSize=${historyPageSize}&page=${nextPage}`);
      if (res.ok) {
        const json = await res.json();
        if (json.code === 0 && json.data?.list) {
          const newItems = json.data.list.map((item: any) => {
            let modelVal = "flash";
            let imageSize = "1K";
            if (item.params) {
              try {
                const params = JSON.parse(item.params);
                modelVal = params.model || "flash";
                imageSize = params.imageSize || "1K";
              } catch {}
            }
            return {
              id: item.id,
              url: item.outputUrl,
              thumb: item.thumbnailUrl || item.outputUrl,
              prompt: item.prompt,
              model: modelVal,
              imageSize,
              createdAt: item.createdAt,
              type: item.type,
              inputUrl: item.inputUrl,
            };
          });
          setHistory(prev => [...prev, ...newItems]);
          setHasMoreHistory(newItems.length === historyPageSize);
        }
      }
    } catch {}
    finally {
      setLoadingHistory(false);
    }
  }, [historyPage]);

  const handleHistoryItemClick = useCallback((item: typeof history[number]) => {
    setImages([{ id: item.id, url: item.url, prompt: item.prompt }]);
    setPrompt(item.prompt);
    if (item.inputUrl) {
      setMode("image-to-image");
      setReferenceImages([item.inputUrl]);
    }
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 overflow-hidden">
      {/* Left: Canvas area (60%) */}
      <div className="w-[60%] flex flex-col min-w-0 gap-4 overflow-hidden">
        {/* Reference image upload area (only in image-to-image mode) */}
        {mode === "image-to-image" && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-4 flex-shrink-0">
            <label className="text-sm font-medium text-zinc-300 mb-3 block">
              参考图片
            </label>

            {referenceImages.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {referenceImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/[0.08]"
                  >
                    <Image
                      src={img}
                      alt={`参考图 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <span className="text-xs">X</span>
                      </button>
                    </div>
                    {index === 0 && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-indigo-500/80 text-[10px] text-white font-medium">
                        主图
                      </div>
                    )}
                  </div>
                ))}
                {referenceImages.length < 4 && (
                  <div className="w-20 h-20">
                    <ImageUploader
                      onUpload={handleUpload}
                      compact
                      className="h-full !p-2"
                    />
                  </div>
                )}
              </div>
            )}

            {referenceImages.length === 0 && (
              <ImageUploader
                onUpload={handleUpload}
                compact
                className="mb-3"
              />
            )}

            {/* Reference weight slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">参考图权重</label>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {referenceWeight.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[referenceWeight]}
                onValueChange={([v]) => setReferenceWeight(v)}
                min={0}
                max={1}
                step={0.05}
                className="py-1"
              />
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>更多创意</span>
                <span>更接近原图</span>
              </div>
            </div>

            {/* Transform type selection */}
            <div className="mt-4">
              <label className="text-xs text-zinc-400 mb-2 block">
                变换类型
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TRANSFORM_TYPES.map((t) => (
                  <button
                    key={t.key}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer",
                      transformType === t.key
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:border-white/[0.15] hover:text-zinc-300"
                    )}
                    onClick={() => setTransformType(t.key)}
                  >
                    <span className="text-xs font-medium block">{t.label}</span>
                    <span className="text-[10px] text-zinc-600 mt-0.5 block">
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Canvas - takes remaining space */}
        <div className="flex-1 min-h-0">
          <Canvas
            images={images}
            isGenerating={isGenerating}
            progress={progress}
            onImageAction={handleImageAction}
          />
        </div>

        {/* History grid - fixed height with scroll */}
        {history.length > 0 && (
          <div className="flex-shrink-0 border-t border-white/[0.06] pt-3 mt-2 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-medium text-zinc-500">历史记录</h3>
              {hasMoreHistory && !loadingHistory && (
                <button
                  onClick={loadMoreHistory}
                  className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
                >
                  加载更多
                </button>
              )}
              {loadingHistory && (
                <span className="text-xs text-zinc-500">加载中...</span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-md overflow-hidden border border-white/[0.06] cursor-pointer hover:border-indigo-500/40 transition-colors"
                  onClick={() => handleHistoryItemClick(item)}
                >
                  <Image
                    src={item.thumb}
                    alt={item.prompt}
                    fill
                    className="object-cover"
                    sizes="14vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100">
                    <div className="text-xs text-white space-y-1">
                      <div className="truncate">
                        {item.model === "pro" || item.model === "gemini-3-pro-image-preview"
                          ? "Pro 模型"
                          : "Flash 模型"}
                      </div>
                      <div>{item.imageSize} 质量</div>
                      <div>{formatTime(item.createdAt || "")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Param panel (40%) */}
      <div className="w-[40%] flex flex-col min-w-[340px] max-w-[480px]">
        <div className="flex flex-col h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
            {/* Mode toggle */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                生成模式
              </label>
              <div className="flex gap-2">
                <button
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                    mode === "text-to-image"
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setMode("text-to-image")}
                >
                  文生图
                </button>
                <button
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                    mode === "image-to-image"
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setMode("image-to-image")}
                >
                  图生图
                </button>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                提示词
              </label>
              <PromptInput
                value={prompt}
                onChange={(value) => {
                  setPrompt(value);
                  localStorage.setItem("unified-image-prompt", value);
                }}
                storageKey="unified-image-prompt"
                showQuickPrompts={mode === "text-to-image"}
              />
            </div>

            {/* Model */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                模型
              </label>
              <div className="flex gap-2">
                <button
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                    model === "flash"
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setModel("flash")}
                >
                  Flash
                  <span className="text-[10px] text-zinc-600 ml-1">快速</span>
                </button>
                <button
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                    model === "pro"
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setModel("pro")}
                >
                  Pro
                  <span className="text-[10px] text-zinc-600 ml-1">高质量</span>
                </button>
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                宽高比
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size.ratio}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                      selectedSize.ratio === size.ratio
                        ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                        : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                    )}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced params */}
            <div className="space-y-4">
              {/* Resolution */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400">分辨率</label>
                <div className="flex gap-1.5">
                  {["512", "1K", "2K", "4K"].map((opt) => (
                    <button
                      key={opt}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                        resolution === opt
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                      )}
                      onClick={() => setResolution(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thinking level */}
              {model === "flash" && (
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">
                    思考级别
                    <span className="text-zinc-600 ml-1">（平衡质量与速度）</span>
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                        thinkingLevel === "minimal"
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                      )}
                      onClick={() => setThinkingLevel("minimal")}
                    >
                      快速
                    </button>
                    <button
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                        thinkingLevel === "high"
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                      )}
                      onClick={() => setThinkingLevel("high")}
                    >
                      精细
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Generate button + credits */}
          <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span>余额 <span className="text-zinc-300 font-medium">{credits}</span> 积分</span>
              </div>
              <span className="text-xs text-zinc-600">
                消耗{" "}
                <span className={cn(
                  "font-medium",
                  credits < (model === "flash" ? 1 : 3) ? "text-red-400" : "text-zinc-400"
                )}>
                  {model === "flash" ? 1 : 3}
                </span>{" "}
                积分/个
              </span>
            </div>
            <button
              className={cn(
                "w-full h-11 text-sm font-semibold rounded-xl transition-all duration-300",
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
                "text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
              onClick={handleGenerate}
              disabled={
                !prompt.trim() ||
                (mode === "image-to-image" && referenceImages.length === 0) ||
                credits < (model === "flash" ? 1 : 3) ||
                isGenerating
              }
            >
              {isGenerating ? "生成中..." : "开始生成"}
            </button>
            {!prompt.trim() && (
              <p className="text-xs text-zinc-600 text-center mt-2">
                请输入提示词后开始生成
              </p>
            )}
            {mode === "image-to-image" && prompt.trim() && referenceImages.length === 0 && (
              <p className="text-xs text-zinc-600 text-center mt-2">
                请上传参考图片
              </p>
            )}
            {prompt.trim() && credits < (model === "flash" ? 1 : 3) && (
              <p className="text-xs text-red-400/80 text-center mt-2">
                积分不足，请充值后重试
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
