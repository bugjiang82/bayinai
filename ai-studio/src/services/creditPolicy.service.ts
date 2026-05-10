import prisma from "@/lib/prisma";

interface CreditPolicy {
  key: string;
  name: string;
  description: string | null;
  cost: number;
  unit: string;
  category: string;
  isActive: boolean;
}

interface DefaultPolicy {
  cost: number;
  unit: string;
}

const DEFAULT_POLICIES: Record<string, Omit<DefaultPolicy, "key"> & { key?: string }> = {
  "text-to-image-flash": { cost: 1, unit: "次" },
  "text-to-image-pro": { cost: 3, unit: "次" },
  "text-to-image-image2": { cost: 50, unit: "次" },
  "image-to-image-flash": { cost: 1, unit: "次" },
  "image-to-image-pro": { cost: 3, unit: "次" },
  "image-to-image-image2": { cost: 50, unit: "次" },
  "architecture-flash": { cost: 3, unit: "次" },
  "architecture-pro": { cost: 3, unit: "次" },
  "edit-flash": { cost: 1, unit: "次" },
  "edit-pro": { cost: 3, unit: "次" },
  "video-per-second": { cost: 50, unit: "秒" },
  "workflow-image": { cost: 1, unit: "次" },
  "automation-test": { cost: 10, unit: "次" },
};

let cachedPolicies: Map<string, CreditPolicy> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000;

export async function getCreditPolicies(): Promise<Map<string, CreditPolicy>> {
  const now = Date.now();

  if (cachedPolicies && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedPolicies;
  }

  try {
    const policies = await prisma.creditPolicy.findMany({
      where: { isActive: true },
    });

    cachedPolicies = new Map(policies.map((p) => [p.key, p]));
    cacheTimestamp = now;

    return cachedPolicies;
  } catch (error) {
    console.error("Failed to fetch credit policies from DB:", error);
    return new Map();
  }
}

export function getDefaultPolicy(key: string): DefaultPolicy {
  return DEFAULT_POLICIES[key] || { cost: 1, unit: "次" };
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

  return getDefaultPolicy(key).cost;
}

export async function getPolicyUnit(key: string): Promise<string> {
  const policies = await getCreditPolicies();
  const policy = policies.get(key);

  if (policy) {
    return policy.unit;
  }

  return getDefaultPolicy(key).unit;
}

export function getCostByModelAndType(
  type: "text-to-image" | "image-to-image" | "architecture" | "edit" | "video" | "automation-test" | "workflow-image",
  model?: string
): number {
  const modelKey = model || "flash";
  const policyKey = `${type}-${modelKey}`;

  if (DEFAULT_POLICIES[policyKey]) {
    return DEFAULT_POLICIES[policyKey].cost;
  }

  if (type === "video") {
    return 50;
  }

  return 1;
}

export async function getGenerationCost(
  type: "text-to-image" | "image-to-image" | "architecture" | "edit" | "video" | "automation-test" | "workflow-image",
  model?: string
): Promise<number> {
  const modelKey = model || "flash";
  const policyKey = `${type}-${modelKey}`;
  return await getPolicyCost(policyKey);
}

export async function getVideoCostPerSecond(): Promise<number> {
  return await getPolicyCost("video-per-second");
}

export { DEFAULT_POLICIES };
export type { CreditPolicy, DefaultPolicy };