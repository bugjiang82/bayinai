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
    } = body;

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    // 兼容新旧两种传参方式：referenceImages 数组优先，referenceImage 单数备用
    const refImages = referenceImages || (referenceImage ? [referenceImage] : undefined);

    const result = await generateImage({
      userId: session.user.id,
      prompt,
      aspectRatio,
      imageSize,
      thinkingLevel,
      model,
      referenceImages: refImages,
    });

    return NextResponse.json(success(result, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    const status = message === "积分不足" ? 400 : 500;
    return NextResponse.json(error(message), { status });
  }
}
