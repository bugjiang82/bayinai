import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, updateUser } from "@/services/user.service";
import { success, error } from "@/types/api";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const user = await getUserById(session.user.id);

    if (!user) {
      return NextResponse.json(error("用户不存在"), { status: 404 });
    }

    return NextResponse.json(success(user));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取用户信息失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { name, avatar, industry } = body;

    const user = await updateUser(session.user.id, { name, avatar, industry });

    return NextResponse.json(success(user, "更新成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新用户信息失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
