# 画布模式代码架构与依赖分析

> **文档版本**: 2026-05-22  
> **适用范围**: 画布模式（/workflow 路径）全部前端代码  
> **分析目的**: 识别耦合点，为模块化解耦重构提供依据

---

## 一、代码文件总览

### 1.1 页面入口层

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/app/workflow/page.tsx` | 40 | 画布入口页，解析 URL 参数 `?project=xxx`，渲染 `WorkflowCanvas` |
| `src/app/workflow/workspace/page.tsx` | 591 | 工作空间页，项目管理（创建、列表、删除、搜索） |

### 1.2 核心组件层

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/components/workflow/WorkflowCanvas.tsx` | 1565 | 核心画布组件，承担画布交互、项目管理、AI 助手、历史记录、积分管理等 |
| `src/components/workflow/nodes/BaseNode.tsx` | 652 | 节点基础组件，提供提示词编辑、父节点引用、全屏预览、工具栏等通用 UI |
| `src/components/workflow/nodes/ImageNode.tsx` | 610 | 图片生成节点，包含图片上传、质量/比例配置、生成进度 |
| `src/components/workflow/nodes/VideoNode.tsx` | 521 | 视频生成节点，包含分辨率/时长配置、生成进度轮询、视频播放控制 |
| `src/components/workflow/nodes/TextNode.tsx` | 95 | 文本生成节点，包含文本生成和复制功能 |

### 1.3 服务与工具层

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/components/workflow/services/aiService.ts` | 175 | AI 生成服务封装，提供 generateText/generateImage/generateVideo/chatWithAssistant |
| `src/components/workflow/types.ts` | 34 | 类型定义，NodeType、NodeData 接口 |
| `src/components/workflow/lib/utils.ts` | 6 | cn 工具函数 |

### 1.4 状态管理层

| 文件 | 行数 | 职责 | 状态 |
|------|------|------|------|
| `src/stores/canvasStore.ts` | 408 | Zustand Store，定义完整画布状态管理接口 | **已定义但未使用** |

### 1.5 API 层

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/app/api/workflow/projects/route.ts` | 100 | 项目列表获取 (GET) + 创建 (POST) |
| `src/app/api/workflow/projects/[id]/route.ts` | 136 | 项目详情获取 (GET) + 更新 (PUT) + 删除 (DELETE) |

### 1.6 外部依赖

| 模块 | 用途 | 被引用位置 |
|------|------|-----------|
| `@/hooks/useCreditPolicies` | 积分策略和费用查询 | BaseNode, ImageNode, VideoNode |
| `@/models` (imageModels, videoModels) | 模型元数据和配置查询 | WorkflowCanvas, BaseNode, ImageNode, VideoNode |

---

## 二、功能依赖图

```
┌──────────────────────────────────────────────────────────────────┐
│                        workflow/page.tsx                         │
│                    (入口：解析 URL 参数 ?project)                   │
│              提供 ReactFlowProvider 上下文给 WorkflowCanvas        │
└──────────────────────────────┬───────────────────────────────────┘
                               │ initialProjectId
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     WorkflowCanvas.tsx (1565行)                   │
│                                                                  │
│  ┌─────────────────── 状态管理 (20+ useState) ────────────────┐  │
│  │ nodes/edges        (ReactFlow useNodesState/useEdgesState) │  │
│  │ userCredits        (useEffect → /api/user/credits)         │  │
│  │ isDragging         (node drag start/stop)                  │  │
│  │ isMultiSelect      (selection change)                      │  │
│  │ isConnecting       (连接线拖拽中)                            │  │
│  │ menu               (右键/连接结束菜单位置)                    │  │
│  │ ─────────────────────────────────────────────────────────  │  │
│  │ 项目管理:                                                    │  │
│  │   currentProjectId, currentProjectName, projectName       │  │
│  │   hasUnsavedChanges, isSaving, lastSaved                  │  │
│  │ ─────────────────────────────────────────────────────────  │  │
│  │ 对话框状态:                                                  │  │
│  │   showSaveDialog, showLoadDialog, showHistoryDialog       │  │
│  │   showHomeDialog, showMenu, showAssistant                 │  │
│  │ ─────────────────────────────────────────────────────────  │  │
│  │ AI 助手:                                                    │  │
│  │   messages, assistantInput, isAssistantLoading            │  │
│  │ ─────────────────────────────────────────────────────────  │  │
│  │ 历史记录:                                                    │  │
│  │   historyTab, historyItems, historyLoading, historyTotal  │  │
│  │ ─────────────────────────────────────────────────────────  │  │
│  │ Toast / 保存状态:                                            │  │
│  │   toastMessage, saveLoading, loadLoading, projectsLoading │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────── Context 提供 ──────────────┐                    │
│  │ DraggingContext / MultiSelectContext     │                    │
│  │ (直接定义在本文件中，通过 Provider 透传)   │                    │
│  └──────────────────┬──────────────────────┘                    │
│                     │                                            │
│  ┌────────── nodeTypes 映射 ──────────┐                          │
│  │ {                                  │                          │
│  │   text:       TextNode,            │                          │
│  │   image:      ImageNode,           │                          │
│  │   video:      VideoNode,           │                          │
│  │   image-edit: ImageNode            │                          │
│  │ }                                  │                          │
│  └──────────┬─────────────────────────┘                          │
│             │                                                    │
│  ┌──────────▼───────────────────────────────────────────────┐   │
│  │                   节点组件层                               │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ BaseNode.tsx (652行)                            │    │   │
│  │  │                                                  │    │   │
│  │  │  ← useDragging()      from WorkflowCanvas ◄─┐   │   │
│  │  │  ← useMultiSelect()   from WorkflowCanvas ◄─┤   │   │
│  │  │  ← useReactFlow()     直接操作 setNodes/   ◄─┤   │   │
│  │  │                         setEdges/getNodes     │   │   │
│  │  │  ← useCreditPolicies() from @/hooks          │   │   │
│  │  │                                                  │   │   │
│  │  │  内联 calculateCost() ← 费用计算 (重复!)       │   │   │
│  │  └───────────────────┬─────────────────────────────┘   │   │
│  │                      │                                 │   │
│  │    ┌─────────────────┼─────────────────┐               │   │
│  │    ▼                 ▼                  ▼              │   │
│  │ ImageNode.tsx    VideoNode.tsx     TextNode.tsx        │   │
│  │ (610行)          (521行)           (95行)              │   │
│  │                                                       │   │
│  │ 每个节点独立:                                           │   │
│  │ ├─ useReactFlow() → setNodes/setEdges 直接操作        │   │
│  │ ├─ 独立的费用计算逻辑 (Image: L26-37, Video: L75-85)  │   │
│  │ └─ 独立的缩略图生成逻辑 (重复 3 处)                    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ aiService.ts (175行)                                     │   │
│  │ ├─ generateText(prompt, imageBase64?)                    │   │
│  │ ├─ generateImage(prompt, config)                         │   │
│  │ ├─ generateVideo(prompt, config)                         │   │
│  │ ├─ checkVideoStatus(taskId)                              │   │
│  │ └─ chatWithAssistant(messages, context)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    workspace/page.tsx (591行)                     │
│                                                                  │
│  状态: projects, loading, error, searchQuery, viewMode,         │
│        showCreateDialog, toast, selectedProjects, activeMenu    │
│                                                                  │
│  操作: fetchProjects()  →  GET /api/workflow/projects           │
│        createProject()  →  POST /api/workflow/projects          │
│        deleteProject()  →  DELETE /api/workflow/projects/[id]   │
│        deleteSelectedProjects() → Promise.all(delete...)        │
│                                                                  │
│  导航: router.push(/workflow?project=${projectId})              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              [未使用] canvasStore.ts (408行)                      │
│                                                                  │
│  完整的 Zustand + persist Store                                  │
│  包含: CanvasState 接口、节点/连接/项目操作                      │
│  现状: 所有方法内部均为 mock + console.log                       │
│  原因: WorkflowCanvas 开发时直接写了 inline useState             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 三、数据流图

### 3.1 项目数据流

```
    workspace/page.tsx                WorkflowCanvas.tsx
    ┌─────────────────┐              ┌──────────────────────┐
    │ fetchProjects()  │              │ handleLoadProject()   │
    │   ↓              │              │   ↓                   │
    │ GET /api/...     │              │ GET /api/projects/[id]│
    │   ↓              │              │   ↓                   │
    │ setProjects()    │              │ setNodes(canvasData   │
    │                  │              │   .nodes)             │
    │ 点击项目          │              │ setEdges(canvasData   │
    │ router.push(     │──────────────│   .edges)             │
    │   /workflow?     │  initialPid  │ setCurrentProjectId() │
    │   project=xxx)   │              │                       │
    └─────────────────┘              │ 自动保存 (3秒debounce) │
                                     │   ↓                   │
                                     │ PUT /api/projects/[id] │
                                     └───────────────────────┘

    问题: 两者各自调用 API，无共享缓存，无统一状态源
```

### 3.2 积分数据流

```
    WorkflowCanvas.tsx
    ┌──────────────────────────┐
    │ useEffect → /api/user/    │
    │   credits                 │
    │   ↓ setUserCredits()     │
    │                          │
    │ addNode() 中写入:         │
    │   data.credits =          │
    │     userCredits ──────────┼──── 积分写入节点 data
    │                          │
    │ [不再主动更新]            │
    └──────────────────────────┘
              │
              ▼ 节点 data.credits
    ┌──────────────────────────┐
    │ BaseNode / ImageNode /    │
    │ VideoNode                 │
    │                          │
    │ cost = calculateCost(...) │ ← useCreditPolicies hook
    │                          │
    │ 生成成功后:                │
    │ data.credits =            │
    │   Math.max(0,             │
    │     credits - cost)       │ ← 节点自减积分（分散在各节点）
    └──────────────────────────┘

    问题: 积分在多个节点中独立更新，无全局一致性校验
```

### 3.3 用户交互流

```
    用户操作
    ┌──────┴──────┐
    │ 拖拽连出      │  → onConnectStart → isConnecting=true
    │ 释放到空白    │  → onConnectEnd → setMenu(弹出添加节点菜单)
    │ 释放到节点    │  → onConnect → setEdges + setNodes(更新 target data)
    │              │
    │ 拖拽节点      │  → onNodeDragStart → isDragging=true
    │              │      → BaseNode 感知: 跳过 useMemo 计算 (性能优化)
    │              │
    │ 操作工具栏    │
    │ ├─ + 按钮     │  → openAddMenuAtCenter → setMenu
    │ ├─ 历史按钮   │  → setShowHistoryDialog
    │ ├─ 保存按钮   │  → setShowSaveDialog
    │ ├─ 加载按钮   │  → setShowLoadDialog
    │ └─ AI 按钮    │  → setShowAssistant
    └──────────────┘
```

---

## 四、耦合点矩阵

| 编号 | 耦合点 | 严重程度 | 影响文件数 | 类型 |
|------|--------|---------|-----------|------|
| CP-1 | WorkflowCanvas 上帝组件（10+ 职责） | 🔴 严重 | 1 (但影响全部子功能) | 职责耦合 |
| CP-2 | canvasStore 未使用 + 多处理状态 | 🔴 严重 | 3 | 状态管理碎片化 |
| CP-3 | BaseNode → WorkflowCanvas 循环依赖 | 🔴 严重 | 2 | 模块循环依赖 |
| CP-4 | 费用计算三处重复 | 🟡 高 | 3 | 逻辑重复 |
| CP-5 | 节点直接操作 ReactFlow 状态 | 🟡 高 | 5 (所有节点+WorkflowCanvas) | 框架耦合 |
| CP-6 | userCredits 通过 data props 透传 | 🟡 高 | 4 | 数据透传 |
| CP-7 | 缩略图生成三处重复 | 🟠 中 | 4 | 逻辑重复 |
| CP-8 | Toast 通知两处重复实现 | 🟠 中 | 2 | 逻辑重复 |

---

## 五、当前架构模块化评估

| 维度 | 评分 (1-10) | 说明 |
|------|------------|------|
| 单一职责 | 2 | WorkflowCanvas 承担 10+ 项不相关职责 |
| 开闭原则 | 3 | 新增节点类型需要修改多处 |
| 依赖倒置 | 3 | 节点组件直接依赖 ReactFlow 具体实现 |
| 接口隔离 | 4 | NodeData 接口过于宽泛（30+ 个可选字段） |
| 代码复用 | 3 | 费用计算、缩略图生成、Toast 逻辑均重复 |
| 状态管理 | 3 | 20+ useState vs 已定义的 Zustand Store 未使用 |
| 可测试性 | 2 | 所有逻辑耦合在组件内，依赖 ReactFlow 运行时 |
| **综合评分** | **2.9/10** | 架构急需重构 |

---

## 六、canvasStore 现状分析

### 6.1 已定义但未使用的 Store

`src/stores/canvasStore.ts` 使用 Zustand + persist 定义了一个完整的画布状态管理系统，包含：

```typescript
interface CanvasState {
  currentProject: CanvasProject | null;  // 当前项目
  nodes: CanvasNode[];                   // 画布节点
  connections: CanvasConnection[];        // 节点连接
  selectedNode: CanvasNode | null;       // 选中节点
  isLoading: boolean;                    // 加载状态
  error: string | null;                  // 错误信息
  // 11 个操作方法
}
```

### 6.2 为何未被使用

1. **开发时序问题**: WorkflowCanvas 开发时优先采用了 React Flow 内置的 `useNodesState` / `useEdgesState`，这使得 Zustand Store 中的 `nodes` / `connections` 状态与 React Flow 内部状态形成冗余
2. **Mock 阻塞**: Store 中所有 API 调用方法都是 `console.log` + mock 数据，无法直接使用
3. **persist 中间件冲突**: Store 使用 localStorage 持久化，但项目数据实际存储在服务端数据库

### 6.3 重构方向

将 Store 的职责重新定位为"项目级别的 UI 状态管理"，移除与 React Flow 重复的 nodes/connections 状态，让所有方法调用统一的服务层 `projectService`。

---

## 七、解耦重构方案概览

### 7.1 目标架构

```
                          workflow/page.tsx
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
          WorkflowCanvas.tsx          workspace/page.tsx
          (编排层 ~400行)              (项目管理页)
                │                           │
    ┌───────────┼───────────┐               │
    ▼           ▼           ▼               ▼
  hooks/     panels/     dialogs/     useToast (统一)
  ├─ useProjectManager    ├─ SaveDialog       │
  ├─ useAssistantChat     ├─ LoadDialog   projectService (统一)
  ├─ useHistoryManager    ├─ HistoryDialog  ├─ list()
  ├─ useCanvasInteraction ├─ AssistantPanel ├─ get()
  └─ useUserCredits       ├─ TopNavPanel   ├─ create()
                           └─ LeftToolbar   ├─ update()
                                            └─ delete()
    ┌──────────────────┐
    │ 节点组件层         │          canvasStore (Zustand)
    │ BaseNode          │          └─ currentProject
    │ ├─ ImageNode      │          └─ isLoading/error
    │ ├─ VideoNode      │          └─ CRUD 操作
    │ └─ TextNode       │
    │                   │
    │ context/ ←── CanvasInteractionContext
    │ services/  ←── costCalculator
    │            ←── canvasEvents (事件总线)
    └──────────────────┘
```

### 7.2 三阶段实施路线

**第一优先级（消除关键阻塞）**:
1. 创建 `projectService.ts` 统一 API 调用
2. 重构 `canvasStore.ts` 调用 projectService
3. 拆离 Context 到独立模块
4. 提取费用计算工具
5. 提取缩略图工具

**第二优先级（架构优化）**:
6. 拆分 WorkflowCanvas 为 5 个 Hook
7. 提取对话框为独立子组件
8. 提取 Toast 为统一 Hook

**第三优先级（架构升级）**:
9. 引入事件总线替代节点直接操作 ReactFlow

---

## 八、重构后的文件结构

```
src/
├── app/
│   ├── workflow/
│   │   ├── page.tsx                          # 入口 (~40行)
│   │   └── workspace/page.tsx               # 工作空间 (~300行)
│   └── admin/docs/page.tsx                  # 管理后台文档
├── components/workflow/
│   ├── WorkflowCanvas.tsx                    # 编排层 (~400行)
│   ├── types.ts                              # 类型定义
│   ├── lib/utils.ts                          # cn 工具
│   ├── context/
│   │   └── CanvasInteractionContext.tsx       # [新] 交互上下文
│   ├── services/
│   │   ├── aiService.ts                      # AI 生成服务
│   │   ├── costCalculator.ts                 # [新] 费用计算
│   │   └── canvasEvents.ts                   # [新] 事件总线
│   ├── hooks/
│   │   ├── useProjectManager.ts              # [新] 项目管理
│   │   ├── useAssistantChat.ts               # [新] AI 助手
│   │   ├── useHistoryManager.ts              # [新] 历史记录
│   │   ├── useCanvasInteraction.ts           # [新] 画布交互
│   │   └── useUserCredits.ts                 # [新] 积分管理
│   ├── dialogs/
│   │   ├── SaveProjectDialog.tsx             # [新] 保存对话框
│   │   ├── LoadProjectDialog.tsx             # [新] 加载对话框
│   │   └── HistoryDialog.tsx                 # [新] 历史对话框
│   ├── panels/
│   │   ├── AssistantPanel.tsx                # [新] AI 助手面板
│   │   ├── TopNavPanel.tsx                   # [新] 顶部导航
│   │   └── LeftToolbarPanel.tsx              # [新] 左侧工具栏
│   └── nodes/
│       ├── BaseNode.tsx                       # 基础节点 (~550行)
│       ├── ImageNode.tsx                      # 图片节点 (~500行)
│       ├── VideoNode.tsx                      # 视频节点 (~400行)
│       └── TextNode.tsx                       # 文本节点 (~80行)
├── services/
│   └── projectService.ts                     # [新] 项目服务层
├── stores/
│   └── canvasStore.ts                        # 重构后的 Zustand Store
├── hooks/
│   ├── useToast.ts                           # [新] 统一 Toast
│   └── useCreditPolicies.ts                  # 扩展 useNodeCost
└── utils/
    └── thumbnail.ts                          # [新] 缩略图工具
```