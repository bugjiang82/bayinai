import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { auth } from "@/lib/auth";
import { success, error } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const userId = session.user.id;
    
    // 获取用户积分
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return NextResponse.json(error("用户不存在"), { status: 404 });
    }

    return NextResponse.json(success({
      credits: user.credits || 0
    }));
  } catch (err) {
    logger.error("Get credits error:", err);
    const message = err instanceof Error ? err.message : "获取积分失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}