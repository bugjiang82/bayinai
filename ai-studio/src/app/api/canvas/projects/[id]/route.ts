import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface UpdateProjectRequest {
  name?: string;
  description?: string;
  canvasData?: any;
  isDraft?: boolean;
  thumbnail?: string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = params;
    const project = await prisma.canvasProject.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      project: {
        ...project,
        canvasData: JSON.parse(project.canvasData),
      }
    });
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = params;
    const body: UpdateProjectRequest = await request.json();

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.canvasProject.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 构建更新数据
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.canvasData !== undefined) updateData.canvasData = JSON.stringify(body.canvasData);
    if (body.isDraft !== undefined) updateData.isDraft = body.isDraft;
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
    updateData.updatedAt = new Date();

    const updatedProject = await prisma.canvasProject.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      project: {
        ...updatedProject,
        canvasData: JSON.parse(updatedProject.canvasData),
      }
    });
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = params;

    // 检查项目是否存在且属于当前用户
    const existingProject = await prisma.canvasProject.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 删除项目
    await prisma.canvasProject.delete({ where: { id } });

    return NextResponse.json({ success: true, message: '项目已删除' });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 });
  }
}
