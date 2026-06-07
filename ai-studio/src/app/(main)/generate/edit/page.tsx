"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  RefreshCw,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/shared/ImageUploader";
import ProgressBar from "@/components/generate/ProgressBar";
import DropdownSelector from "@/components/generate/DropdownSelector";
import SelectionTool from "@/components/generate/SelectionTool";
import KonvaCanvas from "@/components/generate/KonvaCanvas";
import { Toolbox } from "@/components/generate/Toolbox";
import ComparisonSlider from "@/components/generate/ComparisonSlider";
import { useEditStore } from "@/store/editStore";
import OutpaintCanvas, { type OutpaintCanvasRef } from "@/components/generate/OutpaintCanvas";
import { useOutpaintStore } from "@/store/outpaintStore";
import { useCreditPolicies } from "@/hooks/useCreditPolicies";

type EditMode = "style-transfer" | "inpaint" | "outpainting";

interface EditModeOption {
  key: EditMode;
  label: string;
  icon: React.ElementType;
  desc: string;
}

const EDIT_MODES: EditModeOption[] = [
  {
    key: "style-transfer",
    label: "风格迁移",
    icon: Palette,
    desc: "转换图片艺术风格",
  },
  {
    key: "inpaint",
    label: "局部重绘",
    icon: Paintbrush,
    desc: "选择区域重新绘制",
  },
  {
    key: "outpainting",
    label: "扩图",
    icon: Maximize2,
    desc: "向外扩展画面边界",
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

const INPAINT_MODEL_OPTIONS = [
  { value: "flash", label: "Flash", description: "快速生成" },
  { value: "pro", label: "Pro", description: "高质量" },
  { value: "image2", label: "Image2", description: "超强图像生成" },
];

const INPAINT_SIZE_OPTIONS = [
  { value: "1K", label: "1K", description: "标准" },
  { value: "2K", label: "2K", description: "高清" },
  { value: "4K", label: "4K", description: "超高清" },
];

const INPAINT_RATIO_OPTIONS = [
  { value: "1:1", label: "1:1", description: "方形" },
  { value: "16:9", label: "16:9", description: "横屏" },
  { value: "9:16", label: "9:16", description: "竖屏" },
  { value: "21:9", label: "21:9", description: "超宽屏" },
  { value: "4:3", label: "4:3", description: "标准" },
  { value: "3:4", label: "3:4", description: "竖版" },
];

const OUTPAINT_MODEL_OPTIONS = [
  { value: "flash", label: "Flash", description: "快速扩展" },
  { value: "pro", label: "Pro", description: "高质量扩展" },
  { value: "image2", label: "Image2", description: "超强图像扩展" },
];

const OUTPAINT_RATIO_OPTIONS = [
  { value: "1:1", label: "1:1", description: "方形" },
  { value: "16:9", label: "16:9", description: "横屏" },
  { value: "9:16", label: "9:16", description: "竖屏" },
  { value: "4:3", label: "4:3", description: "标准" },
  { value: "3:4", label: "3:4", description: "竖版" },
  { value: "21:9", label: "21:9", description: "超宽屏" },
  { value: "free", label: "自由", description: "自由比例" },
  { value: "custom", label: "自定义", description: "输入比例" },
];

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
      if (w > h) {
        h = Math.round(h * (MAX_DIM / w));
        w = MAX_DIM;
      } else {
        w = Math.round(w * (MAX_DIM / h));
        h = MAX_DIM;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { callback(dataUrl); return; }
    ctx.drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL("image/jpeg", 0.85));
  };
  img.src = dataUrl;
}

export default function EditPage() {
  const searchParams = useSearchParams();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("inpaint");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const applyAttemptsRef = useRef<number>(0);

  const { data: session } = useSession();
  const { setCurrentImage, clearShapes, setSelectionPath } = useEditStore();
  const konvaCanvasRef = useRef<any>(null);

  useEffect(() => {
    const sessionCredits = (session?.user as { credits?: number })?.credits;
    if (sessionCredits !== undefined) {
      setCredits(sessionCredits);
    }
  }, [session]);

  useEffect(() => {
    const imageUrl = searchParams.get("image");
    const prompt = searchParams.get("prompt");
    if (imageUrl) {
      setSourceImage(imageUrl);
      setCurrentImage(imageUrl);
      setResultImage(null);
      clearShapes();
      setSelectionPath(null);
      // 检测图片原始尺寸
      const img = new Image();
      img.onload = () => {
        setOriginalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = imageUrl;
    }
  }, [searchParams, setCurrentImage, clearShapes, setSelectionPath]);
  
  const generateMask = useCallback(() => {
    if (konvaCanvasRef.current) {
      return konvaCanvasRef.current.generateMask();
    }
    return null;
  }, []);

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
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  
  // 新增统一参数选项
  const [model, setModel] = useState("flash");
  const [resolution, setResolution] = useState("1K");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [image2Count, setImage2Count] = useState(1);
  const [image2Thinking, setImage2Thinking] = useState("off");
  const [image2ReferenceImages, setImage2ReferenceImages] = useState<string[]>([]);

  const outpaintCanvasRef = useRef<OutpaintCanvasRef>(null);
  const {
    prompt: outpaintPrompt,
    setPrompt: setOutpaintPrompt,
    aspectRatio: outpaintAspectRatio,
    setAspectRatio: setOutpaintAspectRatio,
    customRatio: outpaintCustomRatio,
    setCustomRatio: setOutpaintCustomRatio,
    modelName: outpaintModel,
    setModelName: setOutpaintModel,
    isProcessing: outpaintIsProcessing,
    setIsProcessing: setOutpaintIsProcessing,
    reset: resetOutpaintStore,
  } = useOutpaintStore();

  // 使用积分策略hook获取实时成本
  const { getCostByType, getImageCostFromApi } = useCreditPolicies();
  const [inpaintCost, setInpaintCost] = useState(1);
  const [outpaintCost, setOutpaintCost] = useState(2);

  // 当模型变化时重新计算积分成本
  useEffect(() => {
    const loadCost = async () => {
      if (editMode === "outpainting") {
        // outpaintModel 存储的是完整 API 模型名（如 gemini-2.5-flash-image），
        // 需要转换为短名称（flash/pro/image2）以匹配后台策略键
        const shortModel = outpaintModel === "gemini-3.1-flash-image-preview" ? "pro"
          : outpaintModel === "gpt-image-2" ? "image2"
          : "flash";
        const cost = await getCostByType("outpaint", shortModel);
        setOutpaintCost(cost);
      } else {
        const cost = await getCostByType("edit", model);
        setInpaintCost(cost);
      }
    };
    loadCost();
  }, [editMode, model, outpaintModel, getCostByType]);

  // 自动检测原图尺寸并计算比例
  const detectImageAspectRatio = useCallback((imageUrl: string): string => {
    if (originalImageSize) {
      const ratio = originalImageSize.width / originalImageSize.height;
      if (Math.abs(ratio - 1) < 0.1) return "1:1";
      if (ratio > 1.2) return "16:9";
      if (ratio < 0.85) return "9:16";
      return "1:1";
    }
    return "1:1";
  }, [originalImageSize]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // 局部重绘模式：上传图片后自动检测比例并锁定，不可手动修改
  useEffect(() => {
    if (editMode === "inpaint" && sourceImage && originalImageSize) {
      const detected = detectImageAspectRatio(sourceImage);
      if (detected && detected !== aspectRatio) {
        setAspectRatio(detected);
      }
    }
  }, [editMode, sourceImage, originalImageSize, detectImageAspectRatio, aspectRatio]);

  const handleSourceUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      compressImageForUpload(rawDataUrl, (compressed) => {
        setSourceImage(compressed);
        setCurrentImage(compressed);
        setResultImage(null);
        clearShapes();
        setSelectionPath(null);
        const img = new Image();
        img.onload = () => {
          setOriginalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = rawDataUrl;
      });
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

  const handleReplaceImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSourceImage(imageUrl);
      setCurrentImage(imageUrl);
      setResultImage(null);
      clearShapes();
      setSelectionPath(null);
      // 检测图片原始尺寸
      const img = new Image();
      img.onload = () => {
        setOriginalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }, [setCurrentImage, clearShapes, setSelectionPath]);

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setSourceImage(null);
    setResultImage(null);
    setIsProcessing(false);
    setIsApplying(false);
    setProgress(0);
    setMaskImage(null);
    setStructureRef(null);
    setStyleRef(null);
    setOriginalImageSize(null);
    applyAttemptsRef.current = 0;
    setCurrentImage(null);
    clearShapes();
    setSelectionPath(null);
    resetOutpaintStore();
  }, [setCurrentImage, clearShapes, setSelectionPath, resetOutpaintStore]);

  const handleApply = useCallback(async () => {
    if (!sourceImage) return;
    if (isApplying) return;

    const cost = editMode === "outpainting" ? outpaintCost : inpaintCost;
    if (credits < cost) return;

    setIsApplying(true);
    setIsProcessing(true);
    setProgress(0);
    setResultImage(null);

    applyAttemptsRef.current += 1;
    const currentAttempt = applyAttemptsRef.current;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      if (currentAttempt !== applyAttemptsRef.current) return;
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress >= 90) {
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
        if (!inpaintDescription.trim()) {
          throw new Error("请输入重绘描述");
        }

        const maskImage = generateMask();
        if (!maskImage) {
          throw new Error("无法生成选区 mask，请重新绘制选区");
        }

        const requestOptions: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortControllerRef.current?.signal,
          body: JSON.stringify({
            originalImage: sourceImage,
            maskImage: maskImage,
            prompt: inpaintDescription,
            structureRef,
            styleRef,
            model,
            imageSize: resolution,
            aspectRatio,
            n: model === "image2" ? image2Count : 1,
            quality: model === "image2" ? "low" : undefined,
            thinking: model === "image2" ? image2Thinking : undefined,
            referenceImages: model === "image2" ? image2ReferenceImages : undefined,
          }),
        };

        const timeoutMs = model === "image2" ? 180000 : 90000;
        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, timeoutMs);

        try {
          response = await fetch("/api/generate/inpaint", requestOptions);
        } finally {
          clearTimeout(timeoutId);
        }
      } else if (editMode === "outpainting") {
        if (!outpaintPrompt.trim()) {
          throw new Error("请输入扩图描述");
        }

        const paddedImage = await outpaintCanvasRef.current?.buildPaddedImage?.();
        if (!paddedImage) {
          throw new Error("无法构建扩展画布");
        }

        const box = outpaintCanvasRef.current?.getBox?.();

        const requestOptions: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortControllerRef.current?.signal,
          body: JSON.stringify({
            originalImage: sourceImage,
            paddedImage,
            prompt: outpaintPrompt,
            model: outpaintModel === "gemini-3.1-flash-image-preview" ? "pro" : outpaintModel === "gpt-image-2" ? "image2" : "flash",
            aspectRatio: outpaintAspectRatio,
            box,
          }),
        };

        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, 90000);

        try {
          response = await fetch("/api/generate/outpaint", requestOptions);
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setResultImage(sourceImage);
        setCredits((prev) => Math.max(0, prev - cost));
        setIsProcessing(false);
        setProgress(100);
        return;
      }

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info("API Response:", result);

      if (result.code !== 0) {
        throw new Error(result.message || "生成失败");
      }

      // 处理结果 - 检查是否当前请求仍然有效
      if (currentAttempt !== applyAttemptsRef.current) {
        return;
      }

      logger.info("outputBase64:", result.data.outputBase64);
      logger.info("outputUrl:", result.data.outputUrl);

      if (result.data.outputBase64) {
        const imageUrl = `data:image/png;base64,${result.data.outputBase64}`;
        logger.info("Setting resultImage from outputBase64:", imageUrl);
        setResultImage(imageUrl);
      } else if (result.data.outputUrl) {
        logger.info("Setting resultImage from outputUrl:", result.data.outputUrl);
        setResultImage(result.data.outputUrl);
      } else {
        throw new Error("响应中没有图像数据");
      }

      setCredits((prev) => Math.max(0, prev - cost));
      setIsProcessing(false);
      setProgress(100);
      setIsApplying(false);

    } catch (error) {
      if (currentAttempt !== applyAttemptsRef.current) {
        return;
      }
      logger.error("Edit failed:", error);
      setIsProcessing(false);
      setProgress(0);
      setIsApplying(false);
      const errorMessage = error instanceof Error ? error.message : "生成失败，请重试";
      logger.error(errorMessage);
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      abortControllerRef.current = null;
    }
  }, [sourceImage, credits, editMode, inpaintDescription, structureRef, styleRef, detectImageAspectRatio, generateMask, isApplying, outpaintPrompt, outpaintModel, outpaintAspectRatio, outpaintCost, inpaintCost]);

  const renderModeParams = () => {
    switch (editMode) {
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

      case "inpaint":
        return (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
              <p className="text-xs text-indigo-400/80">
                使用左侧画布中的选区工具绘制需要重绘的区域：<br/>
                • 套索工具：点击添加锚点，双击或点击起点闭合选区<br/>
                • 多边形工具：点击添加顶点，双击或点击起点闭合多边形<br/>
                • 笔刷工具：直接绘制选区<br/>
                • 橡皮擦：擦除选区<br/>
                • 矩形/圆形工具：拖拽创建选区
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
            
            {/* 模型选择 */}
            <DropdownSelector
              label="大模型"
              value={model}
              options={INPAINT_MODEL_OPTIONS}
              onChange={setModel}
            />
            
            {/* 图片质量选择 */}
            <DropdownSelector
              label="图片质量"
              value={resolution}
              options={INPAINT_SIZE_OPTIONS}
              onChange={setResolution}
            />
            
            {/* 图片比例选择 */}
            <DropdownSelector
              label="图片比例（自动识别）"
              value={aspectRatio}
              options={INPAINT_RATIO_OPTIONS}
              onChange={setAspectRatio}
              disabled={true}
            />

            {/* Image2 多图参考上传 */}
            {model === "image2" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">生成数量</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setImage2Count(n)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                          image2Count === n
                            ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                            : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                        )}
                      >
                        {n}张
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">思考级别</label>
                  <div className="flex gap-2">
                    {["off", "low", "medium", "high"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setImage2Thinking(t)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                          image2Thinking === t
                            ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                            : "bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:border-white/[0.15] hover:text-zinc-300"
                        )}
                      >
                        {t === "off" ? "关闭" : t === "low" ? "低" : t === "medium" ? "中" : "高"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">参考图片（可选）</label>
                  <div className="grid grid-cols-3 gap-2">
                    {image2ReferenceImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/[0.08] group">
                        <img src={img} alt={`参考 ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={() => setImage2ReferenceImages((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <span className="text-white text-sm">移除</span>
                        </button>
                      </div>
                    ))}
                    {image2ReferenceImages.length < 8 && (
                      <ImageUploader
                        onUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const dataUrl = e.target?.result as string;
                            setImage2ReferenceImages((prev) => [...prev, dataUrl]);
                          };
                          reader.readAsDataURL(file);
                        }}
                        compact
                        className="h-full"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "outpainting":
        return renderOutpaintParams();

      default:
        return null;
    }
  };

  const renderOutpaintParams = () => {
    return (
      <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
          <p className="text-xs text-indigo-400/80">
            拖拽画布中的锚点来扩展画面边界：<br />
            • 四角锚点：自由调整宽高<br />
            • 边缘锚点：调整上下左右边界<br />
            • 棋盘格区域为AI生成区域<br />
            • 原图内容不受影响
          </p>
        </div>

        <div>
          <label className="text-xs text-zinc-400">扩图描述</label>
          <Textarea
            value={outpaintPrompt}
            onChange={(e) => setOutpaintPrompt(e.target.value)}
            placeholder="描述你希望在扩展区域生成的内容..."
            className="min-h-[60px] resize-none bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600 mt-1"
          />
        </div>

        <DropdownSelector
          label="大模型"
          value={outpaintModel === "gemini-2.5-flash-image" ? "flash" : outpaintModel === "gemini-3.1-flash-image-preview" ? "pro" : "image2"}
          options={OUTPAINT_MODEL_OPTIONS}
          onChange={(v) =>
            setOutpaintModel(
              v === "pro" ? "gemini-3.1-flash-image-preview" : v === "image2" ? "gpt-image-2" : "gemini-2.5-flash-image"
            )
          }
        />

        <DropdownSelector
          label="画面比例"
          value={outpaintAspectRatio}
          options={OUTPAINT_RATIO_OPTIONS}
          onChange={(v) => setOutpaintAspectRatio(v as any)}
        />

        {outpaintAspectRatio === "custom" && (
          <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <Input
              placeholder="输入宽高比，如 3:2"
              value={outpaintCustomRatio}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9:]/g, "");
                setOutpaintCustomRatio(val);
              }}
              className="bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-600">
              格式: 宽度:高度，例如 3:2、5:4
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <input
        ref={replaceImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleReplaceImage(file);
            e.target.value = '';
          }
        }}
      />
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
                请在右侧面板上传需要编辑的图片
              </p>
            </div>
          )}

          {/* Source image with processing */}
          {sourceImage && !isProcessing && !resultImage && (
            <div className="w-full h-full flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                {editMode === "inpaint" ? (
                    <>
                      <Toolbox />
                      <KonvaCanvas ref={konvaCanvasRef} className="flex-1" />
                    </>
                  ) : editMode === "outpainting" ? (
                    <OutpaintCanvas
                      ref={outpaintCanvasRef}
                      className="flex-1"
                      imageSrc={sourceImage!}
                    />
                  ) : (
                  <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sourceImage}
                      alt="源图片"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 border border-white/10"
                      onClick={() => replaceImageInputRef.current?.click()}
                    >
                      <RefreshCw className="w-4 h-4 text-white" />
                    </Button>
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

          {/* Result image with comparison */}
          {resultImage && !isProcessing && (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 relative flex items-center justify-center p-4">
                <ComparisonSlider
                  beforeImage={sourceImage || ""}
                  afterImage={resultImage}
                  beforeLabel="Original"
                  afterLabel="AI Edited"
                  className="w-full h-full max-w-4xl max-h-[60vh]"
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
                  onClick={async () => {
                    try {
                      let blob: Blob;
                      if (resultImage.startsWith("data:")) {
                        const base64 = resultImage.split(",")[1];
                        const binary = atob(base64);
                        const array = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                          array[i] = binary.charCodeAt(i);
                        }
                        blob = new Blob([array], { type: "image/png" });
                      } else {
                        const response = await fetch(resultImage);
                        blob = await response.blob();
                      }
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `ai-studio-edit-${Date.now()}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch {
                      window.open(resultImage, "_blank");
                    }
                  }}
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
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
            {/* Image Upload - Top of the panel */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                上传图片
              </label>
              <ImageUploader onUpload={handleSourceUpload} preview={sourceImage} storageKey="" compact />
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

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

          {/* Bottom: Apply button + cost display */}
          <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] flex-shrink-0">
            <div className="flex items-center justify-end mb-3">
              <span className="text-xs text-zinc-600">
                消耗{
                  " "
                }
                <span
                  className={cn(
                    "font-medium",
                    credits > 0 && credits < (
                      editMode === "outpainting" ? outpaintCost : inpaintCost
                    ) ? "text-red-400" : "text-zinc-400"
                  )}
                >
                  {editMode === "outpainting" ? outpaintCost : inpaintCost}
                </span>{
                  " "
                }
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
                credits < (editMode === "outpainting" ? outpaintCost : inpaintCost) || 
                isProcessing ||
                (editMode === "inpaint" && !inpaintDescription.trim()) ||
                (editMode === "outpainting" && !outpaintPrompt.trim())
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
