import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateVideo, getVideoStatus } from "@/services/generation.service";
import { success, error } from "@/types/api";

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
      model = "wan2.7-flav-replicate",
    } = body;

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    if (!first_frame) {
      return NextResponse.json(error("请上传起始帧图片"), { status: 400 });
    }

    const result = await generateVideo({
      userId: session.user.id,
      firstFrame: first_frame,
      lastFrame: last_frame || undefined,
      prompt,
      resolution,
      duration,
      model,
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
