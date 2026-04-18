import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { success, error } from "@/types/api";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "",
});

// 图像生成大冒险：全能渲染引擎
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const {
      mode,           // 'CAD_TO_3D', 'SU_RENDER', 'INPAINT'
      prompt,         // 用户提示词
      mainImage,      // 主输入图 (CAD平面图或SU白模)
      styleRefImage,  // 风格参考图 (可选)
      maskImage,      // 局部重绘遮罩 (仅重绘模式需要)
      baseRendered,   // 渲染不满意的底图 (仅重绘模式需要)
      negativePrompt, // 负面提示词
      fidelity,       // 还原度 (0-1)
      styleImpact,    // 风格浸染 (0-1)
      aiCreativity,   // AI 脑洞 (3-15)
    } = body;

    if (!mode || !prompt || !mainImage) {
      return NextResponse.json(error("请提供必要参数"), { status: 400 });
    }

    if (mode === 'INPAINT' && (!maskImage || !baseRendered)) {
      return NextResponse.json(error("重绘模式需要遮罩和底图"), { status: 400 });
    }

    // 检查积分
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      throw new Error("用户不存在");
    }
    const cost = 3;
    if (user.credits < cost) {
      throw new Error("积分不足");
    }

    // 创建生成记录
    const generation = await prisma.generation.create({
      data: {
        userId: session.user.id,
        type: "IMAGE_TO_IMAGE",
        status: "PROCESSING",
        prompt,
        negativePrompt,
        params: JSON.stringify({
          mode,
          fidelity,
          styleImpact,
          aiCreativity,
        }),
        cost,
      },
    });

    try {
      // 构建完整提示词
      let fullPrompt = prompt;
      if (negativePrompt) {
        fullPrompt += `\n\n避免以下内容: ${negativePrompt}`;
      }
      
      // 添加模式特定的提示词
      if (mode === 'CAD_TO_3D') {
        fullPrompt = `将这个CAD平面图转换为3D建筑效果图，保持原有的几何结构，还原度${fidelity * 100}%。\n\n${fullPrompt}`;
      } else if (mode === 'SU_RENDER') {
        fullPrompt = `对这个SketchUp白模进行高清渲染，保持原有的建筑结构，还原度${fidelity * 100}%。\n\n${fullPrompt}`;
      }

      const contents: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string }; text?: string }
      > = [];

      // 添加主图片
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: mainImage,
        },
      });

      // 添加风格参考图片（如果有）
      if (styleRefImage) {
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: styleRefImage,
          },
        });
        fullPrompt += `\n\n请参考这张图片的风格进行渲染，风格强度${styleImpact * 100}%。`;
      }

      // 添加提示词
      contents.push({ text: fullPrompt });

      // 调用 Gemini API
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: contents,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        },
      });

      // 解析响应
      const outputDir = path.join(process.cwd(), "public", "outputs", session.user.id);
      fs.mkdirSync(outputDir, { recursive: true });

      const filename = `${generation.id}.png`;
      const filepath = path.join(outputDir, filename);

      let outputBase64: string | undefined;
      let hasImage = false;

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(filepath, buffer);
          outputBase64 = part.inlineData.data;
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

      // 扣除积分
      await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: cost } },
      });

      // 创建积分日志
      await prisma.creditLog.create({
        data: {
          userId: session.user.id,
          type: "GENERATE",
          amount: -cost,
          balance: user.credits - cost,
          remark: "进阶设计生成",
          refId: generation.id,
        },
      });

      // 更新生成记录
      const now = new Date();
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "COMPLETED",
          outputUrl,
          completedAt: now,
        },
      });

      return NextResponse.json(success({ outputUrl }, "生成成功"));
    } catch (err) {
      // 更新失败状态
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
