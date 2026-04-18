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

    // 3. 构建多重参考数组
    const imageInputs = [
      {
        image: mainImage,
        reference_type: "STRUCTURE",
        structure_strength: structureStrength
      }
    ];

    // 如果有风格图，自动注入风格参考
    if (styleRefImage) {
      imageInputs.push({
        image: styleRefImage,
        reference_type: "STYLE",
        style_strength: 0.65
      });
    }

    // 4. 封装最终 API 请求
    const payload = {
      prompt: prompt,
      generation_config: {
        aspect_ratio: "16:9",
        negative_prompt: "flat, 2d, low quality, distorted lines, signature"
      },
      image_input_config: imageInputs
    };

    // 如果是重绘，注入特殊的重绘配置
    if (mode === 'INPAINT') {
      payload.inpainting_config = {
        base_image: baseRendered, // 之前那张不满意的渲染图
        mask_image: maskImage,    // 涂抹区域
        denoising_strength: denoisingStrength,
        mask_blur: 8
      };
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
      ],
      generationConfig: {
        aspectRatio: "16:9",
        negativePrompt: "flat, 2d, low quality, distorted lines, signature"
      }
    });

    const response = result.response;
    const image = response.images?.[0];

    if (!image) {
      throw new Error("生成失败，未返回图像");
    }

    return NextResponse.json(success({ outputUrl: image.url }, "生成成功"));
  } catch (err) {
    console.error("生成失败:", err);
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
