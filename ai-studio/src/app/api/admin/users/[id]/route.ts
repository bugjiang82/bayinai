import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, credits, name } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (role && (role === "USER" || role === "ADMIN")) updateData.role = role;
    if (typeof credits === "number") updateData.credits = credits;
    if (name) updateData.name = name;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, credits: true },
    });

    return NextResponse.json({ success: true, data: updated, message: "更新成功" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新用户失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({ success: false, error: "不能删除管理员账户" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除用户失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
