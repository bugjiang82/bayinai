# 画布模式功能设计文档

## 1. 概述

### 1.1 功能描述
画布模式是一个基于节点的可视化编辑工具，允许用户通过拖拽创建节点，连接节点关系，并基于现有内容生成新的图片或视频。

### 1.2 目标用户
- 设计师和创意工作者
- 需要复杂视觉创作的用户
- 喜欢可视化工作流程的用户

### 1.3 核心功能
- 节点拖拽和连接
- 基于参考图的内容生成
- 项目保存和管理
- 与现有积分系统集成

## 2. 技术架构

### 2.1 前端架构
- **框架**：React + Next.js
- **画布库**：React Flow
- **状态管理**：Zustand
- **样式**：Tailwind CSS
- **集成**：与现有组件和样式系统集成

### 2.2 后端架构
- **框架**：Next.js API 路由
- **数据库**：SQLite + Prisma
- **服务**：CanvasService + 现有 GenerationService 和 CreditService
- **认证**：共享现有用户认证系统

### 2.3 数据模型

**新增表：CanvasProject**
- id: String (PK)
- userId: String (FK to User)
- name: String
- description: String
- canvasData: String (JSON 存储画布布局和节点数据)
- thumbnail: String (预览图)
- isDraft: Boolean (是否为草稿)
- createdAt: DateTime
- updatedAt: DateTime

**新增表：CanvasNode**
- id: String (PK)
- projectId: String (FK to CanvasProject)
- type: String (image, video, text, etc.)
- generationId: String (FK to Generation, 关联生成记录)
- position: String (JSON 存储节点位置)
- createdAt: DateTime
- updatedAt: DateTime

**新增表：CanvasConnection**
- id: String (PK)
- projectId: String (FK to CanvasProject)
- sourceNodeId: String (FK to CanvasNode)
- targetNodeId: String (FK to CanvasNode)
- type: String (连接类型)
- createdAt: DateTime

## 3. 页面设计

### 3.1 页面结构
- **左侧**：节点库（可拖拽的节点类型）
- **中央**：画布区域（使用 React Flow）
- **右侧**：节点属性面板（编辑内容、提示词、参数）

### 3.2 核心组件
- **CanvasPage**：主页面组件
- **NodePalette**：节点库组件
- **FlowCanvas**：画布组件（使用 React Flow）
- **NodeProperties**：节点属性编辑组件
- **ProjectToolbar**：项目工具栏（保存、加载、导出）

### 3.3 导航
- 在左侧导航栏添加"画布模式"链接
- 路径：/generate/canvas

## 4. 功能流程

### 4.1 创建项目
1. 用户点击左侧导航栏的"画布模式"链接
2. 进入画布模式页面
3. 系统自动创建一个新的草稿项目

### 4.2 节点操作
1. 用户从左侧节点库拖拽节点到画布
2. 点击节点打开属性面板
3. 编辑节点内容、提示词和参数
4. 通过拖拽连接节点建立关系

### 4.3 生成操作
1. 用户拖拽已有内容的节点到新的空白节点
2. 系统自动使用源节点的内容作为参考图
3. 基于目标节点的提示词和参数生成新内容
4. 调用现有的生成服务，扣减积分
5. 生成的内容自动保存到用户目录并持久化
6. 更新节点状态和内容

### 4.4 项目管理
1. 系统自动保存草稿
2. 用户可以手动保存为正式项目
3. 用户可以加载、编辑和删除项目

## 5. API 设计

### 5.1 画布项目 API
- **POST /api/canvas/projects** - 创建项目
- **GET /api/canvas/projects** - 获取用户项目列表
- **GET /api/canvas/projects/[id]** - 获取项目详情
- **PUT /api/canvas/projects/[id]** - 更新项目
- **DELETE /api/canvas/projects/[id]** - 删除项目

### 5.2 画布生成 API
- **POST /api/canvas/generate** - 基于节点内容生成图片/视频

## 6. 集成要求

### 6.1 用户认证
- 共享现有的 NextAuth 认证系统
- 确保只有登录用户可以访问画布模式

### 6.2 积分系统
- 复用现有的 CreditService
- 生成操作扣减积分逻辑与现有系统一致

### 6.3 生成服务
- 复用现有的 GenerationService
- 支持基于参考图的生成

### 6.4 文件存储
- 复用现有的文件存储结构
- 生成的内容自动保存到用户目录

## 7. 技术实现细节

### 7.1 前端实现
- 安装 React Flow：`npm install reactflow`
- 集成现有样式系统和组件
- 复用现有的文件上传和生成功能
- 实现画布状态管理

### 7.2 后端实现
- 使用 Prisma 迁移工具创建新表
- 实现画布相关的 API 路由
- 集成现有的生成服务和积分系统
- 实现项目保存和加载功能

## 8. 测试计划

### 8.1 功能测试
- 节点拖拽和连接
- 基于参考图的生成
- 项目保存和加载
- 积分扣减

### 8.2 性能测试
- 大型画布的渲染性能
- 多个节点的生成操作
- 项目保存和加载速度

## 9. 未来扩展

### 9.1 功能扩展
- 支持更多节点类型
- 实现节点组和层次结构
- 添加批量操作和自动化

### 9.2 集成扩展
- 与模板系统集成
- 与团队协作功能集成
- 支持导出和分享项目

## 10. 实施计划

1. **添加导航链接**：在左侧导航栏添加画布模式链接
2. **创建数据库模型**：添加 CanvasProject、CanvasNode、CanvasConnection 表
3. **实现后端服务**：创建 CanvasService 和相关 API 端点
4. **开发前端页面**：创建 CanvasPage 和相关组件
5. **集成生成功能**：连接画布操作和生成服务
6. **测试和优化**：测试功能完整性和性能