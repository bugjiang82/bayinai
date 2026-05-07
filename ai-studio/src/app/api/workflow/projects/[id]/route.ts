import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { success, error } from "@/types/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const userId = session.user.id;

    const { prisma } = await import("@/lib/prisma");
    const project = await prisma.canvasProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(error("项目不存在"), { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json(error("无权访问此项目"), { status: 403 });
    }

    return NextResponse.json(success({ 
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        canvasData: JSON.parse(project.canvasData || "{}"),
        thumbnail: project.thumbnail,
        isDraft: project.isDraft,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    }));
  } catch (err) {
    console.error("Get project error:", err);
    const message = err instanceof Error ? err.message : "获取项目失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { prisma } = await import("@/lib/prisma");
    
    const existingProject = await prisma.canvasProject.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json(error("项目不存在"), { status: 404 });
    }

    if (existingProject.userId !== userId) {
      return NextResponse.json(error("无权修改此项目"), { status: 403 });
    }

    const updatedProject = await prisma.canvasProject.update({
      where: { id: projectId },
      data: {
        name: body.name || existingProject.name,
        description: body.description !== undefined ? body.description : existingProject.description,
        canvasData: body.canvasData !== undefined ? JSON.stringify(body.canvasData) : existingProject.canvasData,
        thumbnail: body.thumbnail !== undefined ? body.thumbnail : existingProject.thumbnail,
        isDraft: body.isDraft !== undefined ? body.isDraft : existingProject.isDraft,
      },
    });

    return NextResponse.json(success({ 
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
      }
    }));
  } catch (err) {
    console.error("Update project error:", err);
    const message = err instanceof Error ? err.message : "更新项目失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const userId = session.user.id;

    const { prisma } = await import("@/lib/prisma");
    
    const existingProject = await prisma.canvasProject.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json(error("项目不存在"), { status: 404 });
    }

    if (existingProject.userId !== userId) {
      return NextResponse.json(error("无权删除此项目"), { status: 403 });
    }

    await prisma.canvasProject.delete({
      where: { id: projectId },
    });

    return NextResponse.json(success({ message: "项目已删除" }));
  } catch (err) {
    console.error("Delete project error:", err);
    const message = err instanceof Error ? err.message : "删除项目失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}