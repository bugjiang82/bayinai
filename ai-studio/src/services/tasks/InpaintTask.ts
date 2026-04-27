import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import fs from "fs";
import path from "path";
import type { GenType } from "@/types/generation";
import type { GenerateTaskParams, GenerateTaskResult } from "./GenerateService";
import { BaseGenerateService } from "./BaseGenerateService";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
};

const COST_MAP: Record<string, number> = {
  flash: 2,
  pro: 5,
};

export class InpaintTask extends BaseGenerateService {
  getType(): GenType {
    return "INPAINT";
  }

  getCost(model?: string): number {
    return COST_MAP[model || "flash"] || COST_MAP.flash;
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
    } = params;

    const modelName = MODEL_MAP[model] || MODEL_MAP.flash;
    const cost = this.getCost(model);
    const isProModel = modelName.includes("pro");

    // 创建生成记录
    const generation = await this.createGenerationRecord(userId, prompt, {
      model,
      imageSize,
      structureStrength,
      styleStrength,
      guidanceScale,
      aspectRatio,
    }, originalImage);

    try {
      // 构建专业的 Inpainting Prompt
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

      // 处理 negative prompt
      const negParts = [...negativePrompt];
      if (customNegativePrompt) negParts.push(customNegativePrompt);
      
      if (negParts.length > 0) {
        finalPrompt += ` . Negative prompt: ${negParts.join(', ')}`;
      }

      const contents: any[] = [];

      // 结构参考
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

      // 风格参考
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

      // 处理原图 - 支持 URL 路径和 base64 两种格式
      let originalBase64: string;
      if (originalImage.startsWith("/outputs/") || originalImage.startsWith("http")) {
        // URL 路径格式，需要获取文件内容
        const filePath = originalImage.startsWith("/outputs/")
          ? path.join(process.cwd(), "public", originalImage)
          : originalImage;
        try {
          const fileBuffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
          if (fileBuffer) {
            originalBase64 = fileBuffer.toString("base64");
          } else {
            // 尝试作为 URL 获取
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
        // data:image/png;base64,... 格式
        originalBase64 = originalImage.split(",")[1];
      } else {
        // 直接是 base64 字符串
        originalBase64 = originalImage;
      }

      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: originalBase64,
        },
      });

      // 添加 Mask 图
      const maskBase64 = maskImage.includes(",")
        ? maskImage.split(",")[1]
        : maskImage;
      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: maskBase64,
        },
      });

      // 添加 Prompt
      contents.push({ text: finalPrompt });

      // 调用 Gemini API
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

      // 解析响应
      let outputBase64: string | undefined;
      let hasImage = false;
      let actualMimeType = "image/png";

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
