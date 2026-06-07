import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import {
  getImageCost,
  getVideoCostPerSecond,
  buildDefaultPolicyMap,
  createPolicyKey,
} from "@/models";
import type {
  ImageModelId,
  ImageQuality,
  VideoModelId,
  VideoResolution,
  CreditPolicyEntry,
} from "@/models";

let cachedPolicies: Map<string, CreditPolicyEntry> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000;

export async function getCreditPolicies(): Promise<Map<string, CreditPolicyEntry>> {
  const now = Date.now();

  if (cachedPolicies && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedPolicies;
  }

  try {
    const policies = await prisma.creditPolicy.findMany({
      where: { isActive: true },
    });

    if (policies.length > 0) {
      cachedPolicies = new Map(policies.map((p) => [p.key, p]));
      cacheTimestamp = now;
      return cachedPolicies;
    }
  } catch (error) {
    logger.error("Failed to fetch credit policies from DB:", error);
  }

  const defaultMap = buildDefaultPolicyMap();
  cachedPolicies = new Map();
  for (const [key, value] of Object.entries(defaultMap)) {
    cachedPolicies.set(key, {
      key,
      name: key,
      description: null,
      cost: value.cost,
      unit: value.unit,
      category: "image",
      isActive: true,
    } as CreditPolicyEntry);
  }
  cacheTimestamp = now;
  return cachedPolicies;
}

export function invalidatePolicyCache(): void {
  cachedPolicies = null;
  cacheTimestamp = 0;
}

export async function getPolicyCost(key: string): Promise<number> {
  const policies = await getCreditPolicies();
  const policy = policies.get(key);

  if (policy) {
    return policy.cost;
  }

  const defaultMap = buildDefaultPolicyMap();
  return defaultMap[key]?.cost ?? 1;
}

export async function getImageGenerationCost(
  modelId: ImageModelId,
  quality: ImageQuality
): Promise<number> {
  const policyKey = createPolicyKey(modelId, quality);
  const dbCost = await getPolicyCost(policyKey);

  if (dbCost !== undefined && dbCost > 0) {
    return dbCost;
  }

  return getImageCost(modelId, quality);
}

export async function getVideoGenerationCostPerSecond(
  modelId: VideoModelId,
  resolution: VideoResolution
): Promise<number> {
  const policyKey = createPolicyKey(modelId, resolution);
  const dbCost = await getPolicyCost(policyKey);

  if (dbCost !== undefined && dbCost > 0) {
    return dbCost;
  }

  return getVideoCostPerSecond(modelId, resolution);
}

export async function getVideoGenerationTotalCost(
  modelId: VideoModelId,
  resolution: VideoResolution,
  duration: number
): Promise<number> {
  const costPerSecond = await getVideoGenerationCostPerSecond(modelId, resolution);
  return costPerSecond * duration;
}

export function getDefaultImageCost(modelId: ImageModelId, quality: ImageQuality): number {
  return getImageCost(modelId, quality);
}

export function getDefaultVideoCostPerSecond(modelId: VideoModelId, resolution: VideoResolution): number {
  return getVideoCostPerSecond(modelId, resolution);
}

export { DEFAULT_POLICIES } from "./creditPolicyCompat";
export type { CreditPolicyEntry };

export async function getGenerationCost(
  type: "text-to-image" | "image-to-image" | "architecture" | "edit" | "video" | "outpaint" | "automation-test" | "workflow-image",
  model?: string,
  qualityOrResolution?: string
): Promise<number> {
  const modelKey = (model || "flash").toLowerCase().replace(/\./g, "-");

  // 对于图片和视频类型，使用 createPolicyKey 格式以匹配数据库中的策略键
  let policyKey: string;
  if (type === "text-to-image" || type === "image-to-image") {
    const quality = qualityOrResolution || "1K";
    policyKey = createPolicyKey(modelKey, quality);
  } else if (type === "video") {
    const resolution = qualityOrResolution || "720P";
    policyKey = createPolicyKey(modelKey, resolution);
  } else {
    // outpaint, edit, architecture, workflow, automation-test 使用简单格式
    policyKey = `${type}-${modelKey}`;
  }

  try {
    const policies = await getCreditPolicies();
    const policy = Array.from(policies.values()).find(p => p.key === policyKey);
    if (policy) return policy.cost;

    // 降级：尝试简单格式匹配（兼容旧数据）
    const simpleKey = `${type}-${modelKey}`;
    const simplePolicy = Array.from(policies.values()).find(p => p.key === simpleKey);
    if (simplePolicy) return simplePolicy.cost;

    if (type === "video") return 50;

    const defaultMap = buildDefaultPolicyMap();
    if (defaultMap[policyKey]) return defaultMap[policyKey].cost;
    if (defaultMap[simpleKey]) return defaultMap[simpleKey].cost;
  } catch {
    // fallback
  }

  const compatModule = await import("./creditPolicyCompat");
  return compatModule.getCostByModelAndType(type, model);
}

export { getCostByModelAndType } from "./creditPolicyCompat";