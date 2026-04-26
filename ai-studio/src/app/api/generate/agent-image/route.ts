import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { success, error } from "@/types/api";
import sharp from "sharp";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(error("请提供提示词"), { status: 400 });
    }

    const cost = 2;
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      throw new Error("用户不存在");
    }
    if (user.credits < cost) {
      throw new Error("积分不足");
    }

    const generation = await prisma.generation.create({
      data: {
        userId: session.user.id,
        type: "TEXT_TO_IMAGE",
        status: "PROCESSING",
        prompt,
        cost,
      },
    });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ text: prompt }],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        },
      });

      const outputDir = path.join(process.cwd(), "public", "outputs", session.user.id);
      fs.mkdirSync(outputDir, { recursive: true });

      const filename = `${generation.id}.png`;
      const filepath = path.join(outputDir, filename);

      let hasImage = false;

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(filepath, buffer);
          hasImage = true;
        }
      }

      if (!hasImage) {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        throw new Error("未能生成图片");
      }

      const outputUrl = `/outputs/${session.user.id}/${filename}`;

      // 生成缩略图
      let thumbnailUrl: string | null = null;
      try {
        const thumbFilename = `${generation.id}_thumb.jpg`;
        const thumbPath = path.join(outputDir, thumbFilename);
        await sharp(filepath).resize(256, 256, { fit: "inside" }).jpeg({ quality: 70 }).toFile(thumbPath);
        thumbnailUrl = `/outputs/${session.user.id}/${thumbFilename}`;
      } catch (thumbErr) {
        console.error("缩略图生成失败:", thumbErr);
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: cost } },
      });

      await prisma.creditLog.create({
        data: {
          userId: session.user.id,
          type: "GENERATE",
          amount: -cost,
          balance: user.credits - cost,
          remark: "AI绘画大师生成",
          refId: generation.id,
        },
      });

      const now = new Date();
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "COMPLETED",
          outputUrl,
          thumbnailUrl,
          completedAt: now,
        },
      });

      return NextResponse.json(success({ outputUrl, thumbnailUrl }, "生成成功"));
    } catch (err) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "FAILED",
          errorMsg: err instanceof Error ? err.message : "生成失败",
        },
      });
      throw err;
    }
  } catch (err) {
    console.error("生成失败:", err);
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
