import { NextRequest, NextResponse } from "next/server";
import { register } from "@/services/user.service";
import { success, error } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(error("缺少必填字段"), { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(error("密码长度不能少于6位"), { status: 400 });
    }

    const user = await register({ email, password, name });

    return NextResponse.json(success(user, "注册成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "注册失败";
    return NextResponse.json(error(message), { status: 400 });
  }
}
