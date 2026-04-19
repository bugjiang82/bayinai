import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { SubTask, Agent } from "@/types/ai-agent";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "" });

interface ExecuteRequest {
  objective: string;
  task: SubTask;
  agent: Agent;
  previousResults: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body: ExecuteRequest = await request.json();
    const { objective, task, agent, previousResults } = body;

    if (!objective || !task || !agent) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const context = Object.entries(previousResults || {})
      .map(([id, res]) => `Task ${id} Result: ${res}`)
      .join("\n");

    const prompt = `
    Overall Objective: "${objective}"
    Current Task: "${task.title}"
    Description: "${task.description}"
    Your Identity: "${agent.name}" (${agent.persona})
    Previous Results:
    ${context || "No previous results"}

    Instructions:
    1. Execute the task based on your persona.
    2. All your output (reasoning, thoughts, and descriptions) MUST be in Chinese (简体中文).
    3. IMAGE GENERATION: If the task requires or would benefit from visual content, you MUST output a line followed by your reasoning: "IMAGE_PROMPT: <detailed English description for image generation>".
    4. MANDATORY INTERACTION: At the VERY END of your response, if there are branching choices or a need for confirmation, output "USER_DECISION:" followed by the choices in Chinese.
    5. CRITICAL ORDER: Always output reasoning first, then IMAGE_PROMPT (if applicable), and finally USER_DECISION (if applicable).
    6. All reasoning and choices MUST be in Chinese, but the IMAGE_PROMPT description MUST be in English.
  `;

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        let imageUrl: string | undefined = "";

        try {
          for await (const chunk of response) {
            fullText += chunk.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: chunk.text })}\n\n`));
          }

          const imageMatch = fullText.match(/IMAGE_PROMPT:\s*([^\n\r]+)/i);
          if (imageMatch && imageMatch[1]) {
            const imagePrompt = imageMatch[1].trim().replace(/^["']|["']$/g, '');
            try {
              imageUrl = await generateImage(imagePrompt);
              if (imageUrl) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "image", content: imageUrl })}\n\n`));
              }
            } catch (imgErr) {
              console.error("Image generation failed:", imgErr);
            }
          }

          if (fullText.includes("USER_DECISION:")) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "waiting", content: fullText })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", content: fullText, imageUrl })}\n\n`));
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", content: "任务执行失败" })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Execute subtask error:", err);
    return NextResponse.json({ error: "任务执行失败" }, { status: 500 });
  }
}

async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview",
    contents: prompt,
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return "";
}