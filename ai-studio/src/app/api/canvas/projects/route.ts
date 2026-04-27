import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface CreateProjectRequest {
  name: string;
  description?: string;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
  canvasData?: any;
  isDraft?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body: CreateProjectRequest = await request.json();
    const { name, description = '' } = body;

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    const project = await prisma.canvasProject.create({
      data: {
        userId: session.user.id,
        name,
        description,
        canvasData: JSON.stringify({
          nodes: [],
          connections: [],
        }),
        isDraft: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      project: {
        ...project,
        canvasData: JSON.parse(project.canvasData),
      }
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const projects = await prisma.canvasProject.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const formattedProjects = projects.map(project => ({
      ...project,
      canvasData: JSON.parse(project.canvasData),
    }));

    return NextResponse.json({ success: true, projects: formattedProjects });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json({ error: '获取项目列表失败' }, { status: 500 });
  }
}
