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
      aspect_ratio = "1:1",
      quality = "1K",
      model = "flash",
      reference_images,
      cost,
    } = body;

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    if (!cost || cost < 0) {
      return NextResponse.json(error("积分参数错误"), { status: 400 });
    }

    // 映射质量参数到API格式
    const imageSizeMap: Record<string, string> = {
      "512P": "512px",
      "1K": "1K",
      "2K": "2K",
      "4K": "4K",
    };

    const result = await generateImage({
      userId: session.user.id,
      prompt,
      aspectRatio: aspect_ratio,
      imageSize: imageSizeMap[quality] || "1K",
      model: model as "flash" | "pro" | "image2",
      referenceImages: reference_images,
      cost: cost,
    });

    return NextResponse.json(success({
      url: result.outputUrl,
      base64: result.outputBase64,
    }, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}