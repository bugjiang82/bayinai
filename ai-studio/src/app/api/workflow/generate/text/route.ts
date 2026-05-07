import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { success, error } from "@/types/api";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

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

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(error("OpenRouter API Key 未配置"), { status: 500 });
    }

    const messages: any[] = [{ role: "user", content: prompt }];

    if (image_base64) {
      messages[0].content = {
        type: "text",
        text: prompt
      };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
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
    const text = result.choices?.[0]?.message?.content || "未生成内容";

    return NextResponse.json(success({ text }, "生成成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败";
    console.error("Text generation error:", err);
    return NextResponse.json(error(message), { status: 500 });
  }
}