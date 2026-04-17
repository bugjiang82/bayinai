import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLogs } from "@/services/credit.service";
import { paginated, error } from "@/types/api";
import type { CreditType } from "@/services/credit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as CreditType | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const result = await getLogs(session.user.id, {
      type: type || undefined,
      page,
      pageSize,
    });

    return NextResponse.json(
      paginated(result.list, result.total, result.page, result.pageSize)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取积分记录失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
