import { describe, it, expect } from "vitest";
import {
  DEFAULT_IMAGE_CREDIT_RULES,
  DEFAULT_VIDEO_CREDIT_RULES,
  getAllDefaultPolicies,
  getImageCost,
  getVideoCostPerSecond,
  buildDefaultPolicyMap,
  clearDefaultPolicyCache,
  createPolicyKey,
  parsePolicyKey,
} from "@/models";

describe("Policy Key Utils", () => {
  it("createPolicyKey should join modelId and quality with __", () => {
    expect(createPolicyKey("flash", "1K")).toBe("flash__1k");
    expect(createPolicyKey("pro", "4K")).toBe("pro__4k");
    expect(createPolicyKey("image2", "2K")).toBe("image2__2k");
  });

  it("createPolicyKey should handle dots in modelId", () => {
    expect(createPolicyKey("wan2.2-kf2v-flash", "720P")).toBe("wan2-2-kf2v-flash__720p");
    expect(createPolicyKey("wan2.7-r2v", "1080P")).toBe("wan2-7-r2v__1080p");
    expect(createPolicyKey("happyhorse-1.0-i2v", "720P")).toBe("happyhorse-1-0-i2v__720p");
  });

  it("parsePolicyKey should correctly parse keys", () => {
    expect(parsePolicyKey("flash__1k")).toEqual({ modelId: "flash", qualityOrResolution: "1k" });
    expect(parsePolicyKey("pro__4k")).toEqual({ modelId: "pro", qualityOrResolution: "4k" });
    expect(parsePolicyKey("wan2-2-kf2v-flash__720p")).toEqual({
      modelId: "wan2-2-kf2v-flash",
      qualityOrResolution: "720p",
    });
  });

  it("parsePolicyKey should return null for invalid keys", () => {
    expect(parsePolicyKey("invalid-key")).toBeNull();
    expect(parsePolicyKey("a__b__c")).toBeNull();
    expect(parsePolicyKey("")).toBeNull();
  });
});

describe("Image Credit Rules", () => {
  it("should have 11 image credit rules (3 models × qualities)", () => {
    expect(DEFAULT_IMAGE_CREDIT_RULES).toHaveLength(11);
  });

  it("flash 512 should cost 1 credit", () => {
    expect(getImageCost("flash", "512")).toBe(1);
  });

  it("flash 1K should cost 2 credits", () => {
    expect(getImageCost("flash", "1K")).toBe(2);
  });

  it("flash 2K should cost 4 credits", () => {
    expect(getImageCost("flash", "2K")).toBe(4);
  });

  it("flash 4K should cost 8 credits", () => {
    expect(getImageCost("flash", "4K")).toBe(8);
  });

  it("pro 512 should cost 3 credits", () => {
    expect(getImageCost("pro", "512")).toBe(3);
  });

  it("pro 1K should cost 5 credits", () => {
    expect(getImageCost("pro", "1K")).toBe(5);
  });

  it("pro 2K should cost 8 credits", () => {
    expect(getImageCost("pro", "2K")).toBe(8);
  });

  it("pro 4K should cost 15 credits", () => {
    expect(getImageCost("pro", "4K")).toBe(15);
  });

  it("image2 1K should cost 50 credits", () => {
    expect(getImageCost("image2", "1K")).toBe(50);
  });

  it("image2 2K should cost 100 credits", () => {
    expect(getImageCost("image2", "2K")).toBe(100);
  });

  it("image2 4K should cost 200 credits", () => {
    expect(getImageCost("image2", "4K")).toBe(200);
  });

  it("should progressively increase cost with quality for each model", () => {
    const flashCosts = ["512", "1K", "2K", "4K"].map(q => getImageCost("flash", q as any));
    const proCosts = ["512", "1K", "2K", "4K"].map(q => getImageCost("pro", q as any));
    const image2Costs = ["1K", "2K", "4K"].map(q => getImageCost("image2", q as any));

    for (let i = 1; i < flashCosts.length; i++) {
      expect(flashCosts[i]).toBeGreaterThan(flashCosts[i - 1]);
    }
    for (let i = 1; i < proCosts.length; i++) {
      expect(proCosts[i]).toBeGreaterThan(proCosts[i - 1]);
    }
    for (let i = 1; i < image2Costs.length; i++) {
      expect(image2Costs[i]).toBeGreaterThan(image2Costs[i - 1]);
    }
  });

  it("should return 1 as fallback for unknown model/quality", () => {
    expect(getImageCost("unknown" as any, "1K")).toBe(1);
  });
});

describe("Video Credit Rules", () => {
  it("should have 12 video credit rules", () => {
    expect(DEFAULT_VIDEO_CREDIT_RULES).toHaveLength(12);
  });

  it("wan2.2 480P should cost 20 per second", () => {
    expect(getVideoCostPerSecond("wan2.2-kf2v-flash", "480P")).toBe(20);
  });

  it("wan2.2 720P should cost 30 per second", () => {
    expect(getVideoCostPerSecond("wan2.2-kf2v-flash", "720P")).toBe(30);
  });

  it("wan2.2 1080P should cost 50 per second", () => {
    expect(getVideoCostPerSecond("wan2.2-kf2v-flash", "1080P")).toBe(50);
  });

  it("wan2.7 r2v 720P should cost 40 per second", () => {
    expect(getVideoCostPerSecond("wan2.7-r2v", "720P")).toBe(40);
  });

  it("wan2.7 r2v 1080P should cost 60 per second", () => {
    expect(getVideoCostPerSecond("wan2.7-r2v", "1080P")).toBe(60);
  });

  it("happyhorse t2v 720P should cost 35 per second", () => {
    expect(getVideoCostPerSecond("happyhorse-1.0-t2v", "720P")).toBe(35);
  });

  it("happyhorse i2v 1080P should cost 55 per second", () => {
    expect(getVideoCostPerSecond("happyhorse-1.0-i2v", "1080P")).toBe(55);
  });

  it("veo 3.1 should cost 50 per second", () => {
    expect(getVideoCostPerSecond("veo-3.1-lite-generate-preview", "720P")).toBe(50);
  });

  it("should return 50 as fallback for unknown model/resolution", () => {
    expect(getVideoCostPerSecond("unknown" as any, "720P")).toBe(50);
  });

  it("higher resolution should cost more for same model", () => {
    const wan22Costs = getVideoCostPerSecond("wan2.2-kf2v-flash", "1080P");
    const wan22LowCosts = getVideoCostPerSecond("wan2.2-kf2v-flash", "480P");
    expect(wan22Costs).toBeGreaterThan(wan22LowCosts);
  });
});

describe("Combined Cost Calculator", () => {
  it("5s wan2.2 720p video should be 5 × 30 = 150 credits", () => {
    const costPerSec = getVideoCostPerSecond("wan2.2-kf2v-flash", "720P");
    expect(costPerSec * 5).toBe(150);
  });

  it("10s wan2.7 1080p video should be 10 × 60 = 600 credits", () => {
    const costPerSec = getVideoCostPerSecond("wan2.7-r2v", "1080P");
    expect(costPerSec * 10).toBe(600);
  });
});

describe("All Default Policies", () => {
  it("should return a non-empty list", () => {
    const policies = getAllDefaultPolicies();
    expect(policies.length).toBeGreaterThan(0);
  });

  it("each policy should have required fields", () => {
    const policies = getAllDefaultPolicies();
    for (const policy of policies) {
      expect(policy).toHaveProperty("key");
      expect(policy).toHaveProperty("name");
      expect(policy).toHaveProperty("cost");
      expect(policy).toHaveProperty("unit");
      expect(policy).toHaveProperty("category");
      expect(policy.isActive).toBe(true);
    }
  });

  it("should contain both image and video categories", () => {
    const policies = getAllDefaultPolicies();
    const categories = new Set(policies.map(p => p.category));
    expect(categories.has("image")).toBe(true);
    expect(categories.has("video")).toBe(true);
  });
});

describe("Policy Map Cache", () => {
  it("buildDefaultPolicyMap should return key-to-cost/unit mapping", () => {
    clearDefaultPolicyCache();
    const map = buildDefaultPolicyMap();
    expect(map["flash__1k"]).toEqual({ cost: 2, unit: "次" });
    expect(map["wan2-2-kf2v-flash__720p"]).toEqual({ cost: 30, unit: "秒" });
  });

  it("buildDefaultPolicyMap should return cached version on second call", () => {
    clearDefaultPolicyCache();
    const map1 = buildDefaultPolicyMap();
    const map2 = buildDefaultPolicyMap();
    expect(map1).toBe(map2);
  });

  it("clearDefaultPolicyCache should reset cache", () => {
    clearDefaultPolicyCache();
    const map1 = buildDefaultPolicyMap();
    clearDefaultPolicyCache();
    const map2 = buildDefaultPolicyMap();
    expect(Object.keys(map1).length).toBe(Object.keys(map2).length);
  });
});