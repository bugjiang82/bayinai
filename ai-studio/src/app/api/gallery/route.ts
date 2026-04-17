import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { success, error } from "@/types/api";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const generations = await prisma.generation.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        prompt: true,
        outputUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        cost: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      success(generations.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
      })))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取作品列表失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
