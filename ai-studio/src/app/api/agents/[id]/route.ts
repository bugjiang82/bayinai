import { NextRequest, NextResponse } from "next/server";
import { getAgentById } from "@/services/agent.service";
import { success, error } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getAgentById(id);
    return NextResponse.json(success(agent));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取智能体详情失败";
    const status = message === "智能体不存在" ? 404 : 500;
    return NextResponse.json(error(message), { status });
  }
}
