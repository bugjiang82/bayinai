import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { success, error } from "@/types/api";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const { id } = await params;

    const generation = await prisma.generation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!generation) {
      return NextResponse.json(error("作品不存在"), { status: 404 });
    }

    await prisma.generation.delete({ where: { id } });

    return NextResponse.json(success(null, "删除成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除作品失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { favorite } = body;

    const generation = await prisma.generation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!generation) {
      return NextResponse.json(error("作品不存在"), { status: 404 });
    }

    // 使用 params 字段来存储收藏状态
    const currentParams = (JSON.parse(generation.params || '{}') as Record<string, unknown>) || {};
    await prisma.generation.update({
      where: { id },
      data: {
        params: JSON.stringify({ ...currentParams, favorite: !!favorite }),
      },
    });

    return NextResponse.json(success(null, favorite ? "收藏成功" : "取消收藏成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
