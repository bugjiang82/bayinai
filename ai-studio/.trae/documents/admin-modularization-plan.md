# 画布模式解耦重构实施计划

## 概述

基于前期的代码耦合分析，本计划将分三个阶段执行：

1. **架构文档编写** — 绘制代码逻辑与功能依赖图，形成架构分析文档
2. **解耦重构实施** — 按优先级逐步实施 8 个耦合点的解耦
3. **文档沉淀** — 将架构文档整合到管理后台开发文档中

***

## 阶段一：架构文档编写

### 任务 1.1：编写画布模式代码逻辑与依赖分析文档

**输出文件**：`docs/superpowers/2026-05-22-canvas-mode-architecture.md`

**内容大纲**：

1. **代码文件总览** — 列出所有涉及画布模式的文件及其行数、职责

2. **功能依赖图（文字版 + ASCII 图）**

   ```
   ┌──────────────────────────────────────────────────────────────┐
   │                      workflow/page.tsx                       │
   │                   (入口：解析 URL 参数)                        │
   └──────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
   ┌──────────────────────────┐  ┌──────────────────────────┐
   │   WorkflowCanvas.tsx     │  │  workspace/page.tsx      │
   │   (核心画布，1565行)      │  │  (项目管理，591行)        │
   │   ┌───────────────────┐  │  │  - fetchProjects()       │
   │   │ 状态管理 (useState)│  │  │  - handleCreateProject() │
   │   │ - 20+ 状态变量     │  │  │  - handleDeleteProject() │
   │   │ - 画布交互         │  │  │  - 直接调用 API          │
   │   │ - 项目 CRUD        │  │  └──────────────────────────┘
   │   │ - AI 助手          │  │              │
   │   │ - 历史记录          │  │     ┌────────┴────────┐
   │   │ - 积分管理          │  │     ▼                 ▼
   │   │ - Toast 通知       │  │  ┌──────────┐  ┌──────────────┐
   │   │ - 对话框渲染        │  │  │project   │  │[id]/route.ts │
   │   │ - 工具栏面板        │  │  │route.ts  │  │(CRUD 实现)   │
   │   └───────────────────┘  │  └──────────┘  └──────────────┘
   │                          │
   │   ┌───────────────────┐  │
   │   │ 节点组件层          │  │
   │   │  BaseNode (652行)  │◄─┼── useDragging / useMultiSelect
   │   │  ├─ ImageNode      │  │   (Context 循环依赖!)
   │   │  ├─ VideoNode      │  │
   │   │  └─ TextNode       │  │
   │   │  每个节点:          │  │
   │   │  - useReactFlow()  │  │  ← 直接操作 ReactFlow 内部状态
   │   │  - 独立计费逻辑     │  │
   │   │  - 独立缩略图生成   │  │
   │   └───────────────────┘  │
   │                          │
   │   ┌───────────────────┐  │
   │   │ aiService.ts      │  │
   │   │ (生成 API 封装)    │  │
   │   │ - generateText()  │  │
   │   │ - generateImage() │  │
   │   │ - generateVideo() │  │
   │   └───────────────────┘  │
   └──────────────────────────┘

   [废弃] canvasStore.ts (408行) — Zustand Store 定义但不使用
   ```

3. **数据流图** — 描述积分、项目数据、用户交互在不同组件间如何流动

4. **耦合点矩阵** — 表格形式列出 8 个耦合点的严重程度、影响范围

5. **当前架构评估** — 模块化评分（满分 10）及相关说明

### 任务 1.2：编写 canvasStore 现状分析

在架构文档中专门用一节说明 `canvasStore.ts` 的现状：

* 已定义的完整接口（70+ 行类型定义）

* 所有方法内部都是 mock 实现和 `console.log`

* 为何未被使用的根因分析（组件开发时直接写了 inline 逻辑）

***

## 阶段二：解耦重构实施

### 第一优先级（消除关键阻塞）

#### 任务 2.1：创建统一项目服务层

**新建文件**：`src/services/projectService.ts`

**内容**：

* 定义 `ProjectDTO` 接口

* 创建 `ProjectService` 类，封装所有项目 API 调用

  * `list()` → GET /api/workflow/projects

  * `get(id)` → GET /api/workflow/projects/\[id]

  * `create(data)` → POST /api/workflow/projects

  * `update(id, data)` → PUT /api/workflow/projects/\[id]

  * `delete(id)` → DELETE /api/workflow/projects/\[id]

* 导出单例 `projectService`

**验证**：`workspace/page.tsx` 和 `WorkflowCanvas.tsx` 都可导入使用

***

#### 任务 2.2：重构 canvasStore 使其调用 projectService

**修改文件**：`src/stores/canvasStore.ts`

**改造要点**：

* 删除 mock 实现和 `console.log`

* 让 `loadProject`、`saveProject`、`deleteProject`、`getProjects` 调用 `projectService`

* 移除 `nodes`、`connections` 等 React Flow 状态（这些应由 React Flow 自己管理）

* 保留 `currentProject`、`isLoading`、`error` 等 UI 状态

* 移除 `persist` 中间件（项目数据已在服务端持久化）

**修改后的接口**：

```typescript
interface CanvasState {
  currentProject: ProjectDTO | null;
  isLoading: boolean;
  error: string | null;
  // 项目操作
  createProject: (name: string, desc?: string) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  saveProject: (id: string, name: string, desc?: string, canvasData?: unknown) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  listProjects: () => Promise<ProjectDTO[]>;
  // 状态操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
```

***

#### 任务 2.3：拆离 DraggingContext / MultiSelectContext 到独立模块

**新建文件**：`src/components/workflow/context/CanvasInteractionContext.tsx`

**内容**：

* 从 `WorkflowCanvas.tsx` 拆出 `DraggingContext`、`MultiSelectContext` 的定义

* 导出 `useDragging`、`useMultiSelect` hooks

* 导出 `CanvasInteractionProvider` 组件

**修改文件**：

* `src/components/workflow/WorkflowCanvas.tsx` — 改为从新模块导入 Provider

* `src/components/workflow/nodes/BaseNode.tsx` — 改为从新模块导入 hooks

**验证**：不再有 `BaseNode` → `WorkflowCanvas` 的 import 引用

***

#### 任务 2.4：提取费用计算逻辑

**新建文件**：`src/components/workflow/services/costCalculator.ts`

**内容**：

* 导出 `calculateNodeCost()` 函数（合并 BaseNode、ImageNode、VideoNode 中三份重复实现）

* 参数设计：`(data: NodeData, getImageCost, getVideoCost) => number`

**扩展文件**：`src/hooks/useCreditPolicies.ts`

**新增内容**：

* 导出 `useNodeCost(data: NodeData)` hook，内部调用 `calculateNodeCost`

**修改文件**：

* `src/components/workflow/nodes/BaseNode.tsx` — 删除内联 `calculateCost`，改用 `useNodeCost`

* `src/components/workflow/nodes/ImageNode.tsx` — 删除内联 cost useMemo，改用 `useNodeCost`

* `src/components/workflow/nodes/VideoNode.tsx` — 删除内联 `calculateCost`，改用 `useNodeCost`

**验证**：三处节点组件调用同一函数，计算结果一致

***

#### 任务 2.5：提取缩略图生成工具

**新建文件**：`src/utils/thumbnail.ts`

**内容**：

* 导出 `createImageThumbnail(src: string, maxSize?: number): Promise<string>`

* 导出 `generateVideoThumbnail(videoUrl: string): Promise<string>`

**修改文件**：

* `src/components/workflow/nodes/ImageNode.tsx` — 删除内联 `createThumbnail`，改用工具函数

* `src/components/workflow/WorkflowCanvas.tsx` — `onDropCanvas` 中的图片处理改用工具函数

* `src/components/workflow/nodes/VideoNode.tsx` — 删除 `generateThumbnail`，改用工具函数

***

### 第二优先级（架构优化）

#### 任务 2.6：拆分 WorkflowCanvas 上帝组件

**新建文件**：

1. `src/components/workflow/hooks/useProjectManager.ts` — 项目 CRUD + 自动保存
2. `src/components/workflow/hooks/useAssistantChat.ts` — AI 助手对话逻辑
3. `src/components/workflow/hooks/useHistoryManager.ts` — 历史记录管理
4. `src/components/workflow/hooks/useCanvasInteraction.ts` — 画布拖拽/连接/选择
5. `src/components/workflow/hooks/useUserCredits.ts` — 积分获取与扣减

**修改文件**：`src/components/workflow/WorkflowCanvas.tsx`

**改造要点**：

* 将 20+ 个 useState 按职责分组迁移到对应 Hook

* `WorkflowCanvas` 仅保留：ReactFlow 渲染、子面板编排、Hook 调用整合

* 目标行数：从 1565 行缩减至约 400 行

**验证**：每个 Hook 可独立进行单元测试

***

#### 任务 2.7：提取对话框为独立子组件

**新建文件**：

1. `src/components/workflow/dialogs/SaveProjectDialog.tsx` — 保存项目对话框
2. `src/components/workflow/dialogs/LoadProjectDialog.tsx` — 加载项目对话框
3. `src/components/workflow/dialogs/HistoryDialog.tsx` — 历史记录对话框
4. `src/components/workflow/panels/AssistantPanel.tsx` — AI 助手侧边面板
5. `src/components/workflow/panels/TopNavPanel.tsx` — 顶部导航栏
6. `src/components/workflow/panels/LeftToolbarPanel.tsx` — 左侧工具栏

**每个子组件**：

* 通过 props 接收数据和回调（不依赖父组件内部状态）

* 内部只负责 UI 渲染和本地交互状态

**修改文件**：`src/components/workflow/WorkflowCanvas.tsx`

* 删除内联的大型 JSX 块，替换为子组件引用

***

#### 任务 2.8：提取 Toast 工具为统一 Hook

**新建文件**：`src/hooks/useToast.ts`

**内容**：

* 导出 `useToast()` hook，包含 `toast` 状态和 `showToast(type, message)` 方法

* 自动 3 秒后清除

**修改文件**：

* `src/components/workflow/WorkflowCanvas.tsx` — `showToast` + `toastMessage` 改用 `useToast`

* `src/app/workflow/workspace/page.tsx` — `showToast` + `toast` 改用 `useToast`

***

### 第三优先级（架构升级）

#### 任务 2.9：引入事件总线替代节点直接操作 ReactFlow

**新建文件**：`src/components/workflow/services/canvasEvents.ts`

**内容**：

* 定义 `CanvasEventMap` 类型（node:update, node:delete, node:add, edge:add 等）

* 基于 EventEmitter 模式实现

* 导出 `canvasEvents` 单例

**修改文件**：

* `src/components/workflow/nodes/BaseNode.tsx` — `updateNodeData` 改为 emit 事件

* `src/components/workflow/nodes/ImageNode.tsx` — 生成操作中的 setNodes 改为 emit 事件

* `src/components/workflow/nodes/VideoNode.tsx` — 生成操作中的 setNodes 改为 emit 事件

* `src/components/workflow/nodes/TextNode.tsx` — 生成操作中的 setNodes 改为 emit 事件

* `src/components/workflow/WorkflowCanvas.tsx` — 订阅事件并统一操作 ReactFlow 状态

***

## 阶段三：文档沉淀

### 任务 3.1：在管理后台添加画布模式开发文档

**修改文件**：`src/app/admin/docs/page.tsx`

**新增内容**：

1. 在 `DOC_SECTIONS` 数组中添加新条目：

   ```typescript
   { id: "canvas-architecture", title: "画布模式架构", description: "画布模式的代码结构与模块依赖关系", icon: GitBranch },
   ```

   （需要新增 `GitBranch` icon 导入）

2. 在 `DOC_CHAPTERS` 对象中添加 `"canvas-architecture"` 章节，包含：

   * **概述**：画布模式的整体架构简介，技术栈

   * **文件结构**：完整的文件树

   * **功能依赖图**：ASCII 依赖关系图

   * **核心组件说明**：WorkflowCanvas、节点组件、服务层的职责

   * **数据流图**：项目数据、积分、用户交互的流动路径

   * **解耦重构方案**：总结 8 个耦合点及解耦方向

   * **新增模块说明**：重构后新增的 hooks、services、context 模块

   * **最佳实践**：后续开发应遵循的模块化原则

***

## 执行顺序

```
阶段一（文档）
  1.1 编写架构文档

阶段二 第一优先级（关键阻塞）
  2.1 创建 projectService    ←── 无依赖，纯新增
  2.2 重构 canvasStore       ←── 依赖 2.1
  2.3 拆离 Context            ←── 无依赖，移动+新建
  2.4 提取费用计算            ←── 无依赖，纯新增
  2.5 提取缩略图工具          ←── 无依赖，纯新增

阶段二 第二优先级（架构优化）
  2.6 拆分 WorkflowCanvas    ←── 依赖 2.3, 2.4, 2.5
  2.7 提取对话框子组件        ←── 依赖 2.6 (需要 hooks)
  2.8 提取 Toast Hook        ←── 无依赖，纯新增

阶段二 第三优先级（架构升级）
  2.9 引入事件总线            ←── 依赖 2.6 (需要 hooks 就位)

阶段三（文档沉淀）
  3.1 添加到管理后台文档      ←── 依赖 阶段一、二完成
```

## 风险与回退策略

* 每次任务完成后运行 `npm run build` 验证编译通过

* 每个新建文件都可独立回退（删除即可）

* 重构中保持 API 接口签名不变，确保功能不退化

* 阶段二每个优先级完成后做一次完整功能验证

