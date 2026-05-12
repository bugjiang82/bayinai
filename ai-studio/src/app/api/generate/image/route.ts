import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateImage } from "@/services/generation.service";
import { success, error } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const {
      prompt,
      aspectRatio = "1:1",
      imageSize = "1K",
      thinkingLevel = "MINIMAL",
      model = "flash",
      referenceImage,
      referenceImages,
      n,
      quality,
      thinking,
    } = body;

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    const refImages = referenceImages || (referenceImage ? [referenceImage] : undefined);

    const result = await generateImage({
      userId: session.user.id,
      prompt,
      aspectRatio,
      imageSize,
      thinkingLevel,
      model,
      referenceImages: refImages,
      n: model === "image2" ? n : undefined,
      quality: model === "image2" ? (quality || "low") : undefined,
      thinking: model === "image2" ? thinking : undefined,
    });

    return NextResponse.json(success(result, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    const status = message === "积分不足" ? 400 : 500;
    return NextResponse.json(error(message), { status });
  }
}
