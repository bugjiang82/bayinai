import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { success, error } from "@/types/api";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "");

// 定义提取提示词的模型配置
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", // 使用用户指定的模型
  systemInstruction: "你是一个专业的视觉艺术提示词专家。请分析用户提供的图片，提取其核心视觉元素、风格、构图、光影及材质，并将其转化为适用于 AI 生图模型的高质量英文提示词。",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return NextResponse.json(error("请提供图片"), { status: 400 });
    }

    // 构建提示词提取请求
    const prompt = "请详细描述这张图片的内容，并输出一段整理好的 AI 绘图提示词。";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const extractedPrompt = result.response.text();

    return NextResponse.json(success({ prompt: extractedPrompt }, "提取成功"));
  } catch (err) {
    console.error("提取提示词失败:", err);
    const message = err instanceof Error ? err.message : "提取失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
