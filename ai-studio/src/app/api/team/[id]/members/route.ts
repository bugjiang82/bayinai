import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTeamMembers, inviteMember } from "@/services/team.service";
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
    const members = await getTeamMembers(id);

    return NextResponse.json(success(members));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取团队成员失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(error("请指定要邀请的用户"), { status: 400 });
    }

    const member = await inviteMember(id, session.user.id, targetUserId);

    return NextResponse.json(success(member, "邀请成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "邀请成员失败";
    const status =
      message === "无权限邀请成员" ? 403 :
      message === "目标用户不存在" ? 404 : 500;
    return NextResponse.json(error(message), { status });
  }
}
