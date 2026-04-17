import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBalance } from "@/services/credit.service";
import { success, error } from "@/types/api";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const balance = await getBalance(session.user.id);

    return NextResponse.json(success({ balance }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取积分余额失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
