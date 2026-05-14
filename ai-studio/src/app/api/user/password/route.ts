import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changePassword } from "@/services/user.service";
import { success, error } from "@/types/api";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(error("请提供当前密码和新密码"), { status: 400 });
    }

    const user = await changePassword(session.user.id, currentPassword, newPassword);

    return NextResponse.json(success(user, "密码修改成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "密码修改失败";
    const status = message === "当前密码不正确" ? 401 : 500;
    return NextResponse.json(error(message), { status });
  }
}
