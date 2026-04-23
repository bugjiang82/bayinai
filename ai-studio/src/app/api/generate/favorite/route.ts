import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { error, success } from "@/types/api";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { generationId, favorited } = body;

    if (!generationId) {
      return NextResponse.json(error("缺少生成记录ID"), { status: 400 });
    }

    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
    });

    if (!generation) {
      return NextResponse.json(error("生成记录不存在"), { status: 404 });
    }

    if (generation.userId !== session.user.id) {
      return NextResponse.json(error("无权操作此记录"), { status: 403 });
    }

    const updated = await prisma.generation.update({
      where: { id: generationId },
      data: {
        favorited: favorited ?? !generation.favorited,
        favoritedAt: favorited === false ? null : (generation.favorited ? generation.favoritedAt : new Date()),
      },
    });

    return NextResponse.json(success({
      id: updated.id,
      favorited: updated.favorited,
      favoritedAt: updated.favoritedAt?.toISOString() ?? null,
    }, "操作成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "收藏操作失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
