import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import type { GenType } from "@/types/generation";
import type { GenerateTaskParams, GenerateTaskResult } from "./GenerateService";
import { BaseGenerateService } from "./BaseGenerateService";
import { getGenerationCost } from "../creditPolicy.service";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI || "",
  timeout: 600 * 1000,
  maxRetries: 2,
});

const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "gpt-image-2",
};

const COST_MAP: Record<string, number> = {
  flash: 2,
  pro: 5,
  image2: 60,
};

function getImage2Size(aspectRatio: string): string {
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3": "1024x1024",
    "3:4": "1024x1024",
    "3:2": "1024x1024",
    "2:3": "1024x1024",
    "21:9": "1792x1024",
  };
  return sizeMap[aspectRatio] || "1024x1024";
}

export class InpaintTask extends BaseGenerateService {
  getType(): GenType {
    return "INPAINT";
  }

  async execute(params: GenerateTaskParams): Promise<GenerateTaskResult> {
    const {
      userId,
      prompt,
      originalImage,
      maskImage,
      model = "flash",
      imageSize = "1K",
      thinkingLevel = ThinkingLevel.MINIMAL,
      structureRef,
      styleRef,
      structureStrength = 0.9,
      styleStrength = 0.6,
      guidanceScale = 7.5,
      negativePrompt = [],
      customNegativePrompt,
      aspectRatio = "1:1",
      useGoogleSearch = false,
      useImageSearch = false,
      n = 1,
      quality = "low",
      thinking = "medium",
      referenceImages = [],
    } = params;

    const modelName = MODEL_MAP[model] || MODEL_MAP.flash;
    const isProModel = modelName.includes("pro");
    const isImage2Model = model === "image2";
    const generateCount = isImage2Model ? Math.max(1, Math.min(4, n)) : 1;
    const cost = await getGenerationCost("edit", model) * generateCount;

    // 创建生成记录
    const generation = await this.createGenerationRecord(userId, prompt, {
      model,
      imageSize,
      structureStrength,
      styleStrength,
      guidanceScale,
      aspectRatio,
    }, originalImage, cost);

    try {
      let finalPrompt = `
You are an expert image editor.

Image 1: Original image
Image 2: Binary mask where WHITE area indicates the specific region to modify.

Instructions:
- Keep everything in BLACK area of the mask EXACTLY the same as original image.
- Only modify the WHITE mask area.
- Inpaint the WHITE area with the following content: ${prompt}
- Make the result seamless and photorealistic, matching the surrounding style, lighting, and perspective.
`;

      const negParts = [...negativePrompt];
      if (customNegativePrompt) negParts.push(customNegativePrompt);
      if (negParts.length > 0) {
        finalPrompt += ` . Negative prompt: ${negParts.join(', ')}`;
      }

      const outputImages: { base64?: string; url?: string }[] = [];
      let outputBase64: string | undefined;
      let actualMimeType = "image/png";

      if (isImage2Model) {
        let originalBuffer: Buffer;
        if (originalImage.startsWith("/outputs/") || originalImage.startsWith("http")) {
          const filePath = originalImage.startsWith("/outputs/")
            ? path.join(process.cwd(), "public", originalImage)
            : originalImage;
          if (fs.existsSync(filePath)) {
            originalBuffer = fs.readFileSync(filePath);
          } else {
            const response = await fetch(originalImage);
            const arrayBuffer = await response.arrayBuffer();
            originalBuffer = Buffer.from(arrayBuffer);
          }
        } else if (originalImage.includes(",")) {
          const base64Data = originalImage.split(",")[1];
          originalBuffer = Buffer.from(base64Data, "base64");
        } else {
          originalBuffer = Buffer.from(originalImage, "base64");
        }

        let maskBuffer: Buffer | undefined;
        if (maskImage) {
          if (maskImage.includes(",")) {
            maskBuffer = Buffer.from(maskImage.split(",")[1], "base64");
          } else {
            maskBuffer = Buffer.from(maskImage, "base64");
          }
        }

        const imageBuffers: { image: Buffer }[] = [];
        for (const refImg of referenceImages) {
          let refBuffer: Buffer;
          if (refImg.includes(",")) {
            refBuffer = Buffer.from(refImg.split(",")[1], "base64");
          } else if (refImg.startsWith("/outputs/") || refImg.startsWith("http")) {
            const filePath = refImg.startsWith("/outputs/")
              ? path.join(process.cwd(), "public", refImg)
              : refImg;
            if (fs.existsSync(filePath)) {
              refBuffer = fs.readFileSync(filePath);
            } else {
              const response = await fetch(refImg);
              const arrayBuffer = await response.arrayBuffer();
              refBuffer = Buffer.from(arrayBuffer);
            }
          } else {
            refBuffer = Buffer.from(refImg, "base64");
          }
          imageBuffers.push({ image: refBuffer });
        }

        const response = await openai.images.edit({
          model: modelName,
          image: originalBuffer,
          mask: maskBuffer,
          images: imageBuffers.length > 0 ? imageBuffers : undefined,
          prompt: finalPrompt,
          size: getImage2Size(aspectRatio),
          quality: quality as "low" | "medium" | "high",
          n: generateCount,
          thinking: thinking as "off" | "low" | "medium" | "high",
        });

        for (const img of response.data) {
          if (img.b64_json) {
            outputImages.push({ base64: img.b64_json });
          } else if (img.url) {
            outputImages.push({ url: img.url });
          }
        }

        if (outputImages.length === 0) {
          throw new Error("Image2 未能生成图片");
        }

        if (outputImages[0].base64) {
          outputBase64 = outputImages[0].base64;
        }
      } else {
        const contents: any[] = [];

        if (structureRef) {
          contents.push({
            inlineData: {
              data: structureRef.includes(',') ? structureRef.split(',')[1] : structureRef,
              mimeType: "image/png"
            },
            metadata: {
              referenceType: "STRUCTURE",
              structureStrength: structureStrength
            }
          });
        }

        if (styleRef) {
          contents.push({
            inlineData: {
              data: styleRef.includes(',') ? styleRef.split(',')[1] : styleRef,
              mimeType: "image/png"
            },
            metadata: {
              referenceType: "STYLE",
              styleStrength: styleStrength
            }
          });
        }

        let originalBase64: string;
        if (originalImage.startsWith("/outputs/") || originalImage.startsWith("http")) {
          const filePath = originalImage.startsWith("/outputs/")
            ? path.join(process.cwd(), "public", originalImage)
            : originalImage;
          try {
            const fileBuffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
            if (fileBuffer) {
              originalBase64 = fileBuffer.toString("base64");
            } else {
              const response = await fetch(originalImage);
              if (!response.ok) {
                throw new Error(`无法读取原始图片: ${response.status}`);
              }
              const arrayBuffer = await response.arrayBuffer();
              originalBase64 = Buffer.from(arrayBuffer).toString("base64");
            }
          } catch {
            throw new Error("无法读取原始图片文件，请确保图片存在且可访问");
          }
        } else if (originalImage.includes(",")) {
          originalBase64 = originalImage.split(",")[1];
        } else {
          originalBase64 = originalImage;
        }

        contents.push({
          inlineData: {
            mimeType: "image/png",
            data: originalBase64,
          },
        });

        const maskBase64 = maskImage.includes(",")
          ? maskImage.split(",")[1]
          : maskImage;
        contents.push({
          inlineData: {
            mimeType: "image/png",
            data: maskBase64,
          },
        });

        contents.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: contents },
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              imageSize,
              aspectRatio,
            },
            tools: useGoogleSearch ? [
              {
                googleSearch: {
                  searchTypes: {
                    webSearch: {},
                    imageSearch: useImageSearch ? {} : undefined
                  }
                }
              }
            ] : undefined,
            ...(!isProModel
              ? { thinkingConfig: { thinkingLevel } }
              : {}),
          },
        });

        let hasImage = false;

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            outputBase64 = part.inlineData.data;
            actualMimeType = part.inlineData.mimeType || "image/png";
            hasImage = true;
          }
        }

        if (!hasImage) {
          const finishReason = response.candidates?.[0]?.finishReason;
          if (finishReason === "NO_IMAGE") {
            throw new Error("局部重绘未能生成图片，请尝试使用更详细的提示词");
          }
          throw new Error("模型未返回图像数据。这可能是由于提示词触发了安全过滤，或参数设置超出了模型当前支持的范围。");
        }
      }

      // 保存图片
      const { outputUrl, thumbnailUrl } = await this.saveImage(
        userId, 
        generation.id, 
        outputBase64!, 
        actualMimeType
      );

      // 扣除积分
      await this.deductUserCredits(userId, generation.id, cost, `图片局部重绘 (${model})`);

      // 更新生成记录
      const updatedGeneration = await this.updateGenerationStatus(generation.id, "COMPLETED", {
        outputUrl,
        thumbnailUrl,
      });

      return {
        id: updatedGeneration.id,
        type: updatedGeneration.type as GenType,
        status: updatedGeneration.status,
        prompt: updatedGeneration.prompt,
        outputUrl: updatedGeneration.outputUrl || undefined,
        outputBase64,
        thumbnailUrl: updatedGeneration.thumbnailUrl || undefined,
        width: updatedGeneration.width || undefined,
        height: updatedGeneration.height || undefined,
        cost: updatedGeneration.cost,
        createdAt: updatedGeneration.createdAt.toISOString(),
        completedAt: updatedGeneration.completedAt?.toISOString(),
      };
    } catch (error) {
      await this.handleError(generation.id, error);
      throw error;
    }
  }
}
