import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTemplates, createTemplate } from "@/services/template.service";
import { paginated, success, error } from "@/types/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const result = await getTemplates({ category, page, pageSize });

    return NextResponse.json(
      paginated(result.list, result.total, result.page, result.pageSize)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取模板列表失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const body = await request.json();
    const { title, description, coverImage, category, tags, prompt, negativePrompt, params, isPublic } = body;

    if (!title || !prompt || !category) {
      return NextResponse.json(error("缺少必填字段: title, prompt, category"), { status: 400 });
    }

    const template = await createTemplate({
      title,
      description,
      coverImage,
      category,
      tags,
      prompt,
      negativePrompt,
      params,
      isPublic,
      userId: session.user.id,
    });

    return NextResponse.json(success(template, "创建成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建模板失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
