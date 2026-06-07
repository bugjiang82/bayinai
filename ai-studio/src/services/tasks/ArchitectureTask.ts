import { ThinkingLevel } from "@google/genai";
import { getOpenAI, getGoogleGenAI } from "@/lib/ai-clients";
import logger from "@/lib/logger";
import type { GenType } from "@/types/generation";
import type { GenerateTaskParams, GenerateTaskResult } from "./GenerateService";
import { BaseGenerateService } from "./BaseGenerateService";
import { getGenerationCost } from "../creditPolicy.service";

const ai = getGoogleGenAI();

const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "gpt-image-2",
};

export class ArchitectureTask extends BaseGenerateService {
  getType(): GenType {
    return "ARCHITECTURE";
  }

  async execute(params: GenerateTaskParams): Promise<GenerateTaskResult> {
    const {
      userId,
      prompt,
      negativePrompt,
      model = "pro", // 建筑设计默认使用 pro 模型
      aspectRatio = "16:9", // 建筑设计默认使用宽屏比例
      imageSize = "2K", // 建筑设计默认使用更高分辨率
      thinkingLevel = ThinkingLevel.MINIMAL, // 建筑设计默认使用更详细的思考
      style = "modern",
      view = "exterior", // exterior, interior, aerial
      lighting = "daytime",
      materials = [],
      referenceImages = [],
    } = params;

    const modelName = MODEL_MAP[model] || MODEL_MAP.pro;
    const cost = await getGenerationCost("architecture", model);
    const isProModel = modelName.includes("pro");
    const isImage2Model = model === "image2";

    // 创建生成记录
    const generation = await this.createGenerationRecord(userId, prompt, {
      model,
      aspectRatio,
      imageSize,
      style,
      view,
      lighting,
      materials,
    }, undefined, cost);

    try {
      // 构建专业的建筑设计 Prompt
      let finalPrompt = `
You are an award-winning architect and 3D visualization expert.

Create a photorealistic architectural visualization based on the following requirements:

Project Description: ${prompt}

Design Parameters:
- Style: ${style}
- View: ${view}
- Lighting: ${lighting}
- Materials: ${materials.length > 0 ? materials.join(', ') : 'Default materials'}

Technical Requirements:
- Create a professional, photorealistic rendering
- Pay attention to scale, proportion, and architectural details
- Include appropriate surrounding context (landscape, furniture, etc.)
- Ensure realistic lighting and shadows
- Use high-quality textures and materials
`;

      if (negativePrompt) {
        finalPrompt += `

Avoid:
${negativePrompt}
`;
      }

      let outputBase64: string | undefined;
      let actualMimeType = "image/png";

      if (isImage2Model) {
        const openai = getOpenAI();

        const response = await openai.images.generate({
          model: "gpt-image-2",
          prompt: finalPrompt,
          size: "1024x1024",
          quality: "low",
        });

        for (const img of response.data || []) {
          if (img.b64_json) {
            outputBase64 = img.b64_json;
          }
        }

        if (!outputBase64) {
          throw new Error("Image2 未能生成图片");
        }
      } else {
        // Gemini 模型（flash / pro）
        const parts: any[] = [];

        // 添加参考图片
        for (const refImg of referenceImages) {
          const base64Data = refImg.includes(",")
            ? refImg.split(",")[1]
            : refImg;
          const mimeType = refImg.includes("data:")
            ? refImg.split(";").split(":")[1] || "image/png"
            : "image/png";
          
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }

        // 添加文本提示词
        parts.push({ text: finalPrompt });

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
      const { outputUrl, thumbnailUrl } = await this.saveImage(
        userId, 
        generation.id, 
        outputBase64!, 
        actualMimeType
      );

      // 扣除积分
      await this.deductUserCredits(userId, generation.id, cost, `建筑设计生成 (${model})`);

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
