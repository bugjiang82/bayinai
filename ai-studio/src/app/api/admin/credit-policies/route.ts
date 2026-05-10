import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_CREDIT_POLICIES = [
  { key: "text-to-image-flash", name: "文生图-Flash", description: "快速文生图模型", cost: 1, unit: "次", category: "image" },
  { key: "text-to-image-pro", name: "文生图-Pro", description: "高质量文生图模型", cost: 3, unit: "次", category: "image" },
  { key: "text-to-image-image2", name: "文生图-Image2", description: "超强图像生成模型", cost: 50, unit: "次", category: "image" },
  { key: "image-to-image-flash", name: "图生图-Flash", description: "快速图生图模型", cost: 1, unit: "次", category: "image" },
  { key: "image-to-image-pro", name: "图生图-Pro", description: "高质量图生图模型", cost: 3, unit: "次", category: "image" },
  { key: "image-to-image-image2", name: "图生图-Image2", description: "超强图像生成模型", cost: 50, unit: "次", category: "image" },
  { key: "architecture-flash", name: "进阶设计-Flash", description: "SU高清渲染/CAD转3D", cost: 3, unit: "次", category: "architecture" },
  { key: "architecture-pro", name: "进阶设计-Pro", description: "SU高清渲染/CAD转3D", cost: 3, unit: "次", category: "architecture" },
  { key: "edit-flash", name: "图片编辑-Flash", description: "局部重绘", cost: 1, unit: "次", category: "edit" },
  { key: "edit-pro", name: "图片编辑-Pro", description: "局部重绘", cost: 3, unit: "次", category: "edit" },
  { key: "video-per-second", name: "视频生成", description: "按秒计费", cost: 50, unit: "秒", category: "video" },
  { key: "workflow-image", name: "工作流-图片", description: "工作流图片节点", cost: 1, unit: "次", category: "workflow" },
  { key: "automation-test", name: "自动化测试", description: "AI编排自动化测试", cost: 10, unit: "次", category: "other" },
];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const policies = await prisma.creditPolicy.findMany({
      orderBy: { category: "asc" },
    });

    if (policies.length === 0) {
      await prisma.creditPolicy.createMany({
        data: DEFAULT_CREDIT_POLICIES,
      });
      return NextResponse.json({
        success: true,
        data: DEFAULT_CREDIT_POLICIES,
        isDefault: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: policies,
      isDefault: false,
    });
  } catch (error) {
    console.error("Failed to fetch credit policies:", error);
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

    return NextResponse.json({ success: true, message: "积分策略更新成功" });
  } catch (error) {
    console.error("Failed to update credit policies:", error);
    return NextResponse.json({ error: "更新积分策略失败" }, { status: 500 });
  }
}