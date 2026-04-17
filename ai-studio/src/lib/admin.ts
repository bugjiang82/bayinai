import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ success: false, error: "未登录" }, { status: 401 }), session: null };
  }

  if ((session.user as { role?: string }).role !== "ADMIN") {
    return { error: NextResponse.json({ success: false, error: "权限不足" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
