import prisma from "@/lib/prisma";
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
    console.error("Failed to fetch credit policies from DB:", error);
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
  type: "text-to-image" | "image-to-image" | "architecture" | "edit" | "video" | "automation-test" | "workflow-image",
  model?: string
): Promise<number> {
  const modelKey = model || "flash";
  const policyKey = `${type}-${modelKey}`;

  try {
    const policies = await getCreditPolicies();
    const policy = Array.from(policies.values()).find(p => p.key === policyKey);
    if (policy) return policy.cost;

    if (type === "video") return 50;

    const defaultMap = buildDefaultPolicyMap();
    if (defaultMap[policyKey]) return defaultMap[policyKey].cost;
  } catch {
    // fallback
  }

  const compatModule = await import("./creditPolicyCompat");
  return compatModule.getCostByModelAndType(type, model);
}

export { getCostByModelAndType } from "./creditPolicyCompat";