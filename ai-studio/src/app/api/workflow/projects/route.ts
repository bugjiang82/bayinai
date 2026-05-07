import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { success, error } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const userId = session.user.id;
    
    const { prisma } = await import("@/lib/prisma");
    const projects = await prisma.canvasProject.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(success({ projects }));
  } catch (err) {
    console.error("Get projects error:", err);
    const message = err instanceof Error ? err.message : "获取项目列表失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(error("项目名称不能为空"), { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");
    
    const project = await prisma.canvasProject.create({
      data: {
        userId,
        name: body.name,
        description: body.description || "",
        canvasData: JSON.stringify(body.canvasData || {}),
        thumbnail: body.thumbnail || null,
        isDraft: body.isDraft !== undefined ? body.isDraft : true,
      },
    });

    return NextResponse.json(success({ 
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    }), { status: 201 });
  } catch (err) {
    console.error("Create project error:", err);
    const message = err instanceof Error ? err.message : "保存项目失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}