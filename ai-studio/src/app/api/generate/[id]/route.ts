import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { success, error } from "@/types/api";

export async function GET(
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
      return NextResponse.json(error("记录不存在"), { status: 404 });
    }

    return NextResponse.json(success(generation));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取生成记录失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

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
      return NextResponse.json(error("记录不存在"), { status: 404 });
    }

    await prisma.generation.delete({ where: { id } });

    return NextResponse.json(success(null, "删除成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除生成记录失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
