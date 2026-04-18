"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { AuthProvider } from "@/providers/AuthProvider";
import {
  Sparkles,
  ImagePlus,
  Video,
  Wand2,
  Bot,
  LayoutTemplate,
  ArrowRight,
  BookOpen,
  Play,
  Users,
  ImageIcon,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  Building2,
  Home as HomeIcon,
  TreePine,
  GraduationCap,
  Film,
  MousePointerClick,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AnimatedSection from "@/components/shared/AnimatedSection";
import Footer from "@/components/layout/Footer";

/* ========================================
   Navigation Bar (Simplified for landing)
   ======================================== */
function Navbar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-[fadeInDown_0.5s_ease-out] ${
        scrolled
          ? "h-16 backdrop-blur-xl bg-black/80 border-b border-white/[0.08] shadow-lg shadow-black/20"
          : "h-20 backdrop-blur-md bg-black/40"
      }`}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-8 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI创意工作室
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "#features", label: "功能" },
            { href: "#agents", label: "智能体" },
            { href: "#showcase", label: "作品" },
            { href: "#tutorials", label: "教程" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                    <AvatarFallback className="bg-indigo-500 text-white">
                      {session.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/[0.08] text-white">
                <DropdownMenuLabel>我的账号</DropdownMenuLabel>
                <DropdownMenuSeparator className="border-white/[0.08]" />
                <DropdownMenuItem asChild>
                  <Link href="/generate" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    开始创作
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gallery" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    我的作品
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    设置
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-white/[0.08]" />
                <DropdownMenuItem asChild>
                  <a
                    href="/api/auth/signout"
                    className="flex items-center gap-2 text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">登录</Link>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
                asChild
              >
                <Link href="/register">免费注册</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          } bg-black/90 backdrop-blur-xl border-b border-white/[0.06]`}
        >
          <div className="px-4 py-4 space-y-1">
            {[
              { href: "#features", label: "功能" },
              { href: "#agents", label: "智能体" },
              { href: "#showcase", label: "作品" },
              { href: "#tutorials", label: "教程" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/[0.06]">
              {session?.user ? (
                <div className="space-y-2">
                  <Link
                    href="/generate"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    开始创作
                  </Link>
                  <Link
                    href="/gallery"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    我的作品
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    设置
                  </Link>
                  <a
                    href="/api/auth/signout"
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild className="w-full justify-center border-white/20 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/login">登录</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                    asChild
                  >
                    <Link href="/register">免费注册</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
    </header>
  );
}

/* ========================================
   Hero Section
   ======================================== */
const rotatingKeywords = [
  { text: "文生图", icon: ImagePlus },
  { text: "图生图", icon: Wand2 },
  { text: "视频生成", icon: Video },
  { text: "智能体引导", icon: Bot },
];

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [keywordVisible, setKeywordVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setKeywordVisible(false);
      // After fade-out transition completes, switch keyword and fade in
      setTimeout(() => {
        setKeywordIndex((prev) => (prev + 1) % rotatingKeywords.length);
        setKeywordVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-[150px] animate-pulse-soft" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-pink-500/5 rounded-full blur-[120px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Radial fade */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0a_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 text-center pt-20">
        {/* Badge */}
        <div className="animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-zinc-400">全新升级 v2.0 - 更快、更智能</span>
          </div>
        </div>

        {/* Main Title */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight mb-6 animate-[fadeInUp_0.7s_ease-out_0.2s_both]"
        >
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            AI 驱动的
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            创意工作室
          </span>
        </h1>

        {/* Rotating Keywords */}
        <div
          className="flex items-center justify-center gap-3 mb-6 h-10 animate-[fadeInUp_0.6s_ease-out_0.4s_both]"
        >
          <span className="text-sm text-zinc-500">支持</span>
          <div className="relative h-10 overflow-hidden">
            <div
              key={keywordIndex}
              className="flex items-center gap-2 transition-all duration-300 ease-in-out"
              style={{
                opacity: keywordVisible ? 1 : 0,
                transform: keywordVisible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              {(() => {
                const CurrentIcon = rotatingKeywords[keywordIndex].icon;
                return (
                  <>
                    <CurrentIcon className="w-5 h-5 text-indigo-400" />
                    <span className="text-lg font-semibold text-indigo-300">
                      {rotatingKeywords[keywordIndex].text}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
          <span className="text-sm text-zinc-500">等创作模式</span>
        </div>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.5s_both]"
        >
          为建筑设计师和 AI 初学者打造的智能创作平台，一键生成建筑效果图、室内设计图和短视频
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeInUp_0.6s_ease-out_0.6s_both]"
        >
          {isAuthenticated ? (
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02]"
              asChild
            >
              <Link href="/generate">
                进入工作区
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02]"
              asChild
            >
              <Link href="/login">
                登录
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.2] text-zinc-300 hover:text-white transition-all duration-300"
            asChild
          >
            <Link href="/tutorials">
              <Play className="w-4 h-4 mr-1" />
              查看教程
            </Link>
          </Button>
        </div>

        {/* Floating preview cards */}
        <div
          className="mt-16 relative animate-[fadeInUp_0.8s_ease-out_0.8s_both]"
        >
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {[
              { gradient: "from-indigo-600/40 to-blue-600/40", label: "现代建筑" },
              { gradient: "from-purple-600/40 to-pink-600/40", label: "室内设计" },
              { gradient: "from-emerald-600/40 to-teal-600/40", label: "景观规划" },
            ].map((item, i) => (
              <div
                key={item.label}
                className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.06] bg-gradient-to-br group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] animate-[fadeInUp_0.5s_ease-out_both]"
                style={{ animationDelay: `${1 + i * 0.15}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-medium text-white/80">{item.label}</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}

/* ========================================
   Showcase / Featured Works Section
   ======================================== */
const showcaseItems = [
  { title: "未来城市天际线", author: "设计师小王", gradient: "from-indigo-600 via-blue-500 to-cyan-400" },
  { title: "极简主义客厅", author: "ArchDesign", gradient: "from-purple-600 via-pink-500 to-rose-400" },
  { title: "生态花园别墅", author: "绿洲设计", gradient: "from-emerald-600 via-green-500 to-lime-400" },
  { title: "赛博朋克街道", author: "NeonArt", gradient: "from-violet-600 via-fuchsia-500 to-pink-400" },
  { title: "日式禅意庭院", author: "和风工作室", gradient: "from-amber-600 via-orange-500 to-yellow-400" },
  { title: "北欧风格卧室", author: "NordDesign", gradient: "from-sky-600 via-blue-500 to-indigo-400" },
  { title: "商业综合体外观", author: "UrbanPlan", gradient: "from-rose-600 via-red-500 to-orange-400" },
  { title: "水下餐厅概念", author: "AquaVision", gradient: "from-teal-600 via-cyan-500 to-blue-400" },
];

function ShowcaseSection() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  return (
    <section id="showcase" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <AnimatedSection>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                精选作品展示
              </h2>
              <p className="text-zinc-400 text-base">
                探索社区创作者使用 AI 生成的精彩作品
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </AnimatedSection>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {showcaseItems.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.05} direction="left">
              <div className="shrink-0 w-[280px] sm:w-[300px] snap-start group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/[0.06] mb-3">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {/* Bottom info */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-sm font-semibold text-white mb-1 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/60">{item.author}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================
   Features Section
   ======================================== */
const features = [
  {
    icon: ImagePlus,
    title: "文生图",
    description: "输入文字描述，AI 自动生成高质量建筑效果图和设计图",
    gradient: "from-indigo-500 to-blue-500",
    bgGlow: "bg-indigo-500/10",
  },
  {
    icon: Wand2,
    title: "图生图",
    description: "上传参考图片，AI 理解风格并生成全新的设计方案",
    gradient: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/10",
  },
  {
    icon: Video,
    title: "视频生成",
    description: "一键生成建筑漫游动画和短视频，展示设计方案",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/10",
  },
  {
    icon: ImagePlus,
    title: "图片编辑",
    description: "支持放大、风格迁移、局部重绘等专业编辑功能",
    gradient: "from-orange-500 to-amber-500",
    bgGlow: "bg-orange-500/10",
  },
  {
    icon: Bot,
    title: "智能体引导",
    description: "对话式 AI 创作助手，引导你完成专业级创作",
    gradient: "from-violet-500 to-purple-500",
    bgGlow: "bg-violet-500/10",
  },
  {
    icon: LayoutTemplate,
    title: "预设模板",
    description: "建筑、室内、景观等场景一键生成，快速出图",
    gradient: "from-rose-500 to-pink-500",
    bgGlow: "bg-rose-500/10",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[150px]" />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-zinc-400">核心功能</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            强大的 AI 创作工具
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            从灵感到成品，AI 全程辅助你的创作流程
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, i) => (
            <AnimatedSection key={feature.title} delay={i * 0.08}>
              <div className="group relative p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 cursor-pointer overflow-hidden">
                {/* Hover glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 ${feature.bgGlow} rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors duration-200">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors duration-200">
                    {feature.description}
                  </p>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-indigo-400 transition-colors duration-200">
                    了解更多
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================
   AI Agents Section
   ======================================== */
const agents = [
  {
    emoji: "\u{1F3D7}\uFE0F",
    name: "建筑大师",
    description: "专注于建筑外观设计，从现代到古典风格，帮你快速生成专业建筑效果图",
    gradient: "from-indigo-500/20 to-blue-500/20",
    borderColor: "hover:border-indigo-500/30",
  },
  {
    emoji: "\u{1F6E1}\uFE0F",
    name: "室内设计师",
    description: "精通各类室内设计风格，从极简到奢华，打造理想居住空间",
    gradient: "from-purple-500/20 to-pink-500/20",
    borderColor: "hover:border-purple-500/30",
  },
  {
    emoji: "\u{1F333}",
    name: "景观规划师",
    description: "擅长园林景观和城市规划，生成逼真的户外场景和鸟瞰图",
    gradient: "from-emerald-500/20 to-teal-500/20",
    borderColor: "hover:border-emigo-500/30",
  },
  {
    emoji: "\u{1F3AC}",
    name: "视频导演",
    description: "帮你制作建筑漫游动画和短视频，让设计方案动起来",
    gradient: "from-orange-500/20 to-amber-500/20",
    borderColor: "hover:border-orange-500/30",
  },
];

function AgentsSection() {
  return (
    <section id="agents" className="relative py-24 md:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-zinc-400">AI 智能体</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            AI 智能体，让创作更简单
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            无需了解复杂参数，对话即可完成专业级创作
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {agents.map((agent, i) => (
            <AnimatedSection key={agent.name} delay={i * 0.1}>
              <div className={`group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] ${agent.borderColor} hover:bg-white/[0.04] transition-all duration-300 cursor-pointer`}>
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center mb-5 text-3xl group-hover:scale-105 transition-transform duration-300">
                  {agent.emoji}
                </div>

                {/* Name */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {agent.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                  {agent.description}
                </p>

                {/* CTA */}
                <button className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  开始对话
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================
   Stats Section
   ======================================== */
const stats = [
  { value: "10,000+", label: "注册用户", icon: Users },
  { value: "50,000+", label: "生成作品", icon: ImageIcon },
  { value: "4", label: "智能体数量", icon: Bot },
  { value: "100+", label: "预设模板", icon: LayoutTemplate },
];

function StatsSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[120px]" />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 0.1}>
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <stat.icon className="w-5 h-5 text-indigo-400/60" />
                </div>
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500 font-medium">{stat.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================
   Tutorials Section
   ======================================== */
const tutorials = [
  {
    icon: MousePointerClick,
    title: "新手引导",
    description: "5 分钟了解 AI 创作全流程，快速上手",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: Building2,
    title: "建筑效果图教程",
    description: "学习如何生成逼真的建筑外观效果图",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Film,
    title: "视频制作教程",
    description: "从静态到动态，制作建筑漫游短视频",
    gradient: "from-emerald-500 to-teal-500",
  },
];

function TutorialsSection() {
  return (
    <section id="tutorials" className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-zinc-400">学习资源</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            快速上手
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            跟随教程，轻松掌握 AI 创作技巧
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {tutorials.map((tutorial, i) => (
            <AnimatedSection key={tutorial.title} delay={i * 0.1}>
              <Link href="/tutorials" className="group block">
                <div className="relative p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 overflow-hidden">
                  {/* Hover glow */}
                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${tutorial.gradient} opacity-0 group-hover:opacity-10 rounded-full blur-[60px] transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tutorial.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <tutorial.icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {tutorial.title}
                    </h3>

                    <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                      {tutorial.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-indigo-400 transition-colors">
                      开始学习
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================
   CTA Section
   ======================================== */
function CTASection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative py-24 md:py-32">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <AnimatedSection>
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.06]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-purple-500/10 rounded-full blur-[100px]" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "48px 48px",
              }}
            />

            <div className="relative z-10 px-6 py-16 md:px-16 md:py-20 text-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  {isAuthenticated ? "准备好继续创作了吗？" : "准备好开始创作了吗？"}
                </h2>
                <p className="text-zinc-300 text-lg mb-8 max-w-xl mx-auto">
                  {isAuthenticated ? "进入工作区，继续你的创意之旅" : "注册即送 20 积分，立即体验 AI 创作的魔力"}
                </p>
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    className="h-12 px-10 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02]"
                    asChild
                  >
                    <Link href="/generate">
                      进入工作区
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="h-12 px-10 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02]"
                    asChild
                  >
                    <Link href="/register">
                      免费注册
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ========================================
   Main Page Component
   ======================================== */
function HomePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 如果正在加载，显示加载状态
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main>
        <HeroSection isAuthenticated={status === 'authenticated'} />
        <ShowcaseSection />
        <FeaturesSection />
        <AgentsSection />
        <StatsSection />
        <TutorialsSection />
        <CTASection isAuthenticated={status === 'authenticated'} />
      </main>
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <HomePageContent />
    </AuthProvider>
  );
}
