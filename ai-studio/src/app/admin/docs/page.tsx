"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode,
  Image,
  Video,
  Zap,
  ArrowRight,
  Copy,
  Check,
  GitBranch,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  "image-models": {
    id: "image-models",
    title: "添加图片大模型",
    sections: [
      {
        id: "image-overview",
        title: "概述",
        content: (
          <div className="space-y-4">
            <p>
              图片大模型统一注册在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/imageModels.ts</code> 文件中。
              添加新模型只需修改以下三个文件，无需改动其他业务代码。
            </p>
            <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm">网页模式自动同步</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm">画布模式自动同步</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm">积分规则自动适配</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "image-step1",
        title: "步骤一：注册模型信息",
        content: (
          <div className="space-y-4">
            <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/imageModels.ts</code> 的 <code className="px-2 py-1 bg-slate-800 rounded text-sm">IMAGE_MODELS</code> 对象中添加新模型：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">src/models/imageModels.ts</span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code>{`export const IMAGE_MODELS: Record<ImageModelId, ModelInfo> = {
  // ... 已有模型
  turbo: {
    id: "turbo",
    name: "GPT Turbo",
    category: "image",
    description: "超快速生成，适合批量创作",
    supportedQualities: ["1K", "2K"],
    isImage2Model: false,
    isProModel: false,
    isFlashModel: false,
  },
};`}</code>
              </pre>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <span className="font-medium text-indigo-400">supportedQualities</span>
                <p className="text-slate-400 mt-1">支持的图片质量：512, 1K, 2K, 4K</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <span className="font-medium text-indigo-400">布尔标志</span>
                <p className="text-slate-400 mt-1">isFlashModel/isProModel/isImage2Model 用于分类</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "image-step2",
        title: "步骤二：添加 API 名称映射",
        content: (
          <div className="space-y-4">
            <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">IMAGE_MODEL_API_NAMES</code> 对象中添加 API 调用名称：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">src/models/imageModels.ts</span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code>{`export const IMAGE_MODEL_API_NAMES: Record<ImageModelId, string> = {
  // ... 已有映射
  turbo: "openai/gpt-5-turbo-image",
};`}</code>
              </pre>
            </div>
          </div>
        ),
      },
      {
        id: "image-step3",
        title: "步骤三：更新类型定义",
        content: (
          <div className="space-y-4">
            <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/types.ts</code> 中添加新模型 ID：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">src/models/types.ts</span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code>{`export type ImageModelId = "flash" | "pro" | "image2" | "turbo";`}</code>
              </pre>
            </div>
          </div>
        ),
      },
      {
        id: "image-step4",
        title: "步骤四：配置积分规则",
        content: (
          <div className="space-y-4">
            <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/creditRules.ts</code> 中添加积分规则：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">src/models/creditRules.ts</span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code>{`export const DEFAULT_IMAGE_CREDIT_RULES: ImageCreditRule[] = [
  // ... 已有规则
  { policyKey: "turbo__1k", modelId: "turbo", quality: "1K", name: "Turbo - 1K", cost: 10, unit: "次" },
  { policyKey: "turbo__2k", modelId: "turbo", quality: "2K", name: "Turbo - 2K", cost: 20, unit: "次" },
];`}</code>
              </pre>
            </div>
            <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm">
              <p className="text-amber-400 font-medium">提示：policyKey 格式</p>
              <p className="text-slate-300 mt-1">policyKey 必须遵循格式：<code className="px-1 bg-slate-800 rounded">modelId__quality</code>（如 flash__1k、pro__4k）</p>
            </div>
          </div>
        ),
      },
    ],
  },
  "video-models": {
    id: "video-models",
    title: "添加视频大模型",
    sections: [
      {
        id: "video-overview",
        title: "概述",
        content: (
          <div className="space-y-4">
            <p>
              视频大模型统一注册在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/videoModels.ts</code> 文件中。
              添加新模型只需修改两个文件。
            </p>
          </div>
        ),
      },
      {
        id: "video-step1",
        title: "步骤一：注册模型信息",
        content: (
          <div className="space-y-4">
            <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">VIDEO_MODELS</code> 对象中添加新模型：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">src/models/videoModels.ts</span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code>{`export const VIDEO_MODELS: Record<VideoModelId, VideoModelInfo> = {
  // ... 已有模型
  "pika-2.0-t2v": {
    id: "pika-2.0-t2v",
    name: "Pika 2.0",
    displayName: "Pika 2.0",
    category: "video",
    description: "文生视频，支持风格控制",
    supportedResolutions: ["720P", "1080P"],
    supportedDurations: [5, 10],
    supportsTextToVideo: true,
    supportsImageToVideo: false,
    isWan22: false,
    isWan27: false,
    isHappyHorse: false,
  },
};`}</code>
              </pre>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <span className="font-medium text-indigo-400">supportedResolutions</span>
                <p className="text-slate-400 mt-1">支持的分辨率：480P, 720P, 1080P</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <span className="font-medium text-indigo-400">supportedDurations</span>
                <p className="text-slate-400 mt-1">支持的时长（秒）：3, 5, 10, 15</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <span className="font-medium text-indigo-400">支持模式</span>
                <p className="text-slate-400 mt-1">supportsTextToVideo / supportsImageToVideo</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "video-step2",
        title: "步骤二：配置积分规则",
        content: (
          <div className="space-y-4">
            <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/creditRules.ts</code> 中添加按秒计费规则：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">src/models/creditRules.ts</span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code>{`export const DEFAULT_VIDEO_CREDIT_RULES: VideoCreditRule[] = [
  // ... 已有规则
  { policyKey: "pika-2-0-t2v__720p", modelId: "pika-2.0-t2v", resolution: "720P", name: "Pika 2.0 - 720P", costPerSecond: 45, unit: "秒" },
  { policyKey: "pika-2-0-t2v__1080p", modelId: "pika-2.0-t2v", resolution: "1080P", name: "Pika 2.0 - 1080P", costPerSecond: 70, unit: "秒" },
];`}</code>
              </pre>
            </div>
            <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm">
              <p className="text-amber-400 font-medium">提示：policyKey 格式</p>
              <p className="text-slate-300 mt-1">policyKey 必须将模型 ID 中的点替换为连字符：<code className="px-1 bg-slate-800 rounded">pika-2.0-t2v → pika-2-0-t2v__720p</code></p>
            </div>
          </div>
        ),
      },
    ],
  },
  "credit-rules": {
    id: "credit-rules",
    title: "配置积分规则",
    sections: [
      {
        id: "credit-overview",
        title: "概述",
        content: (
          <div className="space-y-4">
            <p>
              积分规则定义在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/creditRules.ts</code> 中，分为图片规则和视频规则两类。
              规则会自动同步到管理后台的积分策略配置页面。
            </p>
          </div>
        ),
      },
      {
        id: "credit-policy-key",
        title: "Policy Key 命名规范",
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-indigo-400 mb-2">图片模型</h4>
                  <code className="text-sm bg-slate-900 px-2 py-1 rounded">modelId__quality</code>
                  <div className="mt-2 space-y-1 text-sm text-slate-400">
                    <p>flash__1k, flash__2k, flash__4k</p>
                    <p>pro__512, pro__1k, pro__2k</p>
                    <p>image2__1k, image2__2k</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-indigo-400 mb-2">视频模型</h4>
                  <code className="text-sm bg-slate-900 px-2 py-1 rounded">modelId__resolution</code>
                  <div className="mt-2 space-y-1 text-sm text-slate-400">
                    <p>wan2-2-kf2v-flash__720p</p>
                    <p>wan2-7-t2v__1080p</p>
                    <p>happyhorse-1-0-t2v__720p</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm">
              <p className="text-blue-400 font-medium">重要提示</p>
              <p className="text-slate-300 mt-1">Policy Key 中的模型 ID 需要将点（.）替换为连字符（-），质量/分辨率使用小写字母。</p>
            </div>
          </div>
        ),
      },
      {
        id: "credit-auto-sync",
        title: "自动同步机制",
        content: (
          <div className="space-y-4">
            <p>当访问管理后台的积分策略页面时，系统会自动检查数据库中的规则与默认规则是否一致。如果数据库中缺少某些规则，系统会自动补充。</p>
            <div className="flex items-center gap-2 p-4 bg-slate-800/50 rounded-lg">
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <span className="text-sm">修改默认规则后，刷新管理后台页面即可自动同步到数据库</span>
            </div>
          </div>
        ),
      },
    ],
  },
  "canvas-architecture": {
    id: "canvas-architecture",
    title: "画布模式架构",
    sections: [
      {
        id: "canvas-overview",
        title: "概述",
        content: (
          <div className="space-y-4">
            <p>
              画布模式是基于 <span className="text-indigo-400">React Flow (@xyflow/react)</span> 构建的 AI 工作流编辑器，
              使用 <span className="text-indigo-400">Zustand</span> 进行状态管理，
              通过 <span className="text-indigo-400">Next.js App Router</span> 路由。
              用户可通过拖拽方式在画布上添加和连接节点，支持文生图、文生视频等 AI 生成功能。
            </p>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h4 className="font-medium text-indigo-400 mb-3">技术栈</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Next.js 15 (App Router)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>React Flow (@xyflow/react)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span>Zustand (状态管理)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                  <span>Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  <span>Framer Motion</span>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "canvas-file-structure",
        title: "文件结构",
        content: (
          <div className="space-y-4">
            <p>画布模式相关代码分布如下（重构后）：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">项目文件结构</span>
              </div>
              <pre className="p-4 text-sm overflow-x-auto text-slate-300">
                <code>{`src/
├── app/
│   ├── workflow/
│   │   ├── page.tsx                    # 画布入口页
│   │   └── workspace/page.tsx         # 工作空间（项目管理）
│   └── api/workflow/projects/         # 项目 CRUD API
├── components/workflow/
│   ├── WorkflowCanvas.tsx              # 核心画布组件
│   ├── types.ts                        # 类型定义
│   ├── context/
│   │   └── CanvasInteractionContext.tsx # [新] 交互上下文
│   ├── services/
│   │   ├── aiService.ts                # AI 生成服务
│   │   ├── costCalculator.ts           # [新] 费用计算
│   │   └── canvasEvents.ts             # [新] 事件总线
│   ├── hooks/
│   │   ├── useProjectManager.ts        # [新] 项目管理
│   │   ├── useAssistantChat.ts         # [新] AI 助手
│   │   ├── useHistoryManager.ts        # [新] 历史记录
│   │   └── useUserCredits.ts           # [新] 积分管理
│   ├── dialogs/                        # [新] 对话框组件
│   │   ├── SaveProjectDialog.tsx
│   │   ├── LoadProjectDialog.tsx
│   │   └── HistoryDialog.tsx
│   └── nodes/
│       ├── BaseNode.tsx                # 基础节点
│       ├── ImageNode.tsx               # 图片节点
│       ├── VideoNode.tsx               # 视频节点
│       └── TextNode.tsx                # 文本节点
├── services/
│   └── projectService.ts               # [新] 项目服务层
├── stores/
│   └── canvasStore.ts                  # Zustand 状态管理
├── hooks/
│   └── useToast.ts                     # [新] 统一 Toast
└── utils/
    └── thumbnail.ts                    # [新] 缩略图工具`}</code>
              </pre>
            </div>
          </div>
        ),
      },
      {
        id: "canvas-dependency-graph",
        title: "功能依赖图",
        content: (
          <div className="space-y-4">
            <p>下图展示了画布模式核心组件之间的依赖关系：</p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">组件依赖关系</span>
              </div>
              <pre className="p-4 text-xs overflow-x-auto text-slate-300 leading-relaxed">
                <code>{`workflow/page.tsx
  └─► WorkflowCanvas.tsx (编排层)
       ├─► hooks/useProjectManager ──► projectService ──► /api/workflow/projects
       ├─► hooks/useAssistantChat ────► aiService.chatWithAssistant
       ├─► hooks/useHistoryManager ───► /api/workflow/history
       ├─► hooks/useUserCredits ──────► /api/user/credits
       ├─► context/CanvasInteractionContext ◄── BaseNode
       ├─► dialogs/SaveProjectDialog
       ├─► dialogs/LoadProjectDialog ──► projectService
       ├─► dialogs/HistoryDialog
       └─► nodes/
            ├─► BaseNode ──► costCalculator / CanvasInteractionContext
            ├─► ImageNode ──► costCalculator / thumbnail / aiService
            ├─► VideoNode ──► costCalculator / thumbnail / aiService
            └─► TextNode ───► aiService

workspace/page.tsx
  ├─► projectService ──► /api/workflow/projects
  └─► hooks/useToast

canvasStore (Zustand)
  └─► projectService ──► /api/workflow/projects`}</code>
              </pre>
            </div>
          </div>
        ),
      },
      {
        id: "canvas-core-components",
        title: "核心组件说明",
        content: (
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h4 className="font-medium text-indigo-400 mb-2">WorkflowCanvas.tsx</h4>
                <p className="text-sm text-slate-400">核心画布组件，负责编排所有子模块。其职责已从原来的 10+ 项缩减为：ReactFlow 渲染、Hook 整合、子面板编排。具体业务逻辑已拆分到独立的 Hook 中。</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h4 className="font-medium text-indigo-400 mb-2">projectService.ts</h4>
                <p className="text-sm text-slate-400">统一项目服务层，封装所有项目 CRUD 的 API 调用。被 WorkflowCanvas、workspace/page、canvasStore 共同使用，确保 API 调用逻辑一致。</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h4 className="font-medium text-indigo-400 mb-2">canvasStore.ts</h4>
                <p className="text-sm text-slate-400">Zustand 状态管理，管理当前项目信息、加载状态、错误信息。提供 createProject、loadProject、saveProject、deleteProject 等操作方法。</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h4 className="font-medium text-indigo-400 mb-2">costCalculator.ts</h4>
                <p className="text-sm text-slate-400">统一的费用计算模块，合并了原先在 BaseNode、ImageNode、VideoNode 中三份重复的计算逻辑。所有节点组件通过此模块获取积分消耗。</p>
              </CardContent>
            </Card>
          </div>
        ),
      },
      {
        id: "canvas-new-modules",
        title: "重构新增模块",
        content: (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h4 className="font-medium text-green-400 mb-2">服务层</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><code className="px-1 bg-slate-800 rounded">projectService.ts</code> — 统一项目 API 调用（list/get/create/update/delete）</li>
                <li><code className="px-1 bg-slate-800 rounded">costCalculator.ts</code> — 统一节点积分费用计算</li>
                <li><code className="px-1 bg-slate-800 rounded">canvasEvents.ts</code> — 事件总线，解耦节点与 ReactFlow 的直接操作</li>
              </ul>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h4 className="font-medium text-blue-400 mb-2">业务 Hook</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><code className="px-1 bg-slate-800 rounded">useProjectManager</code> — 项目 CRUD 与自动保存</li>
                <li><code className="px-1 bg-slate-800 rounded">useAssistantChat</code> — AI 助手对话逻辑</li>
                <li><code className="px-1 bg-slate-800 rounded">useHistoryManager</code> — 历史记录管理</li>
                <li><code className="px-1 bg-slate-800 rounded">useUserCredits</code> — 用户积分获取与扣减</li>
                <li><code className="px-1 bg-slate-800 rounded">useToast</code> — 统一 Toast 通知</li>
              </ul>
            </div>
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
              <h4 className="font-medium text-purple-400 mb-2">UI 组件</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><code className="px-1 bg-slate-800 rounded">CanvasInteractionContext.tsx</code> — 画布交互状态上下文</li>
                <li><code className="px-1 bg-slate-800 rounded">SaveProjectDialog</code> — 保存项目对话框</li>
                <li><code className="px-1 bg-slate-800 rounded">LoadProjectDialog</code> — 加载项目对话框</li>
                <li><code className="px-1 bg-slate-800 rounded">HistoryDialog</code> — 历史记录对话框</li>
              </ul>
            </div>
            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
              <h4 className="font-medium text-orange-400 mb-2">工具函数</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><code className="px-1 bg-slate-800 rounded">thumbnail.ts</code> — 图片/视频缩略图生成（createImageThumbnail / generateVideoThumbnail）</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "canvas-data-flow",
        title: "数据流图",
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-indigo-400 mb-2">项目数据流</h4>
                  <pre className="text-xs text-slate-300 leading-relaxed">
                    <code>{`workspace/page.tsx            WorkflowCanvas.tsx
┌────────────────┐          ┌──────────────────────┐
│ listProjects() │          │ useProjectManager    │
│      ↓         │          │      ↓               │
│ projectService │  shared  │ projectService       │
│      ↓         │◄────────►│      ↓               │
│ /api/projects  │          │ /api/projects/[id]   │
└────────────────┘          └──────────────────────┘

统一出口: projectService (单例)
统一状态: canvasStore (Zustand)`}</code>
                  </pre>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-indigo-400 mb-2">积分数据流</h4>
                  <pre className="text-xs text-slate-300 leading-relaxed">
                    <code>{`useUserCredits (WorkflowCanvas)
      ↓ userCredits
addNode() → data.credits = userCredits
      ↓
BaseNode / ImageNode / VideoNode
      ↓
cost = calculateNodeCost(data, ...)  ← costCalculator (统一)
      ↓
生成成功后: deductCredits(cost)      ← useUserCredits (统一)`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        ),
      },
      {
        id: "canvas-best-practices",
        title: "开发最佳实践",
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <h4 className="font-medium text-blue-400 mb-2">模块化原则</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li><span className="font-medium">单一职责</span>：每个 Hook 只处理一类业务逻辑（如 useProjectManager 只处理项目 CRUD）</li>
                <li><span className="font-medium">服务层隔离</span>：所有 API 调用通过 projectService 统一管理，不要在组件中直接 fetch</li>
                <li><span className="font-medium">状态提升</span>：跨组件共享的 UI 状态使用 Context 或 Zustand Store，避免 props drilling</li>
                <li><span className="font-medium">事件驱动</span>：节点组件通过 canvasEvents 发布事件，不再直接操作 ReactFlow 内部状态</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <h4 className="font-medium text-amber-400 mb-2">注意事项</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                <li>新增节点类型时，只需在 <code className="px-1 bg-slate-800 rounded">nodes/</code> 目录下创建组件并在 nodeTypes 中注册</li>
                <li>费用计算逻辑统一在 <code className="px-1 bg-slate-800 rounded">costCalculator.ts</code> 中维护</li>
                <li>缩略图生成统一使用 <code className="px-1 bg-slate-800 rounded">utils/thumbnail.ts</code> 中的工具函数</li>
                <li>Toast 通知统一使用 <code className="px-1 bg-slate-800 rounded">hooks/useToast</code></li>
                <li>使用 canvasStore 管理项目级别状态，不要在组件内重复管理</li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
};

export default function AdminDocsPage() {
  const [activeSection, setActiveSection] = useState<string>("image-models");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["image-overview", "image-step1", "video-overview", "credit-overview"]));

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

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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