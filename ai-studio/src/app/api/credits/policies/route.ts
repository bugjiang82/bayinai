import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import prisma from "@/lib/prisma";
import { buildDefaultPolicyMap } from "@/models";

export async function GET() {
  try {
    const policies = await prisma.creditPolicy.findMany({
      where: { isActive: true },
      orderBy: { category: "asc" },
    });

    const result: Record<string, { cost: number; unit: string }> = {};

    if (policies.length > 0) {
      for (const policy of policies) {
        result[policy.key] = { cost: policy.cost, unit: policy.unit };
      }
    } else {
      const defaultMap = buildDefaultPolicyMap();
      for (const [key, value] of Object.entries(defaultMap)) {
        result[key] = { cost: value.cost, unit: value.unit };
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("Failed to fetch credit policies:", error);
    const fallback = buildDefaultPolicyMap();
    const fallbackResult: Record<string, { cost: number; unit: string }> = {};
    for (const [key, value] of Object.entries(fallback)) {
      fallbackResult[key] = { cost: value.cost, unit: value.unit };
    }
    return NextResponse.json({
      success: true,
      data: fallbackResult,
    });
  }
}