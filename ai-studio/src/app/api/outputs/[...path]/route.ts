import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = path.join(process.cwd(), "public", "outputs", ...pathSegments);

  // 安全检查：防止路径遍历
  const resolvedPath = path.resolve(filePath);
  const allowedDir = path.resolve(process.cwd(), "public", "outputs");
  if (!resolvedPath.startsWith(allowedDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(resolvedPath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const stat = fs.statSync(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();

  const contentTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };

  const buffer = fs.readFileSync(resolvedPath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentTypeMap[ext] || "application/octet-stream",
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
