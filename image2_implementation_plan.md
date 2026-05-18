# Image2 大模型调用方式修改计划

## 概述

根据参考文档 `image2.md`，将网站中的 Image2 (gpt-image-2) 大模型调用方式从 **OpenRouter API** 改为 **OpenAI 官方 Node.js SDK**。

## 当前情况分析

### 当前实现

* **模型名称**：`openai/gpt-5.4-image-2`

* **调用方式**：通过 OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)

* **API Key**：使用 `OPENROUTER_API_KEY`

### 需要修改的调用方式

* **模型名称**：`gpt-image-2`（移除 `openai/` 前缀）

* **调用方式**：OpenAI 官方 SDK (`openai.images.generate`)

* **API Key**：使用 `GPTAPI`（已在 .env 文件中配置）

## 需要修改的文件

### 1. 服务端 Task 文件

#### 1.1 `src/services/tasks/TextToImageTask.ts`

* 添加 OpenAI SDK 导入和初始化

* 更新 MODEL\_MAP：移除 `openai/` 前缀

* 替换 Image2 调用代码：从 OpenRouter fetch 改为 OpenAI SDK

* 支持新参数：`thinking`, `quality`, `n`

#### 1.2 `src/services/tasks/AgentImageTask.ts`

* 添加 OpenAI SDK 导入和初始化

* 更新 MODEL\_MAP：移除 `openai/` 前缀

* 替换 Image2 调用代码：从 OpenRouter fetch 改为 OpenAI SDK

* 支持新参数：`thinking`, `quality`, `n`, `referenceImages`

#### 1.3 `src/services/tasks/InpaintTask.ts`

* 添加 OpenAI SDK 导入和初始化

* 更新 MODEL\_MAP：移除 `openai/` 前缀

* 替换 Image2 调用代码：从 OpenRouter fetch 改为 OpenAI SDK

* 支持参数：`thinking`, `quality`, `n`, `image`, `mask`

#### 1.4 `src/services/generation.service.ts`

* 更新 MODEL\_MAP：移除 `openai/` 前缀

* 替换 Image2 调用代码：从 OpenRouter fetch 改为 OpenAI SDK

### 2. API 路由文件

#### 2.1 `src/app/api/generate/image/route.ts`

* 确保传递 Image2 相关参数到 service 层

* 新增参数：`n`, `quality`, `thinking`

#### 2.2 `src/app/api/generate/inpaint/route.ts`

* 确保传递 Image2 局部重绘参数

### 3. 环境变量配置

#### 3.1 `.env` 文件

* 确认 `GPTAPI` 已正确配置（已有）

## 详细实施步骤

### 步骤 1：创建 OpenAI 客户端工具函数

创建文件：`src/lib/openai-client.ts`

```typescript
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.GPTAPI || process.env.OPENAI_API_KEY || "",
      timeout: 600 * 1000, // 生图可能需3-5分钟
      maxRetries: 2,
    });
  }
  return openaiClient;
}
```

### 步骤 2：更新 TextToImageTask.ts

1. 导入 OpenAI SDK
2. 更新 MODEL\_MAP：`image2: "gpt-image-2"`
3. 添加尺寸映射函数 `getImage2Size()`
4. 替换 Image2 调用代码
5. 解析多图返回

### 步骤 3：更新 AgentImageTask.ts

1. 导入 OpenAI SDK
2. 更新 MODEL\_MAP：`image2: "gpt-image-2"`
3. 替换 Image2 调用代码（支持多图参考）
4. 解析多图返回

### 步骤 4：更新 InpaintTask.ts

1. 导入 OpenAI SDK
2. 更新 MODEL\_MAP：`image2: "gpt-image-2"`
3. 替换 Image2 调用代码（支持 mask 和多图参考）
4. 解析多图返回

### 步骤 5：更新 generation.service.ts

1. 更新 MODEL\_MAP：`image2: "gpt-image-2"`
2. 替换 Image2 调用代码
3. 解析多图返回

### 步骤 6：验证 API 路由

检查并确保所有 API 路由正确传递 Image2 参数

## Image2 SDK 调用示例

```typescript
const response = await openai.images.generate({
  model: "gpt-image-2",
  prompt: fullPrompt,
  size: getImage2Size(aspectRatio), // 如 "1024x1024"
  quality: quality || "low",
  n: generateCount || 1, // 1-4
  thinking: thinking || "medium",
  response_format: "b64_json",
});

for (const img of response.data) {
  if (img.b64_json) {
    outputImages.push({ base64: img.b64_json });
  }
}
```

### 图生图（多图参考）

```typescript
const imageBuffers = await Promise.all(
  referenceImages.map(async (imgPath) => ({
    image: await fs.readFile(imgPath)
  }))
);

const response = await openai.images.edit({
  model: "gpt-image-2",
  images: imageBuffers,
  prompt: fullPrompt,
  size: getImage2Size(aspectRatio),
  quality: quality || "low",
  n: generateCount || 1,
  thinking: thinking || "medium",
  response_format: "b64_json",
});
```

### 局部重绘（带 mask）

```typescript
const response = await openai.images.edit({
  model: "gpt-image-2",
  image: originalBuffer,
  mask: maskBuffer,
  prompt: prompt,
  size: getImage2Size(aspectRatio),
  quality: quality || "low",
  n: generateCount || 1,
  thinking: thinking || "medium",
  response_format: "b64_json",
});
```

## 尺寸映射

### Image2 模型支持的完整尺寸映射

```typescript
function getImage2Size(aspectRatio: string): string {
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3": "1024x1024",
    "3:4": "1024x1024",
    "3:2": "1024x1024",
    "2:3": "1024x1024",
    "21:9": "1792x1024",
  };
  return sizeMap[aspectRatio] || "1024x1024";
}
```

### 前端比例到 Image2 尺寸的完整映射表

| 前端比例 | Image2 尺寸 |
| ---- | --------- |
| 1:1  | 1024x1024 |
| 16:9 | 1792x1024 |
| 9:16 | 1024x1792 |
| 4:3  | 1024x1024 |
| 3:4  | 1024x1024 |
| 3:2  | 1024x1024 |
| 2:3  | 1024x1024 |
| 21:9 | 1792x1024 |
| 其他  | 1024x1024 |

## 参数说明

| 参数         | 类型      | 默认值         | 说明                       |
| ---------- | ------- | ----------- | ------------------------ |
| `n`        | integer | 1           | 生成数量 1-4                 |
| `quality`  | string  | "low"       | 质量档位：low/medium/high     |
| `thinking` | string  | "medium"    | 思考级别：off/low/medium/high |
| `size`     | string  | "1024x1024" | 输出尺寸                     |

## 注意事项

1. **超时设置**：必须设置 `timeout: 600000`（600秒），因为高质量图片生成可能需要 3-5 分钟
2. **API Key**：优先使用 `GPTAPI`，其次 `OPENAI_API_KEY`
3. **多图支持**：Image2 支持一次生成 1-4 张图片
4. **成本计算**：每张图片消耗独立积分

## 验证步骤

1. 运行 `npm run dev` 启动开发服务器
2. 在前端页面选择 image2 模型
3. 测试文生图功能
4. 测试图生图功能
5. 测试局部重绘功能
6. 检查图片是否正确保存
7. 验证积分扣除是否正确

