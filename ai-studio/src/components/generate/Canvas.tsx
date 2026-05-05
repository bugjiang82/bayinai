"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Download,
  Heart,
  ImagePlus,
  ZoomIn,
  X,
  ImageIcon,
  Pencil,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  Play,
  Pause,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ProgressBar from "@/components/generate/ProgressBar";

interface CanvasImage {
  id: string;
  url: string;
  prompt?: string;
  favorited?: boolean;
  type?: "image" | "video";
  duration?: number;
}

interface HistoryItem {
  id: string;
  url: string;
  thumb: string;
  prompt?: string;
  model?: string;
  imageSize?: string;
  aspectRatio?: string;
  createdAt?: string;
  type?: string;
  inputUrl?: string;
}

interface CanvasProps {
  images: CanvasImage[];
  isGenerating: boolean;
  progress: number;
  onImageClick?: (image: CanvasImage) => void;
  onImageAction?: (action: string, image: CanvasImage) => void;
  className?: string;
  singleImageMode?: boolean;
  history?: HistoryItem[];
  onHistoryItemClick?: (item: HistoryItem) => void;
  onHistoryDelete?: (itemId: string) => void;
  hasMoreHistory?: boolean;
  loadingHistory?: boolean;
  onLoadMoreHistory?: () => void;
}

interface ImageItemProps {
  image: CanvasImage;
  onImageClick: () => void;
  onDownload: (e: React.MouseEvent) => void;
  onFavorite: (e: React.MouseEvent) => void;
  onUseAsReference: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onFullscreen: () => void;
  isFavorite: boolean;
  className?: string;
}

function isValidImageSource(src: string | null | undefined): boolean {
  if (!src) return false;
  if (typeof src !== 'string') return false;
  if (src.trim() === "") return false;
  if (src.includes("placeholder")) return false;
  if (src.includes("undefined")) return false;
  if (src.includes("null")) return false;
  if (src.toLowerCase().includes("http") && !src.startsWith("http")) return false;
  return true;
}

interface HistoryImageProps {
  item: HistoryItem;
  onLoadError: (id: string) => void;
}

function HistoryImage({ item, onLoadError }: HistoryImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      onLoadError(item.id);
    }
  }, [item.id, onLoadError, hasError]);

  const imageSrc = item.thumb && item.thumb !== item.url ? item.thumb : null;

  if (!imageSrc || !isValidImageSource(imageSrc) || hasError) {
    return null;
  }

  if (imageSrc.startsWith("/outputs/")) {
    return (
      <img
        src={imageSrc}
        alt={item.prompt || ""}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={item.prompt || ""}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      sizes="15vw"
      loading="lazy"
      unoptimized
      onError={handleError}
    />
  );
}

function VideoPlayer({ 
  videoUrl, 
  onClose, 
  showControls = true,
  onEnded 
}: { 
  videoUrl: string; 
  onClose?: () => void; 
  showControls?: boolean;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      video.currentTime = 0;
      onEnded?.();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={`${videoUrl}?t=1`}
        muted
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {showControls && (
        <>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div
              className="h-1 bg-zinc-700 rounded-full cursor-pointer mb-3"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ImageItem({
  image,
  onImageClick,
  onDownload,
  onFavorite,
  onUseAsReference,
  onEdit,
  onFullscreen,
  isFavorite,
  className,
}: ImageItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || image.type !== "video") return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (!hasPlayed.current) {
        hasPlayed.current = true;
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      video.currentTime = 0;
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [image.type]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  return (
    <div
      className={cn(
        "relative group rounded-xl overflow-hidden border border-white/[0.06] bg-[#0f0f0f] cursor-pointer hover:border-indigo-500/30 transition-all duration-300",
        className
      )}
      onClick={onImageClick}
    >
      {image.type === "video" ? (
        <div className="relative w-full aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={`${image.url}?t=1`}
            muted
            loop={false}
          >
            <source src={image.url} type="video/mp4" />
          </video>

          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div
              className="h-1 bg-zinc-700 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center mt-2">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      ) : className?.includes("max-h-[") ? (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/20 rounded-lg">
          <Image
            src={image.url}
            alt={image.prompt || "生成结果"}
            width={960}
            height={960}
            className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
            unoptimized
          />
        </div>
      ) : className?.includes("aspect-auto") ? (
        <div className="relative w-full h-auto">
          <Image
            src={image.url}
            alt={image.prompt || "生成结果"}
            width={1920}
            height={1920}
            className="w-full h-auto object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="aspect-square relative">
          <Image
            src={image.url}
            alt={image.prompt || "生成结果"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        </div>
      )}

      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFullscreen();
          }}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-colors cursor-pointer"
          title="全屏预览"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(e);
            }}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="下载"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(e);
            }}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer",
              isFavorite && "text-red-400"
            )}
            title={isFavorite ? "取消收藏" : "点赞/收藏"}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUseAsReference(e);
            }}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="图生图"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="局部重绘"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageClick();
            }}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="预览"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Canvas({
  images,
  isGenerating,
  progress,
  onImageClick,
  onImageAction,
  className,
  singleImageMode = false,
  history = [],
  onHistoryItemClick,
  onHistoryDelete,
  hasMoreHistory = false,
  loadingHistory = false,
  onLoadMoreHistory,
}: CanvasProps) {
  const [selectedImage, setSelectedImage] = useState<CanvasImage | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const historyBottomRef = useRef<HTMLDivElement>(null);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [failedHistoryItemIds, setFailedHistoryItemIds] = useState<Set<string>>(new Set());
  const [fullscreenImage, setFullscreenImage] = useState<CanvasImage | null>(null);
  const router = useRouter();

  const handleImageLoadError = useCallback((itemId: string) => {
    setFailedHistoryItemIds(prev => new Set([...prev, itemId]));
  }, []);

  const filteredHistory = history.filter(item => {
    if (failedHistoryItemIds.has(item.id)) return false;
    const imageSrc = item.thumb && item.thumb !== item.url ? item.thumb : null;
    return isValidImageSource(imageSrc);
  });

  useEffect(() => {
    const favoritedIds = history
      .filter((item) => (item as any).favorited)
      .map((item) => item.id);
    if (favoritedIds.length > 0) {
      setFavorites(new Set(favoritedIds));
    }
  }, [history]);

  const handleDeleteHistoryItem = useCallback(async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/generate/${itemToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok && onHistoryDelete) {
        onHistoryDelete(itemToDelete.id);
      }
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, onHistoryDelete]);

  const handleImageClick = useCallback(
    (image: CanvasImage) => {
      setSelectedImage(image);
      onImageClick?.(image);
    },
    [onImageClick]
  );

  const handleFullscreen = useCallback((image: CanvasImage) => {
    setFullscreenImage(image);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenImage(null);
  }, []);

  const handleDownload = useCallback(
    async (image: CanvasImage, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = image.type === "video" ? "mp4" : "png";
        a.download = `ai-studio-${image.id}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        window.open(image.url, "_blank");
      }
    },
    []
  );

  const handleFavorite = useCallback(
    async (image: CanvasImage, e: React.MouseEvent) => {
      e.stopPropagation();
      const currentlyFavorited = favorites.has(image.id);

      setFavorites((prev) => {
        const next = new Set(prev);
        if (currentlyFavorited) {
          next.delete(image.id);
        } else {
          next.add(image.id);
        }
        return next;
      });

      try {
        const response = await fetch("/api/generate/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generationId: image.id, favorited: !currentlyFavorited }),
        });

        if (!response.ok) {
          setFavorites((prev) => {
            const next = new Set(prev);
            if (currentlyFavorited) {
              next.add(image.id);
            } else {
              next.delete(image.id);
            }
            return next;
          });
        }
      } catch {
        setFavorites((prev) => {
          const next = new Set(prev);
          if (currentlyFavorited) {
            next.add(image.id);
          } else {
            next.delete(image.id);
          }
          return next;
        });
      }

      onImageAction?.("favorite", image);
    },
    [favorites, onImageAction]
  );

  const handleUseAsReference = useCallback(
    (image: CanvasImage, e: React.MouseEvent) => {
      e.stopPropagation();
      onImageAction?.("use-as-reference", image);
    },
    [onImageAction]
  );

  const handleEdit = useCallback(
    (image: CanvasImage, e: React.MouseEvent) => {
      e.stopPropagation();
      if (image.type === "video") {
        return;
      }
      const editUrl = `/generate/edit?image=${encodeURIComponent(image.url)}&prompt=${encodeURIComponent(image.prompt || "")}`;
      router.push(editUrl);
    },
    [router]
  );

  const handleClosePreview = useCallback(() => {
    setSelectedImage(null);
  }, []);

  useEffect(() => {
    if (!historyBottomRef.current || !hasMoreHistory || !onLoadMoreHistory) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreHistory && !loadingHistory) {
          onLoadMoreHistory();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(historyBottomRef.current);
    return () => observer.disconnect();
  }, [hasMoreHistory, loadingHistory, onLoadMoreHistory]);

  if (!isGenerating && images.length === 0 && filteredHistory.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0a0a0a]/50 h-full min-h-[200px] overflow-hidden",
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

  if (isGenerating) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 h-full min-h-[200px] overflow-hidden",
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

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 min-h-[200px] h-full overflow-hidden flex flex-col",
          className
        )}
      >
        <div className="flex-1 overflow-y-auto p-4">
          {images.length > 0 && (
            <div className={cn(
              "mb-4",
              singleImageMode && images.length === 1
                ? "flex justify-center items-center"
                : "grid grid-cols-2 gap-3"
            )}>
              {images.map((image) => (
                <ImageItem
                  key={image.id}
                  image={image}
                  onImageClick={() => handleImageClick(image)}
                  onDownload={(e) => handleDownload(image, e)}
                  onFavorite={(e) => handleFavorite(image, e)}
                  onUseAsReference={(e) => handleUseAsReference(image, e)}
                  onEdit={(e) => handleEdit(image, e)}
                  onFullscreen={() => handleFullscreen(image)}
                  isFavorite={image.favorited ?? favorites.has(image.id)}
                  className={singleImageMode && images.length === 1 ? "w-full max-h-[60vh]" : ""}
                />
              ))}
            </div>
          )}

          {filteredHistory.length > 0 && (
            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-zinc-500">历史记录</h3>
                <div className="flex items-center gap-2">
                  {loadingHistory && (
                    <span className="text-xs text-indigo-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      加载中...
                    </span>
                  )}
                  <button
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    className="p-1 rounded hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {historyExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {historyExpanded && (
                <div className="grid grid-cols-6 gap-2">
                  {filteredHistory.map((item) => {
                    const imageSrc = item.thumb && item.thumb !== item.url ? item.thumb : null;
                    if (!isValidImageSource(imageSrc)) return null;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group relative aspect-square rounded-md overflow-hidden border cursor-pointer transition-all duration-200",
                          images.some(img => img.id === item.id)
                            ? "border-indigo-500 ring-1 ring-indigo-500/30"
                            : "border-white/[0.06] hover:border-indigo-500/40"
                        )}
                        onClick={() => onHistoryItemClick?.(item)}
                      >
                        <HistoryImage
                          item={item}
                          onLoadError={handleImageLoadError}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(item);
                              }}
                              className="p-1 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors cursor-pointer"
                              title="删除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[9px] text-white space-y-0.5">
                            <div className="truncate">
                              {item.model === "pro" || item.model === "gemini-3-pro-image-preview"
                                ? "Pro 大模型"
                                : "Flash 大模型"}
                            </div>
                            {item.imageSize && (
                              <div className="text-zinc-300">{item.imageSize} 质量</div>
                            )}
                            <div className="text-zinc-300">{item.aspectRatio || "未知"} 比例</div>
                            {item.createdAt && (
                              <div className="text-zinc-400">{item.createdAt}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hasMoreHistory && (
                    <div ref={historyBottomRef} className="flex items-center justify-center aspect-square">
                      {loadingHistory && (
                        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {filteredHistory.length === 0 && !loadingHistory && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-zinc-600 mb-2">
                <ImageIcon className="w-12 h-12 mx-auto opacity-50" />
              </div>
              <p className="text-sm text-zinc-500">暂无历史记录</p>
              <p className="text-xs text-zinc-600 mt-1">生成图片后将显示在这里</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className="max-w-[85vw] max-h-[85vh] w-auto h-auto p-0 overflow-hidden bg-[#0a0a0a] border-white/[0.08] rounded-2xl z-50 flex flex-col">
          <DialogTitle className="sr-only">图片预览</DialogTitle>
          <DialogDescription className="sr-only">
            查看生成的图片详情
          </DialogDescription>
          {selectedImage && (
            <div className="relative flex flex-col max-h-[85vh]">
              <button
                onClick={handleClosePreview}
                className="absolute top-3 right-3 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center bg-black/40 min-h-[200px] max-h-[70vh] p-4 relative">
                <div className="relative w-auto h-auto max-w-full max-h-[65vh]">
                  {selectedImage.type === "video" ? (
                    <VideoPlayer videoUrl={selectedImage.url} />
                  ) : (
                    <Image
                      src={selectedImage.url}
                      alt={selectedImage.prompt || "生成结果"}
                      width={1920}
                      height={1920}
                      className="max-w-full max-h-[65vh] w-auto h-auto object-contain rounded-lg"
                      unoptimized
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] shrink-0">
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
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button
            onClick={handleCloseFullscreen}
            className="absolute top-4 right-4 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full h-full flex items-center justify-center p-8">
            {fullscreenImage.type === "video" ? (
              <div className="w-full max-w-5xl aspect-video">
                <VideoPlayer
                  videoUrl={fullscreenImage.url}
                  onClose={handleCloseFullscreen}
                />
              </div>
            ) : (
              <div className="w-full max-w-6xl flex">
                <div className="flex-1 flex items-center justify-center">
                  <Image
                    src={fullscreenImage.url}
                    alt={fullscreenImage.prompt || ""}
                    width={1920}
                    height={1920}
                    className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                    unoptimized
                  />
                </div>
                <div className="w-72 bg-zinc-900/50 backdrop-blur-sm p-6 flex flex-col">
                  <h3 className="text-sm font-medium text-zinc-300 mb-4">图片信息</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">提示词</label>
                      <p className="text-sm text-zinc-400">{fullscreenImage.prompt || "-"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">尺寸</label>
                      <p className="text-sm text-zinc-400">-</p>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">创建时间</label>
                      <p className="text-sm text-zinc-400">-</p>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">模型</label>
                      <p className="text-sm text-zinc-400">-</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button
                      className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
                      onClick={(e) => handleDownload(fullscreenImage, e)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/[0.08] rounded-xl p-6">
          <DialogTitle className="text-lg font-semibold text-white mb-2">确认删除</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400 mb-6">
            确定要删除这张图片吗？此操作无法撤销，图片和缩略图都将被删除。
          </DialogDescription>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemToDelete(null)}
              disabled={deleting}
              className="text-zinc-300 hover:text-white"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteHistoryItem}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
