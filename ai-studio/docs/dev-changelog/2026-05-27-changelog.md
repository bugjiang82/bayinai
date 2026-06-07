# 开发变更记录

> **日期**: 2026-05-27  
> **版本范围**: 画布模式、图像生成、视频生成、导航  
> **涉及文件**: 10 个

---

## 一、图片全屏预览拖拽修复

### 2026-05-27 | 任务 #1 | 图片预览拖拽行为修复

**功能模块**: 画布模式 → 图片节点 → 全屏预览

**问题描述**:  
在画布模式中点击图片节点进入全屏预览后，放大图片并拖拽鼠标时，浏览器将鼠标移动解释为**页面滚动行为**，而非改变图片的位移偏移量，导致无法正常平移图片。

**修改文件**: `src/components/workflow/nodes/BaseNode.tsx`

**关键代码变更**:

1. **将 onMouseMove/onMouseUp 提升到 document 级别**（第 214-252 行新增 useEffect）：
   - 使用 `document.addEventListener('mousemove', ..., { passive: false })` 确保 `e.preventDefault()` 生效
   - 即使鼠标移出 viewport 区域也能继续拖拽，体验更流畅
   - 增加了拖拽边界限制（maxX/maxY），防止图片被拖出可视范围过远

2. **添加光标样式**（第 619 行）：
   - 可拖拽时显示 `grab`（手型张开）
   - 拖拽中显示 `grabbing`（手型握紧）
   - 不可拖拽时显示 `default`

3. **onMouseDown 增加 e.stopPropagation()**：防止事件冒泡触发意外交互

**修改原因**:  
原实现中 onMouseMove 仅绑定在 viewport div 上且缺少 `preventDefault()`，浏览器默认将拖拽解释为文本选择或页面滚动。

---

## 二、视频生成失败修复

### 2026-05-27 | 任务 #2 | 视频节点生成后前端显示失败

**功能模块**: 画布模式 → 视频节点 → 视频生成 API

**问题描述**:  
后台（DashScope）已成功提交视频生成任务，但前端显示"视频生成失败"。

**修改文件**:
- `src/services/generation.service.ts`
- `src/app/api/workflow/generate/video/route.ts`

**关键代码变更**:

1. **generation.service.ts — getVideoStatus 错误检测逻辑重构**（第 823-855 行）：
   - **旧逻辑**: 在所有 task_status 判断之前，用 `output.code || result.code` 和 `output.message || result.message` 判断是否有错误——任何非空值都会返回 FAILED
   - **新逻辑**: 移除激进的 code/message 预检查，严格按 `task_status` 进行状态映射，仅在 `FAILED` / `CANCELED` 时返回失败
   - DashScope API 文档明确说明 `output.code` / `output.message` 仅任务失败时返回，但某些 API 版本可能在顶层 `result.code` 中返回非空值，导致误判

2. **video/route.ts — cost 校验逻辑修正**（第 59 行）：
   - **旧逻辑**: `if (!cost || cost < 0)` — JavaScript 中 `0` 是 falsy 值，`cost = 0` 时被错误拒绝
   - **新逻辑**: `if (cost == null || cost < 0)` — 仅检查 `null`/`undefined` 和负数

**修改原因**:  
- `getVideoStatus` 的错误检测过于激进，在 task_status 为 PENDING/RUNNING 时可能因 DashScope 响应的顶层 `code` 字段而返回 FAILED
- `!cost` 校验在合法 cost=0 时拒绝请求，导致"后台已提交但前端报错"

---

## 三、图像历史记录信息显示修复

### 2026-05-27 | 任务 #3 | 历史记录悬浮卡片模型/质量/比例显示修复

**功能模块**: 图像生成页面 → 历史记录 → 悬浮信息卡

**问题描述**:  
鼠标悬浮在历史记录图片上时，所有图片的模型信息都显示"Flash 大模型"，质量和比例信息也不正确。

**修改文件**:
- `src/app/(main)/generate/image/page.tsx`
- `src/components/generate/Canvas.tsx`

**关键代码变更**:

1. **page.tsx — loadHistory 函数**（第 197-211 行）：
   - **旧逻辑**: 尝试从 `item.params`（JSON 字符串）解析 model/imageSize/aspectRatio
   - **新逻辑**: 直接从 `item.model`、`item.imageSize`、`item.aspectRatio` 读取
   - **根因**: 历史 API (`/api/generate/history`) 已经在服务端解析了 `params` 字段并返回为顶层属性，`item.params` 在响应中不存在，导致永远走默认值 `model="flash"`

2. **page.tsx — loadMoreHistory 函数**（第 253-266 行）：
   - 与 loadHistory 相同的修复

3. **Canvas.tsx — 模型名称显示逻辑**（第 992-1019 行）：
   - **旧逻辑**: 仅判断 `item.model === "pro"`，其余全部显示 "Flash 大模型"
   - **新逻辑**: 使用映射表处理 `flash` / `pro` / `image2` / `gemini-3-pro-image-preview`，未匹配模型名可兜底显示
   - 增加质量值显示优化 (`"512"` → `"512P"`)
   - 增加 `ratio` 字段备用读取

**修改原因**:  
前端用错误的字段名读取 API 响应数据，导致全部落入默认值分支。

---

## 四、节点菜单栏拆分

### 2026-05-27 | 任务 #4 | BaseNode 工具栏按节点类型拆分

**功能模块**: 画布模式 → 节点 → 顶部菜单栏

**问题描述**:  
图片节点和视频节点共用 BaseNode 中硬编码的统一菜单栏，但两类节点需要的功能按钮不同（图片需要 Upscale/全屏预览，视频不需要）。

**修改文件**:
- `src/components/workflow/nodes/BaseNode.tsx`
- `src/components/workflow/nodes/ImageNode.tsx`
- `src/components/workflow/nodes/VideoNode.tsx`

**关键代码变更**:

1. **BaseNode.tsx**（第 50-64 行 / 第 269-304 行）：
   - 新增 `renderToolbar` prop，接收回调函数 `(actions) => ReactNode`
   - actions 暴露 6 个参数：`onGenerate`、`onDownload`、`onFullscreen`、`onDelete`、`isGenerating`、`hasOutput`
   - 保留默认 fallback 工具栏（向下兼容）

2. **ImageNode.tsx**（第 348-377 行）：
   - 传入自定义 `renderToolbar`：
     ```
     Redraw | Upscale Download Fullscreen | Delete
     ```
   - 导入 `Sparkles`、`Download`、`Trash2` 图标

3. **VideoNode.tsx**（第 283-322 行）：
   - 传入自定义 `renderToolbar`：
     ```
     Redraw | Download Fullscreen | Delete
     ```
   - 下载使用 `downloadVideo()` 导出 `.mp4` 格式
   - 导入 `Download`、`Trash2`、`Maximize2` 图标

**架构收益**:  
每个节点类型可独立定制工具栏按钮组合，后续新增按钮只需在对应节点的 `renderToolbar` 中添加，互不影响。

---

## 五、视频节点全屏预览播放器

### 2026-05-27 | 任务 #5 | 视频节点全屏预览 + 播放器

**功能模块**: 画布模式 → 视频节点 → 全屏预览

**修改文件**: `src/components/workflow/nodes/VideoNode.tsx`

**关键代码变更**:

1. **导入 VideoPlayer 组件**（第 10 行）：
   - 从 `@/components/generate/Canvas` 导入 `VideoPlayer`，复用作品页面相同的播放器

2. **全屏 Portal 实现**（第 520-540 行）：
   - 使用 `createPortal` 渲染到 `document.body`，z-index: 99999
   - VideoPlayer 配置 `autoPlay={true}`
   - 点击背景关闭 + VideoPlayer 自带关闭按钮
   - 使用 `e.stopPropagation()` 隔离事件

**播放器功能**: 播放/暂停、可拖拽进度条、静音切换、播放速度（0.5x-2x）、画中画、原生全屏、下载

---

## 六、菜单栏按钮修复

### 2026-05-27 | 任务 #6 | 移除 hasOutput 条件渲染导致按钮消失

**功能模块**: 画布模式 → 节点工具栏

**问题描述**:  
上一轮任务（#4）给 Download/Fullscreen 按钮添加了 `{hasOutput && (...)}` 条件渲染。当节点无输出时按钮消失，但两侧分隔线仍在，导致菜单栏显示异常（两个连续分隔线中间空无一物）。

**修改文件**:
- `src/components/workflow/nodes/ImageNode.tsx`
- `src/components/workflow/nodes/VideoNode.tsx`

**关键代码变更**:  
移除 `hasOutput` 条件包装，所有工具栏按钮始终显示，恢复与原来硬编码菜单栏一致的行为。

---

## 七、视频节点画幅比例选择

### 2026-05-27 | 任务 #7 | 视频节点配置增加画面比例

**功能模块**: 画布模式 → 视频节点 → 配置下拉

**问题描述**:  
视频节点的配置下拉只有分辨率和时长，缺少画面比例选择，与视频生成页面的功能不一致。

**修改文件**: `src/components/workflow/nodes/VideoNode.tsx`

**关键代码变更**:

1. **导入 VIDEO_ASPECT_RATIO_OPTIONS**（第 39 行）：来自 `@/models`，包含 5 个比例选项

2. **标签更新**（第 345 行）：
   - 从 `万相 2.2 · 720P · 5s` 变为 `万相 2.2 · 720P · 5s · 16:9`

3. **比例选择按钮组**（第 365-381 行）：
   - 五项：16:9（横屏）、9:16（竖屏）、1:1（方形）、4:3（标准）、3:4（竖版）
   - 默认选中 `16:9`
   - 样式与分辨率/时长按钮组一致

---

## 八、画布模式导航优化

### 2026-05-27 | 任务 #8 | 画布模式入口 + 返回按钮

**功能模块**: 全局导航 → 侧边栏 → 工作空间

**修改文件**:
- `src/components/layout/Sidebar.tsx`
- `src/app/workflow/workspace/page.tsx`

**关键代码变更**:

1. **Sidebar.tsx**（第 25 行）：
   - "画布模式" 链接从 `/workflow` 改为 `/workflow/workspace`
   - 点击后进入项目管理页面而非直接进入画布编辑器

2. **workspace/page.tsx**（第 201-207 行 / 第 22 行导入）：
   - 标题上方新增 `← 返回工作区` 链接（href: `/generate/image`）
   - 样式：`text-zinc-400 hover:text-white`，`ArrowLeft` 图标

**修改原因**:  
优化用户流程：先看到项目列表再选择进入，页面增加返回方式避免迷失导航。

---

## 变更影响范围汇总

| 变更文件 | 行数变化 | 影响功能 |
|---------|---------|---------|
| `BaseNode.tsx` | +30 / -25 | 图片全屏拖拽、工具栏架构 |
| `generation.service.ts` | +15 / -15 | 视频状态查询 |
| `video/route.ts` | 1 行修改 | 视频生成参数校验 |
| `generate/image/page.tsx` | -25 行 | 历史记录数据加载 |
| `Canvas.tsx` | +20 / -10 | 历史悬浮信息显示 |
| `ImageNode.tsx` | +25 / -5 | 图片节点工具栏 |
| `VideoNode.tsx` | +60 / -10 | 视频工具栏、播放器、比例 |
| `Sidebar.tsx` | 1 行修改 | 画布模式导航 |
| `workspace/page.tsx` | +9 行 | 工作空间返回按钮 |

**总计**: 修改 9 个文件，新增约 140 行，删除约 80 行。