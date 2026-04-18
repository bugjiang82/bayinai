"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ZoomIn,
  Palette,
  Image as ImageIcon,
  Sun,
  Paintbrush,
  Download,
  Sparkles,
  Loader2,
  Coins,
  Upload,
  RotateCcw,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/shared/ImageUploader";
import ProgressBar from "@/components/generate/ProgressBar";
import SelectionTool from "@/components/generate/SelectionTool";
import { KonvaCanvas } from "@/components/generate/KonvaCanvas";
import { Toolbox } from "@/components/generate/Toolbox";
import { useEditStore } from "@/store/editStore";

type EditMode =
  | "upscale"
  | "style-transfer"
  | "background-replace"
  | "color-adjust"
  | "inpaint";

interface EditModeOption {
  key: EditMode;
  label: string;
  icon: React.ElementType;
  desc: string;
}

const EDIT_MODES: EditModeOption[] = [
  { key: "upscale", label: "放大", icon: ZoomIn, desc: "提高图片分辨率" },
  {
    key: "style-transfer",
    label: "风格迁移",
    icon: Palette,
    desc: "转换图片艺术风格",
  },
  {
    key: "background-replace",
    label: "背景替换",
    icon: ImageIcon,
    desc: "替换图片背景",
  },
  {
    key: "color-adjust",
    label: "色彩调整",
    icon: Sun,
    desc: "调整亮度对比度等",
  },
  {
    key: "inpaint",
    label: "局部重绘",
    icon: Paintbrush,
    desc: "选择区域重新绘制",
  },
];

const STYLE_OPTIONS = [
  "油画风格",
  "水彩风格",
  "素描风格",
  "动漫风格",
  "赛博朋克",
  "复古胶片",
  "极简主义",
  "印象派",
];

export default function EditPage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("upscale");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [credits, setCredits] = useState(100);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const { setCurrentImage, clearShapes, setSelectionPath } = useEditStore();

  // Upscale params
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);

  // Style transfer params
  const [targetStyle, setTargetStyle] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");

  // Background replace params
  const [bgDescription, setBgDescription] = useState("");
  const [bgImage, setBgImage] = useState<string | null>(null);

  // Color adjust params
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);

  // Inpaint params
  const [inpaintDescription, setInpaintDescription] = useState("");
  const [maskImage, setMaskImage] = useState<string | null>(null);
  // 新增 nano-banana 控制参数
  const [structureRef, setStructureRef] = useState<string | null>(null);
  const [styleRef, setStyleRef] = useState<string | null>(null);
  const [structureStrength, setStructureStrength] = useState(0.9);
  const [styleStrength, setStyleStrength] = useState(0.6);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [negativePrompt, setNegativePrompt] = useState<string[]>([]);
  const [customNegativePrompt, setCustomNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [useImageSearch, setUseImageSearch] = useState(false);
  
  // Negative tags
  const NEGATIVE_TAGS = [
    { id: 'messy', label: '拒绝杂乱线条', prompt: 'messy lines, extra lines' },
    { id: 'watermark', label: '去除水印', prompt: 'watermark, text, signature' },
    { id: '2d', label: '拒绝 2D 感', prompt: 'flat, 2d, illustration, cartoon' },
    { id: 'blurry', label: '修复模糊', prompt: 'blurry, low quality, pixelated' },
    { id: 'deform', label: '畸变矫正', prompt: 'deformed, distorted, warped' },
  ];

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleSourceUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSourceImage(imageUrl);
      setCurrentImage(imageUrl);
      setResultImage(null);
      clearShapes();
      setSelectionPath(null);
    };
    reader.readAsDataURL(file);
  }, [setCurrentImage, clearShapes, setSelectionPath]);

  const handleBgImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBgImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleReset = useCallback(() => {
    setSourceImage(null);
    setResultImage(null);
    setIsProcessing(false);
    setProgress(0);
    setMaskImage(null);
    // 重置 nano-banana 控制参数
    setStructureRef(null);
    setStyleRef(null);
    setStructureStrength(0.9);
    setStyleStrength(0.6);
    setGuidanceScale(7.5);
    setNegativePrompt([]);
    setCustomNegativePrompt("");
    setAspectRatio("1:1");
    setUseGoogleSearch(false);
    setUseImageSearch(false);
    // 重置 editStore 状态
    setCurrentImage(null);
    clearShapes();
    setSelectionPath(null);
  }, [setCurrentImage, clearShapes, setSelectionPath]);

  const handleApply = useCallback(async () => {
    if (!sourceImage) return;

    const cost = 2;
    if (credits < cost) return;

    setIsProcessing(true);
    setProgress(0);
    setResultImage(null);

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress >= 90) {
        // 90% 时停止自动增长，等待 API 返回
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } else {
        setProgress(currentProgress);
      }
    }, 300);

    try {
      let response;

      if (editMode === "inpaint") {
        // Inpainting 模式
        if (!inpaintDescription.trim()) {
          throw new Error("请输入重绘描述");
        }

        // 这里需要从 editStore 中获取选区信息并生成 maskImage
        // 暂时使用 mock maskImage，后续需要实现从 KonvaCanvas 生成 maskImage
        const mockMaskImage = sourceImage;

        response = await fetch("/api/generate/inpaint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalImage: sourceImage,
            maskImage: mockMaskImage,
            prompt: inpaintDescription,
            structureRef,
            styleRef,
            structureStrength,
            styleStrength,
            guidanceScale,
            negativePrompt: negativePrompt.map(tagId => {
              const tag = NEGATIVE_TAGS.find(t => t.id === tagId);
              return tag ? tag.prompt : tagId;
            }),
            customNegativePrompt,
            aspectRatio,
            useGoogleSearch,
            useImageSearch,
          }),
        });
      } else {
        // 其他模式暂时使用 mock，后续可以扩展
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setResultImage(sourceImage);
        setCredits((prev) => Math.max(0, prev - cost));
        setIsProcessing(false);
        setProgress(100);
        return;
      }

      const result = await response.json();
      console.log("API Response:", result);

      if (result.code !== 0) {
        throw new Error(result.message || "生成失败");
      }

      // 处理结果
      console.log("outputBase64:", result.data.outputBase64);
      console.log("outputUrl:", result.data.outputUrl);
      
      if (result.data.outputBase64) {
        const imageUrl = `data:image/png;base64,${result.data.outputBase64}`;
        console.log("Setting resultImage from outputBase64:", imageUrl);
        setResultImage(imageUrl);
      } else if (result.data.outputUrl) {
        console.log("Setting resultImage from outputUrl:", result.data.outputUrl);
        setResultImage(result.data.outputUrl);
      } else {
        console.error("No image data in response");
      }

      setCredits((prev) => Math.max(0, prev - cost));
      setIsProcessing(false);
      setProgress(100);

    } catch (error) {
      console.error("Edit failed:", error);
      setIsProcessing(false);
      setProgress(0);
      // 显示错误信息
      alert(error instanceof Error ? error.message : "生成失败，请重试");
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [sourceImage, credits, editMode, inpaintDescription, structureRef, styleRef, structureStrength, styleStrength, guidanceScale, negativePrompt, customNegativePrompt, aspectRatio, useGoogleSearch, useImageSearch]);

  const renderModeParams = () => {
    switch (editMode) {
      case "upscale":
        return (
          <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <label className="text-xs text-zinc-400">放大倍率</label>
            <div className="flex gap-2">
              {([2, 4] as const).map((factor) => (
                <button
                  key={factor}
                  className={cn(
                    "flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                    upscaleFactor === factor
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setUpscaleFactor(factor)}
                >
                  {factor}x
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600">
              {upscaleFactor === 2
                ? "将图片放大 2 倍，适合一般用途"
                : "将图片放大 4 倍，适合大尺寸输出"}
            </p>
          </div>
        );

      case "style-transfer":
        return (
          <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <label className="text-xs text-zinc-400">目标风格</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                    targetStyle === style
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                  )}
                  onClick={() => setTargetStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-zinc-400 mt-2 block">
                补充描述（可选）
              </label>
              <Textarea
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="描述你想要的风格细节..."
                className="min-h-[60px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 mt-1"
              />
            </div>
          </div>
        );

      case "background-replace":
        return (
          <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <label className="text-xs text-zinc-400">新背景描述</label>
            <Textarea
              value={bgDescription}
              onChange={(e) => setBgDescription(e.target.value)}
              placeholder="描述你想要的新背景...\n例如：纯白色背景 / 蓝天白云 / 办公室环境"
              className="min-h-[80px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <div className="relative">
              <p className="text-xs text-zinc-500 mb-2">或上传背景图片</p>
              {bgImage ? (
                <div className="relative rounded-lg overflow-hidden border border-white/[0.08]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bgImage}
                    alt="背景图片"
                    className="w-full h-24 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                    onClick={() => setBgImage(null)}
                  >
                    <span className="text-[10px]">X</span>
                  </Button>
                </div>
              ) : (
                <ImageUploader
                  onUpload={handleBgImageUpload}
                  compact
                  className="!p-3"
                />
              )}
            </div>
          </div>
        );

      case "color-adjust":
        return (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">亮度</label>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {brightness > 0 ? "+" : ""}
                  {brightness}
                </span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([v]) => setBrightness(v)}
                min={-100}
                max={100}
                step={5}
                className="py-1"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">对比度</label>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {contrast > 0 ? "+" : ""}
                  {contrast}
                </span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([v]) => setContrast(v)}
                min={-100}
                max={100}
                step={5}
                className="py-1"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">饱和度</label>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {saturation > 0 ? "+" : ""}
                  {saturation}
                </span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={([v]) => setSaturation(v)}
                min={-100}
                max={100}
                step={5}
                className="py-1"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-zinc-500 hover:text-zinc-300"
              onClick={() => {
                setBrightness(0);
                setContrast(0);
                setSaturation(0);
              }}
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              重置参数
            </Button>
          </div>
        );

      case "inpaint":
        return (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
              <p className="text-xs text-indigo-400/80">
                使用左侧画布中的选区工具绘制需要重绘的区域：<br/>
                • 套索工具：点击添加锚点，闭合生成选区<br/>
                • 笔刷工具：直接绘制选区<br/>
                • 橡皮擦：擦除选区
              </p>
            </div>
            
            <div>
              <label className="text-xs text-zinc-400">重绘描述</label>
              <Textarea
                value={inpaintDescription}
                onChange={(e) => setInpaintDescription(e.target.value)}
                placeholder="描述你想要在选中区域生成的内容..."
                className="min-h-[60px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 mt-1"
              />
            </div>
            
            {/* 图像参考控制 */}
            <div>
              <label className="text-xs text-zinc-400 block mb-2">图像参考控制</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-zinc-500 mb-1">结构/线稿</div>
                  <div className="border border-white/[0.08] rounded-lg overflow-hidden">
                    {structureRef ? (
                      <div className="relative">
                        <img 
                          src={structureRef} 
                          alt="结构参考" 
                          className="w-full h-20 object-cover"
                        />
                        <button
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70"
                          onClick={() => setStructureRef(null)}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-20 cursor-pointer hover:bg-white/[0.04]">
                        <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                        <span className="text-[11px] text-zinc-500">上传参考图</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setStructureRef(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 mb-1">风格参考</div>
                  <div className="border border-white/[0.08] rounded-lg overflow-hidden">
                    {styleRef ? (
                      <div className="relative">
                        <img 
                          src={styleRef} 
                          alt="风格参考" 
                          className="w-full h-20 object-cover"
                        />
                        <button
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70"
                          onClick={() => setStyleRef(null)}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-20 cursor-pointer hover:bg-white/[0.04]">
                        <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                        <span className="text-[11px] text-zinc-500">上传参考图</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setStyleRef(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 滑块控制 */}
            <div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>还原度 (Structure)</span>
                    <span>{structureStrength.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[structureStrength * 100]}
                    onValueChange={([v]) => setStructureStrength(v / 100)}
                    min={0}
                    max={100}
                    step={1}
                    className="py-1"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>风格浸染 (Style)</span>
                    <span>{styleStrength.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[styleStrength * 100]}
                    onValueChange={([v]) => setStyleStrength(v / 100)}
                    min={0}
                    max={100}
                    step={1}
                    className="py-1"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>AI 脑洞 (Guidance)</span>
                    <span>{guidanceScale.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[guidanceScale]}
                    onValueChange={([v]) => setGuidanceScale(v)}
                    min={3}
                    max={15}
                    step={0.5}
                    className="py-1"
                  />
                </div>
              </div>
            </div>
            
            {/* 负向提示词 */}
            <div>
              <label className="text-xs text-zinc-400 block mb-2">一键避雷</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {NEGATIVE_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setNegativePrompt(prev => 
                      prev.includes(tag.id)
                        ? prev.filter(id => id !== tag.id)
                        : [...prev, tag.id]
                    )}
                    className={`px-2 py-0.5 rounded-md text-[10px] border transition-all ${
                      negativePrompt.includes(tag.id)
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/[0.04] border-white/[0.06] text-zinc-500 hover:border-white/[0.15] hover:text-zinc-300'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">自定义排除项</label>
                <Input
                  value={customNegativePrompt}
                  onChange={(e) => setCustomNegativePrompt(e.target.value)}
                  placeholder="例如：ugly, blurry, lowres..."
                  className="text-xs bg-[#0f0f0f] border-white/[0.08] text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
            </div>
            
            {/* 高级选项 */}
            <div>
              <label className="text-xs text-zinc-400 block mb-2">高级选项</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-zinc-500 mb-1">宽高比</div>
                  <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
                    {["1:1", "16:9", "9:16"].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 px-2 py-1 text-[10px] rounded-md transition-all ${
                          aspectRatio === ratio
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 mb-1">搜索增强</div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[10px] text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGoogleSearch}
                        onChange={(e) => setUseGoogleSearch(e.target.checked)}
                        className="w-3 h-3 rounded border-white/[0.15] bg-[#0f0f0f] text-indigo-500 focus:ring-indigo-500"
                      />
                      使用 Google 搜索
                    </label>
                    {useGoogleSearch && (
                      <label className="flex items-center gap-2 text-[10px] text-zinc-400 cursor-pointer ml-5">
                        <input
                          type="checkbox"
                          checked={useImageSearch}
                          onChange={(e) => setUseImageSearch(e.target.checked)}
                          className="w-3 h-3 rounded border-white/[0.15] bg-[#0f0f0f] text-indigo-500 focus:ring-indigo-500"
                        />
                        包含图片搜索
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left: Image edit area (70%) */}
      <div className="w-[70%] flex flex-col min-w-0">
        <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 flex items-center justify-center min-h-[500px] overflow-hidden">
          {/* Empty state - no source image */}
          {!sourceImage && !isProcessing && (
            <div className="text-center px-8 py-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                <Paintbrush className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-400 mb-2">
                图片编辑工作台
              </h3>
              <p className="text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed mb-6">
                上传需要编辑的图片，选择编辑模式
                <br />
                AI 将帮你完成专业级图片处理
              </p>
              <ImageUploader onUpload={handleSourceUpload} />
            </div>
          )}

          {/* Source image with processing */}
          {sourceImage && !isProcessing && !resultImage && (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 flex">
                {editMode === "inpaint" ? (
                  <>
                    <Toolbox />
                    <KonvaCanvas className="flex-1" />
                  </>
                ) : (
                  <div className="flex-1 relative flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sourceImage}
                      alt="源图片"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-center border-t border-white/[0.06] bg-[#0a0a0a]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                  onClick={handleReset}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  重新上传图片
                </Button>
              </div>
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="text-center px-8 py-12 w-full max-w-md">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Paintbrush className="w-10 h-10 text-amber-400 animate-pulse" />
                </div>
              </div>
              <ProgressBar progress={progress} />
              <p className="text-sm text-zinc-400 mt-4">正在处理图片...</p>
            </div>
          )}

          {/* Result image */}
          {resultImage && !isProcessing && (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 relative flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultImage}
                  alt="编辑结果"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <div className="absolute top-6 right-6">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">
                      编辑完成
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between border-t border-white/[0.06] bg-[#0a0a0a]">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    重新编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                    onClick={handleReset}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    重新上传图片
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                  onClick={() => window.open(resultImage, "_blank")}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  下载结果
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Edit tools panel (30%) */}
      <div className="w-[30%] flex flex-col min-w-[300px] max-w-[400px]">
        <div className="flex flex-col h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Edit mode selection */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                编辑模式
              </label>
              <div className="space-y-1">
                {EDIT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = editMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent"
                      )}
                      onClick={() => setEditMode(mode.key)}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-indigo-400" : "text-zinc-600"
                        )}
                      />
                      <div>
                        <span className="text-sm font-medium block">
                          {mode.label}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {mode.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

            {/* Mode-specific params */}
            <div>{renderModeParams()}</div>
          </div>

          {/* Bottom: Apply button + credits */}
          <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a]">
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
                    credits < 2 ? "text-red-400" : "text-zinc-400"
                  )}
                >
                  2
                </span>{" "}
                积分/次
              </span>
            </div>
            <Button
              className={cn(
                "w-full h-11 text-sm font-semibold rounded-xl transition-all duration-300",
                "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500",
                "text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              )}
              onClick={handleApply}
              disabled={
                !sourceImage || 
                credits < 2 || 
                isProcessing ||
                (editMode === "inpaint" && !inpaintDescription.trim())
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  应用编辑
                </>
              )}
            </Button>
            {!sourceImage && (
              <p className="text-xs text-zinc-600 text-center mt-2">
                请先上传需要编辑的图片
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
