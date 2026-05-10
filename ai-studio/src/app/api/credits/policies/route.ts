import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_POLICIES: Record<string, { cost: number; unit: string }> = {
  "text-to-image-flash": { cost: 1, unit: "次" },
  "text-to-image-pro": { cost: 3, unit: "次" },
  "text-to-image-image2": { cost: 50, unit: "次" },
  "image-to-image-flash": { cost: 1, unit: "次" },
  "image-to-image-pro": { cost: 3, unit: "次" },
  "image-to-image-image2": { cost: 50, unit: "次" },
  "architecture-flash": { cost: 3, unit: "次" },
  "architecture-pro": { cost: 3, unit: "次" },
  "edit-flash": { cost: 1, unit: "次" },
  "edit-pro": { cost: 3, unit: "次" },
  "video-per-second": { cost: 50, unit: "秒" },
  "workflow-image": { cost: 1, unit: "次" },
  "automation-test": { cost: 10, unit: "次" },
};

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
      Object.assign(result, DEFAULT_POLICIES);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch credit policies:", error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_POLICIES,
    });
  }
}