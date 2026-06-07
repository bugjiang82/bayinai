"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ImagePlus,
  Video,
  Pencil,
  Building2,
  Sofa,
  TreePine,
  ChevronLeft,
  ChevronRight,
  Bot,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const generateModes = [
  { key: "image", label: "图像生成", icon: ImagePlus, href: "/generate/image" },
  { key: "video", label: "视频生成", icon: Video, href: "/generate/video" },
  { key: "edit", label: "图片编辑", icon: Pencil, href: "/generate/edit" },
  { key: "architecture", label: "进阶设计", icon: Building2, href: "/generate/architecture" },
  { key: "canvas-mode", label: "画布模式", icon: LayoutGrid, href: "/workflow/workspace" },
  { key: "all-round-test", label: "自动化测试", icon: Bot, href: "/all-round-test" },
];

const quickTemplates = [
  { key: "architecture", label: "建筑", icon: Building2, href: "/templates?category=architecture" },
  { key: "interior", label: "室内", icon: Sofa, href: "/templates?category=interior" },
  { key: "landscape", label: "景观", icon: TreePine, href: "/templates?category=landscape" },
];

// Independent Sidebar NavLink component for generate modes
const SidebarNavLink = React.memo(function SidebarNavLink({
  href,
  activeMode,
  modeKey,
  icon: Icon,
  collapsed,
  label,
}: {
  href: string;
  activeMode: string;
  modeKey: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  label: string;
}) {
  const isActive = activeMode === modeKey;
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-indigo-400")} />
      <span className={cn("transition-opacity duration-200", collapsed ? "hidden" : "hidden lg:inline")}>
        {label}
      </span>
    </Link>
  );
});

// Independent Template NavLink component
const TemplateNavLink = React.memo(function TemplateNavLink({
  href,
  icon: Icon,
  collapsed,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors",
        collapsed && "justify-center px-0"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className={cn("transition-opacity duration-200", collapsed ? "hidden" : "hidden lg:inline")}>
        {label}
      </span>
    </Link>
  );
});

interface SidebarProps {
  currentMode?: string;
}

export default function Sidebar({ currentMode = "text-to-image" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Sync sidebar width to CSS variable so layout can react
  useEffect(() => {
    const width = collapsed ? 56 : 224; // w-14=56px, w-56=224px
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
  }, [collapsed]);

  // Determine active mode from URL pathname
  const getActiveMode = () => {
    if (pathname.includes("/workflow")) return "canvas-mode";
    if (pathname.includes("canvas-mode")) return "canvas-mode";
    if (pathname.includes("image-to-image")) return "image";
    if (pathname.includes("text-to-image")) return "image";
    if (pathname.includes("video")) return "video";
    if (pathname.includes("edit")) return "edit";
    if (pathname.includes("architecture")) return "architecture";
    if (pathname.includes("canvas")) return "canvas-mode";
    if (pathname.includes("all-round-test")) return "all-round-test";
    if (pathname.includes("/generate/image")) return "image";
    return "image";
  };

  const activeMode = getActiveMode();

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 bottom-0 bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col z-40 transition-all duration-300",
        collapsed ? "w-14" : "w-16 lg:w-56"
      )}
    >
      {/* Generation Modes */}
      <div className="flex-1 py-4 px-2 lg:px-3 overflow-y-auto">
        <p
          className={cn(
            "text-xs font-medium text-zinc-600 uppercase tracking-wider px-3 mb-3 transition-opacity duration-200",
            collapsed ? "hidden" : "hidden lg:block"
          )}
        >
          生成模式
        </p>
        <nav className="space-y-1">
          {generateModes.map((mode) => (
            <SidebarNavLink
              key={mode.key}
              href={mode.href}
              activeMode={activeMode}
              modeKey={mode.key}
              icon={mode.icon}
              collapsed={collapsed}
              label={mode.label}
            />
          ))}
        </nav>
      </div>

      {/* Quick Templates */}
      <div className="py-4 px-2 lg:px-3 border-t border-white/[0.06]">
        <p
          className={cn(
            "text-xs font-medium text-zinc-600 uppercase tracking-wider px-3 mb-3 transition-opacity duration-200",
            collapsed ? "hidden" : "hidden lg:block"
          )}
        >
          快捷模板
        </p>
        <nav className="space-y-1">
          {quickTemplates.map((template) => (
            <TemplateNavLink
              key={template.key}
              href={template.href}
              icon={template.icon}
              collapsed={collapsed}
              label={template.label}
            />
          ))}
        </nav>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center py-3 border-t border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
        title={collapsed ? "展开菜单" : "收起菜单"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
