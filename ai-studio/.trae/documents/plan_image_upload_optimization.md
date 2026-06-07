# 参考图片上传优化与比例自动适配

## 摘要

修复图片生成页面两个问题：
1. 用户上传多张参考图片时 `localStorage.setItem` 配额超限报错
2. 图片生成页面缺少参考图片比例自动适配功能

## 现状分析

### 问题 1：localStorage 配额超限

**根因**：[`src/app/(main)/generate/image/page.tsx`](file:///home/ubuntu/bayinai/ai-studio/src/app/(main)/generate/image/page.tsx#L183-L185) 第 183-185 行：

```typescript
useEffect(() => {
  localStorage.setItem("unified-image-reference-images", JSON.stringify(referenceImages));
}, [referenceImages]);
```

`referenceImages` 是 base64 data URL 数组。每张图片转 base64 后约 1-5MB，上传 3 张即超过 localStorage 5MB 限制。

**已有基础设施**：[`src/lib/imageStorage.ts`](file:///home/ubuntu/bayinai/ai-studio/src/lib/imageStorage.ts) 已提供 `saveToStorage`/`loadFromStorage` 函数，支持：
- 数据 < 2MB → localStorage 存储
- 数据 >= 2MB → IndexedDB 存储（容量 ~250MB）
- 但 `image/page.tsx` 未使用此封装，而是直接调用 `localStorage.setItem`

### 问题 2：缺少比例自动适配

编辑页面（[`edit/page.tsx`](file:///home/ubuntu/bayinai/ai-studio/src/app/(main)/generate/edit/page.tsx#L272-L282)）已有 `detectImageAspectRatio` 和 `originalImageSize` 逻辑，但图片生成页面完全没有此功能。用户上传参考图后需要手动选择比例，体验不佳。

参考仓库（`0520happyhorse` 分支）的 `edit/page.tsx` 有相同的 `detectImageAspectRatio` 实现，但也没有自动应用。我们需要在图片生成页面实现**自动检测并设置比例**。

## 修改方案

### 修改 1：`src/app/(main)/generate/image/page.tsx` — 修复 localStorage 配额

**改动点**：
- 导入 `saveToStorage` 和 `loadFromStorage` 替代直接 `localStorage` 操作
- 初始化 `referenceImages` 时使用 `loadFromStorage` 异步加载
- 保存 `referenceImages` 时使用 `saveToStorage`（自动选择 localStorage/IndexedDB）
- 上传图片时先压缩再存储（复用 edit 页面的 `compressImageForUpload` 或内联压缩逻辑）

**代码改动**：

```typescript
// 新增导入
import { saveToStorage, loadFromStorage } from "@/lib/imageStorage";

// 新增：图片压缩函数（复用 edit 页面的逻辑）
function compressImageForUpload(dataUrl: string, callback: (compressed: string) => void) {
  const img = new Image();
  img.onload = () => {
    const MAX_DIM = 2000;
    let { naturalWidth: w, naturalHeight: h } = img;
    if (w <= MAX_DIM && h <= MAX_DIM && dataUrl.length < 500000) {
      callback(dataUrl);
      return;
    }
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) { h = Math.round(h * (MAX_DIM / w)); w = MAX_DIM; }
      else { w = Math.round(w * (MAX_DIM / h)); h = MAX_DIM; }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { callback(dataUrl); return; }
    ctx.drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL("image/jpeg", 0.85));
  };
  img.src = dataUrl;
}

// 修改：异步初始化 referenceImages
const [referenceImages, setReferenceImages] = useState<string[]>([]);
const [imagesLoaded, setImagesLoaded] = useState(false);

useEffect(() => {
  loadFromStorage("unified-image-reference-images").then((saved) => {
    if (saved.length > 0) setReferenceImages(saved);
    setImagesLoaded(true);
  });
}, []);

// 修改：handleUpload 先压缩再存储
const handleUpload = useCallback((file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    compressImageForUpload(dataUrl, (compressed) => {
      setReferenceImages((prev) => [...prev, compressed]);
    });
  };
  reader.readAsDataURL(file);
}, []);

// 修改：使用 saveToStorage 替代 localStorage.setItem
useEffect(() => {
  if (imagesLoaded) {
    saveToStorage(referenceImages, "unified-image-reference-images");
  }
}, [referenceImages, imagesLoaded]);
```

### 修改 2：`src/app/(main)/generate/image/page.tsx` — 添加比例自动适配

**改动点**：
- 新增 `originalImageSize` 状态，记录上传图片的原始尺寸
- 新增 `detectImageAspectRatio` 函数，根据图片宽高比自动匹配 SIZE_OPTIONS
- 在 `handleUpload` 中检测图片尺寸，当图生图模式下上传参考图片时自动设置 `selectedSize`

**代码改动**：

```typescript
// 新增状态
const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);

// 新增：自动检测比例
const detectImageAspectRatio = useCallback((width: number, height: number): string => {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.1) return "1:1";
  if (ratio > 2.0) return "21:9";
  if (ratio > 1.6) return "16:9";
  if (ratio > 1.2) return "4:3";
  if (ratio < 0.45) return "9:16";
  if (ratio < 0.6) return "3:4";
  if (ratio < 0.85) return "9:16";
  return "1:1";
}, []);

// 修改 handleUpload：检测图片尺寸并自动设置比例
const handleUpload = useCallback((file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    // 检测原始尺寸
    const img = new Image();
    img.onload = () => {
      setOriginalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      if (mode === "image-to-image") {
        const detectedRatio = detectImageAspectRatio(img.naturalWidth, img.naturalHeight);
        const matchedSize = SIZE_OPTIONS.find(s => s.ratio === detectedRatio);
        if (matchedSize && matchedSize.ratio !== selectedSize.ratio) {
          setSelectedSize(matchedSize);
        }
      }
    };
    img.src = dataUrl;
    // 压缩并存储
    compressImageForUpload(dataUrl, (compressed) => {
      setReferenceImages((prev) => [...prev, compressed]);
    });
  };
  reader.readAsDataURL(file);
}, [mode, selectedSize.ratio, detectImageAspectRatio]);

// 新增：sourceImage 变化时也自动适配（从 URL 参数加载时）
useEffect(() => {
  if (mode === "image-to-image" && referenceImages.length > 0 && originalImageSize) {
    const detectedRatio = detectImageAspectRatio(originalImageSize.width, originalImageSize.height);
    const matchedSize = SIZE_OPTIONS.find(s => s.ratio === detectedRatio);
    if (matchedSize && matchedSize.ratio !== selectedSize.ratio) {
      setSelectedSize(matchedSize);
    }
  }
}, [referenceImages, originalImageSize, mode, detectImageAspectRatio, selectedSize.ratio]);
```

## 验证步骤

1. 在图片生成页面切换到"图生图"模式
2. 依次上传 3 张以上不同尺寸的图片（如 1920x1080、800x600、正方形）
3. 验证：
   - 不再出现 `exceeded the quota` 错误
   - 上传第一张图片时 `selectedSize` 自动匹配图片比例（如 16:9 图片自动选 16:9）
   - 刷新页面后参考图片仍正确加载
   - 删除图片后比例不重置（保持用户手动选择）