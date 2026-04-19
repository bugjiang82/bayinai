import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI, Type } from "@google/genai";
import { SubTask } from "@/types/ai-agent";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "" });

interface InteractionOption {
  id: string;
  label: string;
}

interface InteractionResponse {
  prompt: string;
  options: InteractionOption[];
}

interface GenerateInteractionRequest {
  task: SubTask;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body: GenerateInteractionRequest = await request.json();
    const { task, reasoning } = body;

    if (!task || !reasoning) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const prompt = `
    Based on this task requirement and reasoning:
    Task: ${task.title}
    Reasoning context: ${reasoning}

    The agent has identified a decision point (USER_DECISION).
    Your job is to generate 2-3 specific, meaningful options (Chinese) for the user to choose from to resolve this decision.

    CRITICAL:
    1. The 'prompt' field should be a clear question or instruction in Chinese for the user.
    2. Each option 'label' MUST start with a letter identifier (e.g., "A. 方案一", "B. 方案二").
    3. Return valid JSON.
  `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING }
                },
                required: ["id", "label"]
              }
            }
          },
          required: ["prompt", "options"]
        }
      }
    });

    const data: InteractionResponse = JSON.parse(response.text || "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("Generate interactions error:", err);
    return NextResponse.json({ error: "生成交互选项失败" }, { status: 500 });
  }
}