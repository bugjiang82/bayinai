import { NextRequest, NextResponse } from "next/server";
import { getGenerationCost } from "@/services/creditPolicy.service";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, model, quality, resolution, items } = body;

    // 单个策略查询
    if (type) {
      const cost = await getGenerationCost(
        type as any,
        model,
        quality || resolution
      );
      return NextResponse.json({
        success: true,
        data: { type, model, quality, resolution, cost, unit: "次" },
      });
    }

    // 批量策略查询
    if (items && Array.isArray(items)) {
      const results = await Promise.all(
        items.map(async (item: { type: string; model?: string; quality?: string; resolution?: string }) => {
          const cost = await getGenerationCost(
            item.type as any,
            item.model,
            item.quality || item.resolution
          );
          return { type: item.type, model: item.model, quality: item.quality, resolution: item.resolution, cost, unit: "次" };
        })
      );
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json(
      { success: false, message: "请提供 type 或 items 参数" },
      { status: 400 }
    );
  } catch (err) {
    logger.error("Failed to calculate credit cost:", err);
    const message = err instanceof Error ? err.message : "计算积分失败";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}