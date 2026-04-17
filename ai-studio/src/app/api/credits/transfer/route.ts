import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transfer } from "@/services/credit.service";
import { success, error } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { toUserId, amount, remark } = body;

    if (!toUserId || !amount || amount <= 0) {
      return NextResponse.json(error("参数错误"), { status: 400 });
    }

    const result = await transfer(
      session.user.id,
      toUserId,
      amount,
      remark
    );

    return NextResponse.json(success(result, "划转成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "划转失败";
    const status =
      message === "积分不足" || message === "参数错误"
        ? 400
        : message === "目标用户不存在"
          ? 404
          : 500;
    return NextResponse.json(error(message), { status });
  }
}
