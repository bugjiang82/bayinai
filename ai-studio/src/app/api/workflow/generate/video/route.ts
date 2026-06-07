import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateVideo } from "@/services/generation.service";
import { success, error } from "@/types/api";
import logger from "@/lib/logger";
import sharp from "sharp";

async function processImageData(imageData: string): Promise<string> {
  let buffer: Buffer;
  
  if (imageData.startsWith("data:")) {
    const base64 = imageData.split(",")[1];
    buffer = Buffer.from(base64, "base64");
  } else if (imageData.includes(",")) {
    const base64 = imageData.split(",")[1];
    buffer = Buffer.from(base64, "base64");
  } else {
    buffer = Buffer.from(imageData, "base64");
  }

  // 压缩图片，确保在10MB以内
  const compressed = await sharp(buffer)
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  return `data:image/jpeg;base64,${compressed.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const {
      prompt,
      model,
      duration = 5,
      resolution = "720P",
      ratio = "16:9",
      reference_image,
      reference_images,
      first_frame,
      last_frame,
    } = body;

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    if (!model) {
      return NextResponse.json(error("请选择模型"), { status: 400 });
    }

    const isHappyHorse = model.includes("happyhorse");

    logger.info("=================== Workflow Video API ===================");
    logger.info("Model:", model);
    logger.info("Is HappyHorse:", isHappyHorse);
    logger.info("Prompt:", prompt.substring(0, 50), "...");
    logger.info("First frame provided:", !!first_frame);
    logger.info("First frame type:", typeof first_frame);
    logger.info("First frame length:", first_frame?.length);
    logger.info("First frame starts with data:", first_frame?.startsWith("data:"));
    logger.info("Last frame provided:", !!last_frame);
    logger.info("Last frame type:", typeof last_frame);
    logger.info("Last frame length:", last_frame?.length);
    logger.info("Last frame starts with data:", last_frame?.startsWith("data:"));
    logger.info("Reference image provided:", !!reference_image);
    logger.info("Reference image type:", typeof reference_image);
    logger.info("Reference images provided:", !!reference_images);
    logger.info("==========================================================");

    let firstFrameData: string | undefined;
    let lastFrameData: string | undefined;
    let referenceImagesData: string[] = [];

    if (first_frame) {
      try {
        firstFrameData = await processImageData(first_frame);
        logger.info("First frame processed successfully, length:", firstFrameData.length);
      } catch (e) {
        logger.error("Error processing first frame:", e);
        throw new Error("处理首帧图片失败: " + (e instanceof Error ? e.message : "未知错误"));
      }
    } else if (reference_image) {
      try {
        firstFrameData = await processImageData(reference_image);
        logger.info("Reference image processed successfully, length:", firstFrameData.length);
      } catch (e) {
        logger.error("Error processing reference image:", e);
        throw new Error("处理参考图片失败: " + (e instanceof Error ? e.message : "未知错误"));
      }
    }

    if (last_frame) {
      try {
        lastFrameData = await processImageData(last_frame);
        logger.info("Last frame processed successfully, length:", lastFrameData.length);
      } catch (e) {
        logger.error("Error processing last frame:", e);
        throw new Error("处理尾帧图片失败: " + (e instanceof Error ? e.message : "未知错误"));
      }
    }

    if (reference_images && Array.isArray(reference_images)) {
      for (const img of reference_images) {
        if (img) {
          try {
            const processedImg = await processImageData(img);
            referenceImagesData.push(processedImg);
            logger.info("Reference image processed successfully, length:", processedImg.length);
          } catch (e) {
            logger.error("Error processing reference image:", e);
            throw new Error("处理参考图片失败: " + (e instanceof Error ? e.message : "未知错误"));
          }
        }
      }
    }

    const result = await generateVideo({
      userId: session.user.id,
      prompt,
      mode: firstFrameData || referenceImagesData.length > 0 ? "image-to-video" : "text-to-video",
      model,
      firstFrame: firstFrameData,
      lastFrame: lastFrameData,
      referenceImages: referenceImagesData,
      duration,
      resolution,
      ratio,
    });

    return NextResponse.json(success({
      task_id: result.taskId,
      video_id: result.videoId,
      message: result.message,
    }, "视频生成任务已提交"));
  } catch (err) {
    logger.error("Workflow Video API error:", err);
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
