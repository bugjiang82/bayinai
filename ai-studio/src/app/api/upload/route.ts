import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/services/file.service";
import { success, error } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(error("未登录"), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(error("请选择要上传的文件"), { status: 400 });
    }

    // 限制文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(error("文件大小不能超过10MB"), { status: 400 });
    }

    const result = await uploadFile(file);

    return NextResponse.json(success(result, "上传成功"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    return NextResponse.json(error(message), { status: 500 });
  }
}
