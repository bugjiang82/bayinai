import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chatWithAgent } from "@/services/agent.service";
import { success, error } from "@/types/api";

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
    const { message, history } = body;

    if (!message) {
      return NextResponse.json(error("请输入消息"), { status: 400 });
    }

    const result = await chatWithAgent({
      agentId: id,
      message,
      history,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "对话失败";
    const status = message === "智能体不存在" ? 404 : 500;
    return NextResponse.json(error(message), { status });
  }
}
