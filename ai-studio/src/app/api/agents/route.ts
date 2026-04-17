import { NextResponse } from "next/server";
import { getAgents } from "@/services/agent.service";
import { success, error } from "@/types/api";

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json(success(agents));
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取智能体列表失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
