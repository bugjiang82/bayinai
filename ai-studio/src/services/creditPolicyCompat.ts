import { buildDefaultPolicyMap } from "@/models";

export const DEFAULT_POLICIES: Record<string, { cost: number; unit: string }> = (() => {
  const map = buildDefaultPolicyMap();
  const compatMap: Record<string, { cost: number; unit: string }> = {};

  for (const [key, value] of Object.entries(map)) {
    compatMap[key] = { cost: value.cost, unit: value.unit };
  }

  compatMap["text-to-image-flash"] = { cost: 1, unit: "次" };
  compatMap["text-to-image-pro"] = { cost: 3, unit: "次" };
  compatMap["text-to-image-image2"] = { cost: 50, unit: "次" };
  compatMap["image-to-image-flash"] = { cost: 1, unit: "次" };
  compatMap["image-to-image-pro"] = { cost: 3, unit: "次" };
  compatMap["image-to-image-image2"] = { cost: 50, unit: "次" };
  compatMap["outpaint-flash"] = { cost: 2, unit: "次" };
  compatMap["outpaint-pro"] = { cost: 2, unit: "次" };
  compatMap["outpaint-image2"] = { cost: 60, unit: "次" };
  compatMap["architecture-flash"] = { cost: 3, unit: "次" };
  compatMap["architecture-pro"] = { cost: 3, unit: "次" };
  compatMap["edit-flash"] = { cost: 1, unit: "次" };
  compatMap["edit-pro"] = { cost: 3, unit: "次" };
  compatMap["edit-image2"] = { cost: 60, unit: "次" };
  compatMap["video-per-second"] = { cost: 50, unit: "秒" };
  compatMap["workflow-image"] = { cost: 1, unit: "次" };
  compatMap["automation-test"] = { cost: 10, unit: "次" };

  return compatMap;
})();

export function getCostByModelAndType(
  type: "text-to-image" | "image-to-image" | "architecture" | "edit" | "video" | "outpaint" | "automation-test" | "workflow-image",
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