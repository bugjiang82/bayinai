"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { X, GripVertical, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenerationStore, type GenerationResult as StoreResult } from "@/stores/generationStore";
import Canvas from "@/components/generate/Canvas";
import ParamPanel, { SIZE_OPTIONS, type SizeOption } from "@/components/generate/ParamPanel";
import ImageUploader from "@/components/shared/ImageUploader";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { ModelType } from "@/components/generate/ModelSelector";

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

export default function ImageToImagePage() {
  const searchParams = useSearchParams();
  const store = useGenerationStore();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reference images
  const [referenceImages, setReferenceImages] = useState<string[]>(() => {
    const ref = searchParams.get("ref");
    if (ref) return [ref];
    return [];
  });
  const [referenceWeight, setReferenceWeight] = useState(0.7);
  const [transformType, setTransformType] = useState<TransformType>("style-transfer");

  // Local state for params
  const [prompt, setPrompt] = useState(store.currentParams.prompt || "");
  const [negativePrompt, setNegativePrompt] = useState(
    store.currentParams.negativePrompt || ""
  );
  const [model, setModel] = useState<ModelType>(
    store.currentParams.model === "pro" ? "pro" : "flash"
  );
  const [selectedSize, setSelectedSize] = useState<SizeOption>(() => {
    return SIZE_OPTIONS[0];
  });
  const [resolution, setResolution] = useState("1K");
  const [thinkingLevel, setThinkingLevel] = useState("minimal");
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [credits, setCredits] = useState(100);
  const [history, setHistory] = useState<Array<{id: string, url: string, thumb: string, prompt: string, model?: string, imageSize?: string, createdAt?: string, type?: string, inputUrl?: string}>>([]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Load from localStorage on component mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem("image-to-image-prompt");
    const savedNegativePrompt = localStorage.getItem("image-to-image-negative-prompt");
    const savedReference = localStorage.getItem("image-to-image-reference");
    
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
    if (savedNegativePrompt) {
      setNegativePrompt(savedNegativePrompt);
    }
    if (savedReference && referenceImages.length === 0) {
      setReferenceImages([savedReference]);
    }
  }, []);

  // Load history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/generate/history?status=COMPLETED&pageSize=10");
        if (res.ok) {
          const json = await res.json();
          if (json.code === 0 && json.data?.list) {
            setHistory(json.data.list.map((item: any) => {
              let model = "flash";
              let imageSize = "1K";
              
              if (item.params) {
                try {
                  const params = JSON.parse(item.params);
                  model = params.model || "flash";
                  imageSize = params.imageSize || "1K";
                } catch {}
              }
              
              return {
                id: item.id,
                url: item.outputUrl,
                thumb: item.thumbnailUrl || item.outputUrl,
                prompt: item.prompt,
                model,
                imageSize,
                createdAt: item.createdAt,
                type: item.type,
                inputUrl: item.inputUrl,
              };
            }));
          }
        }
      } catch {}
    }
    loadHistory();
  }, []);

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setReferenceImages((prev) => [...prev, dataUrl]);
      // 保存到本地存储
      localStorage.setItem("image-to-image-reference", dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    // 从本地存储移除
    if (index === 0) {
      localStorage.removeItem("image-to-image-reference");
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || referenceImages.length === 0) return;

    const creditsPerImage = model === "flash" ? 1 : 3;
    const totalCost = creditsPerImage;

    if (credits < totalCost) return;

    // Start progress simulation
    let currentProgress = 0;
    store.startGeneration();

    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 12 + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        store.updateProgress(100);
      } else {
        store.updateProgress(currentProgress);
      }
    }, 600);

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio: selectedSize.ratio,
          imageSize: resolution,
          thinkingLevel: thinkingLevel,
          model: model === "pro" ? "gemini-3-pro-image-preview" : "gemini-3.1-flash-image-preview",
          referenceImage: referenceImages[0],
        }),
      });

      if (!response.ok) {
        throw new Error("生成请求失败");
      }

      const data = await response.json();

      // Unwrap API response: { code: 0, message: "success", data: { outputUrl } }
      const resultData = data.data || {};

      const resultImages: CanvasImage[] = Array.isArray(resultData.outputUrl)
        ? resultData.outputUrl.map((url: string, i: number) => ({
            id: `${Date.now()}-${i}`,
            url,
            prompt: prompt.trim(),
          }))
        : resultData.outputUrl
        ? [
            {
              id: `${Date.now()}`,
              url: resultData.outputUrl,
              prompt: prompt.trim(),
            },
          ]
        : Array.from({ length: 1 }, (_, i) => ({
            id: `${Date.now()}-${i}`,
            url: `https://picsum.photos/seed/${Date.now() + i}/1024/1024`,
            prompt: prompt.trim(),
          }));

      setImages(resultImages);
      setCredits((prev) => Math.max(0, prev - totalCost));

      // Add to history
      setHistory((prev) => {
        const newItems = resultImages.map((img) => ({
          id: img.id,
          url: img.url,
          thumb: img.url,
          prompt: img.prompt || "",
        }));
        const merged = [...newItems, ...prev];
        return merged.slice(0, 10);
      });

      const storeResult: StoreResult = {
        id: `${Date.now()}`,
        url: resultImages[0]?.url || "",
        prompt: prompt.trim(),
        params: store.currentParams,
        createdAt: new Date(),
      };
      store.completeGeneration(storeResult);
    } catch (error) {
      console.error("Generation failed:", error);
      store.failGeneration();
    }
  }, [
    prompt,
    negativePrompt,
    model,
    selectedSize,
    resolution,
    thinkingLevel,
    credits,
    referenceImages,
    referenceWeight,
    transformType,
    store,
  ]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex gap-4 h-full">
      {/* Left: Canvas area (60%) */}
      <div className="w-[60%] flex flex-col min-w-0 gap-4">
        {/* Reference image upload area */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-4">
          <label className="text-sm font-medium text-zinc-300 mb-3 block">
            参考图片
          </label>

          {/* Uploaded reference images */}
          {referenceImages.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {referenceImages.map((img, index) => (
                <div
                  key={index}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden border border-white/[0.08]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`参考图 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="w-3 h-3" />
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

        {/* Canvas */}
        <div className="flex-1 min-h-[300px]">
          <Canvas
            images={images}
            isGenerating={store.isGenerating}
            progress={store.progress}
          />
        </div>

        {/* History thumbnails */}
        {history.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-zinc-500 mb-2">历史记录</h3>
            <div className="grid grid-cols-8 gap-2">
              {history.map((item) => {
                // 格式化时间
                const formatTime = (timeString: string) => {
                  try {
                    const date = new Date(timeString);
                    return date.toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  } catch {
                    return '';
                  }
                };
                
                return (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-md overflow-hidden border border-white/[0.06] cursor-pointer hover:border-indigo-500/40 transition-colors"
                    onClick={() => {
                      // 设置图片
                      setImages([{ id: item.id, url: item.url, prompt: item.prompt }]);
                      // 填充提示词
                      setPrompt(item.prompt);
                      // 设置参考图片（优先使用inputUrl，如果没有则使用outputUrl）
                      const refUrl = item.inputUrl || item.url;
                      setReferenceImages([refUrl]);
                      localStorage.setItem("image-to-image-reference", refUrl);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumb} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                    {/* 悬停时显示信息 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100">
                      <div className="text-xs text-white space-y-1">
                        <div className="truncate">{item.model === 'pro' ? 'Pro 模型' : 'Flash 模型'}</div>
                        <div>{item.imageSize} 质量</div>
                        <div>{formatTime(item.createdAt || '')}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Param panel (40%) */}
      <div className="w-[40%] flex flex-col min-w-[340px] max-w-[480px]">
        <ParamPanel
          prompt={prompt}
          onPromptChange={(value) => {
            setPrompt(value);
            localStorage.setItem("image-to-image-prompt", value);
          }}
          negativePrompt={negativePrompt}
          onNegativePromptChange={(value) => {
            setNegativePrompt(value);
            localStorage.setItem("image-to-image-negative-prompt", value);
          }}
          model={model}
          onModelChange={setModel}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          resolution={resolution}
          onResolutionChange={setResolution}
          thinkingLevel={thinkingLevel}
          onThinkingLevelChange={setThinkingLevel}
          onGenerate={handleGenerate}
          isGenerating={store.isGenerating}
          credits={credits}
        />
      </div>
    </div>
  );
}
