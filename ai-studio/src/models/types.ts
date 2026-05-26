export type ModelCategory = "image" | "video" | "text";

export type ImageModelId = "flash" | "pro" | "image2";
export type VideoModelId = "wan2.2-kf2v-flash" | "wan2.7-r2v" | "wan2.7-t2v" | "happyhorse-1.0-t2v" | "happyhorse-1.0-i2v" | "veo-3.1-lite-generate-preview";

export type ImageQuality = "512" | "1K" | "2K" | "4K";
export type VideoResolution = "480P" | "720P" | "1080P";

export interface ModelInfo {
  id: string;
  name: string;
  category: ModelCategory;
  description: string;
  supportedQualities: ImageQuality[];
  isImage2Model: boolean;
  isProModel: boolean;
  isFlashModel: boolean;
}

export interface VideoModelInfo {
  id: VideoModelId;
  name: string;
  displayName: string;
  category: "video";
  description: string;
  supportedResolutions: VideoResolution[];
  supportedDurations: number[];
  supportsTextToVideo: boolean;
  supportsImageToVideo: boolean;
  isWan22: boolean;
  isWan27: boolean;
  isHappyHorse: boolean;
}

export interface ImageCreditRule {
  policyKey: string;
  modelId: ImageModelId;
  quality: ImageQuality;
  name: string;
  description: string;
  cost: number;
  unit: string;
}

export interface VideoCreditRule {
  policyKey: string;
  modelId: VideoModelId;
  resolution: VideoResolution;
  name: string;
  description: string;
  costPerSecond: number;
  unit: string;
}

export interface CreditPolicyEntry {
  key: string;
  name: string;
  description: string | null;
  cost: number;
  unit: string;
  category: string;
  isActive: boolean;
}

export function createPolicyKey(modelId: string, qualityOrResolution: string): string {
  return `${modelId}__${qualityOrResolution}`.toLowerCase().replace(/\./g, "-");
}

export function parsePolicyKey(key: string): { modelId: string; qualityOrResolution: string } | null {
  const parts = key.split("__");
  if (parts.length !== 2) return null;
  return { modelId: parts[0], qualityOrResolution: parts[1] };
}