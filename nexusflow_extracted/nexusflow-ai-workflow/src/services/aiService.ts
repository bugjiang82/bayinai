import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const MODELS = {
  TEXT: 'gemini-3-flash-preview',
  IMAGE: 'gemini-2.5-flash-image',
  IMAGE_HQ: 'gemini-3.1-flash-image-preview',
  VIDEO: 'veo-3.1-lite-generate-preview',
};

export async function generateText(prompt: string, imageBase64?: string) {
  try {
    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
    
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      contents[0].parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: contents,
    });
    return response.text;
  } catch (error) {
    console.error("Text Generation Error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, config: { aspectRatio?: string; quality?: string; baseImage?: string } = {}) {
  try {
    const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
    
    if (config.baseImage) {
      const base64Data = config.baseImage.split(',')[1] || config.baseImage;
      contents[0].parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: config.quality === 'hd' ? MODELS.IMAGE_HQ : MODELS.IMAGE,
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: (config.aspectRatio || "1:1") as any,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

export async function generateVideo(prompt: string, config: { aspectRatio?: string; resolution?: string } = {}) {
  // Video generation is a long-running operation.
  // In a real app we'd pool or use webhooks, but here we simulate the start.
  try {
    const operation = await ai.models.generateVideos({
      model: MODELS.VIDEO,
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: (config.resolution || '720p') as any,
        aspectRatio: (config.aspectRatio || '16:9') as any,
      },
    });

    // For this app, we'll wait for the operation if it's quick, or return the op ID
    // In many environments we just poll.
    return operation;
  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
}
