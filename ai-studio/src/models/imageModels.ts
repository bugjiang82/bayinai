import type { ModelInfo, ImageModelId, ImageQuality } from "./types";

export const IMAGE_MODELS: Record<ImageModelId, ModelInfo> = {
  flash: {
    id: "flash",
    name: "Gemini Flash",
    category: "image",
    description: "快速生成，适合日常创作",
    supportedQualities: ["512", "1K", "2K", "4K"],
    isImage2Model: false,
    isProModel: false,
    isFlashModel: true,
  },
  pro: {
    id: "pro",
    name: "Gemini Pro",
    category: "image",
    description: "高质量输出，细节更丰富",
    supportedQualities: ["512", "1K", "2K", "4K"],
    isImage2Model: false,
    isProModel: true,
    isFlashModel: false,
  },
  image2: {
    id: "image2",
    name: "GPT Image2",
    category: "image",
    description: "超强图像生成，效果最佳",
    supportedQualities: ["1K", "2K", "4K"],
    isImage2Model: true,
    isProModel: false,
    isFlashModel: false,
  },
};

export const IMAGE_MODEL_API_NAMES: Record<ImageModelId, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "openai/gpt-5.4-image-2",
};

export const IMAGE_MODEL_OPTIONS = Object.entries(IMAGE_MODELS).map(([id, info]) => ({
  value: id,
  label: info.name,
  description: info.description,
}));

export const IMAGE_QUALITY_OPTIONS: { value: ImageQuality; label: string; description: string }[] = [
  { value: "512", label: "512", description: "标准" },
  { value: "1K", label: "1K", description: "1K 质量" },
  { value: "2K", label: "2K", description: "2K 质量" },
  { value: "4K", label: "4K", description: "4K 高清" },
];

export function getImageModel(id: string): ModelInfo | undefined {
  return IMAGE_MODELS[id as ImageModelId];
}

export function getImageModelApiName(id: ImageModelId): string {
  return IMAGE_MODEL_API_NAMES[id];
}

export function isImageModelId(id: string): id is ImageModelId {
  return id in IMAGE_MODELS;
}

export interface CanvasModelOption {
  id: string;
  name: string;
  type: string[];
}

export function getCanvasImageModelOptions(): CanvasModelOption[] {
  return Object.entries(IMAGE_MODELS).map(([id, info]) => ({
    id: IMAGE_MODEL_API_NAMES[id as ImageModelId],
    name: info.name,
    type: ['image'],
  }));
}

export function getImageModelIdByApiId(apiId: string): ImageModelId | undefined {
  const entry = Object.entries(IMAGE_MODEL_API_NAMES).find(([, apiName]) => apiName === apiId);
  return entry ? entry[0] as ImageModelId : undefined;
}