import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideoStatus, updateVideoResult } from "@/services/generation.service";
import { success, error } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get("task_id");

    if (!task_id) {
      return NextResponse.json(error("缺少 task_id 参数"), { status: 400 });
    }

    const result = await getVideoStatus(task_id);

    if (result.status === "SUCCEEDED" && result.videoUrl) {
      try {
        await updateVideoResult(task_id, result.videoUrl, session.user.id);
      } catch (e) {
        console.error("Failed to update video result:", e);
      }
    }

    return NextResponse.json(success({
      status: result.status,
      progress: result.progress,
      video_url: result.videoUrl || null,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询视频状态失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}