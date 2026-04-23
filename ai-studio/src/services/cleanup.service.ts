import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

const CLEANUP_DAYS = 15;

export interface CleanupResult {
  deletedCount: number;
  failedCount: number;
  errors: string[];
}

export async function cleanupOldGenerations(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    const cutoffDate = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);

    const oldRecords = await prisma.generation.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        favorited: false,
        status: "COMPLETED",
      },
      select: {
        id: true,
        outputUrl: true,
        thumbnailUrl: true,
      },
    });

    for (const record of oldRecords) {
      try {
        if (record.outputUrl && record.outputUrl.startsWith("/outputs/")) {
          const filePath = path.join(process.cwd(), "public", record.outputUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        if (record.thumbnailUrl && record.thumbnailUrl.startsWith("/outputs/")) {
          const thumbPath = path.join(process.cwd(), "public", record.thumbnailUrl);
          if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
          }
        }

        await prisma.generation.delete({
          where: { id: record.id },
        });

        result.deletedCount++;
      } catch (error) {
        result.failedCount++;
        const message = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Failed to delete record ${record.id}: ${message}`);
      }
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Cleanup failed: ${message}`);
  }
}
