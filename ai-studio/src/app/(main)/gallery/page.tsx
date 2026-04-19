"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Download, Trash2, Heart, Image, Video, Filter, Loader2, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Types ───────────────────────────────────────────────────────────────────

type WorkType = "all" | "image" | "video";
type TimeFilter = "all" | "today" | "week" | "month";

interface GalleryItem {
  id: string;
  type: "image" | "video";
  thumbnail: string;
  prompt: string;
  createdAt: string;
  model: string;
  isFavorite: boolean;
}

interface CacheEntry {
  data: GalleryItem[];
  timestamp: number;
  hasMore: boolean;
  total: number;
}

// ─── Local storage cache utilities ──────────────────────────────────────────

const CACHE_KEY = "gallery_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCacheKey(params: Record<string, string>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return sortedParams || 'default';
}

function getCachedData(params: Record<string, string>): CacheEntry | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cache: Record<string, CacheEntry> = JSON.parse(cacheStr);
    const key = getCacheKey(params);
    const entry = cache[key];
    
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL) {
      delete cache[key];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

function setCachedData(params: Record<string, string>, data: GalleryItem[], hasMore: boolean, total: number): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, CacheEntry> = cacheStr ? JSON.parse(cacheStr) : {};
    
    const key = getCacheKey(params);
    cache[key] = {
      data,
      timestamp: Date.now(),
      hasMore,
      total,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

// ─── Gradient placeholders ───────────────────────────────────────────────────

const GRADIENTS = [
  "from-violet-600/40 to-indigo-600/40",
  "from-rose-600/40 to-orange-600/40",
  "from-emerald-600/40 to-teal-600/40",
  "from-cyan-600/40 to-blue-600/40",
  "from-fuchsia-600/40 to-pink-600/40",
  "from-amber-600/40 to-yellow-600/40",
  "from-lime-600/40 to-green-600/40",
  "from-sky-600/40 to-indigo-600/40",
];

function getGradient(id: string): string {
  const index =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    GRADIENTS.length;
  return GRADIENTS[index];
}

// ─── Mock data ───────────────────────────────────────────────────────────────

function generateMockItems(page: number, pageSize: number): GalleryItem[] {
  const models = ["Imagen 3", "Imagen 4", "Veo 2", "Gemma"];
  const prompts = [
    "现代极简主义建筑外观，玻璃幕墙，蓝天白云",
    "日式禅意庭院，枯山水设计，樱花飘落",
    "未来城市夜景，霓虹灯光，赛博朋克风格",
    "北欧风格室内设计，原木家具，暖色调灯光",
    "地中海风格别墅，白色墙壁，蓝色海洋",
    "工业风格LOFT公寓，裸露砖墙，金属元素",
    "中国传统园林，假山流水，古典亭台",
    "热带雨林景观设计，瀑布，茂密植被",
    "后现代艺术博物馆，不规则几何造型",
    "阿尔卑斯山小木屋，雪山背景，温馨灯光",
  ];

  return Array.from({ length: pageSize }, (_, i) => {
    const idx = (page - 1) * pageSize + i;
    return {
      id: `item-${idx}-${Date.now()}`,
      type: idx % 5 === 0 ? "video" : "image",
      thumbnail: "",
      prompt: prompts[idx % prompts.length],
      createdAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      model: models[idx % models.length],
      isFavorite: Math.random() > 0.7,
    };
  });
}

// ─── Lazy image component ───────────────────────────────────────────────────

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder: React.ReactNode;
}

function LazyImage({ src, alt, className = "", placeholder }: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "100px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && <div className="absolute inset-0">{placeholder}</div>}
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
      />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<WorkType>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [usingCache, setUsingCache] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentParams = useCallback(() => ({
    type: typeFilter,
    time: timeFilter,
    q: searchQuery || '',
  }), [typeFilter, timeFilter, searchQuery]);

  const fetchGallery = useCallback(
    async (pageNum: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = {
        type: typeFilter,
        time: timeFilter,
        q: searchQuery || '',
      };

      try {
        // 只有在第一页且非追加模式时才检查本地缓存
        if (pageNum === 1 && !append) {
          const cachedData = getCachedData(params);
          if (cachedData) {
            setItems(cachedData.data);
            setHasMore(cachedData.hasMore);
            setLoading(false);
            setUsingCache(true);
            // 后台继续刷新数据
            fetchFromServer(pageNum, params, false, true);
            return;
          }
        }

        await fetchFromServer(pageNum, params, append, false);
      } catch {
        // Fallback to mock data
        const mockItems = generateMockItems(pageNum, 12);
        setItems((prev) =>
          append ? [...prev, ...mockItems] : mockItems
        );
        setHasMore(pageNum < 5);
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [typeFilter, timeFilter, searchQuery]
  );

  const fetchFromServer = async (
    pageNum: number,
    params: Record<string, string>,
    append: boolean,
    background: boolean
  ) => {
    const searchParams = new URLSearchParams({
      page: String(pageNum),
      pageSize: "12",
      ...params,
    });

    const res = await fetch(`/api/gallery?${searchParams}`);
    if (res.ok) {
      const data = await res.json();
      if (data.code === 0) {
        const galleryData = data.data?.list || [];
        const newHasMore = data.data?.hasMore ?? galleryData.length >= 12;
        const total = data.data?.total ?? 0;
        
        if (!background) {
          setItems((prev) =>
            append ? [...prev, ...galleryData] : galleryData
          );
          setHasMore(newHasMore);
        } else {
          // 后台刷新时检查数据是否变化
          setItems((prev) => {
            const currentIds = new Set(prev.map(i => i.id));
            const newIds = new Set(galleryData.map((i: GalleryItem) => i.id));
            if (currentIds.size !== newIds.size || [...currentIds].some(id => !newIds.has(id))) {
              return galleryData;
            }
            return prev;
          });
          setHasMore(newHasMore);
        }

        // 只缓存第一页的数据
        if (pageNum === 1) {
          setCachedData(params, galleryData, newHasMore, total);
        }
        setUsingCache(false);
      } else {
        if (!background) {
          const mockItems = generateMockItems(pageNum, 12);
          setItems((prev) =>
            append ? [...prev, ...mockItems] : mockItems
          );
          setHasMore(pageNum < 5);
        }
      }
    } else {
      if (!background) {
        const mockItems = generateMockItems(pageNum, 12);
        setItems((prev) =>
          append ? [...prev, ...mockItems] : mockItems
        );
        setHasMore(pageNum < 5);
      }
    }

    if (!background) {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 处理搜索防抖
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setItems([]);
      fetchGallery(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [typeFilter, timeFilter, searchQuery]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchGallery(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, page, fetchGallery]);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownload = (item: GalleryItem) => {
    // Placeholder download action
    const link = document.createElement("a");
    link.href = item.thumbnail || "#";
    link.download = `${item.id}.png`;
    link.click();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 周前`;
    return `${Math.floor(days / 30)} 月前`;
  };

  // ─── Empty state ─────────────────────────────────────────────────────────

  if (!loading && items.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">我的作品</h1>
            {usingCache && (
              <Badge variant="outline" className="text-[10px]">缓存中</Badge>
            )}
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索作品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">还没有作品</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            开始你的第一次 AI 创作，生成令人惊叹的建筑效果图和设计作品
          </p>
          <Button onClick={() => (window.location.href = "/generate/text-to-image")}>
            开始创作
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main content ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">我的作品</h1>
          {usingCache && (
            <Badge variant="outline" className="text-[10px]">缓存中</Badge>
          )}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索作品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as WorkType)}
        >
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              全部
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5">
              <Image className="h-3.5 w-3.5" />
              图片
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5">
              <Video className="h-3.5 w-3.5" />
              视频
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={timeFilter}
          onValueChange={(v) => setTimeFilter(v as TimeFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">全部时间</TabsTrigger>
            <TabsTrigger value="today">今天</TabsTrigger>
            <TabsTrigger value="week">本周</TabsTrigger>
            <TabsTrigger value="month">本月</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Gallery grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const isFav = favorites.has(item.id) || item.isFavorite;
            return (
              <Card
                key={item.id}
                className="group overflow-hidden hover:border-primary/50 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {item.thumbnail ? (
                    <LazyImage
                      src={item.thumbnail}
                      alt={item.prompt}
                      className="transition-transform duration-500 group-hover:scale-105"
                      placeholder={
                        <div
                          className={`w-full h-full bg-gradient-to-br ${getGradient(item.id)} flex items-center justify-center`}
                        >
                          {item.type === "video" ? (
                            <Video className="h-12 w-12 text-white/30" />
                          ) : (
                            <Image className="h-12 w-12 text-white/30" />
                          )}
                        </div>
                      }
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${getGradient(item.id)} flex items-center justify-center`}
                    >
                      {item.type === "video" ? (
                        <Video className="h-12 w-12 text-white/30" />
                      ) : (
                        <Image className="h-12 w-12 text-white/30" />
                      )}
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-[10px] bg-black/50 backdrop-blur-sm border-0 text-white">
                      {item.type === "video" ? "视频" : "图片"}
                    </Badge>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
                      onClick={() => handleDownload(item)}
                      title="下载"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className={`h-9 w-9 rounded-full backdrop-blur-sm border-0 hover:bg-white/30 ${
                        isFav
                          ? "bg-red-500/80 text-white"
                          : "bg-white/20 text-white"
                      }`}
                      onClick={() => handleToggleFavorite(item.id)}
                      title={isFav ? "取消收藏" : "收藏"}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFav ? "fill-current" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm border-0 hover:bg-red-500/60"
                      onClick={() => handleDelete(item.id)}
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <p className="text-sm text-foreground/90 line-clamp-2 mb-2 leading-relaxed">
                    {item.prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.model}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Load more trigger */}
      {!loading && hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">加载更多...</span>
            </div>
          )}
        </div>
      )}

      {/* End of list */}
      {!loading && !hasMore && items.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          已加载全部作品
        </div>
      )}
    </div>
  );
}
