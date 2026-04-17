import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [
      totalUsers,
      totalWorks,
      totalCreditsUsed,
      todayActive,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.generation.count({ where: { status: "COMPLETED" } }),
      prisma.creditLog.aggregate({ _sum: { amount: true }, where: { type: "GENERATE" } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalWorks,
        totalCreditsUsed: totalCreditsUsed._sum.amount || 0,
        todayActive,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取统计数据失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
