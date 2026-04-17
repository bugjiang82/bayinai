import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { success, error } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(error("充值金额必须大于0"), { status: 400 });
    }

    // 创建充值记录（预留支付接口）
    const recharge = await prisma.creditLog.create({
      data: {
        userId: session.user.id,
        type: "RECHARGE",
        amount,
        balance: 0, // 支付成功后更新
        remark: `充值 ${amount} 积分 (${paymentMethod || "预留支付"})`,
      },
    });

    // TODO: 接入实际支付系统后，在支付回调中更新余额
    // 目前直接增加积分（模拟支付成功）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (user) {
      const newBalance = user.credits + amount;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: newBalance },
      });

      await prisma.creditLog.update({
        where: { id: recharge.id },
        data: { balance: newBalance },
      });
    }

    return NextResponse.json(
      success(
        {
          id: recharge.id,
          amount,
          status: "completed",
          remark: recharge.remark,
        },
        "充值成功"
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "充值失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
