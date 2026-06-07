import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { auth } from "@/lib/auth";
import { success, error } from "@/types/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGoogleGenerativeAI } from "@/lib/ai-clients";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { prompt, image_base64 } = body;

    if (!prompt) {
      return NextResponse.json(error("请输入提示词"), { status: 400 });
    }

    const genAI = getGoogleGenerativeAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash",
      systemInstruction: "你是一个专业的视觉艺术提示词专家。请分析用户提供的图片，提取其核心视觉元素、风格、构图、光影及材质，并将其转化为高质量的英文提示词。",
    });

    let text: string;

    if (image_base64) {
      let imageData = image_base64;
      if (image_base64.startsWith("data:")) {
        imageData = image_base64.split(',')[1];
      }

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: "image/png",
          },
        },
      ]);

      text = result.response.text() || "未生成内容";
    } else {
      const result = await model.generateContent(prompt);
      text = result.response.text() || "未生成内容";
    }

    return NextResponse.json(success({ text }, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    logger.error("Text generation error:", err);
    return NextResponse.json(error(message), { status: 500 });
  }
}