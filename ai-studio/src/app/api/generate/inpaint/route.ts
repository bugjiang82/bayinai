import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inpaintImage } from "@/services/generation.service";
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
      maskImage,
      prompt,
      imageSize = "1K",
      thinkingLevel = "MINIMAL",
      model = "flash",
      // 新增参数
      structureRef,
      styleRef,
      structureStrength,
      styleStrength,
      guidanceScale,
      negativePrompt,
      customNegativePrompt,
      aspectRatio,
      useGoogleSearch,
      useImageSearch,
    } = body;

    if (!originalImage || !maskImage || !prompt) {
      return NextResponse.json(error("缺少必要参数"), { status: 400 });
    }

    const result = await inpaintImage({
      userId: session.user.id,
      originalImage,
      maskImage,
      prompt,
      imageSize,
      thinkingLevel,
      model,
      structureRef,
      styleRef,
      structureStrength,
      styleStrength,
      guidanceScale,
      negativePrompt,
      customNegativePrompt,
      aspectRatio,
      useGoogleSearch,
      useImageSearch,
    });

    return NextResponse.json(success(result, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    const status = message === "积分不足" ? 400 : 500;
    return NextResponse.json(error(message), { status });
  }
}
