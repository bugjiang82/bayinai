import type { VideoModelInfo, VideoModelId, VideoResolution } from "./types";

export const VIDEO_MODELS: Record<VideoModelId, VideoModelInfo> = {
  "wan2.2-kf2v-flash": {
    id: "wan2.2-kf2v-flash",
    name: "万相 2.2",
    displayName: "万相 2.2",
    category: "video",
    description: "快速生成，支持首尾帧",
    supportedResolutions: ["480P", "720P", "1080P"],
    supportedDurations: [3, 5, 10],
    supportsTextToVideo: false,
    supportsImageToVideo: true,
    isWan22: true,
    isWan27: false,
    isHappyHorse: false,
    isSeedance: false,
  },
  "wan2.7-r2v": {
    id: "wan2.7-r2v",
    name: "万相 2.7",
    displayName: "万相 2.7",
    category: "video",
    description: "高质量图生视频",
    supportedResolutions: ["720P", "1080P"],
    supportedDurations: [5, 10, 15],
    supportsTextToVideo: false,
    supportsImageToVideo: true,
    isWan22: false,
    isWan27: true,
    isHappyHorse: false,
    isSeedance: false,
  },
  "wan2.7-t2v": {
    id: "wan2.7-t2v",
    name: "万相 2.7",
    displayName: "万相 2.7",
    category: "video",
    description: "文生视频",
    supportedResolutions: ["720P", "1080P"],
    supportedDurations: [5, 10, 15],
    supportsTextToVideo: true,
    supportsImageToVideo: false,
    isWan22: false,
    isWan27: true,
    isHappyHorse: false,
    isSeedance: false,
  },
  "happyhorse-1.0-t2v": {
    id: "happyhorse-1.0-t2v",
    name: "HappyHorse",
    displayName: "HappyHorse",
    category: "video",
    description: "文生视频，支持多图参考",
    supportedResolutions: ["720P", "1080P"],
    supportedDurations: [5, 10, 15],
    supportsTextToVideo: true,
    supportsImageToVideo: false,
    isWan22: false,
    isWan27: false,
    isHappyHorse: true,
    isSeedance: false,
  },
  "happyhorse-1.0-i2v": {
    id: "happyhorse-1.0-i2v",
    name: "HappyHorse",
    displayName: "HappyHorse",
    category: "video",
    description: "图生视频，支持多图参考",
    supportedResolutions: ["720P", "1080P"],
    supportedDurations: [5, 10, 15],
    supportsTextToVideo: false,
    supportsImageToVideo: true,
    isWan22: false,
    isWan27: false,
    isHappyHorse: true,
    isSeedance: false,
  },
  "seedance-1.5-pro": {
    id: "seedance-1.5-pro",
    name: "Seedance",
    displayName: "Seedance 1.5 Pro",
    category: "video",
    description: "豆包视频生成，支持文生/图生",
    supportedResolutions: ["480P", "720P", "1080P"],
    supportedDurations: [4, 5, 8, 10, 12],
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    isWan22: false,
    isWan27: false,
    isHappyHorse: false,
    isSeedance: true,
  },
};

export const VIDEO_RESOLUTION_OPTIONS: { value: VideoResolution; label: string; description: string }[] = [
  { value: "480P", label: "480P", description: "854×480" },
  { value: "720P", label: "720P", description: "1280×720" },
  { value: "1080P", label: "1080P", description: "1920×1080" },
];

export const VIDEO_DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "3", label: "3 秒" },
  { value: "5", label: "5 秒" },
  { value: "10", label: "10 秒" },
  { value: "15", label: "15 秒" },
];

export const VIDEO_ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "16:9", description: "横屏" },
  { value: "9:16", label: "9:16", description: "竖屏" },
  { value: "1:1", label: "1:1", description: "方形" },
  { value: "4:3", label: "4:3", description: "标准" },
  { value: "3:4", label: "3:4", description: "竖版" },
  { value: "21:9", label: "21:9", description: "超宽屏" },
];

export interface VideoModeOption {
  value: string;
  label: string;
  description: string;
}

export function getVideoModelOptions(mode: "text-to-video" | "image-to-video"): VideoModeOption[] {
  return Object.values(VIDEO_MODELS)
    .filter(m => mode === "text-to-video" ? m.supportsTextToVideo : m.supportsImageToVideo)
    .map(m => ({ value: m.id, label: m.displayName, description: m.description }));
}

export function getVideoModel(id: string): VideoModelInfo | undefined {
  return VIDEO_MODELS[id as VideoModelId];
}

export function getVideoModelResolutions(modelId: string): VideoResolution[] {
  return VIDEO_MODELS[modelId as VideoModelId]?.supportedResolutions || ["720P"];
}

export function getVideoModelDurations(modelId: string): number[] {
  return VIDEO_MODELS[modelId as VideoModelId]?.supportedDurations || [5];
}

export function isVideoModelId(id: string): id is VideoModelId {
  return id in VIDEO_MODELS;
}

export function getCanvasVideoModelOptions(): { id: string; name: string; type: string[] }[] {
  return Object.values(VIDEO_MODELS).map(model => ({
    id: model.id,
    name: model.supportsTextToVideo && model.supportsImageToVideo
      ? `${model.displayName}`
      : model.supportsTextToVideo
        ? `${model.displayName} (文生视频)`
        : `${model.displayName} (图生视频)`,
    type: ['video'],
  }));
}