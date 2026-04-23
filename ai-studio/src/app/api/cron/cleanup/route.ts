import { NextResponse } from "next/server";
import { cleanupOldGenerations } from "@/services/cleanup.service";
import { success, error } from "@/types/api";

export async function POST() {
  try {
    const result = await cleanupOldGenerations();

    return NextResponse.json(success({
      deletedCount: result.deletedCount,
      failedCount: result.failedCount,
      errors: result.errors,
      cleanedUpAt: new Date().toISOString(),
    }, "清理完成"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "清理失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
