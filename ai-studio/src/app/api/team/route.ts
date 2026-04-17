import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTeams, createTeam } from "@/services/team.service";
import { success, error } from "@/types/api";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const teams = await getTeams(session.user.id);

    return NextResponse.json(success(teams));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取团队列表失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { name, description, avatar } = body;

    if (!name) {
      return NextResponse.json(error("请输入团队名称"), { status: 400 });
    }

    const team = await createTeam(session.user.id, {
      name,
      description,
      avatar,
    });

    return NextResponse.json(success(team, "创建成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建团队失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
