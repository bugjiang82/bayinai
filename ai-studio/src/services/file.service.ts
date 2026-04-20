import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function uploadFile(
  file: File,
  subDir?: string
): Promise<UploadResult> {
  await ensureUploadDir();

  const targetDir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || getExtensionFromMime(file.type);
  const filename = `${crypto.randomUUID()}${ext}`;
  const filepath = path.join(targetDir, filename);

  await writeFile(filepath, buffer);

  const relativePath = subDir ? `uploads/${subDir}/${filename}` : `uploads/${filename}`;

  return {
    url: `/${relativePath}`,
    filename,
    size: file.size,
    mimeType: file.type,
  };
}

export async function downloadAndSaveFile(url: string, subDir?: string): Promise<UploadResult> {
  await ensureUploadDir();

  const targetDir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const ext = getExtensionFromMime(mimeType);
  const filename = `${crypto.randomUUID()}${ext}`;
  const filepath = path.join(targetDir, filename);

  const buffer = Buffer.from(await blob.arrayBuffer());
  await writeFile(filepath, buffer);

  const relativePath = subDir ? `uploads/${subDir}/${filename}` : `uploads/${filename}`;

  return {
    url: `/${relativePath}`,
    filename,
    size: buffer.length,
    mimeType,
  };
}

export async function deleteFile(url: string): Promise<boolean> {
  try {
    // 从 URL 中提取文件路径
    const filePath = path.join(process.cwd(), "public", url);
    const fs = await import("fs/promises");
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "application/pdf": ".pdf",
  };
  return mimeMap[mimeType] || "";
}
