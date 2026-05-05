import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateVideo } from "@/services/generation.service";
import { success, error } from "@/types/api";
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
      first_frame,
      last_frame,
      cost,
    } = body;

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    if (!model) {
      return NextResponse.json(error("请选择模型"), { status: 400 });
    }

    if (!cost || cost < 0) {
      return NextResponse.json(error("积分参数错误"), { status: 400 });
    }

    console.log("=================== Workflow Video API ===================");
    console.log("Model:", model);
    console.log("Prompt:", prompt.substring(0, 50), "...");
    console.log("Cost:", cost);
    console.log("First frame provided:", !!first_frame);
    console.log("First frame type:", typeof first_frame);
    console.log("First frame length:", first_frame?.length);
    console.log("First frame starts with data:", first_frame?.startsWith("data:"));
    console.log("Last frame provided:", !!last_frame);
    console.log("Last frame type:", typeof last_frame);
    console.log("Last frame length:", last_frame?.length);
    console.log("Last frame starts with data:", last_frame?.startsWith("data:"));
    console.log("Reference image provided:", !!reference_image);
    console.log("Reference image type:", typeof reference_image);
    console.log("==========================================================");

    let firstFrameData: string | undefined;
    let lastFrameData: string | undefined;

    if (first_frame) {
      try {
        firstFrameData = await processImageData(first_frame);
        console.log("First frame processed successfully, length:", firstFrameData.length);
      } catch (e) {
        console.error("Error processing first frame:", e);
        throw new Error("处理首帧图片失败: " + (e instanceof Error ? e.message : "未知错误"));
      }
    } else if (reference_image) {
      try {
        firstFrameData = await processImageData(reference_image);
        console.log("Reference image processed successfully, length:", firstFrameData.length);
      } catch (e) {
        console.error("Error processing reference image:", e);
        throw new Error("处理参考图片失败: " + (e instanceof Error ? e.message : "未知错误"));
      }
    }

    if (last_frame) {
      try {
        lastFrameData = await processImageData(last_frame);
        console.log("Last frame processed successfully, length:", lastFrameData.length);
      } catch (e) {
        console.error("Error processing last frame:", e);
        throw new Error("处理尾帧图片失败: " + (e instanceof Error ? e.message : "未知错误"));
      }
    }

    const result = await generateVideo({
      userId: session.user.id,
      prompt,
      mode: firstFrameData ? "image-to-video" : "text-to-video",
      model,
      firstFrame: firstFrameData,
      lastFrame: lastFrameData,
      duration,
      resolution,
      ratio,
      cost,
    });

    return NextResponse.json(success({
      task_id: result.taskId,
      video_id: result.videoId,
      message: result.message,
    }, "视频生成任务已提交"));
  } catch (err) {
    console.error("Workflow Video API error:", err);
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
