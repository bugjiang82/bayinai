"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Play,
  Download,
  Video,
  Clock,
  Film,
  MonitorPlay,
  Sparkles,
  Loader2,
  Coins,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/shared/ImageUploader";
import ProgressBar from "@/components/generate/ProgressBar";

interface VideoResult {
  id: string;
  url: string;
  prompt?: string;
  duration: number;
  fps: number;
  resolution: string;
}

type VideoMode = "text-to-video" | "image-to-video";

const DURATION_OPTIONS = [
  { value: 3, label: "3 秒" },
  { value: 5, label: "5 秒" },
  { value: 10, label: "10 秒" },
  { value: 15, label: "15 秒" },
];

const MODEL_OPTIONS = {
  "text-to-video": [
    { value: "wan2.7-t2v", label: "万相 2.7", desc: "文生视频" },
  ],
  "image-to-video": [
    { value: "wan2.2-kf2v-flash", label: "万相 2.2", desc: "快速生成" },
    { value: "wan2.7-i2v", label: "万相 2.7", desc: "高质量" },
  ],
};

const RESOLUTION_OPTIONS = [
  { value: "480P", label: "480P", desc: "854x480" },
  { value: "720P", label: "720P", desc: "1280x720" },
  { value: "1080P", label: "1080P", desc: "1920x1080" },
];

const RATIO_OPTIONS = [
  { value: "16:9", label: "16:9", desc: "横屏" },
  { value: "9:16", label: "9:16", desc: "竖屏" },
  { value: "1:1", label: "1:1", desc: "方形" },
  { value: "4:3", label: "4:3", desc: "标准" },
  { value: "3:4", label: "3:4", desc: "竖版" },
];

export default function VideoPage() {
  const [videoMode, setVideoMode] = useState<VideoMode>("image-to-video");
  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720P");
  const [ratio, setRatio] = useState("16:9");
  const [model, setModel] = useState("wan2.2-kf2v-flash");
  const [promptExtend, setPromptExtend] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState(100);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setModel(MODEL_OPTIONS[videoMode][0].value);
  }, [videoMode]);

  const handleStartUpload = useCallback((file: File) => {
    setStartImage(URL.createObjectURL(file));
  }, []);

  const handleRemoveStartImage = useCallback(() => {
    if (startImage?.startsWith("blob:")) {
      URL.revokeObjectURL(startImage);
    }
    setStartImage(null);
  }, [startImage]);

  const handleEndUpload = useCallback((file: File) => {
    setEndImage(URL.createObjectURL(file));
  }, []);

  const handleRemoveEndImage = useCallback(() => {
    if (endImage?.startsWith("blob:")) {
      URL.revokeObjectURL(endImage);
    }
    setEndImage(null);
  }, [endImage]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (videoMode === "image-to-video" && !startImage) return;

    const cost = 5;
    if (credits < cost) return;

    setIsGenerating(true);
    setProgress(0);
    setVideoResult(null);
    setErrorMessage(null);

    // Simulate progress while waiting for API
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 3 + 1;
      if (currentProgress >= 90) {
        currentProgress = 90;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
      setProgress(currentProgress);
    }, 800);

    try {
      // Upload images first if they are blob URLs
      let firstFrameUrl = startImage;
      let lastFrameUrl = endImage;

      // Upload start image
      if (startImage?.startsWith("blob:")) {
        const blob = await fetch(startImage).then(r => r.blob());
        const file = new File([blob], "start.jpg", { type: blob.type });
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("图片上传失败");
        const uploadData = await uploadRes.json();
        firstFrameUrl = uploadData.data.url;
      }

      // Upload end image if exists and is blob URL
      if (endImage?.startsWith("blob:")) {
        const blob = await fetch(endImage).then(r => r.blob());
        const file = new File([blob], "end.jpg", { type: blob.type });
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("图片上传失败");
        const uploadData = await uploadRes.json();
        lastFrameUrl = uploadData.data.url;
      }

      // Submit video generation task
      const requestBody: Record<string, unknown> = {
        prompt: prompt.trim(),
        resolution: resolution.toUpperCase(),
        duration,
        model,
        prompt_extend: promptExtend,
        mode: videoMode,
        ratio,
      };

      if (videoMode === "image-to-video") {
        requestBody.first_frame = firstFrameUrl;
        if (lastFrameUrl) {
          requestBody.last_frame = lastFrameUrl;
        }
      }

      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || "视频生成任务提交失败");
      }

      const data = await response.json();
      const { taskId } = data.data;

      if (!taskId) {
        throw new Error("未能获取任务 ID");
      }

      // Poll for video status
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/generate/video?taskId=${taskId}`);
          if (!statusRes.ok) {
            throw new Error("查询任务状态失败");
          }

          const statusData = await statusRes.json();
          const { status, progress: taskProgress, videoUrl } = statusData.data;

          // Update progress from server
          if (taskProgress !== undefined) {
            setProgress(taskProgress);
          }

          if (status === "SUCCEEDED" && videoUrl) {
            // Task completed
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }

            setProgress(100);
            setVideoResult({
              id: taskId,
              url: videoUrl,
              prompt: prompt.trim(),
              duration,
              fps: 24,
              resolution,
            });
            setCredits((prev) => Math.max(0, prev - cost));
            setIsGenerating(false);
          } else if (status === "FAILED") {
            // Task failed
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }

            setErrorMessage("视频生成失败，请重试");
            setIsGenerating(false);
            setProgress(0);
          }
          // For RUNNING / PENDING, continue polling
        } catch (pollError) {
          console.error("Polling error:", pollError);
        }
      }, 3000);
    } catch (error) {
      console.error("Video generation failed:", error);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setErrorMessage(error instanceof Error ? error.message : "视频生成失败");
      setIsGenerating(false);
      setProgress(0);
    }
  }, [prompt, duration, resolution, model, credits, startImage, endImage]);

  const getEstimatedTime = () => {
    const baseTime = duration * 4;
    const resMultiplier = resolution === "1080P" ? 1.5 : resolution === "480P" ? 0.7 : 1;
    return Math.round(baseTime * resMultiplier);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left: Video preview area (60%) */}
      <div className="w-[60%] flex flex-col min-w-0">
        <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 flex items-center justify-center min-h-[500px] overflow-hidden">
          {/* Empty state */}
          {!isGenerating && !videoResult && !errorMessage && (
            <div className="text-center px-8 py-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-400 mb-2">
                视频生成工作台
              </h3>
              <p className="text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
                上传起始图片并输入文字描述，
                <br />
                AI 将为你生成精彩视频内容
              </p>
            </div>
          )}

          {/* Error state */}
          {errorMessage && !isGenerating && (
            <div className="text-center px-8 py-12">
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-red-300 mb-2">
                生成失败
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Generating state */}
          {isGenerating && (
            <div className="text-center px-8 py-12 w-full max-w-md">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Film className="w-10 h-10 text-purple-400 animate-pulse" />
                </div>
              </div>
              <ProgressBar progress={progress} />
              <p className="text-sm text-zinc-400 mt-4">
                视频生成中，请耐心等待...
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                预计需要 {getEstimatedTime()} 秒
              </p>
            </div>
          )}

          {/* Video result */}
          {videoResult && !isGenerating && (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 relative bg-black">
                <video
                  src={videoResult.url}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-3 flex items-center justify-between border-t border-white/[0.06] bg-[#0a0a0a]">
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {videoResult.duration}s
                  </span>
                  <span className="flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    {videoResult.fps}fps
                  </span>
                  <span className="flex items-center gap-1">
                    <MonitorPlay className="w-3 h-3" />
                    {videoResult.resolution}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
                  onClick={() => window.open(videoResult.url, "_blank")}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  下载视频
                </Button>
              </div>
            </div>
          )}
        </div>
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
                    videoMode === "text-to-video"
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setVideoMode("text-to-video")}
                >
                  文生视频
                </button>
                <button
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                    videoMode === "image-to-video"
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setVideoMode("image-to-video")}
                >
                  图生视频
                </button>
              </div>
            </div>

            {videoMode === "image-to-video" && (
              <>
                {/* Start image upload */}
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    起始图片
                  </label>
                  {startImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0f0f0f]">
                      <div className="relative aspect-video">
                        <Image
                          src={startImage}
                          alt="起始图片"
                          fill
                          className="object-cover"
                          sizes="50vw"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-80 hover:opacity-100"
                        onClick={handleRemoveStartImage}
                      >
                        <span className="text-xs">X</span>
                      </Button>
                    </div>
                  ) : (
                    <ImageUploader
                      onUpload={handleStartUpload}
                      compact
                      className="!p-4"
                    />
                  )}
                  <p className="text-xs text-zinc-600 mt-1.5">
                    上传起始帧图片，AI 将以此为基础生成视频
                  </p>
                </div>

                {/* End image upload */}
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    结束图片（可选）
                  </label>
                  {endImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0f0f0f]">
                      <div className="relative aspect-video">
                        <Image
                          src={endImage}
                          alt="结束图片"
                          fill
                          className="object-cover"
                          sizes="50vw"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-80 hover:opacity-100"
                        onClick={handleRemoveEndImage}
                      >
                        <span className="text-xs">X</span>
                      </Button>
                    </div>
                  ) : (
                    <ImageUploader
                      onUpload={handleEndUpload}
                      compact
                      className="!p-4"
                    />
                  )}
                  <p className="text-xs text-zinc-600 mt-1.5">
                    上传结束帧图片，AI 将生成从起始到结束的过渡视频
                  </p>
                </div>
              </>
            )}

            {/* Text description */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                文字描述
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的视频内容...\n\n例如：一只蝴蝶在花丛中飞舞，阳光明媚，慢动作"
                maxLength={1000}
                className="min-h-[100px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-purple-500/30 focus-visible:border-purple-500/30"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-zinc-600 tabular-nums">
                  {prompt.length}/1000
                </span>
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                模型
              </label>
              <div className="flex gap-2">
                {MODEL_OPTIONS[videoMode].map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                      model === opt.value
                        ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                        : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                    )}
                    onClick={() => setModel(opt.value)}
                  >
                    {opt.label}
                    <span className="text-[10px] text-zinc-600 ml-1">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                视频时长
              </label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                      duration === opt.value
                        ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                        : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                    )}
                    onClick={() => setDuration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                分辨率
              </label>
              <div className="flex gap-2">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                      resolution === opt.value
                        ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                        : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                    )}
                    onClick={() => setResolution(opt.value)}
                  >
                    {opt.label}
                    <span className="text-[10px] text-zinc-600 ml-1">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mt-4">
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                画面比例
              </label>
              <div className="flex gap-2">
                {RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                      ratio === opt.value
                        ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                        : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                    )}
                    onClick={() => setRatio(opt.value)}
                  >
                    {opt.label}
                    <span className="text-[10px] text-zinc-600 ml-1">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Extend */}
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prompt-extend"
                  checked={promptExtend}
                  onChange={(e) => setPromptExtend(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                />
                <label htmlFor="prompt-extend" className="text-sm text-zinc-400 cursor-pointer">
                  启用 Prompt 智能改写
                </label>
              </div>
            </div>
          </div>

          {/* Bottom: Generate button + credits */}
          <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Coins className="w-3.5 h-3.5" />
                <span>
                  余额 <span className="text-zinc-300 font-medium">{credits}</span>{" "}
                  积分
                </span>
              </div>
              <span className="text-xs text-zinc-600">
                消耗{" "}
                <span
                  className={cn(
                    "font-medium",
                    credits < 5 ? "text-red-400" : "text-zinc-400"
                  )}
                >
                  5
                </span>{" "}
                积分/个
              </span>
            </div>
            <Button
              className={cn(
                "w-full h-11 text-sm font-semibold rounded-xl transition-all duration-300",
                "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
                "text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
              onClick={handleGenerate}
              disabled={!prompt.trim() || (videoMode === "image-to-video" && !startImage) || credits < 5 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成视频
                </>
              )}
            </Button>
            {!prompt.trim() && (
              <p className="text-xs text-zinc-600 text-center mt-2">
                请输入文字描述后开始生成
              </p>
            )}
            {videoMode === "image-to-video" && prompt.trim() && !startImage && (
              <p className="text-xs text-zinc-600 text-center mt-2">
                请上传起始图片
              </p>
            )}
            {prompt.trim() && credits < 5 && (
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
