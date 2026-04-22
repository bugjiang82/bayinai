# 图像生成页面合并 Spec

## Why
文生图和图生图目前是独立的页面，但它们共享相同的核心功能（图片生成、Canvas、参数面板、历史记录）。将它们合并为一个页面可以减少代码重复、统一用户体验，并遵循视频生成页面的设计模式。

## What Changes
- 创建新的 `/generate/image` 页面，将文生图和图生图整合为一个页面
- 添加模式切换按钮（文生图 / 图生图），参考视频生成页面的实现
- 左侧画布区域 + 右侧参数面板的布局保持不变
- 图生图模式下显示参考图片上传区域，文生图模式下隐藏
- 更新 Sidebar 导航链接指向新的统一页面
- 保留原有 `/generate/text-to-image` 和 `/generate/image-to-image` 作为兼容路由（重定向到新页面）

## Impact
- 影响功能：图像生成导航、路由结构
- 受影响代码：
  - `src/app/(main)/generate/image/page.tsx`（新建）
  - `src/components/layout/Sidebar.tsx`（导航链接更新）
  - `src/app/(main)/generate/text-to-image/page.tsx`（添加重定向）
  - `src/app/(main)/generate/image-to-image/page.tsx`（添加重定向）

## ADDED Requirements

### Requirement: 统一图像生成页面
系统 SHALL 提供一个统一的图像生成页面，支持文生图和图生图两种模式。

#### Scenario: 用户访问图像生成页面
- **WHEN** 用户访问 `/generate/image`
- **THEN** 页面默认显示文生图模式
- **AND** 用户可点击按钮切换到图生图模式

#### Scenario: 模式切换
- **WHEN** 用户切换模式（文生图 ↔ 图生图）
- **THEN** 页面布局平滑切换
- **AND** 图生图模式显示参考图片上传区域
- **AND** 文生图模式不显示参考图片上传区域
- **AND** 参数面板根据模式调整显示内容

#### Scenario: 文生图模式
- **WHEN** 用户选择文生图模式
- **THEN** 显示文本输入框 + 参数面板
- **AND** 参考图片上传区域隐藏
- **AND** 生成按钮点击后调用文生图 API

#### Scenario: 图生图模式
- **WHEN** 用户选择图生图模式
- **THEN** 显示参考图片上传区域（可上传多张图片）
- **AND** 显示参考图权重滑块
- **AND** 显示变换类型选择（风格迁移、局部重绘、扩展画布、放大）
- **AND** 生成按钮点击后调用图生图 API

### Requirement: 布局一致性
图像生成页面 SHALL 遵循视频生成页面的布局设计：
- 左侧 60% 区域：Canvas 画布/预览区
- 右侧 40% 区域：参数面板（min 340px, max 480px）
- 图生图模式下，参考图片上传区域位于 Canvas 上方

### Requirement: 历史记录功能
图像生成页面 SHALL 显示历史记录：
- 每行 6 条记录的网格布局
- 首次加载 18 条记录（6列 × 3行）
- 支持分页加载（"加载更多"按钮）
- 悬停显示记录详情（模型、质量、时间）

### Requirement: 旧路由兼容
原有的 `/generate/text-to-image` 和 `/generate/image-to-image` 路由 SHALL 重定向到新的 `/generate/image` 页面。

## REMOVED Requirements
### Requirement: 独立的文生图和图生图页面
**Reason**: 功能已合并到统一页面
**Migration**: 旧路由重定向到新页面，保留 301 跳转
