import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateVideo, getVideoStatus, updateVideoResult } from "@/services/generation.service";
import { success, error } from "@/types/api";
import sharp from "sharp";
import path from "path";
import { existsSync, readFileSync } from "fs";

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

async function convertAndCompressToBase64(urlOrPath: string, maxSizeBytes: number = 4 * 1024 * 1024): Promise<string> {
  let buffer: Buffer;

  if (urlOrPath.startsWith("data:")) {
    const base64 = urlOrPath.split(",")[1];
    buffer = Buffer.from(base64, "base64");
  } else if (isAbsoluteUrl(urlOrPath)) {
    const response = await fetch(urlOrPath);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());
  } else if (urlOrPath.includes(",")) {
    const base64 = urlOrPath.split(",")[1];
    buffer = Buffer.from(base64, "base64");
  } else {
    const filePath = path.join(process.cwd(), "public", urlOrPath);
    if (existsSync(filePath)) {
      buffer = readFileSync(filePath);
    } else {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:5050";
      const absoluteUrl = urlOrPath.startsWith("/")
        ? `${baseUrl}${urlOrPath}`
        : `${baseUrl}/${urlOrPath}`;

      const response = await fetch(absoluteUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }
  }

  if (buffer.length <= maxSizeBytes) {
    return buffer.toString("base64");
  }

  const compressed = await sharp(buffer)
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  if (compressed.length <= maxSizeBytes) {
    return compressed.toString("base64");
  }

  let quality = 80;
  let result = compressed;
  while (quality > 30 && result.length > maxSizeBytes) {
    result = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();
    quality -= 10;
  }

  return result.toString("base64");
}

// POST /api/generate/video - 提交视频生成任务
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const {
      first_frame,
      last_frame,
      prompt,
      resolution = "720P",
      duration = 5,
      model,
      prompt_extend = true,
      mode = "image-to-video",
      ratio = "16:9",
    } = body;

    if (!model) {
      return NextResponse.json(error("请选择模型"), { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    if (mode === "image-to-video" && !first_frame) {
      return NextResponse.json(error("请上传起始帧图片"), { status: 400 });
    }

    let firstFrameBase64: string | undefined;
    let lastFrameBase64: string | undefined;

    if (mode === "image-to-video") {
      firstFrameBase64 = await convertAndCompressToBase64(first_frame);
      if (last_frame) {
        lastFrameBase64 = await convertAndCompressToBase64(last_frame);
      }
    }

    const result = await generateVideo({
      userId: session.user.id,
      prompt,
      mode,
      firstFrame: firstFrameBase64 || undefined,
      lastFrame: lastFrameBase64 || undefined,
      resolution,
      duration,
      model,
      promptExtend: prompt_extend,
      ratio,
    });

    return NextResponse.json(
      success(
        {
          taskId: result.taskId,
          videoId: result.videoId,
          message: result.message,
        },
        "视频生成任务已提交"
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "视频生成任务提交失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

// GET /api/generate/video?taskId=xxx - 查询视频生成状态
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(error("缺少 taskId 参数"), { status: 400 });
    }

    const result = await getVideoStatus(taskId);

    if (result.status === "SUCCEEDED" && result.videoUrl) {
      try {
        await updateVideoResult(taskId, result.videoUrl, session.user.id);
      } catch (e) {
        console.error("Failed to update video result:", e);
      }
    }

    return NextResponse.json(
      success({
        status: result.status,
        progress: result.progress,
        videoUrl: result.videoUrl || null,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询视频状态失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
