import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { SubTask, Agent } from "@/types/ai-agent";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import prisma from "@/lib/prisma";

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

    const userId = session.user.id;
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
    3. IMAGE GENERATION: If the task requires visual content, you can output MULTIPLE image prompts.
       For EACH image needed, output on a separate line: "IMAGE_PROMPT: <detailed English description for image generation>"
       You may output multiple IMAGE_PROMPT lines if the task requires multiple images.
    4. MANDATORY INTERACTION: At the VERY END of your response, if there are branching choices or a need for confirmation, output "USER_DECISION:" followed by the choices in Chinese.
    5. CRITICAL ORDER: Always output reasoning first, then IMAGE_PROMPT(s) (if applicable), and finally USER_DECISION (if applicable).
    6. All reasoning and choices MUST be in Chinese, but each IMAGE_PROMPT description MUST be in English.
  `;

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";

        try {
          for await (const chunk of response) {
            fullText += chunk.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: chunk.text })}\n\n`));
          }

          // 提取所有 IMAGE_PROMPT（支持多个）
          const imagePrompts: string[] = [];
          const imageRegex = /IMAGE_PROMPT:\s*([^\n\r]+)/gi;
          let match;
          while ((match = imageRegex.exec(fullText)) !== null) {
            const promptText = match[1].trim().replace(/^["']|["']$/g, '');
            if (promptText) {
              imagePrompts.push(promptText);
            }
          }

          // 依次生成所有图片
          const imageUrls: string[] = [];
          for (let i = 0; i < imagePrompts.length; i++) {
            try {
              const { url, filePath, thumbUrl } = await generateImage(imagePrompts[i], userId, task.id, i);
              if (url) {
                imageUrls.push(url);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "image", content: url, thumbUrl, index: i })}\n\n`));

                // 记录到数据库
                try {
                  await prisma.generation.create({
                    data: {
                      userId,
                      type: "TEXT_TO_IMAGE",
                      status: "COMPLETED",
                      prompt: imagePrompts[i],
                      outputUrl: url,
                      thumbnailUrl: thumbUrl || url,
                      params: JSON.stringify({
                        model: "gemini-3.1-flash-image-preview",
                        source: "ai-orchestrator",
                        taskId: task.id,
                        objective,
                      }),
                      cost: 0, // 自动化测试不扣积分
                      completedAt: new Date(),
                    },
                  });
                } catch (dbErr) {
                  console.error("记录生成到数据库失败:", dbErr);
                }
              }
            } catch (imgErr) {
              console.error(`图片 ${i + 1} 生成失败:`, imgErr);
            }
          }

          if (fullText.includes("USER_DECISION:")) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "waiting", content: fullText, imageUrls })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", content: fullText, imageUrls })}\n\n`));
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

/**
 * 生成单张图片并保存到服务器
 * @param prompt 图片描述（英文）
 * @param userId 用户 ID
 * @param taskId 任务 ID
 * @param index 图片索引（用于区分同任务多张图片）
 */
async function generateImage(prompt: string, userId: string, taskId: string, index: number): Promise<{ url: string; filePath: string; thumbUrl: string | null }> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K",
      },
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MINIMAL,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      const base64Data = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || "image/png";
      const ext = mimeType.split("/")[1] || "png";

      // 保存目录
      const outputDir = path.join(process.cwd(), "public", "outputs", userId);
      fs.mkdirSync(outputDir, { recursive: true });

      // 文件名：orch-{taskId}-{index}.{ext}
      const filename = `orch-${taskId}-${index}.${ext}`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));

      const url = `/outputs/${userId}/${filename}`;

      // 生成缩略图
      let thumbUrl: string | null = null;
      try {
        const thumbFilename = `orch-${taskId}-${index}_thumb.jpg`;
        const thumbPath = path.join(outputDir, thumbFilename);
        await sharp(filepath).resize(256, 256, { fit: "inside" }).jpeg({ quality: 70 }).toFile(thumbPath);
        thumbUrl = `/outputs/${userId}/${thumbFilename}`;
      } catch {
        // 缩略图生成失败不影响主流程
      }

      return { url, filePath: filepath, thumbUrl };
    }
  }

  throw new Error("模型未返回图像数据");
}