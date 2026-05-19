# HappyHorse 视频大模型支持实现计划

## 项目概述

根据用户需求，需要在现有视频生成架构中添加对 **HappyHorse** 视频大模型的支持。HappyHorse 是阿里云推出的视频生成模型，支持以下三种模式：

1. **文生视频** - 仅通过文字描述生成视频
2. **图生视频（基于首帧）** - 根据首帧图片和文字描述生成视频
3. **图生视频（多图参考）** - 根据多张参考图片和文字描述生成视频

所有请求需要使用**新加坡节点**（ap-southeast-1），API Key使用 `.env` 文件中的 `DASHSCOPE_API_KEY`。

## 现有架构分析

### 核心视频生成服务
- **文件**: `src/services/generation.service.ts`
- **功能**: 提供视频生成的核心逻辑，支持文生视频和图生视频
- **现有模型**: wan2.2-kf2v-flash, wan2.7-t2v, wan2.7-r2v

### API端点
- **文件**: `src/app/api/generate/video/route.ts`
- **功能**: 处理视频生成请求的HTTP接口

### 前端页面
- **文件**: `src/app/(main)/generate/video/page.tsx`
- **功能**: 视频生成的用户界面

### 工作流节点
- **文件**: `src/components/workflow/nodes/VideoNode.tsx`
- **功能**: 工作流中的视频生成节点组件

## 实现计划

### 1. 修改核心服务 (`src/services/generation.service.ts`)

**修改内容**:
- 添加 HappyHorse 模型的API端点支持
- 支持三种生成模式的请求格式
- 使用新加坡节点URL

**API端点**:
- 文生视频: `/services/aigc/text2video/text-to-video-synthesis`
- 图生视频（首帧）: `/services/aigc/text2video/text-to-video-synthesis`
- 图生视频（多图参考）: `/services/aigc/text2video/text-to-video-synthesis`

**请求格式**:
```json
{
  "model": "happyhorse-v1.0",
  "input": {
    "prompt": "视频描述",
    "first_frame_url": "首帧图片URL/base64",
    "reference_images": ["参考图片1", "参考图片2"]
  },
  "parameters": {
    "resolution": "720P",
    "duration": 10,
    "ratio": "16:9"
  }
}
```

### 2. 修改前端页面 (`src/app/(main)/generate/video/page.tsx`)

**修改内容**:
- 添加 HappyHorse 模型选项到下拉选择器
- 支持多图参考上传功能
- 更新模型配置列表

### 3. 修改工作流节点 (`src/components/workflow/nodes/VideoNode.tsx`)

**修改内容**:
- 添加 HappyHorse 模型配置
- 支持多图参考输入
- 更新积分计算逻辑

### 4. 修改工作流视频API (`src/app/api/workflow/generate/video/route.ts`)

**修改内容**:
- 支持 HappyHorse 模型的多图参考参数

## 文件修改清单

| 文件路径 | 修改类型 | 修改内容 |
|---------|---------|---------|
| `src/services/generation.service.ts` | 新增/修改 | 添加 HappyHorse 模型支持 |
| `src/app/api/generate/video/route.ts` | 修改 | 支持多图参考参数 |
| `src/app/(main)/generate/video/page.tsx` | 修改 | 添加 HappyHorse 模型选项 |
| `src/components/workflow/nodes/VideoNode.tsx` | 修改 | 添加 HappyHorse 模型配置 |
| `src/app/api/workflow/generate/video/route.ts` | 修改 | 支持多图参考参数 |

## API调用规范

### 新加坡节点URL
```
BASE_URL: https://dashscope-intl.aliyuncs.com/api/v1
```

### 模型名称
```
happyhorse-v1.0
```

### 请求参数

#### 文生视频
```json
{
  "model": "happyhorse-v1.0",
  "input": {
    "prompt": "描述内容"
  },
  "parameters": {
    "resolution": "720P",
    "duration": 10,
    "ratio": "16:9"
  }
}
```

#### 图生视频（首帧）
```json
{
  "model": "happyhorse-v1.0",
  "input": {
    "prompt": "描述内容",
    "first_frame_url": "base64或URL"
  },
  "parameters": {
    "resolution": "720P",
    "duration": 10,
    "ratio": "16:9"
  }
}
```

#### 图生视频（多图参考）
```json
{
  "model": "happyhorse-v1.0",
  "input": {
    "prompt": "描述内容",
    "first_frame_url": "首帧图片",
    "reference_images": ["参考图1", "参考图2", "参考图3"]
  },
  "parameters": {
    "resolution": "720P",
    "duration": 10,
    "ratio": "16:9"
  }
}
```

## 风险与注意事项

1. **API兼容性**: HappyHorse API与现有万相模型API格式可能不同，需要确保请求格式正确
2. **图片处理**: 需要支持多张参考图片的上传和处理
3. **异步任务处理**: 视频生成为异步任务，需确保状态轮询逻辑正确
4. **错误处理**: 需要处理模型特定的错误码和错误信息

## 测试计划

1. **文生视频测试**: 使用HappyHorse模型生成纯文字描述的视频
2. **图生视频测试**: 使用首帧图片生成视频
3. **多图参考测试**: 使用多张参考图片生成视频
4. **错误处理测试**: 测试各种异常情况的处理

---

*计划版本: 1.0*  
*创建日期: 2026-05-19*