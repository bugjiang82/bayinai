"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useGenerationStore, type GenerationResult as StoreResult } from "@/stores/generationStore";
import Canvas from "@/components/generate/Canvas";
import ParamPanel, { SIZE_OPTIONS, type SizeOption } from "@/components/generate/ParamPanel";
import ImageUploader from "@/components/shared/ImageUploader";
import PromptInput from "@/components/generate/PromptInput";
import DropdownSelector from "@/components/generate/DropdownSelector";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { ModelType } from "@/components/generate/ModelSelector";

type ImageMode = "text-to-image" | "image-to-image";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
  favorited?: boolean;
}

type TransformType = "style-transfer" | "inpaint" | "outpaint" | "upscale";

const TRANSFORM_TYPES: { key: TransformType; label: string; desc: string }[] = [
  { key: "style-transfer", label: "风格迁移", desc: "将参考图风格应用到生成结果" },
  { key: "inpaint", label: "局部重绘", desc: "保留部分内容重新生成" },
  { key: "outpaint", label: "扩展画布", desc: "向四周扩展图片内容" },
  { key: "upscale", label: "放大", desc: "提高图片分辨率" },
];

const MODEL_OPTIONS = [
  { value: "flash", label: "Flash", description: "快速生成" },
  { value: "pro", label: "Pro", description: "高质量输出" },
  { value: "image2", label: "Image2", description: "超强图像生成" },
];

const RESOLUTION_OPTIONS = [
  { value: "512", label: "512", description: "标准" },
  { value: "1K", label: "1K", description: "1K 质量" },
  { value: "2K", label: "2K", description: "2K 质量" },
  { value: "4K", label: "4K", description: "4K 高清" },
];

const THINKING_OPTIONS = [
  { value: "minimal", label: "快速", description: "平衡速度与质量" },
  { value: "high", label: "精细", description: "更高质量" },
];

export default function UnifiedImagePage() {
  const router = useRouter();
  const [mode, setMode] = useState<ImageMode>("image-to-image");
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
    favorited?: boolean;
  }>>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const historyPageSize = 18;

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/credits/balance");
        const json = await res.json();
        if (json.code === 0 && json.data?.balance !== undefined) {
          setCredits(json.data.balance);
        }
      } catch {
        // 忽略错误，使用默认余额
      }
    };
    fetchCredits();
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

    if (savedPrompt) setPrompt(savedPrompt);
    if (savedNegativePrompt) setNegativePrompt(savedNegativePrompt);
  }, []);

  useEffect(() => {
    async function loadHistory(page = 1) {
      try {
        setLoadingHistory(true);
        setHistoryError(null);
        const res = await fetch(`/api/generate/history?type=TEXT_TO_IMAGE&type=IMAGE_TO_IMAGE&type=INPAINT&type=EDIT&status=COMPLETED&pageSize=${historyPageSize}&page=${page}`);
        if (res.ok) {
          const json = await res.json();
          console.log("History API response:", json);
          if (json.code === 0 && json.data?.list) {
            const newItems = json.data.list.map((item: any) => {
              let modelVal = "flash";
              let imageSize = "1K";
              let aspectRatio = "";
              if (item.params) {
                try {
                  const params = typeof item.params === 'string' ? JSON.parse(item.params) : item.params;
                  modelVal = params.model || "flash";
                  imageSize = params.imageSize || "1K";
                  aspectRatio = params.aspectRatio || "";
                } catch {}
              }
              return {
                id: item.id,
                url: item.outputUrl,
                thumb: item.thumbnailUrl || item.outputUrl,
                prompt: item.prompt,
                model: modelVal,
                imageSize,
                aspectRatio,
                createdAt: item.createdAt ? formatTime(item.createdAt) : "",
                type: item.type,
                inputUrl: item.inputUrl,
                favorited: item.favorited ?? false,
              };
            });
            setHistory(prev => page === 1 ? newItems : [...prev, ...newItems]);
            setHasMoreHistory(newItems.length === historyPageSize);
          }
        } else {
          const errorText = await res.text();
          setHistoryError(`HTTP ${res.status}: ${errorText}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载失败";
        setHistoryError(msg);
      }
      finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

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
      const res = await fetch(`/api/generate/history?type=TEXT_TO_IMAGE&type=IMAGE_TO_IMAGE&type=INPAINT&type=EDIT&status=COMPLETED&pageSize=${historyPageSize}&page=${nextPage}`);
      if (res.ok) {
        const json = await res.json();
        if (json.code === 0 && json.data?.list) {
          const newItems = json.data.list.map((item: any) => {
            let modelVal = "flash";
            let imageSize = "1K";
            let aspectRatio = "";
            if (item.params) {
              try {
                const params = typeof item.params === 'string' ? JSON.parse(item.params) : item.params;
                modelVal = params.model || "flash";
                imageSize = params.imageSize || "1K";
                aspectRatio = params.aspectRatio || "";
              } catch {}
            }
            return {
              id: item.id,
              url: item.outputUrl,
              thumb: item.thumbnailUrl || item.outputUrl,
              prompt: item.prompt,
              model: modelVal,
              imageSize,
              aspectRatio,
              createdAt: item.createdAt ? formatTime(item.createdAt) : "",
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
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (mode === "image-to-image" && referenceImages.length === 0) return;

    const getCost = (m: string) => {
      if (m === "flash") return 1;
      if (m === "image2") return 50;
      return 3;
    };
    const creditsPerImage = getCost(model);
    const totalCost = creditsPerImage;
    if (credits < totalCost) return;

    simulateProgress();

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        aspectRatio: selectedSize.ratio,
        imageSize: resolution,
        thinkingLevel,
        model,
      };

      if (mode === "image-to-image" && referenceImages.length > 0) {
        body.referenceImages = referenceImages;
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

  const handleHistoryItemClick = useCallback((item: typeof history[number]) => {
    setImages([{ id: item.id, url: item.url, prompt: item.prompt, favorited: item.favorited }]);
    setPrompt(item.prompt);
    if (item.inputUrl) {
      setMode("image-to-image");
      setReferenceImages([item.inputUrl]);
    }
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 overflow-hidden">
      {/* Left: Canvas area (70%) */}
      <div className="w-[70%] flex flex-col min-w-0 gap-4 overflow-hidden">
        {/* Canvas - takes remaining space */}
        <div className="flex-1 min-h-0">
          <Canvas
            images={images}
            isGenerating={isGenerating}
            progress={progress}
            onImageAction={handleImageAction}
            singleImageMode={images.length === 1}
            history={history}
            onHistoryItemClick={handleHistoryItemClick as any}
            onHistoryDelete={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
            hasMoreHistory={hasMoreHistory}
            loadingHistory={loadingHistory}
            onLoadMoreHistory={loadMoreHistory}
          />
        </div>
      </div>

      {/* Right: Param panel (30%) */}
      <div className="w-[30%] flex flex-col min-w-[300px] max-w-[400px]">
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

            {/* Image upload section - shown in image-to-image mode */}
            {mode === "image-to-image" && (
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  参考图片
                </label>
                {referenceImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {referenceImages.map((img, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-white/[0.08]"
                      >
                        <Image
                          src={img}
                          alt={`参考图 ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <span className="text-xs">X</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {referenceImages.length < 9 && (
                      <div className="aspect-square">
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
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <ImageUploader
                      onUpload={handleUpload}
                      compact
                    />
                    <div className="aspect-square rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02]" />
                    <div className="aspect-square rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02]" />
                  </div>
                )}
              </div>
            )}

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
            <DropdownSelector
              label="模型"
              value={model}
              options={MODEL_OPTIONS}
              onChange={(val) => setModel(val as ModelType)}
            />

            {/* Aspect ratio */}
            <DropdownSelector
              label="宽高比"
              value={selectedSize.ratio}
              options={SIZE_OPTIONS.map((s) => ({ value: s.ratio, label: s.label }))}
              onChange={(val) => {
                const size = SIZE_OPTIONS.find((s) => s.ratio === val);
                if (size) setSelectedSize(size);
              }}
            />

            {/* Advanced params */}
            <div className="space-y-4">
              {/* Resolution */}
              <DropdownSelector
                label="分辨率"
                value={resolution}
                options={RESOLUTION_OPTIONS}
                onChange={setResolution}
              />

              {/* Thinking level */}
              {model === "flash" && (
                <DropdownSelector
                  label="思考级别"
                  value={thinkingLevel}
                  options={THINKING_OPTIONS}
                  onChange={setThinkingLevel}
                />
              )}
            </div>
          </div>

          {/* Bottom: Generate button + cost display */}
          <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] flex-shrink-0">
            <div className="flex items-center justify-end mb-3">
              <span className="text-xs text-zinc-600">
                消耗{" "}
                <span className={cn(
                  "font-medium",
                  credits > 0 && credits < (model === "image2" ? 50 : model === "flash" ? 1 : 3) ? "text-red-400" : "text-zinc-400"
                )}>
                  {model === "image2" ? 50 : model === "flash" ? 1 : 3}
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
                credits < (model === "image2" ? 50 : model === "flash" ? 1 : 3) ||
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
            {prompt.trim() && credits < (model === "image2" ? 50 : model === "flash" ? 1 : 3) && (
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
