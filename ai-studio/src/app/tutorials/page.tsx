"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Search,
  ArrowRight,
  Sparkles,
  Building2,
  Home as HomeIcon,
  Film,
  GraduationCap,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

type TutorialCategory =
  | "全部"
  | "新手入门"
  | "建筑效果图"
  | "室内设计"
  | "视频制作"
  | "高级技巧";

type DifficultyLevel = "入门" | "进阶" | "高级";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: Exclude<TutorialCategory, "全部">;
  difficulty: DifficultyLevel;
  readTime: number; // minutes
  gradient: string;
  icon: React.ElementType;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: TutorialCategory[] = [
  "全部",
  "新手入门",
  "建筑效果图",
  "室内设计",
  "视频制作",
  "高级技巧",
];

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  入门: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  进阶: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  高级: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const TUTORIALS: Tutorial[] = [
  {
    id: "tut-1",
    title: "5 分钟上手 AI 创作平台",
    description:
      "从注册到生成第一张图片，快速了解平台核心功能和操作流程",
    category: "新手入门",
    difficulty: "入门",
    readTime: 5,
    gradient: "from-indigo-600 to-blue-600",
    icon: Zap,
  },
  {
    id: "tut-2",
    title: "提示词编写完全指南",
    description:
      "掌握提示词的结构和技巧，让 AI 生成更精准的设计效果",
    category: "新手入门",
    difficulty: "入门",
    readTime: 10,
    gradient: "from-violet-600 to-purple-600",
    icon: BookOpen,
  },
  {
    id: "tut-3",
    title: "现代建筑外观效果图生成",
    description:
      "学习如何生成玻璃幕墙、混凝土质感等现代风格的建筑外观效果图",
    category: "建筑效果图",
    difficulty: "进阶",
    readTime: 15,
    gradient: "from-blue-600 to-cyan-600",
    icon: Building2,
  },
  {
    id: "tut-4",
    title: "古典建筑风格还原",
    description:
      "使用图生图功能，基于参考照片还原欧式古典建筑风格",
    category: "建筑效果图",
    difficulty: "高级",
    readTime: 20,
    gradient: "from-amber-600 to-orange-600",
    icon: Building2,
  },
  {
    id: "tut-5",
    title: "北欧风格客厅设计",
    description:
      "从空间布局到家具搭配，生成温馨舒适的北欧风格室内设计图",
    category: "室内设计",
    difficulty: "进阶",
    readTime: 12,
    gradient: "from-sky-600 to-indigo-600",
    icon: HomeIcon,
  },
  {
    id: "tut-6",
    title: "极简主义空间设计",
    description:
      "探索极简主义设计理念，用 AI 生成干净、通透的室内空间",
    category: "室内设计",
    difficulty: "入门",
    readTime: 8,
    gradient: "from-slate-600 to-zinc-600",
    icon: HomeIcon,
  },
  {
    id: "tut-7",
    title: "建筑漫游视频制作入门",
    description:
      "从静态效果图到动态漫游视频，让你的设计方案动起来",
    category: "视频制作",
    difficulty: "进阶",
    readTime: 15,
    gradient: "from-emerald-600 to-teal-600",
    icon: Film,
  },
  {
    id: "tut-8",
    title: "短视频运镜与节奏控制",
    description:
      "学习如何控制视频的运镜速度和转场效果，制作专业级展示视频",
    category: "视频制作",
    difficulty: "高级",
    readTime: 18,
    gradient: "from-rose-600 to-pink-600",
    icon: Film,
  },
  {
    id: "tut-9",
    title: "ControlNet 精准控制构图",
    description:
      "利用 ControlNet 实现对画面构图、透视和结构的精准控制",
    category: "高级技巧",
    difficulty: "高级",
    readTime: 25,
    gradient: "from-fuchsia-600 to-violet-600",
    icon: GraduationCap,
  },
  {
    id: "tut-10",
    title: "LoRA 风格模型训练与使用",
    description:
      "训练专属风格模型，让 AI 始终保持你想要的设计风格",
    category: "高级技巧",
    difficulty: "高级",
    readTime: 30,
    gradient: "from-red-600 to-orange-600",
    icon: Star,
  },
  {
    id: "tut-11",
    title: "智能体对话创作实战",
    description:
      "通过对话式交互，让 AI 智能体引导你完成从概念到成品的创作",
    category: "新手入门",
    difficulty: "入门",
    readTime: 8,
    gradient: "from-teal-600 to-emerald-600",
    icon: Sparkles,
  },
  {
    id: "tut-12",
    title: "夜景建筑效果图渲染",
    description:
      "掌握灯光和氛围营造技巧，生成令人惊艳的夜景建筑效果图",
    category: "建筑效果图",
    difficulty: "进阶",
    readTime: 15,
    gradient: "from-indigo-700 to-violet-700",
    icon: Building2,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TutorialsPage() {
  const [activeCategory, setActiveCategory] =
    useState<TutorialCategory>("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTutorials = TUTORIALS.filter((tutorial) => {
    const matchesCategory =
      activeCategory === "全部" || tutorial.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="relative border-b border-white/[0.06]">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/[0.06] rounded-full blur-[120px]" />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-400">
                学习资源
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              教程中心
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              从零开始学习 AI 创作，掌握建筑效果图、室内设计和视频制作技巧
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="搜索教程..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeCategory === category
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:text-zinc-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-sm text-zinc-500">
            共找到{" "}
            <span className="text-zinc-300 font-medium">
              {filteredTutorials.length}
            </span>{" "}
            个教程
          </p>
        </div>

        {/* Tutorial Grid */}
        {filteredTutorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredTutorials.map((tutorial) => (
              <Card
                key={tutorial.id}
                className="group overflow-hidden border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
              >
                {/* Cover Image (gradient placeholder) */}
                <div
                  className={`relative h-48 bg-gradient-to-br ${tutorial.gradient} overflow-hidden`}
                >
                  {/* Pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                      backgroundSize: "24px 24px",
                    }}
                  />

                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <tutorial.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="secondary"
                      className="text-[11px] bg-black/40 backdrop-blur-sm border-0 text-white/90 px-2.5 py-0.5"
                    >
                      {tutorial.category}
                    </Badge>
                  </div>

                  {/* Difficulty badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`text-[11px] border px-2.5 py-0.5 ${DIFFICULTY_STYLES[tutorial.difficulty]}`}
                    >
                      {tutorial.difficulty}
                    </Badge>
                  </div>

                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <CardContent className="p-5">
                  <h3 className="text-base font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                    {tutorial.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{tutorial.readTime} 分钟阅读</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      阅读教程
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 mb-2">未找到匹配的教程</p>
            <p className="text-sm text-zinc-500 mb-4">
              试试其他关键词或分类
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveCategory("全部");
                setSearchQuery("");
              }}
              className="border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06]"
            >
              清除筛选
            </Button>
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            准备好开始创作了吗？
          </h2>
          <p className="text-zinc-400 mb-6">
            学以致用，立即体验 AI 创作的魔力
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
