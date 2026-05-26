import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import type { GenType, GenStatus } from "@/types/generation";
import { TaskFactory } from "./tasks";
import { deductCredits } from "./credit.service";
import * as fileService from "./file.service";
import {
  getImageGenerationCost,
  getVideoGenerationCostPerSecond,
  getDefaultImageCost,
} from "./creditPolicy.service";
import {
  getImageModelApiName,
  isImageModelId,
  getVideoModel,
  type ImageModelId,
  type ImageQuality,
  type VideoModelId,
  type VideoResolution,
} from "@/models";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || "";
const DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";

// ======================== 图片生成 ========================

export interface GenerateImageParams {
  userId: string;
  prompt: string;
  negativePrompt?: string;
  model?: "flash" | "pro" | "image2";
  aspectRatio?: string;   // 默认 "1:1"
  imageSize?: string;     // 默认 "1K"
  thinkingLevel?: ThinkingLevel;
  referenceImage?: string; // 兼容旧版
  referenceImages?: string[]; // 新版支持多张参考图片
  transformType?: string;
  cost?: number;
  n?: number;
  quality?: "low" | "medium" | "high";
  thinking?: "off" | "low" | "medium" | "high";
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
    referenceImages,
    transformType,
    cost: costParam,
  } = params;

  // 兼容新旧传参方式
  const refImages = referenceImages || (referenceImage ? [referenceImage] : []);

  // 确定生成类型
  let genType: GenType = "TEXT_TO_IMAGE";
  if (refImages.length > 0 && transformType) {
    genType = "EDIT";
  } else if (refImages.length > 0) {
    genType = "IMAGE_TO_IMAGE";
  }

  // 使用新的任务处理架构
  try {
    // 对于支持的任务类型，使用 TaskFactory
    if (TaskFactory.isTaskTypeSupported(genType)) {
      const task = TaskFactory.createTask(genType);
      const result = await task.execute({
        userId,
        prompt,
        negativePrompt,
        model,
        aspectRatio,
        imageSize,
        thinkingLevel,
        referenceImages: refImages,
        transformType,
        n: params.n,
        quality: params.quality,
        thinking: params.thinking,
      });
      return result as GenerateImageResult;
    } else {
      // 对于不支持的任务类型，使用旧的实现
      // 这里保留旧的实现以保持向后兼容性
      const modelId = (isImageModelId(model) ? model : "flash") as ImageModelId;
      const quality = (imageSize as ImageQuality) || "1K";
      const modelName = getImageModelApiName(modelId);
      const cost = await getImageGenerationCost(modelId, quality);
      const isProModel = modelId === "pro";
      const isImage2Model = modelId === "image2";

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
          inputUrl: refImages.length > 0 ? refImages[0] : null,
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

        // 输出目录
        const outputDir = path.join(process.cwd(), "public", "outputs", userId);
        fs.mkdirSync(outputDir, { recursive: true });
        let filename = `${generation.id}.png`;
        let filepath = path.join(outputDir, filename);

        let outputBase64: string | undefined;
        let outputUrl: string | undefined;
        let thumbUrl: string | undefined;

        if (isImage2Model) {
          // Image2 模型使用 OpenAI SDK
          try {
            const openai = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI || "",
              timeout: 600 * 1000,
              maxRetries: 2,
            });

            const imageParams: any = {
              model: "gpt-image-2",
              prompt: fullPrompt,
              size: "1024x1024",
              quality: "low",
              n: params.n || 1,
            };

            // 如果有参考图片，添加到请求中
            if (refImages.length > 0) {
              const firstRefImg = refImages[0];
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

            for (const img of response.data || []) {
              if (img.b64_json) {
                outputBase64 = img.b64_json;
                const imageBytes = Buffer.from(outputBase64, "base64");
                const actualFilename = `${generation.id}.png`;
                const actualFilepath = path.join(outputDir, actualFilename);
                fs.writeFileSync(actualFilepath, imageBytes);
                filename = actualFilename;
                filepath = actualFilepath;
              }
            }

            if (!outputBase64) {
              throw new Error("Image2 未能生成图片");
            }

            outputUrl = `/outputs/${userId}/${filename}`;
          } catch (apiError) {
            throw new Error(`Image2 API 调用失败: ${apiError instanceof Error ? apiError.message : "未知错误"}`);
          }
        } else {
          // Gemini 模型（flash / pro）
          // 构建 contents：多图 Part + 文字 Part
          const parts: any[] = [];

          // 1. 添加所有参考图片
          if (refImages.length > 0) {
            for (const refImg of refImages) {
              const base64Data = refImg.includes(",")
                ? refImg.split(",")[1]
                : refImg;
              const mimeType = refImg.includes("data:")
                ? refImg.split(";")[0].split(":")[1] || "image/png"
                : "image/png";
              
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            }
            // 2. 添加文字提示词（在所有图片之后）
            parts.push({ text: fullPrompt });
          } else {
            // 文生图模式：只有文字提示词
            parts.push({ text: fullPrompt });
          }

          // 构建 contents 结构
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
          let actualMimeType = "image/png";
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

          const ext = actualMimeType.split("/")[1] || "png";
          filename = `${generation.id}.${ext}`;
          filepath = path.join(outputDir, filename);
          fs.writeFileSync(filepath, Buffer.from(outputBase64!, "base64"));
          outputUrl = `/outputs/${userId}/${filename}`;
        }

        // 生成缩略图（256px 宽，降低带宽开销）
        thumbUrl = outputUrl;
        try {
          const thumbFilename = `${generation.id}_thumb.jpg`;
          const thumbPath = path.join(outputDir, thumbFilename);
          await sharp(filepath).resize(256, 256, { fit: "inside" }).jpeg({ quality: 70 }).toFile(thumbPath);
          thumbUrl = `/outputs/${userId}/${thumbFilename}`;
        } catch {
          // 缩略图生成失败不影响主流程
        }

        // 扣除积分（使用统一扣减服务）
        await deductCredits(
          userId,
          cost,
          `图片生成 (${model})`,
          generation.id
        );

        // 更新生成记录
        const now = new Date();
        const updatedGeneration = await prisma.generation.update({
          where: { id: generation.id },
          data: {
            status: "COMPLETED",
            outputUrl,
            thumbnailUrl: thumbUrl,
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
  } catch (error) {
    throw error;
  }
}

// ======================== 视频生成 ========================

export interface GenerateVideoParams {
  userId: string;
  prompt: string;
  mode: "text-to-video" | "image-to-video";
  firstFrame?: string;
  lastFrame?: string;
  referenceImages?: string[];
  resolution?: string;
  duration?: number;
  model?: string;
  promptExtend?: boolean;
  ratio?: string;
  cost?: number;
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
    referenceImages = [],
    resolution = "720P",
    duration = 5,
    model = "wan2.2-kf2v-flash",
    promptExtend = true,
    ratio = "16:9",
    cost = 0,
  } = params;

  if (!DASHSCOPE_API_KEY) {
    throw new Error("DashScope API Key 未配置");
  }

  const videoModelInfo = getVideoModel(model);
  const isWan27 = videoModelInfo?.isWan27 ?? (model.includes("wan2.7") || model.includes("wan27"));
  const isHappyHorse = videoModelInfo?.isHappyHorse ?? model.includes("happyhorse");
  const isTextToVideo = mode === "text-to-video";
  const isWan27I2V = !isTextToVideo && isWan27;
  const isTextToVideoWan27 = isTextToVideo && isWan27;

  let apiEndpoint: string;
  if (isHappyHorse || isTextToVideoWan27 || isWan27I2V) {
    apiEndpoint = "/services/aigc/video-generation/video-synthesis";
  } else {
    apiEndpoint = "/services/aigc/image2video/video-synthesis";
  }

  const resolveMediaUrl = (input: string | undefined): string | undefined => {
    if (!input) return undefined;
    if (input.startsWith("data:")) return input;
    if (input.startsWith("http://") || input.startsWith("https://") || input.startsWith("oss://")) return input;
    if (input.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", input);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        return `data:image/jpeg;base64,${buffer.toString("base64")}`;
      }
    }
    if (input.includes(",")) {
      return input;
    }
    return `data:image/jpeg;base64,${input}`;
  };

  const getImageUrl = (imageInput: string): string => {
    if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
      return imageInput;
    }
    if (imageInput.startsWith("data:")) {
      return imageInput;
    }
    return `data:image/jpeg;base64,${imageInput}`;
  };

  let requestBody: Record<string, unknown>;

  if (isHappyHorse) {
    const processedFirstFrame = firstFrame ? resolveMediaUrl(firstFrame) : undefined;
    const processedReferenceImages = referenceImages.map(img => resolveMediaUrl(img)).filter(Boolean) as string[];

    const input: Record<string, unknown> = { prompt };
    if (processedFirstFrame) {
      input.first_frame_url = processedFirstFrame;
    }
    if (processedReferenceImages.length > 0) {
      input.reference_images = processedReferenceImages;
    }

    requestBody = {
      model,
      input,
      parameters: {
        resolution,
        ratio,
        duration,
        prompt_extend: promptExtend,
        watermark: false,
      },
    };
  } else if (isWan27) {
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
      const firstFrameUrl = firstFrame ? resolveMediaUrl(firstFrame) : undefined;
      const lastFrameUrl = lastFrame ? resolveMediaUrl(lastFrame) : undefined;
      requestBody = {
        model,
        input: {
          prompt,
          media: [
            ...(firstFrameUrl ? [{ type: "reference_image", url: firstFrameUrl }] : []),
            ...(lastFrameUrl ? [{ type: "reference_image", url: lastFrameUrl }] : []),
          ],
        },
        parameters: {
          resolution,
          ratio,
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
    const firstFrameData = firstFrame ? getImageUrl(firstFrame) : undefined;
    const lastFrameData = lastFrame ? getImageUrl(lastFrame) : undefined;
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

  console.log("=================== DashScope Request ===================");
    console.log("API Endpoint:", `${DASHSCOPE_BASE_URL}${apiEndpoint}`);
    console.log("Model:", model);
    console.log("Is Wan27:", isWan27);
    console.log("Is HappyHorse:", isHappyHorse);
    console.log("Is Text to Video:", isTextToVideo);
    console.log("Request Body:", JSON.stringify(requestBody, (key, value) => {
      if (key === "url" && typeof value === "string" && value.length > 100) {
        return value.substring(0, 100) + "...(truncated, total length: " + value.length + ")";
      }
      return value;
    }, 2));
    console.log("==========================================================");

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
  console.log("\n========== DashScope POST Response ==========");
  console.log(JSON.stringify(result, null, 2));
  console.log("==============================================\n");
  
  const taskId = result.output?.task_id || result.request_id;

  if (!taskId) {
    throw new Error("未能获取视频生成任务 ID");
  }

  // 创建生成记录（保存积分成本，后续完成后扣减）
  await prisma.generation.create({
    data: {
      userId,
      type: "VIDEO" as GenType,
      status: "PROCESSING",
      prompt,
      params: JSON.stringify({
        model,
        resolution,
        duration,
        taskId,
      }),
      inputUrl: firstFrame || null,
      cost: cost || 0,
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

  console.log("\n================= getVideoStatus =================");
  console.log("Task ID:", taskId);
  console.log("API URL:", `${DASHSCOPE_BASE_URL}/tasks/${taskId}`);

  const response = await fetch(
    `${DASHSCOPE_BASE_URL}/tasks/${taskId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
    }
  );

  console.log("Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(
      `DashScope 状态查询失败: ${response.status} - ${errorText}`
    );
  }

  const result = await response.json();
  console.log("Full response:", JSON.stringify(result, null, 2));

  const output = result.output || {};
  const taskStatus = output.task_status || result.output?.task_status || "UNKNOWN";
  const errorCode = output.code || result.code;
  const errorMessage = output.message || result.message;

  console.log("Task status:", taskStatus);
  console.log("Error code:", errorCode);
  console.log("Error message:", errorMessage);

  // 如果有明确的错误，返回 FAILED
  if (errorCode || errorMessage) {
    console.log("Detected error, returning FAILED");
    return { status: "FAILED", progress: 0 };
  }

  // 状态映射
  let status: string;
  let progress: number;
  
  switch (taskStatus) {
    case "PENDING":
    case "RUNNING":
      status = taskStatus;
      progress = 50;
      break;
    case "SUCCEEDED":
      status = taskStatus;
      progress = 100;
      break;
    case "FAILED":
    case "CANCELED":
      status = "FAILED";
      progress = 0;
      break;
    default:
      status = taskStatus;
      progress = 20;
  }

  const videoUrl = output.video_url || output.videoUrl;
  console.log("Video URL:", videoUrl);

  console.log("Returning:", { status, progress, videoUrl });
  console.log("===================================================\n");

  return {
    status,
    progress,
    videoUrl,
  };
}

export async function updateVideoResult(
  taskId: string,
  videoUrl: string,
  userId: string,
  cost?: number
): Promise<void> {
  const generation = await prisma.generation.findFirst({
    where: {
      params: {
        contains: taskId,
      },
      userId,
    },
    select: { id: true, cost: true },
  });

  if (!generation) {
    throw new Error("未找到对应的生成记录");
  }

  const outputDir = path.join(process.cwd(), "public", "outputs", userId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let localVideoPath: string | null = null;
  let thumbnailPath: string | null = null;

  try {
    if (videoUrl && videoUrl.startsWith("http")) {
      const videoResponse = await fetch(videoUrl);
      if (videoResponse.ok) {
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const videoFilename = `${generation.id}.mp4`;
        const videoPath = path.join(outputDir, videoFilename);
        fs.writeFileSync(videoPath, videoBuffer);
        localVideoPath = `/outputs/${userId}/${videoFilename}`;

        try {
          const thumbnailFilename = `${generation.id}_thumb.jpg`;
          thumbnailPath = path.join(outputDir, thumbnailFilename);
          const ffmpegCommand = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2" -y "${thumbnailPath}"`;
          const { execSync } = require("child_process");
          execSync(ffmpegCommand, { stdio: "pipe" });
        } catch (thumbError) {
          console.error("Failed to generate video thumbnail:", thumbError);
          thumbnailPath = null;
        }
      }
    }
  } catch (downloadError) {
    console.error("Failed to download video:", downloadError);
  }

  await prisma.generation.update({
    where: { id: generation.id },
    data: {
      status: "COMPLETED",
      outputUrl: localVideoPath || videoUrl,
      thumbnailUrl: thumbnailPath ? `/outputs/${userId}/${path.basename(thumbnailPath)}` : null,
      favorited: true,
    },
  });

  if (cost && cost > 0) {
    await deductCredits(
      userId,
      cost,
      "视频生成",
      generation.id
    );
  }
}

// ======================== 历史记录 ========================

export interface HistoryFilters {
  types?: GenType[];
  status?: GenStatus;
  favorited?: boolean;
  olderThanDays?: number;
  page?: number;
  pageSize?: number;
}

export async function getHistory(
  userId: string,
  filters: HistoryFilters = {}
) {
  const { types, status, favorited, olderThanDays, page = 1, pageSize = 20 } = filters;

  const where: Record<string, unknown> = { userId };
  if (types && types.length > 0) where.type = { in: types };
  if (status) where.status = status;
  if (typeof favorited === "boolean") where.favorited = favorited;
  if (olderThanDays) {
    where.createdAt = {
      lt: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000),
    };
    where.favorited = false;
  }

  const orderBy = favorited
    ? { favoritedAt: "desc" as const }
    : { createdAt: "desc" as const };

  const [list, total] = await Promise.all([
    prisma.generation.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.generation.count({ where }),
  ]);

  return {
    list: list.map((item) => {
      let parsedParams: Record<string, any> = {};
      if (item.params) {
        try {
          parsedParams = typeof item.params === 'string' ? JSON.parse(item.params) : item.params;
        } catch {}
      }
      return {
        id: item.id,
        type: item.type,
        status: item.status,
        prompt: item.prompt,
        outputUrl: item.outputUrl,
        thumbnailUrl: item.thumbnailUrl,
        width: item.width,
        height: item.height,
        cost: item.cost,
        model: parsedParams.model || "flash",
        imageSize: parsedParams.imageSize || "1K",
        aspectRatio: parsedParams.aspectRatio || "",
        createdAt: item.createdAt.toISOString(),
        completedAt: item.completedAt?.toISOString(),
        favorited: (item as any).favorited ?? false,
        favoritedAt: (item as any).favoritedAt?.toISOString() ?? null,
      };
    }),
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
  model?: "flash" | "pro" | "image2";
  imageSize?: string;
  thinkingLevel?: ThinkingLevel;
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
  n?: number;
  quality?: "low" | "medium" | "high";
  thinking?: "off" | "low" | "medium" | "high";
  referenceImages?: string[];
}

export async function inpaintImage(
  params: InpaintParams
): Promise<GenerateImageResult> {
  try {
    const task = TaskFactory.createTask("INPAINT");
    const result = await task.execute({
      userId: params.userId,
      originalImage: params.originalImage,
      maskImage: params.maskImage,
      prompt: params.prompt,
      model: params.model,
      imageSize: params.imageSize,
      thinkingLevel: params.thinkingLevel,
      structureRef: params.structureRef,
      styleRef: params.styleRef,
      structureStrength: params.structureStrength,
      styleStrength: params.styleStrength,
      guidanceScale: params.guidanceScale,
      negativePrompt: params.negativePrompt,
      customNegativePrompt: params.customNegativePrompt,
      aspectRatio: params.aspectRatio,
      useGoogleSearch: params.useGoogleSearch,
      useImageSearch: params.useImageSearch,
      n: params.n,
      quality: params.quality,
      thinking: params.thinking,
      referenceImages: params.referenceImages,
    });
    return result as GenerateImageResult;
  } catch (error) {
    throw error;
  }
}
