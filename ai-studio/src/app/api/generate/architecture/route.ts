import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { success, error } from "@/types/api";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "");

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

    // 1. 初始化基础配置
    let structureStrength = 0.92; // 默认高强度锁定
    let denoisingStrength = 0.75;
    let referenceType = "STRUCTURE";

    // 2. 根据模式动态调整"冒险参数"
    switch (mode) {
      case 'CAD_TO_3D':
        // CAD转3D需要留出空间让墙体"生长"，强度略降
        structureStrength = 0.82;
        break;
      case 'SU_RENDER':
        // SU渲染需要严格对齐建模线条
        structureStrength = 0.95;
        break;
      case 'INPAINT':
        // 重绘模式的核心是去噪强度和遮罩
        denoisingStrength = 0.8;
        break;
    }

    // 3. 使用前端传递的参数覆盖默认值
    if (fidelity !== undefined) {
      structureStrength = fidelity;
    }
    if (styleImpact !== undefined) {
      // 风格强度在前端已处理，这里不需要额外处理
    }



    // 调用模型
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview"
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { 
              inlineData: {
                data: mainImage,
                mimeType: "image/jpeg"
              }
            },
            ...(styleRefImage ? [{
              inlineData: {
                data: styleRefImage,
                mimeType: "image/jpeg"
              }
            }] : []),
            ...(mode === 'INPAINT' ? [{
              inlineData: {
                data: baseRendered!,
                mimeType: "image/jpeg"
              }
            }, {
              inlineData: {
                data: maskImage!,
                mimeType: "image/jpeg"
              }
            }] : [])
          ]
        }
      ]
    });

    // 模拟生成结果
    return NextResponse.json(success({ outputUrl: "https://picsum.photos/seed/architecture/1920/1080" }, "生成成功"));
  } catch (err) {
    console.error("生成失败:", err);
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
