# AI 工具首页测试页面 - 实施计划（修订版）

## 概要

根据 [即梦 AI 工具首页](https://jimeng.jianying.com/ai-tool/home/) 中两个核心内容 DIV 的布局和风格，在 `/test/ai-tools-home` 路由下创建一个独立的测试页面，不影响现有网站的任何功能。

**保留的两个 DIV 内容：**
- **DIV 1 - 竞赛活动区**: VITA SHORTS 2026 竞赛横幅 + 大学生广告艺术节 竞赛横幅 + 创作者成长计划（新视觉 / 新影像）入口
- **DIV 2 - AI 工具网格区**: 大量 AI 工具卡片（图片 + 名称），以网格布局展示

**不需要的内容：** 顶部导航栏（Agent 模式 / 发现 / 短片 / 活动）等

## 当前状态分析

### 项目架构
- **框架**: Next.js 16.2.4 (App Router) + React 19.2.4 + TypeScript
- **样式**: Tailwind CSS v4，dark-first 主题
- **组件库**: shadcn/ui (Radix UI)，Lucide React 图标
- **路由**: `/src/app/` 下按文件系统路由，已有 `(main)`、`(auth)` 路由组
- **测试页模式**: 已有 `/test/credit-policies/page.tsx` 作为独立测试页面的先例

### 设计系统
- 背景色: `#0a0a0a` (dark)，卡片: `bg-white/[0.03]`，边框: `white/[0.08]`
- 强调色: indigo-500 → purple-600 渐变
- 动画: `AnimatedSection` 组件（IntersectionObserver），手动 CSS 动画（fadeInUp）
- 玻璃拟态: `backdrop-blur`, `bg-white/[0.03]`, `border-white/[0.08]`

## 拟议变更

### 新增文件

1. **`/home/ubuntu/bayinai/ai-studio/src/app/test/ai-tools-home/page.tsx`** (新建)

   页面包含两个板块：

   **板块一 - 竞赛活动区：**
   - 2 个竞赛横幅卡片，横向排列
     - VITA SHORTS 2026：AI 短片竞赛单元征稿（已有 995 人参与）
     - 大学生广告艺术节学院奖 即梦AI青年创意大赛（已有 2974 人参与）
   - 2 个创作者成长计划入口卡片
     - 即梦AI 创作者成长计划 · 新视觉
     - 即梦AI 创作者成长计划 · 新影像

   **板块二 - AI 工具网格区：**
   - 标题 "AI 工具"
   - 4 列响应式网格（桌面 4 列 → 平板 2 列 → 手机 1 列）
   - 约 20 个工具卡片，每个卡片包含渐变色块 + 工具名称
   - 工具名称参考：文生图、图生图、视频生成、图片编辑、智能抠图、画质增强、风格迁移、AI 扩图、AI 消除、AI 重绘、人脸融合、动作驱动、老照片修复、图片超分、视频超分、数字人、语音合成、AI 作曲、AI 写稿、AI 翻译

   **技术实现：**
   - `"use client"` 客户端组件
   - 复用 `AnimatedSection` 做滚动渐入动画
   - 复用现有设计 tokens（颜色、间距、圆角）
   - 所有数据均为静态 mock，不调用 API

### 不修改现有文件
- 不修改任何现有文件
- 访问路径: `/test/ai-tools-home`

## 页面结构

```
/test/ai-tools-home
│
├── 板块一：竞赛活动区
│   ├── 竞赛横幅行（2 列，VITA SHORTS + 大学生广告艺术节）
│   └── 创作者计划行（2 列，新视觉 + 新影像）
│
└── 板块二：AI 工具网格区
    └── 4 列响应式网格，约 20 个工具卡片
```

## 假设与决策

1. **完全独立**: 页面通过 URL 直接访问 `/test/ai-tools-home`，不加入导航菜单
2. **纯静态**: 所有数据均为前端 mock，不调用任何 API
3. **不登录可访问**: 不需要认证即可查看
4. **复用现有组件**: 使用 AnimatedSection 做滚动动画
5. **响应式**: 桌面 4 列 → 平板 2 列 → 手机 1 列
6. **使用项目现有设计语言**: dark theme + indigo/purple 渐变

## 验证步骤

1. 启动开发服务器 `cd /home/ubuntu/bayinai/ai-studio && npm run dev`
2. 浏览器访问 `http://localhost:3000/test/ai-tools-home`
3. 验证两个板块渲染正常
4. 验证现有页面完全不受影响
5. 验证响应式布局
6. 运行 `npm run lint` 确保无语法/类型错误