import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { success, error } from "@/types/api";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "" 
});

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

    const contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];
    
    if (image_base64) {
      const base64Data = image_base64.split(",")[1] || image_base64;
      contents[0].parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });

    const text = response.text || "未生成内容";

    return NextResponse.json(success({ text }, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}