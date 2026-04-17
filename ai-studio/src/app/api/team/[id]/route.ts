import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTeamById } from "@/services/team.service";
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
    const team = await getTeamById(id);

    return NextResponse.json(success(team));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取团队详情失败";
    const status = message === "团队不存在" ? 404 : 500;
    return NextResponse.json(error(message), { status });
  }
}
