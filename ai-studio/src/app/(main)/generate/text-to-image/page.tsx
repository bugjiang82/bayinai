"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGenerationStore, type GenerationResult as StoreResult } from "@/stores/generationStore";
import Canvas from "@/components/generate/Canvas";
import ParamPanel, { SIZE_OPTIONS, type SizeOption } from "@/components/generate/ParamPanel";
import type { ModelType } from "@/components/generate/ModelSelector";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
}

export default function TextToImagePage() {
  const router = useRouter();
  const store = useGenerationStore();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const [credits, setCredits] = useState(100); // Mock credits
  const [history, setHistory] = useState<Array<{id: string, url: string, thumb: string, prompt: string}>>([]);

  // Sync params to store
  const setParams = store.setParams;
  useEffect(() => {
    setParams({
      prompt,
      negativePrompt,
      model,
      mode: "text-to-image",
    });
  }, [prompt, negativePrompt, model, setParams]);

  // Load from localStorage on component mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem("text-to-image-prompt");
    const savedNegativePrompt = localStorage.getItem("text-to-image-negative-prompt");
    
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
    if (savedNegativePrompt) {
      setNegativePrompt(savedNegativePrompt);
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Load history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/generate/history?status=COMPLETED&pageSize=10");
        if (res.ok) {
          const json = await res.json();
          if (json.code === 0 && json.data?.list) {
            setHistory(json.data.list.map((item: { id: string; outputUrl: string; thumbnailUrl: string; prompt: string }) => ({
              id: item.id,
              url: item.outputUrl,
              thumb: item.thumbnailUrl || item.outputUrl,
              prompt: item.prompt,
            })));
          }
        }
      } catch {}
    }
    loadHistory();
  }, []);

  const simulateProgress = useCallback(() => {
    let currentProgress = 0;
    store.startGeneration();

    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
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
    }, 500);

    return progressIntervalRef.current;
  }, [store]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    const creditsPerImage = model === "flash" ? 1 : 3;
    const totalCost = creditsPerImage;

    if (credits < totalCost) return;

    simulateProgress();

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
        }),
      });

      if (!response.ok) {
        throw new Error("生成请求失败");
      }

      const data = await response.json();

      // Unwrap API response: { code: 0, message: "success", data: { outputUrl } }
      const resultData = data.data || {};

      // Handle mock or real response
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
        : // Mock fallback: generate placeholder images
          Array.from({ length: 1 }, (_, i) => ({
            id: `${Date.now()}-${i}`,
            url: `https://picsum.photos/seed/${Date.now() + i}/1024/1024`,
            prompt: prompt.trim(),
          }));

      setImages(resultImages);

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

      // Deduct credits
      setCredits((prev) => Math.max(0, prev - totalCost));

      // Store result
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
    store,
    simulateProgress,
  ]);

  const handleImageAction = useCallback(
    (action: string, image: CanvasImage) => {
      if (action === "use-as-reference") {
        // Navigate to image-to-image with the reference image
        router.push(
          `/generate/image-to-image?ref=${encodeURIComponent(image.url)}`
        );
      }
    },
    [router]
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] flex gap-4">
      {/* Left: Canvas area (60%) */}
      <div className="w-[60%] flex flex-col min-w-0">
        <div className="flex-1 min-h-[400px]">
          <Canvas
            images={images}
            isGenerating={store.isGenerating}
            progress={store.progress}
            onImageAction={handleImageAction}
          />
        </div>
        {history.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-zinc-500 mb-2">历史记录</h3>
            <div className="grid grid-cols-8 gap-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square rounded-md overflow-hidden border border-white/[0.06] cursor-pointer hover:border-indigo-500/40 transition-colors"
                  onClick={() => setImages([{ id: item.id, url: item.url, prompt: item.prompt }])}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumb} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Param panel (40%) */}
      <div className="w-[40%] flex flex-col min-w-[340px] max-w-[480px]">
        <ParamPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
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
