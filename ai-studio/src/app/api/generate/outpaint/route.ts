import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { outpaintImage } from "@/services/generation.service";
import { success, error } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const {
      originalImage,
      paddedImage,
      prompt,
      model = "flash",
      aspectRatio = "1:1",
      box,
    } = body;

    if (!originalImage || !paddedImage || !prompt) {
      return NextResponse.json(error("缺少必要参数：originalImage、paddedImage、prompt"), { status: 400 });
    }

    const result = await outpaintImage({
      userId: session.user.id,
      originalImage,
      paddedImage,
      prompt,
      model,
      aspectRatio,
      box,
    });

    return NextResponse.json(success(result, "扩图成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "扩图生成失败";
    const status = message === "积分不足" ? 400 : 500;
    return NextResponse.json(error(message), { status });
  }
}