"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Code2,
  Image,
  Video,
  Zap,
  GitBranch,
  History,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { imageModelsChapter } from "./chapters/image-models";
import { videoModelsChapter } from "./chapters/video-models";
import { creditRulesChapter } from "./chapters/credit-rules";
import { canvasArchitectureChapter } from "./chapters/canvas-architecture";
import { changelogChapter } from "./chapters/changelog";
import { devlog20260601Chapter } from "./chapters/devlog-2026-06-01";

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const DOC_SECTIONS: DocSection[] = [
  { id: "image-models", title: "添加图片大模型", description: "如何添加新的图片生成模型", icon: Image },
  { id: "video-models", title: "添加视频大模型", description: "如何添加新的视频生成模型", icon: Video },
  { id: "credit-rules", title: "配置积分规则", description: "如何配置模型的积分扣减规则", icon: Zap },
  { id: "canvas-architecture", title: "画布模式架构", description: "画布模式的代码结构与模块依赖关系", icon: GitBranch },
  { id: "changelog", title: "开发变更记录", description: "2026-05-27 开发变更记录总览", icon: History },
  { id: "2026-06-01-devlog", title: "2026-06-01 开发日志", description: "Seedance 1.5 Pro 视频时长参数修复", icon: Calendar },
];

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}

const DOC_CHAPTERS: Record<string, Chapter> = {
  "image-models": imageModelsChapter as unknown as Chapter,
  "video-models": videoModelsChapter as unknown as Chapter,
  "credit-rules": creditRulesChapter as unknown as Chapter,
  "canvas-architecture": canvasArchitectureChapter as unknown as Chapter,
  "changelog": changelogChapter as unknown as Chapter,
  "2026-06-01-devlog": devlog20260601Chapter as unknown as Chapter,
};

export default function AdminDocsPage() {
  const [activeSection, setActiveSection] = useState<string>("image-models");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["image-overview", "image-step1", "video-overview", "credit-overview", "changelog-overview", "changelog-1", "changelog-9", "0601-overview", "0601-fix1"]));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BookOpen className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold">开发帮助文档</h1>
            <p className="text-slate-400 text-sm">网站开发指南与API文档</p>
          </div>
        </div>

        <div className="flex gap-6">
          <nav className="w-64 flex-shrink-0">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">文档目录</h3>
              <ul className="space-y-1">
                {DOC_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                        activeSection === section.id
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                      )}
                    >
                      <section.icon className="w-4 h-4" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <main className="flex-1">
            <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                <h2 className="text-xl font-semibold">
                  {DOC_CHAPTERS[activeSection]?.title}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {DOC_SECTIONS.find(s => s.id === activeSection)?.description}
                </p>
              </div>

              <div className="divide-y divide-slate-700">
                {DOC_CHAPTERS[activeSection]?.sections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Code2 className="w-4 h-4 text-indigo-400" />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {expandedSections.has(section.id) && (
                      <div className="px-6 pb-6">
                        {section.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}