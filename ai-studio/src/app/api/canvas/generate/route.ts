import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateImage } from '@/services/generation.service';
import { deductCredits } from '@/services/credit.service';

interface GenerateRequest {
  nodeId: string;
  referenceNodeId?: string;
  prompt: string;
  params: {
    model?: string;
    aspectRatio?: string;
    imageSize?: string;
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { nodeId, referenceNodeId, prompt, params } = body;

    if (!nodeId || !prompt) {
      return NextResponse.json({ error: '节点ID和提示词不能为空' }, { status: 400 });
    }

    // 检查用户积分
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 计算积分消耗
    const model = params.model || 'flash';
    let cost = 1; // 默认消耗 1 积分
    if (model === 'pro') {
      cost = 3;
    } else if (model === 'image2') {
      cost = 50;
    }

    if (user.credits < cost) {
      return NextResponse.json({ error: '积分不足' }, { status: 400 });
    }

    // 获取参考节点内容（如果有）
    let referenceImageUrl = null;
    if (referenceNodeId) {
      // 这里应该从数据库或存储中获取参考节点的内容
      // 暂时使用模拟数据
      referenceImageUrl = 'https://example.com/reference-image.jpg';
    }

    // 生成图片
    const generationResult = await generateImage({
      userId: session.user.id,
      prompt,
      model,
      referenceImage: referenceImageUrl,
      aspectRatio: params.aspectRatio,
      imageSize: params.imageSize,
    });

    if (!generationResult.success) {
      return NextResponse.json({ error: generationResult.error }, { status: 500 });
    }

    // 扣除积分
    await deductCredits(session.user.id, cost, generationResult.generationId!, `画布生成 (${model})`);

    // 这里可以更新节点状态和内容
    // 暂时返回生成结果
    return NextResponse.json({ 
      success: true, 
      result: generationResult 
    });
  } catch (error) {
    console.error('画布生成失败:', error);
    return NextResponse.json({ error: '画布生成失败' }, { status: 500 });
  }
}
