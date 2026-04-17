"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Search,
  Heart,
  Eye,
  User,
  Building2,
  Home as HomeIcon,
  TreePine,
  Film,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

type ShowcaseCategory = "全部" | "建筑" | "室内" | "景观" | "视频";

interface ShowcaseItem {
  id: string;
  title: string;
  author: string;
  description: string;
  category: Exclude<ShowcaseCategory, "全部">;
  gradient: string;
  likes: number;
  views: number;
  aspectRatio: "square" | "tall" | "wide";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: ShowcaseCategory[] = ["全部", "建筑", "室内", "景观", "视频"];

const CATEGORY_ICONS: Record<ShowcaseCategory, React.ElementType> = {
  全部: Sparkles,
  建筑: Building2,
  室内: HomeIcon,
  景观: TreePine,
  视频: Film,
};

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "show-1",
    title: "未来城市天际线",
    author: "设计师小王",
    description: "赛博朋克风格的未来城市概念设计，融合了东方美学与科幻元素",
    category: "建筑",
    gradient: "from-indigo-600 via-blue-500 to-cyan-400",
    likes: 328,
    views: 2150,
    aspectRatio: "tall",
  },
  {
    id: "show-2",
    title: "极简主义客厅",
    author: "ArchDesign",
    description: "以白色和原木为主调的北欧极简客厅设计，营造宁静氛围",
    category: "室内",
    gradient: "from-purple-600 via-pink-500 to-rose-400",
    likes: 256,
    views: 1830,
    aspectRatio: "square",
  },
  {
    id: "show-3",
    title: "生态花园别墅",
    author: "绿洲设计",
    description: "与自然完美融合的生态别墅设计，绿色屋顶与室内花园",
    category: "景观",
    gradient: "from-emerald-600 via-green-500 to-lime-400",
    likes: 412,
    views: 3200,
    aspectRatio: "wide",
  },
  {
    id: "show-4",
    title: "赛博朋克街道",
    author: "NeonArt",
    description: "霓虹灯闪烁的未来街道，充满科技感的都市夜景",
    category: "建筑",
    gradient: "from-violet-600 via-fuchsia-500 to-pink-400",
    likes: 567,
    views: 4100,
    aspectRatio: "tall",
  },
  {
    id: "show-5",
    title: "日式禅意庭院",
    author: "和风工作室",
    description: "枯山水与竹林相结合的传统日式庭院设计",
    category: "景观",
    gradient: "from-amber-600 via-orange-500 to-yellow-400",
    likes: 189,
    views: 1450,
    aspectRatio: "square",
  },
  {
    id: "show-6",
    title: "北欧风格卧室",
    author: "NordDesign",
    description: "温馨舒适的北欧风格卧室，柔和光线与自然材质",
    category: "室内",
    gradient: "from-sky-600 via-blue-500 to-indigo-400",
    likes: 234,
    views: 1780,
    aspectRatio: "square",
  },
  {
    id: "show-7",
    title: "商业综合体外观",
    author: "UrbanPlan",
    description: "现代商业综合体的外观设计，流线型玻璃幕墙",
    category: "建筑",
    gradient: "from-rose-600 via-red-500 to-orange-400",
    likes: 345,
    views: 2680,
    aspectRatio: "wide",
  },
  {
    id: "show-8",
    title: "水下餐厅概念",
    author: "AquaVision",
    description: "梦幻般的水下餐厅概念设计，沉浸式海洋体验",
    category: "室内",
    gradient: "from-teal-600 via-cyan-500 to-blue-400",
    likes: 623,
    views: 5200,
    aspectRatio: "tall",
  },
  {
    id: "show-9",
    title: "建筑漫游动画",
    author: "MotionLab",
    description: "从日出到日落的建筑光影变化，展示建筑与自然的和谐",
    category: "视频",
    gradient: "from-orange-600 via-amber-500 to-yellow-400",
    likes: 456,
    views: 3800,
    aspectRatio: "wide",
  },
  {
    id: "show-10",
    title: "城市公园鸟瞰",
    author: "SkyView",
    description: "俯瞰城市中央公园，绿意盎然的都市绿洲",
    category: "景观",
    gradient: "from-green-600 via-emerald-500 to-teal-400",
    likes: 278,
    views: 2100,
    aspectRatio: "wide",
  },
  {
    id: "show-11",
    title: "工业风 LOFT 空间",
    author: "RawSpace",
    description: "裸露砖墙与金属管道的工业风 LOFT 改造设计",
    category: "室内",
    gradient: "from-stone-600 via-zinc-500 to-neutral-400",
    likes: 198,
    views: 1560,
    aspectRatio: "tall",
  },
  {
    id: "show-12",
    title: "参数化建筑立面",
    author: "ParaArch",
    description: "基于算法生成的参数化建筑立面，流动的几何美感",
    category: "建筑",
    gradient: "from-blue-600 via-indigo-500 to-violet-400",
    likes: 389,
    views: 2950,
    aspectRatio: "square",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  const [activeCategory, setActiveCategory] =
    useState<ShowcaseCategory>("全部");

  const filteredItems = SHOWCASE_ITEMS.filter(
    (item) => activeCategory === "全部" || item.category === activeCategory
  );

  const getAspectClass = (ratio: ShowcaseItem["aspectRatio"]) => {
    switch (ratio) {
      case "tall":
        return "aspect-[3/4]";
      case "wide":
        return "aspect-[4/3]";
      case "square":
      default:
        return "aspect-square";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <header className="relative border-b border-white/[0.06] overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-zinc-400">社区精选</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            精选作品
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            探索社区创作者使用 AI 生成的精彩作品，获取灵感与启发
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeCategory === category
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-zinc-400 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {category}
                </button>
              );
            })}
          </div>

          <p className="text-sm text-zinc-500">
            共{" "}
            <span className="text-zinc-300 font-medium">
              {filteredItems.length}
            </span>{" "}
            个作品
          </p>
        </div>

        {/* Masonry-like Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="break-inside-avoid overflow-hidden border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-all duration-300 cursor-pointer group"
            >
              {/* Image */}
              <div
                className={`relative ${getAspectClass(item.aspectRatio)} bg-gradient-to-br ${item.gradient} overflow-hidden`}
              >
                {/* Pattern overlay */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="secondary"
                    className="text-[11px] bg-black/40 backdrop-blur-sm border-0 text-white/90 px-2.5 py-0.5"
                  >
                    {item.category}
                  </Badge>
                </div>

                {/* Stats overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{item.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{item.views}</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-4">
                <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-zinc-500">{item.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            想要展示你的作品？
          </h2>
          <p className="text-zinc-400 mb-6">
            立即创作，你的作品也可能出现在这里
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
            asChild
          >
            <Link href="/generate">
              开始创作
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
