import { describe, it, expect } from "vitest";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  IMAGE_MODEL_OPTIONS,
  IMAGE_QUALITY_OPTIONS,
  VIDEO_RESOLUTION_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  VIDEO_ASPECT_RATIO_OPTIONS,
  getImageModel,
  getImageModelApiName,
  isImageModelId,
  getVideoModel,
  getVideoModelOptions,
  getVideoModelResolutions,
  getVideoModelDurations,
  isVideoModelId,
} from "@/models";

describe("Image Model Registry", () => {
  it("should define 3 image models: flash, pro, image2", () => {
    const modelIds = Object.keys(IMAGE_MODELS);
    expect(modelIds).toHaveLength(3);
    expect(modelIds).toContain("flash");
    expect(modelIds).toContain("pro");
    expect(modelIds).toContain("image2");
  });

  it("flash model should support all 4 qualities", () => {
    const flash = IMAGE_MODELS.flash;
    expect(flash.supportedQualities).toEqual(["512", "1K", "2K", "4K"]);
    expect(flash.isFlashModel).toBe(true);
    expect(flash.isImage2Model).toBe(false);
  });

  it("pro model should support all 4 qualities", () => {
    const pro = IMAGE_MODELS.pro;
    expect(pro.supportedQualities).toEqual(["512", "1K", "2K", "4K"]);
    expect(pro.isProModel).toBe(true);
  });

  it("image2 model should support only 1K, 2K, 4K (no 512)", () => {
    const image2 = IMAGE_MODELS.image2;
    expect(image2.supportedQualities).toEqual(["1K", "2K", "4K"]);
    expect(image2.supportedQualities).not.toContain("512");
    expect(image2.isImage2Model).toBe(true);
  });

  it("getImageModel should return correct model by id", () => {
    expect(getImageModel("flash")?.name).toBe("Gemini Flash");
    expect(getImageModel("pro")?.name).toBe("Gemini Pro");
    expect(getImageModel("image2")?.name).toBe("GPT Image2");
    expect(getImageModel("nonexistent")).toBeUndefined();
  });

  it("getImageModelApiName should map to correct API names", () => {
    expect(getImageModelApiName("flash")).toBe("gemini-3.1-flash-image-preview");
    expect(getImageModelApiName("pro")).toBe("gemini-3-pro-image-preview");
    expect(getImageModelApiName("image2")).toBe("openai/gpt-5.4-image-2");
  });

  it("isImageModelId should correctly identify valid ids", () => {
    expect(isImageModelId("flash")).toBe(true);
    expect(isImageModelId("pro")).toBe(true);
    expect(isImageModelId("image2")).toBe(true);
    expect(isImageModelId("unknown")).toBe(false);
  });

  it("IMAGE_MODEL_OPTIONS should contain 3 entries", () => {
    expect(IMAGE_MODEL_OPTIONS).toHaveLength(3);
    expect(IMAGE_MODEL_OPTIONS[0]).toHaveProperty("value");
    expect(IMAGE_MODEL_OPTIONS[0]).toHaveProperty("label");
    expect(IMAGE_MODEL_OPTIONS[0]).toHaveProperty("description");
  });

  it("IMAGE_QUALITY_OPTIONS should contain 4 qualities", () => {
    expect(IMAGE_QUALITY_OPTIONS).toHaveLength(4);
    const values = IMAGE_QUALITY_OPTIONS.map(o => o.value);
    expect(values).toContain("512");
    expect(values).toContain("1K");
    expect(values).toContain("2K");
    expect(values).toContain("4K");
  });
});

describe("Video Model Registry", () => {
  it("should define all video models", () => {
    const modelIds = Object.keys(VIDEO_MODELS);
    expect(modelIds.length).toBeGreaterThanOrEqual(6);
    expect(modelIds).toContain("wan2.2-kf2v-flash");
    expect(modelIds).toContain("wan2.7-r2v");
    expect(modelIds).toContain("wan2.7-t2v");
    expect(modelIds).toContain("happyhorse-1.0-t2v");
    expect(modelIds).toContain("happyhorse-1.0-i2v");
  });

  it("wan2.2 should support 480P, 720P, 1080P", () => {
    const model = getVideoModel("wan2.2-kf2v-flash");
    expect(model?.supportedResolutions).toEqual(["480P", "720P", "1080P"]);
    expect(model?.supportedDurations).toEqual([3, 5, 10]);
    expect(model?.isWan22).toBe(true);
  });

  it("wan2.7-r2v should be image-to-video only", () => {
    const model = getVideoModel("wan2.7-r2v");
    expect(model?.supportsTextToVideo).toBe(false);
    expect(model?.supportsImageToVideo).toBe(true);
  });

  it("wan2.7-t2v should be text-to-video only", () => {
    const model = getVideoModel("wan2.7-t2v");
    expect(model?.supportsTextToVideo).toBe(true);
    expect(model?.supportsImageToVideo).toBe(false);
  });

  it("happyhorse should support both text and image to video", () => {
    const t2v = getVideoModel("happyhorse-1.0-t2v");
    const i2v = getVideoModel("happyhorse-1.0-i2v");
    expect(t2v?.supportsTextToVideo).toBe(true);
    expect(i2v?.supportsImageToVideo).toBe(true);
  });

  it("getVideoModelOptions should filter by mode", () => {
    const t2vOptions = getVideoModelOptions("text-to-video");
    expect(t2vOptions.length).toBeGreaterThan(0);
    t2vOptions.forEach(opt => {
      const model = getVideoModel(opt.value);
      expect(model?.supportsTextToVideo).toBe(true);
    });

    const i2vOptions = getVideoModelOptions("image-to-video");
    expect(i2vOptions.length).toBeGreaterThan(0);
    i2vOptions.forEach(opt => {
      const model = getVideoModel(opt.value);
      expect(model?.supportsImageToVideo).toBe(true);
    });
  });

  it("getVideoModelResolutions should return correct resolutions", () => {
    expect(getVideoModelResolutions("wan2.2-kf2v-flash")).toEqual(["480P", "720P", "1080P"]);
    expect(getVideoModelResolutions("nonexistent")).toEqual(["720P"]);
  });

  it("getVideoModelDurations should return correct durations", () => {
    expect(getVideoModelDurations("wan2.2-kf2v-flash")).toEqual([3, 5, 10]);
    expect(getVideoModelDurations("wan2.7-r2v")).toEqual([5, 10, 15]);
  });

  it("isVideoModelId should correctly identify valid ids", () => {
    expect(isVideoModelId("wan2.2-kf2v-flash")).toBe(true);
    expect(isVideoModelId("happyhorse-1.0-t2v")).toBe(true);
    expect(isVideoModelId("unknown-model")).toBe(false);
  });

  it("VIDEO_RESOLUTION_OPTIONS should have 3 entries", () => {
    expect(VIDEO_RESOLUTION_OPTIONS).toHaveLength(3);
  });

  it("VIDEO_DURATION_OPTIONS should have 4 entries", () => {
    expect(VIDEO_DURATION_OPTIONS).toHaveLength(4);
  });

  it("VIDEO_ASPECT_RATIO_OPTIONS should have 6 entries", () => {
    expect(VIDEO_ASPECT_RATIO_OPTIONS).toHaveLength(6);
  });
});