import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAllDefaultPolicies, clearDefaultPolicyCache } from "@/models";
import { invalidatePolicyCache as invalidateServiceCache } from "@/services/creditPolicy.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const dbPolicies = await prisma.creditPolicy.findMany({
      orderBy: { category: "asc" },
    });

    const defaultPolicies = getAllDefaultPolicies();
    const dbKeySet = new Set(dbPolicies.map((p) => p.key));

    const missingPolicies = defaultPolicies.filter((dp) => !dbKeySet.has(dp.key));

    if (missingPolicies.length > 0) {
      for (const mp of missingPolicies) {
        await prisma.creditPolicy.create({
          data: mp,
        });
      }
      clearDefaultPolicyCache();
      invalidateServiceCache();
    }

    const allPolicies = await prisma.creditPolicy.findMany({
      orderBy: { category: "asc" },
    });

    const isDefault = dbPolicies.length === 0;

    return NextResponse.json({
      success: true,
      data: allPolicies,
      isDefault,
    });
  } catch (error) {
    logger.error("Failed to fetch credit policies:", error);
    return NextResponse.json({ error: "获取积分策略失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { policies } = body;

    if (!Array.isArray(policies)) {
      return NextResponse.json({ error: "无效的数据格式" }, { status: 400 });
    }

    for (const policy of policies) {
      await prisma.creditPolicy.upsert({
        where: { key: policy.key },
        update: {
          name: policy.name,
          description: policy.description,
          cost: policy.cost,
          unit: policy.unit,
          category: policy.category,
          isActive: policy.isActive,
        },
        create: {
          key: policy.key,
          name: policy.name,
          description: policy.description,
          cost: policy.cost,
          unit: policy.unit,
          category: policy.category,
          isActive: policy.isActive ?? true,
        },
      });
    }

    invalidateServiceCache();
    clearDefaultPolicyCache();

    return NextResponse.json({ success: true, message: "积分策略更新成功" });
  } catch (error) {
    logger.error("Failed to update credit policies:", error);
    return NextResponse.json({ error: "更新积分策略失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "reset") {
      await prisma.creditPolicy.deleteMany();

      const defaultPolicies = getAllDefaultPolicies();
      for (const dp of defaultPolicies) {
        await prisma.creditPolicy.create({ data: dp });
      }

      clearDefaultPolicyCache();
      invalidateServiceCache();

      return NextResponse.json({ success: true, message: "已重置为默认规则" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    logger.error("Failed to process credit policy action:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}