import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import type { GenType, GenStatus } from "@/types/generation";

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

// ======================== 积分扣减服务 ========================

export interface CreditDeductionResult {
  success: boolean;
  beforeBalance: number;
  deductedAmount: number;
  afterBalance: number;
  error?: string;
}

export interface CreditDeductionParams {
  userId: string;
  amount: number;
  type: string;
  refId?: string;
  remark?: string;
}

export class InsufficientCreditsError extends Error {
  constructor(
    public required: number,
    public available: number
  ) {
    super(`积分不足：需要 ${required} 积分，当前剩余 ${available} 积分`);
    this.name = "InsufficientCreditsError";
  }
}

export class InvalidCreditAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCreditAmountError";
  }
}

export async function deductCredits(
  params: CreditDeductionParams
): Promise<CreditDeductionResult> {
  const { userId, amount, type, refId, remark } = params;

  // 1. 参数验证
  if (!userId) {
    throw new InvalidCreditAmountError("用户ID不能为空");
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new InvalidCreditAmountError("扣减积分数量必须为正整数");
  }

  // 2. 使用事务确保原子性
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 3. 查询当前用户积分余额（加锁）
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      // 4. 验证积分余额
      if (typeof user.credits !== "number" || user.credits < 0) {
        throw new Error("用户积分数据异常");
      }

      if (user.credits < amount) {
        throw new InsufficientCreditsError(amount, user.credits);
      }

      const beforeBalance = user.credits;
      const afterBalance = beforeBalance - amount;

      // 5. 执行积分扣减
      await tx.user.update({
        where: { id: userId },
        data: { credits: afterBalance },
      });

      // 6. 记录积分日志
      await tx.creditLog.create({
        data: {
          userId,
          type,
          amount: -amount,
          balance: afterBalance,
          remark: remark || type,
          refId,
        },
      });

      return { beforeBalance, afterBalance };
    });

    return {
      success: true,
      beforeBalance: result.beforeBalance,
      deductedAmount: amount,
      afterBalance: result.afterBalance,
    };
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return {
        success: false,
        beforeBalance: err.available,
        deductedAmount: 0,
        afterBalance: err.available,
        error: err.message,
      };
    }
    if (err instanceof InvalidCreditAmountError) {
      return {
        success: false,
        beforeBalance: 0,
        deductedAmount: 0,
        afterBalance: 0,
        error: err.message,
      };
    }
    if (err instanceof Error && err.message === "用户不存在") {
      return {
        success: false,
        beforeBalance: 0,
        deductedAmount: 0,
        afterBalance: 0,
        error: "用户不存在",
      };
    }
    // 其他数据库或系统错误
    return {
      success: false,
      beforeBalance: 0,
      deductedAmount: 0,
      afterBalance: 0,
      error: err instanceof Error ? err.message : "积分扣减失败，请重试",
    };
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  if (!userId) return 0;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

export async function refundCredits(
  userId: string,
  amount: number,
  refId: string,
  remark: string
): Promise<CreditDeductionResult> {
  if (!userId) {
    return {
      success: false,
      beforeBalance: 0,
      deductedAmount: 0,
      afterBalance: 0,
      error: "用户ID不能为空",
    };
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return {
      success: false,
      beforeBalance: 0,
      deductedAmount: 0,
      afterBalance: 0,
      error: "退款积分数量必须为正整数",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      const beforeBalance = user.credits ?? 0;
      const afterBalance = beforeBalance + amount;

      await tx.user.update({
        where: { id: userId },
        data: { credits: afterBalance },
      });

      await tx.creditLog.create({
        data: {
          userId,
          type: "REFUND",
          amount,
          balance: afterBalance,
          remark,
          refId,
        },
      });

      return { beforeBalance, afterBalance };
    });

    return {
      success: true,
      beforeBalance: result.beforeBalance,
      deductedAmount: -amount,
      afterBalance: result.afterBalance,
    };
  } catch (err) {
    return {
      success: false,
      beforeBalance: 0,
      deductedAmount: 0,
      afterBalance: 0,
      error: err instanceof Error ? err.message : "积分退款失败，请重试",
    };
  }
}

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

  // 兼容新旧传参方式
  const refImages = referenceImages || (referenceImage ? [referenceImage] : []);

  // 确定生成类型
  let genType: GenType = "TEXT_TO_IMAGE";
  if (refImages.length > 0 && transformType) {
    genType = "EDIT";
  } else if (refImages.length > 0) {
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
      // Image2 模型使用 OpenRouter API（参考 test-image2.ts 实现）
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
      // 构建 contents：多图 Part + 文字 Part（参考多图 API 文档逻辑）
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
      console.log("API Response structure:", JSON.stringify(response, null, 2).substring(0, 1000));
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          outputBase64 = part.inlineData.data;
          actualMimeType = part.inlineData.mimeType || "image/png";
          hasImage = true;
        }
      }

      if (!hasImage) {
        console.error("未能获取图片数据，响应内容:", JSON.stringify(response, null, 2).substring(0, 2000));
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
    const deductionResult = await deductCredits({
      userId,
      amount: cost,
      type: "GENERATE",
      refId: generation.id,
      remark: `图片生成 (${model})`,
    });

    if (!deductionResult.success) {
      // 更新失败状态并抛出错误
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "FAILED",
          errorMsg: deductionResult.error || "积分扣减失败",
        },
      });
      throw new Error(deductionResult.error || "积分扣减失败");
    }

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
  const isWan27I2V = !isTextToVideo && isWan27;
  const apiEndpoint = (isTextToVideoWan27 || isWan27I2V)
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
      const resolveMediaUrl = async (input: string | undefined): Promise<string | undefined> => {
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
      const firstFrameUrl = await resolveMediaUrl(firstFrame);
      const lastFrameUrl = await resolveMediaUrl(lastFrame);
      requestBody = {
        model,
        input: {
          prompt,
          media: [
            ...(firstFrameUrl ? [{ type: "reference_image", url: firstFrameUrl }] : []),
            ...(lastFrameUrl ? [{ type: "last_frame", url: lastFrameUrl }] : []),
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
    const deductionResult = await deductCredits({
      userId,
      amount: cost,
      type: "GENERATE",
      refId: generation.id,
      remark: "视频生成",
    });

    if (!deductionResult.success) {
      throw new Error(deductionResult.error || "积分扣减失败");
    }
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
    const outputDir = path.join(process.cwd(), "public", "outputs", userId);
    fs.mkdirSync(outputDir, { recursive: true });

    let outputBase64: string | undefined;
    let hasImage = false;
    let revisedPrompt: string | undefined;
    let actualMimeType = "image/png";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        outputBase64 = part.inlineData.data;
        actualMimeType = part.inlineData.mimeType || "image/png";
        hasImage = true;
      } else if (part.text) {
        revisedPrompt = part.text;
      }
    }

    if (!hasImage) {
      console.error("Inpaint API 未能获取图片数据，响应内容:", JSON.stringify(response, null, 2).substring(0, 2000));
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === "NO_IMAGE") {
        throw new Error("局部重绘未能生成图片，请尝试使用更详细的提示词");
      }
      throw new Error("模型未返回图像数据。这可能是由于提示词触发了安全过滤，或参数设置超出了模型当前支持的范围。");
    }

    const ext = actualMimeType.split("/")[1] || "png";
    const filename = `${generation.id}.${ext}`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, Buffer.from(outputBase64!, "base64"));

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

    // 扣除积分（使用统一扣减服务）
    const deductionResult = await deductCredits({
      userId,
      amount: cost,
      type: "GENERATE",
      refId: generation.id,
      remark: `图片局部重绘 (${model})`,
    });

    if (!deductionResult.success) {
      // 更新失败状态并抛出错误
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "FAILED",
          errorMsg: deductionResult.error || "积分扣减失败",
        },
      });
      throw new Error(deductionResult.error || "积分扣减失败");
    }

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
