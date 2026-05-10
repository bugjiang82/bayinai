import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { success, error } from "@/types/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "";

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

    let text: string;

    if (image_base64) {
      if (!GOOGLE_GENAI_API_KEY) {
        return NextResponse.json(error("Google GenAI API Key 未配置"), { status: 500 });
      }

      const genAI = new GoogleGenerativeAI(GOOGLE_GENAI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-image-preview",
        systemInstruction: "你是一个专业的视觉艺术提示词专家。请分析用户提供的图片，提取其核心视觉元素、风格、构图、光影及材质，并将其转化为高质量的英文提示词。",
      });

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
      if (!OPENROUTER_API_KEY) {
        return NextResponse.json(error("OpenRouter API Key 未配置"), { status: 500 });
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", response.status, errorText);
        return NextResponse.json(error(`API 调用失败: ${response.status}`), { status: 500 });
      }

      const result = await response.json();
      text = result.choices?.[0]?.message?.content || "未生成内容";
    }

    return NextResponse.json(success({ text }, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    console.error("Text generation error:", err);
    return NextResponse.json(error(message), { status: 500 });
  }
}