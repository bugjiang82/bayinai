import { GoogleGenAI } from "@google/genai";
import { ImageGenerationParams } from "../types";

export const generateImage = async (params: ImageGenerationParams) => {
  // Use user-selected API key if available, fallback to environment default
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const model = "gemini-3.1-flash-image-preview";
  
  const contents: any[] = [];
  
  // Structure Reference
  if (params.structureRef) {
    contents.push({
      inlineData: {
        data: params.structureRef.split(',')[1],
        mimeType: "image/png"
      },
      // Some GenAI versions support adding metadata to parts for specialized models
      // We'll follow the logical structure provided in the user's example
      metadata: {
        referenceType: "STRUCTURE",
        structureStrength: params.structureStrength
      }
    });
  }

  // Style Reference
  if (params.styleRef) {
    contents.push({
      inlineData: {
        data: params.styleRef.split(',')[1],
        mimeType: "image/png"
      },
      metadata: {
        referenceType: "STYLE",
        styleStrength: params.styleStrength
      }
    });
  }
  
  // Combine prompt and negative prompt
  let finalPrompt = params.prompt;
  const negParts = [...params.negativePrompt];
  if (params.customNegativePrompt) negParts.push(params.customNegativePrompt);
  
  if (negParts.length > 0) {
    finalPrompt += ` . Negative prompt: ${negParts.join(', ')}`;
  }
  
  contents.push({ text: finalPrompt });

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      // Model specific configs
      imageConfig: {
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize
      },
      tools: params.useGoogleSearch ? [
        {
          googleSearch: {
            searchTypes: {
              webSearch: {},
              imageSearch: params.useImageSearch ? {} : undefined
            }
          }
        }
      ] : undefined
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  let imageUrl = "";
  let textResult = "";

  for (const part of parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    } else if (part.text) {
      textResult += part.text;
    }
  }

  if (!imageUrl) {
    throw new Error("模型未返回图像数据。这可能是由于提示词触发了安全过滤，或参数设置超出了模型当前支持的范围。");
  }

  return {
    imageUrl,
    revisedPrompt: textResult || undefined
  };
};
