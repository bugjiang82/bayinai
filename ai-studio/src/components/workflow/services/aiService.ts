import { toast } from "react-hot-toast";

// 模型名称映射
const MODEL_NAME_MAP: Record<string, string> = {
  "gemini-3-flash-preview": "Gemini 3 Flash",
  "gemini-2.5-flash-image": "Gemini 2.5 Flash Image",
  "gemini-3.1-flash-image-preview": "Gemini 3.1 Flash Image",
  "veo-3.1-lite-generate-preview": "Veo 3.1 Lite",
  "wan2.2-kf2v-flash": "Wanx 2.2",
};

// 简单的请求函数
async function request(endpoint: string, data: any = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log("API 响应:", result); // 调试日志

  // 检查 code: 0 表示成功，code: -1 或其他表示失败
  if (result.code !== 0) {
    throw new Error(result.message || result.error || "请求失败");
  }

  return result.data;
}

export async function generateText(prompt: string, imageBase64?: string) {
  try {
    const data = await request("/api/workflow/generate/text", {
      prompt,
      image_base64: imageBase64,
    });
    return data.text;
  } catch (error) {
    console.error("Text generation error:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, config: {
  aspectRatio?: string;
  quality?: string;
  baseImages?: string[];
  model?: string;
  cost?: number;
} = {}) {
  try {
    // 映射模型名称
    let model = "flash";
    if (config.model?.includes("3.1") || config.model?.includes("3,1")) {
      model = "flash"; // 都用flash模型
    } else if (config.model?.includes("pro")) {
      model = "pro";
    } else if (config.model?.includes("image2")) {
      model = "image2";
    }

    const data = await request("/api/workflow/generate/image", {
      prompt,
      aspect_ratio: config.aspectRatio,
      quality: config.quality === "512p" ? "512P" :
                config.quality === "hd" ? "2K" :
                config.quality === "4k" ? "4K" : "1K",
      model,
      reference_images: config.baseImages,
      cost: config.cost,
    });

    console.log("图片数据:", data); // 调试日志

    // 返回完整的base64数据URL
    let imageUrl = null;
    
    if (data.base64) {
      if (data.base64.startsWith("data:")) {
        imageUrl = data.base64;
      } else {
        imageUrl = `data:image/png;base64,${data.base64}`;
      }
    } else if (data.url) {
      imageUrl = data.url;
    }

    if (!imageUrl) {
      throw new Error("No image data returned from API");
    }

    console.log("最终图片URL:", imageUrl); // 调试日志
    return imageUrl;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}

export async function generateVideo(prompt: string, config: {
  aspectRatio?: string;
  resolution?: string;
  duration?: number;
  model?: string;
  referenceImage?: string;
  firstFrame?: string;
  lastFrame?: string;
  cost?: number;
} = {}) {
  try {
    const data = await request("/api/workflow/generate/video", {
      prompt,
      ratio: config.aspectRatio,
      resolution: config.resolution || "720P",
      duration: config.duration || 5,
      model: config.model || "wan2.2-kf2v-flash",
      reference_image: config.referenceImage,
      first_frame: config.firstFrame,
      last_frame: config.lastFrame,
      cost: config.cost,
    });

    return data;
  } catch (error) {
    console.error("Video generation error:", error);
    throw error;
  }
}

export async function checkVideoStatus(taskId: string) {
  try {
    const response = await fetch(`/api/workflow/video/status?task_id=${encodeURIComponent(taskId)}`);
    const result = await response.json();
    console.log("视频状态响应:", result); // 调试日志
    
    // 检查 code: 0 表示成功
    if (result.code !== 0) {
      throw new Error(result.message || result.error || "查询失败");
    }
    return result.data;
  } catch (error) {
    console.error("Video status check error:", error);
    throw error;
  }
}

export interface Message {
  role: "user" | "model" | "system";
  content: string;
}

export const assistantTools = []; // 简化助手工具定义

export async function chatWithAssistant(messages: Message[], context: string) {
  try {
    // 简单的助手聊天实现
    const lastMessage = messages[messages.length - 1];
    const response = await generateText(
      `你是一个AI工作流画布助手，当前画布上下文: ${context}\n\n用户: ${lastMessage.content}\n\n请给出有帮助的回复。`,
    );

    return {
      text: response,
      toolCalls: [],
    };
  } catch (error) {
    console.error("Assistant chat error:", error);
    throw error;
  }
}
