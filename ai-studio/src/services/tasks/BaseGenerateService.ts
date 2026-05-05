import fs from "fs";
import path from "path";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import type { GenType, GenStatus } from "@/types/generation";
import type { GenerateTaskParams, GenerateTaskResult, GenerateService } from "./GenerateService";
import { deductCredits } from "../credit.service";

export abstract class BaseGenerateService implements GenerateService {
  abstract execute(params: GenerateTaskParams): Promise<GenerateTaskResult>;
  abstract getType(): GenType;
  abstract getCost(model?: string): number;

  protected async createGenerationRecord(userId: string, prompt: string, params: Record<string, any>, inputUrl?: string): Promise<any> {
    return await prisma.generation.create({
      data: {
        userId,
        type: this.getType(),
        status: "PROCESSING" as GenStatus,
        prompt,
        params: JSON.stringify(params),
        inputUrl: inputUrl?.substring(0, 255) || null,
        cost: this.getCost(params.model),
      },
    });
  }

  protected async saveImage(userId: string, generationId: string, base64Data: string, mimeType: string): Promise<{ outputUrl: string; thumbnailUrl: string }> {
    const outputDir = path.join(process.cwd(), "public", "outputs", userId);
    fs.mkdirSync(outputDir, { recursive: true });

    const ext = mimeType.split("/")[1] || "png";
    const filename = `${generationId}.${ext}`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));

    const outputUrl = `/outputs/${userId}/${filename}`;
    let thumbnailUrl = outputUrl;

    try {
      const thumbFilename = `${generationId}_thumb.jpg`;
      const thumbPath = path.join(outputDir, thumbFilename);
      await sharp(filepath).resize(256, 256, { fit: "inside" }).jpeg({ quality: 70 }).toFile(thumbPath);
      thumbnailUrl = `/outputs/${userId}/${thumbFilename}`;
    } catch {
      // 缩略图生成失败不影响主流程
    }

    return { outputUrl, thumbnailUrl };
  }

  protected async deductUserCredits(userId: string, generationId: string, cost: number, remark: string): Promise<boolean> {
    const deductionResult = await deductCredits({
      userId,
      amount: cost,
      type: "GENERATE",
      refId: generationId,
      remark,
    });

    if (!deductionResult.success) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "FAILED" as GenStatus,
          errorMsg: deductionResult.error || "积分扣减失败",
        },
      });
      throw new Error(deductionResult.error || "积分扣减失败");
    }

    return true;
  }

  protected async updateGenerationStatus(generationId: string, status: GenStatus, data?: Partial<any>): Promise<any> {
    return await prisma.generation.update({
      where: { id: generationId },
      data: {
        status,
        ...data,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      },
    });
  }

  protected async handleError(generationId: string, error: any): Promise<void> {
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: "FAILED" as GenStatus,
        errorMsg: error instanceof Error ? error.message : "生成失败",
      },
    });
    throw error;
  }
}
