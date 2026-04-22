import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import type { GenType, GenStatus } from "@/types/generation";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || "";
const DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";

const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
};

const COST_MAP: Record<string, number> = {
  flash: 1,
  pro: 3,
};

// ======================== 图片生成 ========================

export interface GenerateImageParams {
  userId: string;
  prompt: string;
  negativePrompt?: string;
  model?: "flash" | "pro";
  aspectRatio?: string;   // 默认 "1:1"
  imageSize?: string;     // 默认 "1K"
  thinkingLevel?: ThinkingLevel;
  referenceImage?: string;
  transformType?: string;
}

export interface GenerateImageResult {
  id: string;
  type: GenType;
  status: GenStatus;
  prompt: string;
  outputUrl?: string;
  outputBase64?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  cost: number;
  createdAt: string;
  completedAt?: string;
}

export async function generateImage(
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  const {
    userId,
    prompt,
    negativePrompt,
    model = "flash",
    aspectRatio = "1:1",
    imageSize = "1K",
    thinkingLevel = ThinkingLevel.MINIMAL,
    referenceImage,
    transformType,
  } = params;

  const modelName = MODEL_MAP[model] || MODEL_MAP.flash;
  const cost = COST_MAP[model] || COST_MAP.flash;
  const isProModel = modelName.includes("pro");

  // 检查积分
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("用户不存在");
  }
  if (user.credits < cost) {
    throw new Error("积分不足");
  }

  // 确定生成类型
  let genType: GenType = "TEXT_TO_IMAGE";
  if (referenceImage && transformType) {
    genType = "EDIT";
  } else if (referenceImage) {
    genType = "IMAGE_TO_IMAGE";
  }

  // 创建生成记录
  const generation = await prisma.generation.create({
    data: {
      userId,
      type: genType,
      status: "PROCESSING",
      prompt,
      negativePrompt,
      params: JSON.stringify({
        model,
        aspectRatio,
        imageSize,
        transformType,
      }),
      inputUrl: referenceImage || null,
      cost,
    },
  });

  try {
    // 构建请求内容
    let fullPrompt = prompt;
    if (negativePrompt) {
      fullPrompt += `\n\n避免以下内容: ${negativePrompt}`;
    }
    if (transformType) {
      fullPrompt += `\n\n编辑要求: ${transformType}`;
    }

    const contents: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string }; text?: string }
    > = [];

    if (referenceImage) {
      // 图生图 / 图片编辑
      const base64Data = referenceImage.includes(",")
        ? referenceImage.split(",")[1]
        : referenceImage;
      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      });
      contents.push({ text: fullPrompt });
    } else {
      // 文生图
      contents.push({ text: fullPrompt });
    }

    // 调用 Gemini API（与官方文档一致）
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio,
          imageSize,
        },
        // 仅 gemini-3.1-flash-image-preview 支持 thinkingConfig
        ...(!isProModel
          ? { thinkingConfig: { thinkingLevel } }
          : {}),
      },
    });

    // 解析响应
    const outputDir = path.join(process.cwd(), "public", "outputs", userId);
    fs.mkdirSync(outputDir, { recursive: true });

    const filename = `${generation.id}.png`;
    const filepath = path.join(outputDir, filename);

    let outputBase64: string | undefined;
    let outputMime: string | undefined;
    let hasImage = false;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(filepath, buffer);
        outputBase64 = part.inlineData.data;
        outputMime = part.inlineData.mimeType;
        hasImage = true;
      }
    }

    if (!hasImage) {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new Error("未能生成图片");
    }

    const outputUrl = `/outputs/${userId}/${filename}`;

    // 生成缩略图（256px 宽，降低带宽开销）
    let thumbnailUrl = outputUrl;
    try {
      const thumbFilename = `${generation.id}_thumb.jpg`;
      const thumbPath = path.join(outputDir, thumbFilename);
      await sharp(filepath).resize(256, 256, { fit: "inside" }).jpeg({ quality: 70 }).toFile(thumbPath);
      thumbnailUrl = `/outputs/${userId}/${thumbFilename}`;
    } catch {
      // 缩略图生成失败不影响主流程
    }

    // 扣除积分
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    });

    // 创建积分日志
    await prisma.creditLog.create({
      data: {
        userId,
        type: "GENERATE",
        amount: -cost,
        balance: user.credits - cost,
        remark: `图片生成 (${model})`,
        refId: generation.id,
      },
    });

    // 更新生成记录
    const now = new Date();
    const updatedGeneration = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "COMPLETED",
        outputUrl,
        thumbnailUrl,
        completedAt: now,
      },
    });

    return {
      id: updatedGeneration.id,
      type: updatedGeneration.type as GenType,
      status: updatedGeneration.status as GenStatus,
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
  } catch (err) {
    // 更新失败状态
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        errorMsg: err instanceof Error ? err.message : "生成失败",
      },
    });
    throw err;
  }
}

// ======================== 视频生成 ========================

export interface GenerateVideoParams {
  userId: string;
  prompt: string;
  mode: "text-to-video" | "image-to-video";
  firstFrame?: string;
  lastFrame?: string;
  resolution?: string;
  duration?: number;
  model?: string;
  promptExtend?: boolean;
  ratio?: string;
}

export interface GenerateVideoResult {
  taskId: string;
  videoId: string;
  message: string;
}

export async function generateVideo(
  params: GenerateVideoParams
): Promise<GenerateVideoResult> {
  const {
    userId,
    prompt,
    mode,
    firstFrame,
    lastFrame,
    resolution = "720P",
    duration = 5,
    model = "wan2.2-kf2v-flash",
    promptExtend = true,
    ratio = "16:9",
  } = params;

  if (!DASHSCOPE_API_KEY) {
    throw new Error("DashScope API Key 未配置");
  }

  const isWan27 = model.includes("wan2.7") || model.includes("wan27");
  const isTextToVideo = mode === "text-to-video";
  const isTextToVideoWan27 = isTextToVideo && isWan27;
  const apiEndpoint = isTextToVideoWan27
    ? "/services/aigc/video-generation/video-synthesis"
    : "/services/aigc/image2video/video-synthesis";

  const extractBase64 = (dataUrl: string): string => {
    if (dataUrl.includes(",")) {
      return dataUrl.split(",")[1];
    }
    return dataUrl;
  };

  let requestBody: Record<string, unknown>;

  if (isWan27) {
    if (isTextToVideo) {
      requestBody = {
        model,
        input: {
          prompt,
        },
        parameters: {
          resolution,
          ratio,
          duration,
          prompt_extend: promptExtend,
          watermark: false,
        },
      };
    } else {
      const firstFrameData = firstFrame ? `data:image/jpeg;base64,${extractBase64(firstFrame)}` : undefined;
      const lastFrameData = lastFrame ? `data:image/jpeg;base64,${extractBase64(lastFrame)}` : undefined;
      requestBody = {
        model,
        input: {
          prompt,
          media: [
            { type: "first_frame", url: firstFrameData },
            ...(lastFrameData ? [{ type: "last_frame", url: lastFrameData }] : []),
          ],
        },
        parameters: {
          resolution,
          duration,
          prompt_extend: promptExtend,
          watermark: false,
        },
      };
    }
  } else {
    if (isTextToVideo) {
      throw new Error("该模型不支持文生视频，请选择图生视频模式");
    }
    const firstFrameData = firstFrame ? `data:image/jpeg;base64,${extractBase64(firstFrame)}` : undefined;
    const lastFrameData = lastFrame ? `data:image/jpeg;base64,${extractBase64(lastFrame)}` : undefined;
    requestBody = {
      model,
      input: {
        prompt,
        first_frame_url: firstFrameData,
        ...(lastFrameData && { last_frame_url: lastFrameData }),
      },
      parameters: {
        async_mode: true,
        resolution,
        duration,
        prompt_extend: promptExtend,
        watermark: false,
      },
    };
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}${apiEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope API 调用失败: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const taskId = result.output?.task_id || result.request_id;

  if (!taskId) {
    throw new Error("未能获取视频生成任务 ID");
  }

  // 创建生成记录
  await prisma.generation.create({
    data: {
      userId,
      type: "TEXT_TO_VIDEO" as GenType,
      status: "PROCESSING",
      prompt,
      params: JSON.stringify({
        model,
        resolution,
        duration,
        taskId,
      }),
      inputUrl: firstFrame || null,
      cost: 0, // 视频生成积分逻辑后续补充
    },
  });

  return {
    taskId,
    videoId: taskId,
    message: "视频生成任务已提交",
  };
}

export async function getVideoStatus(
  taskId: string
): Promise<{ status: string; progress: number; videoUrl?: string }> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error("DashScope API Key 未配置");
  }

  const response = await fetch(
    `${DASHSCOPE_BASE_URL}/tasks/${taskId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `DashScope 状态查询失败: ${response.status} - ${errorText}`
    );
  }

  const result = await response.json();
  const output = result.output || {};
  const taskStatus = output.task_status || result.output?.task_status || "UNKNOWN";

  let progress = 0;
  if (taskStatus === "SUCCEEDED") {
    progress = 100;
  } else if (taskStatus === "FAILED") {
    progress = 0;
  } else if (taskStatus === "RUNNING" || taskStatus === "PENDING") {
    progress = 50; // DashScope 异步任务不提供精确进度
  }

  const videoUrl = output.video_url || output.videoUrl;

  return {
    status: taskStatus,
    progress,
    videoUrl,
  };
}

export async function updateVideoResult(
  taskId: string,
  videoUrl: string,
  userId: string
): Promise<void> {
  await prisma.generation.updateMany({
    where: {
      params: {
        contains: taskId,
      },
      userId,
    },
    data: {
      status: "COMPLETED",
      outputUrl: videoUrl,
    },
  });
}

// ======================== 历史记录 ========================

export interface HistoryFilters {
  type?: GenType;
  status?: GenStatus;
  page?: number;
  pageSize?: number;
}

export async function getHistory(
  userId: string,
  filters: HistoryFilters = {}
) {
  const { type, status, page = 1, pageSize = 20 } = filters;

  const where: Record<string, unknown> = { userId };
  if (type) where.type = type;
  if (status) where.status = status;

  const [list, total] = await Promise.all([
    prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        status: true,
        prompt: true,
        outputUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        cost: true,
        params: true,
        inputUrl: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.generation.count({ where }),
  ]);

  return {
    list: list.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      completedAt: item.completedAt?.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ======================== 图片局部重绘 (Inpainting) ========================

export interface InpaintParams {
  userId: string;
  originalImage: string;
  maskImage: string;
  prompt: string;
  model?: "flash" | "pro";
  imageSize?: string;
  thinkingLevel?: ThinkingLevel;
  // 新增参数，整合 nano-banana 功能
  structureRef?: string;
  styleRef?: string;
  structureStrength?: number;
  styleStrength?: number;
  guidanceScale?: number;
  negativePrompt?: string[];
  customNegativePrompt?: string;
  aspectRatio?: string;
  useGoogleSearch?: boolean;
  useImageSearch?: boolean;
}

export async function inpaintImage(
  params: InpaintParams
): Promise<GenerateImageResult> {
  const {
    userId,
    originalImage,
    maskImage,
    prompt,
    model = "flash",
    imageSize = "1K",
    thinkingLevel = ThinkingLevel.MINIMAL,
    // 新增参数
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
  const cost = COST_MAP[model] || COST_MAP.flash;
  const isProModel = modelName.includes("pro");

  // 检查积分
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("用户不存在");
  }
  if (user.credits < cost) {
    throw new Error("积分不足");
  }

  // 创建生成记录
  const generation = await prisma.generation.create({
    data: {
      userId,
      type: "INPAINT" as GenType,
      status: "PROCESSING",
      prompt,
      params: JSON.stringify({
        model,
        imageSize,
        structureStrength,
        styleStrength,
        guidanceScale,
        aspectRatio,
      }),
      inputUrl: originalImage.substring(0, 255), // 截断过长的 base64
      cost,
    },
  });

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

    // 添加原图
    const originalBase64 = originalImage.includes(",")
      ? originalImage.split(",")[1]
      : originalImage;
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
    const outputDir = path.join(process.cwd(), "public", "outputs", userId);
    fs.mkdirSync(outputDir, { recursive: true });

    const filename = `${generation.id}.png`;
    const filepath = path.join(outputDir, filename);

    let outputBase64: string | undefined;
    let hasImage = false;
    let revisedPrompt: string | undefined;

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(filepath, buffer);
        outputBase64 = part.inlineData.data;
        hasImage = true;
      } else if (part.text) {
        revisedPrompt = part.text;
      }
    }

    if (!hasImage) {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new Error("模型未返回图像数据。这可能是由于提示词触发了安全过滤，或参数设置超出了模型当前支持的范围。");
    }

    const outputUrl = `/outputs/${userId}/${filename}`;

    // 生成缩略图
    let thumbnailUrl = outputUrl;
    try {
      const thumbFilename = `${generation.id}_thumb.jpg`;
      const thumbPath = path.join(outputDir, thumbFilename);
      await sharp(filepath).resize(256, 256, { fit: "inside" }).jpeg({ quality: 70 }).toFile(thumbPath);
      thumbnailUrl = `/outputs/${userId}/${thumbFilename}`;
    } catch {
      // 缩略图生成失败不影响主流程
    }

    // 扣除积分
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    });

    // 创建积分日志
    await prisma.creditLog.create({
      data: {
        userId,
        type: "GENERATE",
        amount: -cost,
        balance: user.credits - cost,
        remark: `图片局部重绘 (${model})`,
        refId: generation.id,
      },
    });

    // 更新生成记录
    const now = new Date();
    const updatedGeneration = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "COMPLETED",
        outputUrl,
        thumbnailUrl,
        completedAt: now,
      },
    });

    return {
      id: updatedGeneration.id,
      type: updatedGeneration.type as GenType,
      status: updatedGeneration.status as GenStatus,
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
  } catch (err) {
    // 更新失败状态
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        errorMsg: err instanceof Error ? err.message : "生成失败",
      },
    });
    throw err;
  }
}
