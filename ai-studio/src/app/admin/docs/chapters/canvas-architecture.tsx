"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check, FileCode, ArrowRight, GitBranch } from "lucide-react";

export const canvasArchitectureChapter = {
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
} as const;