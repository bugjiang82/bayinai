import type { ImageCreditRule, VideoCreditRule, ImageModelId, ImageQuality, VideoModelId, VideoResolution, CreditPolicyEntry, ModelCategory } from "./types";
import { createPolicyKey } from "./types";

export const DEFAULT_IMAGE_CREDIT_RULES: ImageCreditRule[] = [
  { policyKey: createPolicyKey("flash", "512"), modelId: "flash", quality: "512", name: "Flash - 512", description: "Flash 模型 512 分辨率", cost: 1, unit: "次" },
  { policyKey: createPolicyKey("flash", "1K"), modelId: "flash", quality: "1K", name: "Flash - 1K", description: "Flash 模型 1K 分辨率", cost: 2, unit: "次" },
  { policyKey: createPolicyKey("flash", "2K"), modelId: "flash", quality: "2K", name: "Flash - 2K", description: "Flash 模型 2K 分辨率", cost: 4, unit: "次" },
  { policyKey: createPolicyKey("flash", "4K"), modelId: "flash", quality: "4K", name: "Flash - 4K", description: "Flash 模型 4K 分辨率", cost: 8, unit: "次" },

  { policyKey: createPolicyKey("pro", "512"), modelId: "pro", quality: "512", name: "Pro - 512", description: "Pro 模型 512 分辨率", cost: 3, unit: "次" },
  { policyKey: createPolicyKey("pro", "1K"), modelId: "pro", quality: "1K", name: "Pro - 1K", description: "Pro 模型 1K 分辨率", cost: 5, unit: "次" },
  { policyKey: createPolicyKey("pro", "2K"), modelId: "pro", quality: "2K", name: "Pro - 2K", description: "Pro 模型 2K 分辨率", cost: 8, unit: "次" },
  { policyKey: createPolicyKey("pro", "4K"), modelId: "pro", quality: "4K", name: "Pro - 4K", description: "Pro 模型 4K 分辨率", cost: 15, unit: "次" },

  { policyKey: createPolicyKey("image2", "1K"), modelId: "image2", quality: "1K", name: "Image2 - 1K", description: "Image2 模型 1K 分辨率", cost: 50, unit: "次" },
  { policyKey: createPolicyKey("image2", "2K"), modelId: "image2", quality: "2K", name: "Image2 - 2K", description: "Image2 模型 2K 分辨率", cost: 100, unit: "次" },
  { policyKey: createPolicyKey("image2", "4K"), modelId: "image2", quality: "4K", name: "Image2 - 4K", description: "Image2 模型 4K 分辨率", cost: 200, unit: "次" },
];

export const DEFAULT_VIDEO_CREDIT_RULES: VideoCreditRule[] = [
  { policyKey: createPolicyKey("wan2-2-kf2v-flash", "480P"), modelId: "wan2.2-kf2v-flash", resolution: "480P", name: "万相 2.2 - 480P", description: "按秒计费", costPerSecond: 20, unit: "秒" },
  { policyKey: createPolicyKey("wan2-2-kf2v-flash", "720P"), modelId: "wan2.2-kf2v-flash", resolution: "720P", name: "万相 2.2 - 720P", description: "按秒计费", costPerSecond: 30, unit: "秒" },
  { policyKey: createPolicyKey("wan2-2-kf2v-flash", "1080P"), modelId: "wan2.2-kf2v-flash", resolution: "1080P", name: "万相 2.2 - 1080P", description: "按秒计费", costPerSecond: 50, unit: "秒" },

  { policyKey: createPolicyKey("wan2-7-r2v", "720P"), modelId: "wan2.7-r2v", resolution: "720P", name: "万相 2.7 (图生视频) - 720P", description: "按秒计费", costPerSecond: 40, unit: "秒" },
  { policyKey: createPolicyKey("wan2-7-r2v", "1080P"), modelId: "wan2.7-r2v", resolution: "1080P", name: "万相 2.7 (图生视频) - 1080P", description: "按秒计费", costPerSecond: 60, unit: "秒" },
  { policyKey: createPolicyKey("wan2-7-t2v", "720P"), modelId: "wan2.7-t2v", resolution: "720P", name: "万相 2.7 (文生视频) - 720P", description: "按秒计费", costPerSecond: 40, unit: "秒" },
  { policyKey: createPolicyKey("wan2-7-t2v", "1080P"), modelId: "wan2.7-t2v", resolution: "1080P", name: "万相 2.7 (文生视频) - 1080P", description: "按秒计费", costPerSecond: 60, unit: "秒" },

  { policyKey: createPolicyKey("happyhorse-1-0-t2v", "720P"), modelId: "happyhorse-1.0-t2v", resolution: "720P", name: "HappyHorse (文生) - 720P", description: "按秒计费", costPerSecond: 35, unit: "秒" },
  { policyKey: createPolicyKey("happyhorse-1-0-t2v", "1080P"), modelId: "happyhorse-1.0-t2v", resolution: "1080P", name: "HappyHorse (文生) - 1080P", description: "按秒计费", costPerSecond: 55, unit: "秒" },
  { policyKey: createPolicyKey("happyhorse-1-0-i2v", "720P"), modelId: "happyhorse-1.0-i2v", resolution: "720P", name: "HappyHorse (图生) - 720P", description: "按秒计费", costPerSecond: 35, unit: "秒" },
  { policyKey: createPolicyKey("happyhorse-1-0-i2v", "1080P"), modelId: "happyhorse-1.0-i2v", resolution: "1080P", name: "HappyHorse (图生) - 1080P", description: "按秒计费", costPerSecond: 55, unit: "秒" },

  { policyKey: createPolicyKey("seedance-1-5-pro", "480P"), modelId: "seedance-1.5-pro", resolution: "480P", name: "Seedance 1.5 Pro - 480P", description: "按秒计费", costPerSecond: 30, unit: "秒" },
  { policyKey: createPolicyKey("seedance-1-5-pro", "720P"), modelId: "seedance-1.5-pro", resolution: "720P", name: "Seedance 1.5 Pro - 720P", description: "按秒计费", costPerSecond: 50, unit: "秒" },
  { policyKey: createPolicyKey("seedance-1-5-pro", "1080P"), modelId: "seedance-1.5-pro", resolution: "1080P", name: "Seedance 1.5 Pro - 1080P", description: "按秒计费", costPerSecond: 80, unit: "秒" },
];

export function getAllDefaultPolicies(): CreditPolicyEntry[] {
  const entries: CreditPolicyEntry[] = [];

  for (const rule of DEFAULT_IMAGE_CREDIT_RULES) {
    entries.push({
      key: rule.policyKey,
      name: rule.name,
      description: rule.description,
      cost: rule.cost,
      unit: rule.unit,
      category: "image",
      isActive: true,
    });
  }

  for (const rule of DEFAULT_VIDEO_CREDIT_RULES) {
    entries.push({
      key: rule.policyKey,
      name: rule.name,
      description: rule.description,
      cost: rule.costPerSecond,
      unit: rule.unit,
      category: "video",
      isActive: true,
    });
  }

  entries.push(
    { key: "outpaint-flash", name: "扩图-Flash", description: "Flash模型扩图", cost: 2, unit: "次", category: "outpaint", isActive: true },
    { key: "outpaint-pro", name: "扩图-Pro", description: "Pro模型扩图", cost: 2, unit: "次", category: "outpaint", isActive: true },
    { key: "outpaint-image2", name: "扩图-Image2", description: "GPT Image2模型扩图", cost: 60, unit: "次", category: "outpaint", isActive: true },
    { key: "architecture-flash", name: "进阶设计-Flash", description: "SU高清渲染/CAD转3D", cost: 3, unit: "次", category: "architecture", isActive: true },
    { key: "architecture-pro", name: "进阶设计-Pro", description: "SU高清渲染/CAD转3D", cost: 3, unit: "次", category: "architecture", isActive: true },
    { key: "edit-flash", name: "图片编辑-Flash", description: "局部重绘", cost: 1, unit: "次", category: "edit", isActive: true },
    { key: "edit-pro", name: "图片编辑-Pro", description: "局部重绘", cost: 3, unit: "次", category: "edit", isActive: true },
    { key: "edit-image2", name: "图片编辑-Image2", description: "GPT Image2局部重绘", cost: 60, unit: "次", category: "edit", isActive: true },
    { key: "workflow-image", name: "工作流-图片", description: "工作流图片节点", cost: 1, unit: "次", category: "workflow", isActive: true },
    { key: "automation-test", name: "自动化测试", description: "AI编排自动化测试", cost: 10, unit: "次", category: "other", isActive: true },
  );

  return entries;
}

export function getImageCost(modelId: ImageModelId, quality: ImageQuality): number {
  const rule = DEFAULT_IMAGE_CREDIT_RULES.find(r => r.modelId === modelId && r.quality === quality);
  return rule?.cost ?? 1;
}

export function getVideoCostPerSecond(modelId: VideoModelId, resolution: VideoResolution): number {
  const rule = DEFAULT_VIDEO_CREDIT_RULES.find(r => r.modelId === modelId && r.resolution === resolution);
  return rule?.costPerSecond ?? 50;
}

interface CachedPolicyMap {
  [key: string]: { cost: number; unit: string };
}

let cachedPolicyMap: CachedPolicyMap = {};
export function buildDefaultPolicyMap(): CachedPolicyMap {
  if (Object.keys(cachedPolicyMap).length > 0) return cachedPolicyMap;

  const map: CachedPolicyMap = {};
  for (const entry of getAllDefaultPolicies()) {
    map[entry.key] = { cost: entry.cost, unit: entry.unit };
  }
  cachedPolicyMap = map;
  return map;
}

export function clearDefaultPolicyCache(): void {
  cachedPolicyMap = {};
}