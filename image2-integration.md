# Image2 大模型调用方式修改文档

## 概述

本文档记录了对 Image2 (gpt-image-2) 大模型调用方式的所有修改，供其他程序员参考。

### 重要变更

**调用方式**：从 HTTP fetch 改为 OpenAI Node.js SDK

**模型名称**：`openai/gpt-5.4-image-2` → `gpt-image-2`

---

## 1. 服务端 Task 文件修改

### 1.1 TextToImageTask.ts

**文件路径**：`src/services/tasks/TextToImageTask.ts`

#### 添加 OpenAI SDK 导入和初始化

```typescript
import OpenAI from "openai";

// 添加 OpenAI 客户端实例
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI || "",
  timeout: 600 * 1000, // 生图可能需3-5分钟
  maxRetries: 2,
});
```

#### 模型名称映射

```typescript
const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "gpt-image-2",  // 注意：不再使用 "openai/" 前缀
};
```

#### 成本配置

```typescript
const COST_MAP: Record<string, number> = {
  flash: 1,
  pro: 3,
  image2: 50,  // 每张图片的基础成本
};
```

#### Image2 尺寸映射函数

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

#### Image2 调用代码（execute 方法内）

```typescript
if (isImage2Model) {
  // Image2 模型使用 OpenAI SDK
  const size = getImage2Size(aspectRatio);

  const response = await openai.images.generate({
    model: modelName,           // "gpt-image-2"
    prompt: fullPrompt,
    size,                       // 映射后的尺寸
    quality,                    // 默认 "low"
    n: generateCount,           // 1-4
  });

  // 解析多图返回
  for (const img of response.data) {
    if (img.b64_json) {
      outputImages.push({ base64: img.b64_json });
    } else if (img.url) {
      outputImages.push({ url: img.url });
    }
  }

  if (outputImages.length === 0) {
    throw new Error("Image2 未能生成图片");
  }

  // 使用第一张作为主图
  if (outputImages[0].base64) {
    outputBase64 = outputImages[0].base64;
  }
}
```

#### 新增参数解构

```typescript
const {
  // ... 原有参数
  n = 1,            // 新增：生成数量
  quality = "low",  // 新增：quality 参数
  thinking,         // 新增：Image2 思考层级
} = params;

// Image2 多图成本计算
const generateCount = isImage2Model ? Math.max(1, Math.min(4, n)) : 1;
const cost = this.getCost(model) * generateCount;
```

---

### 1.2 InpaintTask.ts

**文件路径**：`src/services/tasks/InpaintTask.ts`

#### 添加 OpenAI SDK 导入和初始化

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI || "",
  timeout: 600 * 1000,
  maxRetries: 2,
});
```

#### 模型名称映射

```typescript
const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "gpt-image-2",
};
```

#### 成本配置

```typescript
const COST_MAP: Record<string, number> = {
  flash: 2,
  pro: 5,
  image2: 60,
};
```

#### Image2 调用代码（局部重绘/多图参考）

```typescript
if (isImage2Model) {
  // 1. 处理原图为 Buffer
  let originalBuffer: Buffer;
  if (originalImage.startsWith("/outputs/") || originalImage.startsWith("http")) {
    // 从文件系统或网络读取
    const filePath = originalImage.startsWith("/outputs/")
      ? path.join(process.cwd(), "public", originalImage)
      : originalImage;
    if (fs.existsSync(filePath)) {
      originalBuffer = fs.readFileSync(filePath);
    } else {
      const response = await fetch(originalImage);
      const arrayBuffer = await response.arrayBuffer();
      originalBuffer = Buffer.from(arrayBuffer);
    }
  } else if (originalImage.includes(",")) {
    // Base64 data URL 格式
    const base64Data = originalImage.split(",")[1];
    originalBuffer = Buffer.from(base64Data, "base64");
  } else {
    // 纯 base64 字符串
    originalBuffer = Buffer.from(originalImage, "base64");
  }

  // 2. 处理 mask（如果有）
  let maskBuffer: Buffer | undefined;
  if (maskImage) {
    if (maskImage.includes(",")) {
      maskBuffer = Buffer.from(maskImage.split(",")[1], "base64");
    } else {
      maskBuffer = Buffer.from(maskImage, "base64");
    }
  }

  // 3. 处理多张参考图片（如果有）
  const imageBuffers: { image: Buffer }[] = [];
  for (const refImg of referenceImages) {
    let refBuffer: Buffer;
    if (refImg.includes(",")) {
      refBuffer = Buffer.from(refImg.split(",")[1], "base64");
    } else if (refImg.startsWith("/outputs/") || refImg.startsWith("http")) {
      const filePath = refImg.startsWith("/outputs/")
        ? path.join(process.cwd(), "public", refImg)
        : refImg;
      if (fs.existsSync(filePath)) {
        refBuffer = fs.readFileSync(filePath);
      } else {
        const response = await fetch(refImg);
        const arrayBuffer = await response.arrayBuffer();
        refBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      refBuffer = Buffer.from(refImg, "base64");
    }
    imageBuffers.push({ image: refBuffer });
  }

  // 4. 使用 OpenAI SDK 调用
  const response = await openai.images.edit({
    model: modelName,           // "gpt-image-2"
    image: originalBuffer,      // 原始图片
    mask: maskBuffer,           // 蒙版（选区）
    images: imageBuffers.length > 0 ? imageBuffers : undefined, // 多图参考
    prompt,                     // 编辑指令
    size: getImage2Size(aspectRatio),
    quality,                    // 默认 "low"
    n: generateCount,           // 1-4
    thinking: thinking || "medium",
  });

  // 5. 解析多图返回
  for (const img of response.data) {
    if (img.b64_json) {
      outputImages.push({ base64: img.b64_json });
    } else if (img.url) {
      outputImages.push({ url: img.url });
    }
  }
}
```

#### 新增参数解构

```typescript
const {
  // ... 原有参数
  n = 1,
  quality = "low",
  thinking = "medium",
  referenceImages = [],  // 多图参考
} = params;
```

---

## 2. API 路由修改

### 2.1 /api/generate/image

**文件路径**：`src/app/api/generate/image/route.ts`

传递 Image2 相关参数到 service 层：

```typescript
const body = {
  prompt,
  aspectRatio,
  model,
  referenceImages,
  n: model === "image2" ? n : undefined,
  quality: model === "image2" ? (quality || "low") : undefined,
  thinking: model === "image2" ? thinking : undefined,
};
```

### 2.2 /api/generate/inpaint

**文件路径**：`src/app/api/generate/inpaint/route.ts`

传递 Image2 局部重绘参数：

```typescript
const body = {
  prompt,
  originalImage,
  maskImage,
  model,
  aspectRatio,
  referenceImages,
  n: model === "image2" ? n : 1,
  quality: model === "image2" ? (quality || "low") : undefined,
  thinking: model === "image2" ? thinking : undefined,
};
```

---

## 3. 前端页面修改

### 3.1 文生图/图生图页面

**文件路径**：`src/app/(main)/generate/image/page.tsx`

#### 新增配置选项常量

```typescript
const IMAGE2_COUNT_OPTIONS = [
  { value: "1", label: "1张" },
  { value: "2", label: "2张" },
  { value: "3", label: "3张" },
  { value: "4", label: "4张" },
];

const IMAGE2_THINKING_OPTIONS = [
  { value: "off", label: "关闭" },
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];
```

#### 新增状态变量

```typescript
const [image2Count, setImage2Count] = useState(1);
const [image2Thinking, setImage2Thinking] = useState("off");
```

#### Image2 UI 参数（renderModeParams 或类似函数内）

```tsx
{/* Image2 专用参数 */}
{model === "image2" && (
  <>
    <DropdownSelector
      label="生成数量"
      value={image2Count.toString()}
      options={IMAGE2_COUNT_OPTIONS}
      onChange={(val) => setImage2Count(parseInt(val))}
    />
    <DropdownSelector
      label="思考级别"
      value={image2Thinking}
      options={IMAGE2_THINKING_OPTIONS}
      onChange={(val) => setImage2Thinking(val)}
    />
  </>
)}
```

#### API 请求体

```typescript
const body: Record<string, unknown> = {
  prompt: prompt.trim(),
  aspectRatio: selectedSize.ratio,
  imageSize: model === "image2" ? undefined : resolution,
  thinkingLevel: model === "image2" ? undefined : thinkingLevel,
  model,
  n: model === "image2" ? image2Count : undefined,
  thinking: model === "image2" ? image2Thinking : undefined,
  quality: model === "image2" ? "low" : undefined,
};

if (mode === "image-to-image" && referenceImages.length > 0) {
  body.referenceImages = referenceImages;
}
```

#### 成本计算

```typescript
const getCost = (m: string) => {
  if (m === "flash") return 2;
  if (m === "image2") return 60;
  return 5;
};
const totalCost = model === "image2" ? creditsPerImage * image2Count : creditsPerImage;
```

---

### 3.2 局部重绘页面

**文件路径**：`src/app/(main)/generate/edit/page.tsx`

#### 新增状态变量

```typescript
const [image2Count, setImage2Count] = useState(1);
const [image2Thinking, setImage2Thinking] = useState("off");
const [image2ReferenceImages, setImage2ReferenceImages] = useState<string[]>([]);
```

#### 多图参考上传 UI

```tsx
{/* Image2 多图参考上传 */}
{model === "image2" && (
  <div className="space-y-2">
    <label className="text-xs text-zinc-400">参考图片（可选）</label>
    <div className="grid grid-cols-3 gap-2">
      {image2ReferenceImages.map((img, idx) => (
        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/[0.08] group">
          <img src={img} alt={`参考 ${idx + 1}`} className="w-full h-full object-cover" />
          <button
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onClick={() => setImage2ReferenceImages((prev) => prev.filter((_, i) => i !== idx))}
          >
            <span className="text-white text-sm">移除</span>
          </button>
        </div>
      ))}
      {image2ReferenceImages.length < 8 && (
        <ImageUploader
          onUpload={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              setImage2ReferenceImages((prev) => [...prev, dataUrl]);
            };
            reader.readAsDataURL(file);
          }}
          compact
          className="h-full"
        />
      )}
    </div>
  </div>
)}
```

---

### 3.3 ParamPanel.tsx

**文件路径**：`src/components/generate/ParamPanel.tsx`

#### 导出配置选项

```typescript
export const IMAGE2_COUNT_OPTIONS = [
  { value: "1", label: "1张" },
  { value: "2", label: "2张" },
  { value: "3", label: "3张" },
  { value: "4", label: "4张" },
];

export const IMAGE2_THINKING_OPTIONS = [
  { value: "off", label: "关闭" },
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];
```

#### 接收新增 props

```typescript
interface ParamPanelProps {
  // ... 原有 props
  image2Count?: number;
  onImage2CountChange?: (count: number) => void;
  image2Thinking?: string;
  onImage2ThinkingChange?: (thinking: string) => void;
}
```

#### Image2 参数 UI

```tsx
{model === "image2" && (
  <>
    <DropdownSelector
      label="生成数量"
      value={image2Count?.toString() || "1"}
      options={IMAGE2_COUNT_OPTIONS}
      onChange={(val) => onImage2CountChange?.(parseInt(val))}
    />
    <DropdownSelector
      label="思考级别"
      value={image2Thinking || "off"}
      options={IMAGE2_THINKING_OPTIONS}
      onChange={(val) => onImage2ThinkingChange?.(val)}
    />
  </>
)}
```

---

## 4. Workflow 模块修改

### 4.1 aiService.ts

**文件路径**：`src/components/workflow/services/aiService.ts`

#### generateImage 函数更新

```typescript
export async function generateImage(prompt: string, config: {
  aspectRatio?: string;
  quality?: string;
  baseImages?: string[];
  model?: string;
  cost?: number;
  n?: number;        // 新增
  thinking?: string; // 新增
} = {}) {
  try {
    let model = "flash";
    if (config.model?.includes("3.1") || config.model?.includes("3,1")) {
      model = "flash";
    } else if (config.model?.includes("pro")) {
      model = "pro";
    } else if (config.model?.includes("image2")) {
      model = "image2";
    }

    const data = await request("/api/workflow/generate/image", {
      prompt,
      aspect_ratio: config.aspectRatio,
      quality: model === "image2" ? "low" : (config.quality === "512p" ? "512P" : ...),
      model,
      reference_images: config.baseImages,
      cost: config.cost,
      n: model === "image2" ? config.n : undefined,
      thinking: model === "image2" ? config.thinking : undefined,
    });

    // 处理多图返回
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const imageUrls = data.images.map((img: any) => {
        if (img.base64) {
          return img.base64.startsWith("data:")
            ? img.base64
            : `data:image/png;base64,${img.base64}`;
        } else if (img.url) {
          return img.url;
        }
        return null;
      }).filter(Boolean);
      return imageUrls; // 返回数组
    }

    // 单图返回
    let imageUrl = null;
    if (data.base64) {
      imageUrl = data.base64.startsWith("data:")
        ? data.base64
        : `data:image/png;base64,${data.base64}`;
    } else if (data.url) {
      imageUrl = data.url;
    }
    return imageUrl;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}
```

---

### 4.2 ImageNode.tsx

**文件路径**：`src/components/workflow/nodes/ImageNode.tsx`

#### 类型定义更新

```typescript
export interface NodeData {
  // ... 原有字段
  config: {
    // ... 原有配置
    n?: number;                    // 新增
    thinking?: 'off' | 'low' | 'medium' | 'high'; // 新增
  };
}
```

#### 成本计算更新

```typescript
const MODEL_COST_MAP: Record<string, { base: number }> = {
  "gemini-2.5-flash-image": { base: 2 },
  "gemini-3.1-flash-image-preview": { base: 2 },
  "flash": { base: 2 },
  "pro": { base: 5 },
  "image2": { base: 60 },
};

const calculateCost = (data: NodeData): number => {
  let model = "flash";
  if (data.config.model?.includes("3.1")) {
    model = "flash";
  } else if (data.config.model?.includes("pro")) {
    model = "pro";
  } else if (data.config.model?.includes("image2")) {
    model = "image2";
  }

  let cost = MODEL_COST_MAP[model]?.base || 2;

  // Image2 多图生成时，消耗乘以生成数量
  if (model === "image2" && data.config.n) {
    cost = cost * data.config.n;
  }

  return cost;
};
```

#### Image2 参数设置函数

```typescript
const isImage2Model = data.config.model?.includes("image2");

const setImage2N = (n: number) => {
  setNodes((nds) =>
    nds.map((n) =>
      n.id === props.id ? {
        ...n,
        data: { ...n.data, config: { ...n.data.config, n } }
      } : n
    )
  );
};

const setImage2Thinking = (thinking: 'off' | 'low' | 'medium' | 'high') => {
  setNodes((nds) =>
    nds.map((n) =>
      n.id === props.id ? {
        ...n,
        data: { ...n.data, config: { ...n.data.config, thinking } }
      } : n
    )
  );
};
```

#### Image2 参数 UI

```tsx
{/* Image2 专用参数 */}
{isImage2Model && (
  <>
    <div className="space-y-3">
      <div className="text-sm font-bold text-slate-500 pl-1">生成数量</div>
      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
        {([1, 2, 3, 4] as const).map((n) => (
          <button
            key={n}
            onClick={() => setImage2N(n)}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold uppercase transition-all rounded-xl",
              (data.config.n || 1) === n
                ? "bg-white/10 text-white shadow-xl"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {n}张
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <div className="text-sm font-bold text-slate-500 pl-1">思考级别</div>
      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
        {(['off', 'low', 'medium', 'high'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setImage2Thinking(t)}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold uppercase transition-all rounded-xl",
              (data.config.thinking || "off") === t
                ? "bg-white/10 text-white shadow-xl"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {t === 'off' ? '关' : t === 'low' ? '低' : t === 'medium' ? '中' : '高'}
          </button>
        ))}
      </div>
    </div>
  </>
)}
```

---

## 5. 类型定义修改

### 5.1 generation.ts

**文件路径**：`src/types/generation.ts`

```typescript
// Image2 思考级别
export type Image2ThinkingLevel = "off" | "low" | "medium" | "high";

// Image2 生成参数
export interface Image2GenerateParams {
  n?: number;           // 生成数量 1-4
  quality?: "low" | "medium" | "high"; // 默认 low
  thinking?: Image2ThinkingLevel;
  size?: string;       // 如 "1024x1024"
}

// 多图生成结果
export interface MultiImageGenerateResult extends GenerationResult {
  images?: { url?: string; base64?: string }[];
}
```

---

## 6. 环境变量配置

确保 `.env` 文件中包含：

```env
# OpenAI API Key（用于 Image2 模型）
OPENAI_API_KEY=your_openai_api_key_here
# 或者使用 OPENAI 字段
OPENAI=your_openai_api_key_here

# Google API Key（用于 Flash/Pro 模型）
GOOGLE_GENAI_API_KEY=your_google_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 7. 重要注意事项

### 7.1 调用方式选择

| 方式 | 支持情况 | 建议 |
|------|---------|------|
| **OpenAI SDK** | ✅ 完全支持所有参数 | **生产环境使用** |
| **直接 HTTP fetch** | ⚠️ 部分参数不支持（如 `thinking`、`response_format`） | 不推荐 |

### 7.2 尺寸映射

Image2 模型支持的尺寸与前端比例不完全对应，需要通过映射函数转换：

| 前端比例 | Image2 尺寸 |
|---------|------------|
| 1:1 | 1024x1024 |
| 16:9 | 1792x1024 |
| 9:16 | 1024x1792 |
| 4:3 | 1024x1024 |
| 3:4 | 1024x1024 |
| 3:2 | 1024x1024 |
| 2:3 | 1024x1024 |
| 21:9 | 1792x1024 |

### 7.3 成本计算

- **Flash**: 2 积分/次
- **Pro**: 5 积分/次
- **Image2**: 60 积分/张 × 生成数量

### 7.4 参数默认值

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `n` | 1 | 生成数量 1-4 |
| `quality` | "low" | 质量档位 |
| `thinking` | "medium" | 思考级别（仅 Image2） |

---

## 8. 参考文档

更多参数说明和最佳实践，请参考：`/home/ubuntu/bayinai/ai-studio/image2.md`
