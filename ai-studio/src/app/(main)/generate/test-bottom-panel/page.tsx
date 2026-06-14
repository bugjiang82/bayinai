"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import logger from "@/lib/logger";
import { useGenerationStore, type GenerationResult as StoreResult } from "@/stores/generationStore";
import Canvas from "@/components/generate/Canvas";
import { SIZE_OPTIONS, type SizeOption } from "@/components/generate/ParamPanel";
import { cn } from "@/lib/utils";
import type { ModelType } from "@/components/generate/ModelSelector";
import type { ImageModelId, ImageQuality } from "@/models";
import { useCreditPolicies } from "@/hooks/useCreditPolicies";
import { saveToStorage, loadFromStorage } from "@/lib/imageStorage";

function compressImageForUpload(dataUrl: string, callback: (compressed: string) => void) {
  const img = new Image();
  img.onload = () => {
    const MAX_DIM = 2000;
    let { naturalWidth: w, naturalHeight: h } = img;
    if (w <= MAX_DIM && h <= MAX_DIM && dataUrl.length < 500000) {
      callback(dataUrl);
      return;
    }
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) { h = Math.round(h * (MAX_DIM / w)); w = MAX_DIM; }
      else { w = Math.round(w * (MAX_DIM / h)); h = MAX_DIM; }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { callback(dataUrl); return; }
    ctx.drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL("image/jpeg", 0.85));
  };
  img.src = dataUrl;
}

type ImageMode = "text-to-image" | "image-to-image";
type TaskType = "image-generation" | "video-generation" | "image-editing";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
  favorited?: boolean;
}

const TASK_OPTIONS = [
  { value: "image-generation", label: "图像生成", icon: "image" },
  { value: "video-generation", label: "视频生成", icon: "video" },
  { value: "image-editing", label: "图片编辑", icon: "edit" },
];

const IMAGE_MODEL_OPTIONS = [
  { value: "flash", label: "Flash", description: "快速生成" },
  { value: "pro", label: "Pro", description: "高质量输出" },
  { value: "image2", label: "Image2", description: "超强图像生成" },
];

const VIDEO_MODEL_OPTIONS = [
  { value: "wan2.2-kf2v-flash", label: "万相 2.2", description: "快速生成，支持首尾帧" },
  { value: "wan2.7-r2v", label: "万相 2.7", description: "高质量图生视频" },
  { value: "wan2.7-t2v", label: "万相 2.7", description: "文生视频" },
  { value: "happyhorse-1.0-t2v", label: "HappyHorse", description: "文生视频，支持多图参考" },
  { value: "happyhorse-1.0-i2v", label: "HappyHorse", description: "图生视频，支持多图参考" },
  { value: "veo-3.1-lite-generate-preview", label: "Veo 3.1 Lite", description: "Google Veo 视频生成" },
  { value: "seedance-1.5-pro", label: "Seedance 1.5 Pro", description: "豆包视频生成，支持文生/图生" },
];

const IMAGE_ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "21:9", label: "21:9" },
];

const IMAGE_QUALITY_OPTIONS = [
  { value: "512", label: "标准", description: "512px" },
  { value: "1K", label: "高清", description: "1024px" },
  { value: "2K", label: "超清", description: "2048px" },
  { value: "4K", label: "4K", description: "4096px" },
];

const VIDEO_ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

const VIDEO_RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p", description: "高清" },
  { value: "1080p", label: "1080p", description: "全高清" },
  { value: "4K", label: "4K", description: "超高清" },
];

const VIDEO_DURATION_OPTIONS = [
  { value: "5", label: "5秒" },
  { value: "10", label: "10秒" },
  { value: "15", label: "15秒" },
  { value: "30", label: "30秒" },
];

export default function TestBottomPanelPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ImageMode>("text-to-image");
  const [taskType, setTaskType] = useState<TaskType>("image-generation");
  const status = useGenerationStore(state => state.status);
  const progress = useGenerationStore(state => state.progress);
  const startGeneration = useGenerationStore(state => state.startGeneration);
  const updateProgress = useGenerationStore(state => state.updateProgress);
  const completeGeneration = useGenerationStore(state => state.completeGeneration);
  const failGeneration = useGenerationStore(state => state.failGeneration);
  const currentParams = useGenerationStore(state => state.currentParams);
  const setParams = useGenerationStore(state => state.setParams);
  const isGenerating = status === "generating";
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [prompt, setPrompt] = useState(currentParams.prompt || "");
  const [model, setModel] = useState<ModelType>(
    currentParams.model === "pro" ? "pro" : "flash"
  );
  const [selectedSize, setSelectedSize] = useState<SizeOption>(() => SIZE_OPTIONS[0]);
  const [resolution, setResolution] = useState("1K");
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [credits, setCredits] = useState(100);
  const [imageCreditCost, setImageCreditCost] = useState(1);
  const { getCostByType } = useCreditPolicies();

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

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
  const historyPageSize = 18;

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState(60);
  const [dragging, setDragging] = useState(false);
  const [showImageList, setShowImageList] = useState(false);
  const [imageListPosition, setImageListPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const imageModels = IMAGE_MODEL_OPTIONS;
  const videoModels = VIDEO_MODEL_OPTIONS;
  const currentModels = taskType === "video-generation" ? videoModels : imageModels;

  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [imageQuality, setImageQuality] = useState("1K");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [videoDuration, setVideoDuration] = useState("10");

  useEffect(() => {
    const loadCost = async () => {
      const modelId: ImageModelId = model === "pro" ? "pro" : model === "image2" ? "image2" : "flash";
      const quality: ImageQuality = resolution === "512" ? "512" : resolution === "2K" ? "2K" : resolution === "4K" ? "4K" : "1K";
      const cost = await getCostByType("text-to-image", modelId, quality);
      setImageCreditCost(cost);
    };
    loadCost();
  }, [model, resolution, getCostByType]);

  useEffect(() => {
    loadFromStorage("unified-image-reference-images").then((saved) => {
      if (saved.length > 0) setReferenceImages(saved);
    }).catch(() => {}).finally(() => setImagesLoaded(true));
  }, []);

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
      } catch {}
    };
    fetchCredits();
  }, []);

  useEffect(() => {
    setParams({
      prompt,
      model,
      mode,
    });
  }, [prompt, model, mode, setParams]);

  useEffect(() => {
    const savedPrompt = localStorage.getItem("unified-image-prompt");
    if (savedPrompt) setPrompt(savedPrompt);
    localStorage.removeItem("image-upload");
  }, []);

  useEffect(() => {
    if (imagesLoaded) {
      saveToStorage(referenceImages, "unified-image-reference-images");
    }
  }, [referenceImages, imagesLoaded]);

  useEffect(() => {
    async function loadHistory(page = 1) {
      try {
        setLoadingHistory(true);
        const res = await fetch(`/api/generate/history?type=TEXT_TO_IMAGE&type=IMAGE_TO_IMAGE&type=INPAINT&type=EDIT&status=COMPLETED&pageSize=${historyPageSize}&page=${page}`);
        if (res.ok) {
          const json = await res.json();
          if (json.code === 0 && json.data?.list) {
            const newItems = json.data.list.map((item: any) => ({
              id: item.id,
              url: item.outputUrl,
              thumb: item.thumbnailUrl || item.outputUrl,
              prompt: item.prompt,
              model: item.model || "flash",
              imageSize: item.imageSize || "1K",
              aspectRatio: item.aspectRatio || "",
              createdAt: item.createdAt ? formatTime(item.createdAt) : "",
              type: item.type,
              inputUrl: item.inputUrl,
              favorited: item.favorited ?? false,
            }));
            setHistory(prev => page === 1 ? newItems : [...prev, ...newItems]);
            setHasMoreHistory(newItems.length === historyPageSize);
          }
        }
      } catch {} finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setShowImageList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (dragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const newHeight = Math.min(Math.max(60, e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) - 20), 300);
        setTextareaHeight(newHeight);
      };
      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging]);

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
          const newItems = json.data.list.map((item: any) => ({
            id: item.id,
            url: item.outputUrl,
            thumb: item.thumbnailUrl || item.outputUrl,
            prompt: item.prompt,
            model: item.model || "flash",
            imageSize: item.imageSize || "1K",
            aspectRatio: item.aspectRatio || "",
            createdAt: item.createdAt ? formatTime(item.createdAt) : "",
            type: item.type,
            inputUrl: item.inputUrl,
          }));
          setHistory(prev => [...prev, ...newItems]);
          setHasMoreHistory(newItems.length === historyPageSize);
        }
      }
    } catch {} finally {
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
      compressImageForUpload(dataUrl, (compressed) => {
        setReferenceImages((prev) => [...prev, compressed]);
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if ((mode === "image-to-image" || taskType === "image-editing") && referenceImages.length === 0) return;

    const creditsPerImage = imageCreditCost;
    if (credits < creditsPerImage) return;

    simulateProgress();

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        aspectRatio: selectedSize.ratio,
        imageSize: resolution,
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
      setCredits((prev) => Math.max(0, prev - creditsPerImage));

      const storeResult: StoreResult = {
        id: `${Date.now()}`,
        url: resultImages[0]?.url || "",
        prompt: prompt.trim(),
        params: currentParams,
        createdAt: new Date(),
      };
      completeGeneration(storeResult);
    } catch (error) {
      logger.error("Generation failed:", error);
      failGeneration();
    }
  }, [prompt, model, selectedSize, resolution, credits, mode, referenceImages, currentParams, imageCreditCost, simulateProgress, completeGeneration, failGeneration]);

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

  const getTaskIcon = (icon: string) => {
    const icons = {
      image: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
          <circle cx="9" cy="9" r="2"></circle>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
        </svg>
      ),
      video: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect width="15" height="10" x="1" y="9" rx="2" ry="2"></rect>
        </svg>
      ),
      edit: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
          <path d="m15 5 4 4"></path>
        </svg>
      ),
    };
    return icons[icon as keyof typeof icons] || icons.image;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto pb-[160px]">
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

      <div ref={containerRef} className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.5),0_0_40px_rgba(0,0,0,0.3)] -m-px"></div>
            <div className="relative flex items-start gap-3 p-3 rounded-2xl border border-zinc-800/60 bg-[#1a1a1c]/98 backdrop-blur-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)]">
              <div className="flex-shrink-0">
                <div className="relative w-10 h-12 rounded-lg border-2 border-dashed border-zinc-600/50 bg-zinc-800/40 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition-all cursor-pointer flex items-center justify-center group">
                  <svg
                    className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/60 text-zinc-300 border border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-200 transition-all cursor-pointer"
                      onClick={() => setActiveDropdown(activeDropdown === "task" ? null : "task")}
                    >
                      {getTaskIcon(TASK_OPTIONS.find(t => t.value === taskType)?.icon || "image")}
                      {TASK_OPTIONS.find(t => t.value === taskType)?.label}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>
                    {activeDropdown === "task" && (
                      <div className="absolute bottom-full left-0 mb-2 w-40 rounded-lg shadow-[0_-4px_20px_rgba(0,0,0,0.6),0_4px_20px_rgba(0,0,0,0.4)] border border-zinc-700/50 py-1 z-50 bg-[#1a1a1c]">
                        {TASK_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-800/60 transition-colors ${
                              taskType === option.value ? "text-indigo-300 font-medium" : "text-zinc-300"
                            }`}
                            onClick={() => {
                              setTaskType(option.value as TaskType);
                              setActiveDropdown(null);
                            }}
                          >
                            {getTaskIcon(option.icon)}
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/60 text-zinc-300 border border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-200 transition-all cursor-pointer"
                      onClick={() => setActiveDropdown(activeDropdown === "model" ? null : "model")}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      {currentModels.find(m => m.value === model)?.label || "选择模型"}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>
                    {activeDropdown === "model" && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg shadow-[0_-4px_20px_rgba(0,0,0,0.6),0_4px_20px_rgba(0,0,0,0.4)] border border-zinc-700/50 py-1 z-50 bg-[#1a1a1c]">
                        {currentModels.map((option) => (
                          <button
                            key={option.value}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-800/60 transition-colors ${
                              model === option.value ? "text-indigo-300 font-medium" : "text-zinc-300"
                            }`}
                            onClick={() => {
                              setModel(option.value as ModelType);
                              setActiveDropdown(null);
                            }}
                          >
                            <span>{option.label}</span>
                            <span className="text-xs text-zinc-500">{option.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/60 text-zinc-300 border border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-200 transition-all cursor-pointer"
                      onClick={() => setActiveDropdown(activeDropdown === "params" ? null : "params")}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      参数设置
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6"></path>
                      </svg>
                    </button>
                    {activeDropdown === "params" && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg shadow-[0_-4px_20px_rgba(0,0,0,0.6),0_4px_20px_rgba(0,0,0,0.4)] border border-zinc-700/50 py-3 px-4 z-50 bg-[#1a1a1c]">
                        {taskType !== "video-generation" ? (
                          <>
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-zinc-400 mb-2">图片比例</label>
                              <div className="grid grid-cols-5 gap-1">
                                {IMAGE_ASPECT_RATIOS.map((ratio) => (
                                  <button
                                    key={ratio.value}
                                    className={`py-1.5 text-xs rounded-md transition-colors ${
                                      imageAspectRatio === ratio.value
                                        ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                        : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:border-zinc-600 hover:text-zinc-300"
                                    }`}
                                    onClick={() => setImageAspectRatio(ratio.value)}
                                  >
                                    {ratio.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-2">图片质量</label>
                              <div className="grid grid-cols-2 gap-2">
                                {IMAGE_QUALITY_OPTIONS.map((quality) => (
                                  <button
                                    key={quality.value}
                                    className={`py-2 text-xs rounded-md text-left transition-colors ${
                                      imageQuality === quality.value
                                        ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                        : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:border-zinc-600 hover:text-zinc-300"
                                    }`}
                                    onClick={() => {
                                      setImageQuality(quality.value);
                                      setResolution(quality.value);
                                    }}
                                  >
                                    <div className="font-medium">{quality.label}</div>
                                    <div className="text-[10px] opacity-70">{quality.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-zinc-400 mb-2">画面比例</label>
                              <div className="grid grid-cols-4 gap-1">
                                {VIDEO_ASPECT_RATIOS.map((ratio) => (
                                  <button
                                    key={ratio.value}
                                    className={`py-1.5 text-xs rounded-md transition-colors ${
                                      videoAspectRatio === ratio.value
                                        ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                        : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:border-zinc-600 hover:text-zinc-300"
                                    }`}
                                    onClick={() => setVideoAspectRatio(ratio.value)}
                                  >
                                    {ratio.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-zinc-400 mb-2">分辨率</label>
                              <div className="grid grid-cols-3 gap-2">
                                {VIDEO_RESOLUTION_OPTIONS.map((res) => (
                                  <button
                                    key={res.value}
                                    className={`py-2 text-xs rounded-md text-center transition-colors ${
                                      videoResolution === res.value
                                        ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                        : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:border-zinc-600 hover:text-zinc-300"
                                    }`}
                                    onClick={() => setVideoResolution(res.value)}
                                  >
                                    <div className="font-medium">{res.label}</div>
                                    <div className="text-[10px] opacity-70">{res.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-2">时长</label>
                              <div className="grid grid-cols-4 gap-1">
                                {VIDEO_DURATION_OPTIONS.map((duration) => (
                                  <button
                                    key={duration.value}
                                    className={`py-1.5 text-xs rounded-md transition-colors ${
                                      videoDuration === duration.value
                                        ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                                        : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:border-zinc-600 hover:text-zinc-300"
                                    }`}
                                    onClick={() => setVideoDuration(duration.value)}
                                  >
                                    {duration.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="flex-1" />

                  <span className="text-xs text-zinc-400">
                    <span className={cn(
                      "font-medium",
                      credits > 0 && credits < imageCreditCost ? "text-red-400" : "text-zinc-300"
                    )}>
                      {imageCreditCost}
                    </span> 积分
                  </span>
                </div>

                <div className="relative">
                  <div
                    ref={textareaRef}
                    className="w-full bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-500 resize-none text-sm leading-relaxed min-h-[40px] max-h-[120px] overflow-y-auto"
                    contentEditable
                    suppressContentEditableWarning
                    placeholder="输入想法、剧本或上传参考，支持 / 使用技能，输入 @ 引用图片"
                    onInput={(e) => {
                      const target = e.target as HTMLElement;
                      const newValue = target.innerText || "";
                      setPrompt(newValue);
                      localStorage.setItem("unified-image-prompt", newValue);
                      
                      const lastAtIndex = newValue.lastIndexOf("@");
                      if (lastAtIndex !== -1 && lastAtIndex === newValue.length - 1) {
                        if (textareaRef.current) {
                          const rect = textareaRef.current.getBoundingClientRect();
                          setImageListPosition({ x: rect.left + 8, y: rect.top - 8 });
                        }
                        setShowImageList(true);
                      } else if (!newValue.includes("@")) {
                        setShowImageList(false);
                      }
                    }}
                    style={{ height: textareaHeight }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-6 h-3 cursor-ns-resize flex items-center justify-center"
                    onMouseDown={() => setDragging(true)}
                  >
                    <svg className="w-4 h-4 text-zinc-500 hover:text-zinc-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="6" cy="12" r="1"></circle>
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="18" cy="12" r="1"></circle>
                      <circle cx="6" cy="15" r="1"></circle>
                      <circle cx="12" cy="15" r="1"></circle>
                      <circle cx="18" cy="15" r="1"></circle>
                    </svg>
                  </div>

                  {showImageList && referenceImages.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg shadow-[0_-4px_20px_rgba(0,0,0,0.6),0_4px_20px_rgba(0,0,0,0.4)] border border-zinc-700/50 py-2 px-3 z-50 bg-[#1a1a1c]">
                      <div className="text-xs font-medium text-zinc-400 mb-2 px-1">选择图片引用</div>
                      <div className="grid grid-cols-3 gap-2">
                        {referenceImages.map((img, index) => (
                          <button
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700/50 hover:border-indigo-500/50 transition-colors cursor-pointer group"
                            onClick={() => {
                              if (textareaRef.current) {
                                const selection = window.getSelection();
                                if (selection && selection.rangeCount > 0) {
                                  const range = selection.getRangeAt(0);
                                  range.deleteContents();
                                  
                                  const span = document.createElement("span");
                                  span.className = "inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-800 overflow-hidden border border-zinc-700/50 mx-0.5 align-middle";
                                  span.contentEditable = "false";
                                  span.dataset.imageIndex = String(index);
                                  
                                  const imgElement = document.createElement("img");
                                  imgElement.src = referenceImages[index];
                                  imgElement.alt = `图${index + 1}`;
                                  imgElement.className = "w-full h-full object-cover";
                                  imgElement.style.width = "20px";
                                  imgElement.style.height = "20px";
                                  
                                  span.appendChild(imgElement);
                                  range.insertNode(span);
                                  
                                  const textNode = document.createTextNode(" ");
                                  range.insertNode(textNode);
                                  range.collapse(false);
                                  selection.removeAllRanges();
                                  selection.addRange(range);
                                }
                              }
                              setShowImageList(false);
                            }}
                          >
                            <NextImage
                              src={img}
                              alt={`参考图 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                              <span className="text-[10px] text-white">{index + 1}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col gap-2">
                <button
                  className="w-9 h-9 rounded-full bg-zinc-800/60 hover:bg-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-300 transition-all cursor-pointer"
                  disabled={isGenerating}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </button>

                <button
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer",
                    "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
                    "shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  )}
                  onClick={handleGenerate}
                  disabled={
                    !prompt.trim() ||
                    (mode === "image-to-image" && referenceImages.length === 0) ||
                    credits < imageCreditCost ||
                    isGenerating
                  }
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {referenceImages.length > 0 && (
              <div className="flex gap-2 mt-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                {referenceImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative group w-10 h-10 rounded-lg overflow-hidden border border-zinc-700/50"
                  >
                    <NextImage
                      src={img}
                      alt={`参考图 ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
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
                  <div className="relative w-10 h-10 rounded-lg border-2 border-dashed border-zinc-700/40 bg-zinc-800/30 flex items-center justify-center cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all">
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}