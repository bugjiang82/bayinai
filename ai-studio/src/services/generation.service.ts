import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import type { GenType, GenStatus } from "@/types/generation";
import { TaskFactory } from "./tasks";
import * as creditService from "./credit.service";
import * as fileService from "./file.service";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || "";
const DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";

const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "openai/gpt-5.4-image-2",
};

const COST_MAP: Record<string, number> = {
  flash: 1,
  pro: 3,
  image2: 50,
};

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
      });
      return result as GenerateImageResult;
    } else {
      // 对于不支持的任务类型，使用旧的实现
      // 这里保留旧的实现以保持向后兼容性
      const modelName = MODEL_MAP[model] || MODEL_MAP.flash;
      const cost = COST_MAP[model] || COST_MAP.flash;
      const isProModel = modelName.includes("pro");
      const isImage2Model = model === "image2";

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
          // Image2 模型使用 OpenRouter API
          try {
            // 构建消息内容
            const contentParts: any[] = [];

            // 1. 添加所有参考图片（多图支持）
            for (const refImg of refImages) {
              // 处理 URL 路径或 base64 数据
              let imageBase64: string;
              
              if (refImg.startsWith("/outputs/") || refImg.startsWith("http")) {
                // URL 路径格式：从文件系统读取
                const filePath = refImg.startsWith("/outputs/")
                  ? path.join(process.cwd(), "public", refImg)
                  : refImg;
                try {
                  const fileBuffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
                  if (fileBuffer) {
                    const ext = path.extname(filePath).toLowerCase();
                    const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" 
                                     : ext === ".webp" ? "image/webp" 
                                     : "image/png";
                    imageBase64 = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
                  } else {
                    throw new Error(`文件不存在: ${filePath}`);
                  }
                } catch {
                  // 尝试作为 URL 获取
                  const response = await fetch(refImg);
                  if (!response.ok) {
                    throw new Error(`无法读取参考图片: ${response.status}`);
                  }
                  const arrayBuffer = await response.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  imageBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
                }
              } else if (refImg.includes(",")) {
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

            // 2. 添加文本提示词（在所有图片之后）
            contentParts.push({
              type: "text",
              text: fullPrompt,
            });

            // 构建请求体
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
              // 方式1：message.images 数组
              for (const img of message.images) {
                const imageUrlObj = img.image_url;
                if (imageUrlObj?.url) {
                  const imageData = imageUrlObj.url;
                  const mimeMatch = imageData.match(/data:image\/([^;]+)/);
                  const mimeType = mimeMatch ? mimeMatch[1] : "png";
                  const base64Part = imageData.split(",")[1];
                  const imageBytes = Buffer.from(base64Part, "base64");
                  const actualFilename = `${generation.id}.${mimeType}`;
                  const actualFilepath = path.join(outputDir, actualFilename);
                  fs.writeFileSync(actualFilepath, imageBytes);
                  outputBase64 = base64Part;
                  filename = actualFilename;
                  filepath = actualFilepath;
                }
              }
            } else if (message?.content) {
              // 方式2：message.content 数组
              const contentArray = Array.isArray(message.content) ? message.content : [message.content];
              for (const contentItem of contentArray) {
                if (contentItem?.type === "image_url" && contentItem.image_url?.url) {
                  const imageData = contentItem.image_url.url;
                  const mimeMatch = imageData.match(/data:image\/([^;]+)/);
                  const mimeType = mimeMatch ? mimeMatch[1] : "png";
                  const base64Part = imageData.split(",")[1];
                  const imageBytes = Buffer.from(base64Part, "base64");
                  const actualFilename = `${generation.id}.${mimeType}`;
                  const actualFilepath = path.join(outputDir, actualFilename);
                  fs.writeFileSync(actualFilepath, imageBytes);
                  outputBase64 = base64Part;
                  filename = actualFilename;
                  filepath = actualFilepath;
                }
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
                ? refImg.split(";").split(":")[1] || "image/png"
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
        await creditService.deductCredits(
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

  // 创建生成记录（保存积分成本，后续完成后扣减）
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

  await prisma.generation.update({
    where: { id: generation.id },
    data: {
      status: "COMPLETED",
      outputUrl: videoUrl,
    },
  });

  if (cost && cost > 0) {
    await creditService.deductCredits(
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
    list: list.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      prompt: item.prompt,
      outputUrl: item.outputUrl,
      thumbnailUrl: item.thumbnailUrl,
      width: item.width,
      height: item.height,
      cost: item.cost,
      params: item.params,
      inputUrl: item.inputUrl,
      createdAt: item.createdAt.toISOString(),
      completedAt: item.completedAt?.toISOString(),
      favorited: (item as any).favorited ?? false,
      favoritedAt: (item as any).favoritedAt?.toISOString() ?? null,
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
  // 使用新的任务处理架构
  try {
    const task = TaskFactory.createTask("INPAINT");
    const result = await task.execute(params);
    return result as GenerateImageResult;
  } catch (error) {
    throw error;
  }
}
