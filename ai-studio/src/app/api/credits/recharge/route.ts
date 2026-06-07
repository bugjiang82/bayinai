import { NextResponse } from "next/server";
import { error } from "@/types/api";

export async function POST() {
  return NextResponse.json(
    error("充值功能暂未开放，敬请期待"),
    { status: 503 }
  );
}
