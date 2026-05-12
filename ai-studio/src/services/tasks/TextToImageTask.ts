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
  flash: 1,
  pro: 3,
  image2: 50,
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

export class TextToImageTask extends BaseGenerateService {
  getType(): GenType {
    return "TEXT_TO_IMAGE";
  }

  async execute(params: GenerateTaskParams): Promise<GenerateTaskResult> {
    const {
      userId,
      prompt,
      negativePrompt,
      model = "flash",
      aspectRatio = "1:1",
      imageSize = "1K",
      thinkingLevel = ThinkingLevel.MINIMAL,
      n = 1,
      quality = "low",
      thinking = "medium",
    } = params;

    const modelName = MODEL_MAP[model] || MODEL_MAP.flash;
    const isProModel = modelName.includes("pro");
    const isImage2Model = model === "image2";
    const generateCount = isImage2Model ? Math.max(1, Math.min(4, n)) : 1;
    const cost = await getGenerationCost("text-to-image", model) * generateCount;

    // 创建生成记录
    const generation = await this.createGenerationRecord(userId, prompt, {
      model,
      aspectRatio,
      imageSize,
    }, undefined, cost);

    try {
      // 构建请求内容
      let fullPrompt = prompt;
      if (negativePrompt) {
        fullPrompt += `\n\n避免以下内容: ${negativePrompt}`;
      }

      let outputBase64: string | undefined;
      let outputUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      let actualMimeType = "image/png";
      const outputImages: { base64?: string; url?: string }[] = [];

      if (isImage2Model) {
        const size = getImage2Size(aspectRatio);

        const imageParams: any = {
          model: modelName,
          prompt: fullPrompt,
          size,
          quality: quality as "low" | "medium" | "high",
          n: generateCount,
        };

        // 如果有参考图片，添加到请求中
        if (referenceImages && referenceImages.length > 0) {
          const firstRefImg = referenceImages[0];
          let imageUrl: string;
          
          if (firstRefImg.startsWith("/outputs/")) {
            // 本地文件路径
            const filePath = path.join(process.cwd(), "public", firstRefImg);
            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              imageUrl = `data:image/png;base64,${fileBuffer.toString("base64")}`;
            } else {
              throw new Error(`参考图片不存在: ${filePath}`);
            }
          } else if (firstRefImg.includes(",")) {
            // base64 data URL
            imageUrl = firstRefImg;
          } else {
            // 纯 base64 字符串
            imageUrl = `data:image/png;base64,${firstRefImg}`;
          }

          imageParams.image_url = {
            url: imageUrl,
          };
        }

        const response = await openai.images.generate(imageParams);

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
        // Gemini 模型（flash / pro）
        const parts = [{ text: fullPrompt }];
        const contents = [{ parts }];

        // Pro 模型不支持 Thinking Level，固定使用 MINIMAL
        const thinkingConfig = isProModel
          ? {}
          : { thinkingConfig: { thinkingLevel } };

        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseModalities: ["IMAGE", "TEXT"],
            imageConfig: {
              aspectRatio,
              imageSize,
            },
            ...thinkingConfig,
          },
        });

        let hasImage = false;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            outputBase64 = part.inlineData.data;
            actualMimeType = part.inlineData.mimeType || "image/png";
            hasImage = true;
          }
        }

        if (!hasImage) {
          const finishReason = response.candidates?.[0]?.finishReason;
          if (finishReason === "NO_IMAGE") {
            throw new Error("模型未能生成图片，请尝试使用更详细的提示词或不同的描述");
          }
          throw new Error("未能生成图片");
        }
      }

      // 保存图片
      const { outputUrl: savedOutputUrl, thumbnailUrl: savedThumbnailUrl } = await this.saveImage(
        userId, 
        generation.id, 
        outputBase64!, 
        actualMimeType
      );
      outputUrl = savedOutputUrl;
      thumbnailUrl = savedThumbnailUrl;

      // 扣除积分
      await this.deductUserCredits(userId, generation.id, cost, `图片生成 (${model})`);

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
