"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  Download,
  Heart,
  ImagePlus,
  ZoomIn,
  Maximize,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ProgressBar from "@/components/generate/ProgressBar";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
}

interface CanvasProps {
  images: CanvasImage[];
  isGenerating: boolean;
  progress: number;
  onImageClick?: (image: CanvasImage) => void;
  onImageAction?: (action: string, image: CanvasImage) => void;
  className?: string;
}

export default function Canvas({
  images,
  isGenerating,
  progress,
  onImageClick,
  onImageAction,
  className,
}: CanvasProps) {
  const [selectedImage, setSelectedImage] = useState<CanvasImage | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const imageRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (image: CanvasImage) => {
    setSelectedImage(image);
    onImageClick?.(image);
  };

  const handleDownload = async (image: CanvasImage, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-studio-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(image.url, "_blank");
    }
  };

  const handleFavorite = (image: CanvasImage, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(image.id)) {
        next.delete(image.id);
      } else {
        next.add(image.id);
      }
      return next;
    });
    onImageAction?.("favorite", image);
  };

  const handleUseAsReference = (image: CanvasImage, e: React.MouseEvent) => {
    e.stopPropagation();
    onImageAction?.("use-as-reference", image);
  };

  // Empty state
  if (!isGenerating && images.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0a0a0a]/50 min-h-[500px]",
          className
        )}
      >
        <div className="text-center px-8 py-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-400 mb-2">
            你的创作画布
          </h3>
          <p className="text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
            在右侧输入提示词，调整参数后点击生成，
            <br />
            AI 将在这里为你呈现精彩的图像作品
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            {["现代建筑", "自然风光", "人物肖像"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs text-zinc-500 bg-white/[0.04] border border-white/[0.06]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 min-h-[500px]",
          className
        )}
      >
        <div className="text-center px-8 py-12 w-full max-w-md">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <ProgressBar progress={progress} />
          <p className="text-sm text-zinc-400 mt-4">
            AI 正在为你创作中...
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            预计需要 10-30 秒，请耐心等待
          </p>
        </div>
      </div>
    );
  }

  // Results state
  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-4 min-h-[500px]",
          className
        )}
      >
        <div className="grid grid-cols-2 gap-3 h-full">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group rounded-xl overflow-hidden border border-white/[0.06] bg-[#0f0f0f] cursor-pointer hover:border-indigo-500/30 transition-all duration-300"
              onClick={() => handleImageClick(image)}
            >
              <div className="aspect-square" ref={imageRef}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.prompt || "生成结果"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 opacity-0 group-hover:opacity-100">
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => handleDownload(image, e)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white",
                      favorites.has(image.id) && "text-red-400"
                    )}
                    onClick={(e) => handleFavorite(image, e)}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4",
                        favorites.has(image.id) && "fill-current"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => handleUseAsReference(image, e)}
                  >
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(image);
                    }}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      imageRef.current?.requestFullscreen();
                    }}
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image preview dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-[#0a0a0a] border-white/[0.08] rounded-2xl">
          <DialogTitle className="sr-only">图片预览</DialogTitle>
          <DialogDescription className="sr-only">
            查看生成的图片详情
          </DialogDescription>
          {selectedImage && (
            <div className="relative flex flex-col">
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image area */}
              <div className="flex items-center justify-center bg-black/40 min-h-[300px] max-h-[75vh] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt || "生成结果"}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
                <p className="text-sm text-zinc-400 line-clamp-1 flex-1 mr-4">
                  {selectedImage.prompt}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => handleDownload(selectedImage, e)}
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    下载
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => handleFavorite(selectedImage, e)}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 mr-1.5",
                        favorites.has(selectedImage.id) && "fill-current text-red-400"
                      )}
                    />
                    收藏
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => handleUseAsReference(selectedImage, e)}
                  >
                    <ImagePlus className="w-4 h-4 mr-1.5" />
                    图生图
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      imageRef.current?.requestFullscreen();
                    }}
                  >
                    <Maximize className="w-4 h-4 mr-1.5" />
                    全屏
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
