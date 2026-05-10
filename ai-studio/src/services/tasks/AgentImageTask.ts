import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { GenType } from "@/types/generation";
import type { GenerateTaskParams, GenerateTaskResult } from "./GenerateService";
import { BaseGenerateService } from "./BaseGenerateService";
import { getGenerationCost } from "../creditPolicy.service";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "openai/gpt-5.4-image-2",
};

export class AgentImageTask extends BaseGenerateService {
  getType(): GenType {
    return "AGENT_IMAGE";
  }

  async execute(params: GenerateTaskParams): Promise<GenerateTaskResult> {
    const {
      userId,
      prompt,
      negativePrompt,
      model = "pro", // 代理任务默认使用 pro 模型
      aspectRatio = "1:1",
      imageSize = "1K",
      thinkingLevel = ThinkingLevel.MINIMAL, // 代理任务默认使用更详细的思考
      agentId,
      agentType,
      context = [],
      referenceImages = [],
    } = params;

    const modelName = MODEL_MAP[model] || MODEL_MAP.pro;
    const cost = await getGenerationCost("text-to-image", model);
    const isProModel = modelName.includes("pro");
    const isImage2Model = model === "image2";

    // 创建生成记录
    const generation = await this.createGenerationRecord(userId, prompt, {
      model,
      aspectRatio,
      imageSize,
      agentId,
      agentType,
    }, undefined, cost);

    try {
      // 构建代理相关的 Prompt
      let finalPrompt = `
You are an AI assistant specialized in generating images based on agent interactions.

Agent Context:
${context.length > 0 ? context.map((item: any) => `- ${item}`).join('\n') : 'No specific context provided'}

Agent Type: ${agentType || 'General'}

Generate an image that best represents the following request:
${prompt}
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
        // Image2 模型使用 OpenRouter API
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
        if (!OPENROUTER_API_KEY) {
          throw new Error("OpenRouter API Key 未配置");
        }

        const contentParts: any[] = [];

        // 添加参考图片
        for (const refImg of referenceImages) {
          let imageBase64: string;
          
          if (refImg.includes(",")) {
            // 已经是 base64 data URL 格式
            imageBase64 = refImg;
          } else {
            // 纯 base64 字符串
            imageBase64 = `data:image/png;base64,${refImg}`;
          }

          contentParts.push({
            type: "image_url",
            image_url: {
              url: imageBase64,
            },
          });
        }

        // 添加文本提示词
        contentParts.push({
          type: "text",
          text: finalPrompt,
        });

        const requestBody = {
          model: modelName,
          messages: [
            {
              role: "user",
              content: contentParts,
            },
          ],
          modalities: ["image", "text"],
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;

        // 解析返回的图片数据
        if (message?.images) {
          for (const img of message.images) {
            const imageUrlObj = img.image_url;
            if (imageUrlObj?.url) {
              const imageData = imageUrlObj.url;
              const mimeMatch = imageData.match(/data:image\/([^;]+)/);
              actualMimeType = mimeMatch ? mimeMatch[1] : "png";
              const base64Part = imageData.split(",")[1];
              outputBase64 = base64Part;
            }
          }
        } else if (message?.content) {
          const contentArray = Array.isArray(message.content) ? message.content : [message.content];
          for (const contentItem of contentArray) {
            if (contentItem?.type === "image_url" && contentItem.image_url?.url) {
              const imageData = contentItem.image_url.url;
              const mimeMatch = imageData.match(/data:image\/([^;]+)/);
              actualMimeType = mimeMatch ? mimeMatch[1] : "png";
              const base64Part = imageData.split(",")[1];
              outputBase64 = base64Part;
            }
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
      await this.deductUserCredits(userId, generation.id, cost, `代理图像生成 (${model})`);

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
