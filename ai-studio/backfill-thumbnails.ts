import fs from "fs";
import path from "path";
import sharp from "sharp";
import prisma from "./src/lib/prisma";

async function backfillThumbnails() {
  console.log("开始补充缺失的缩略图...");

  const generations = await prisma.generation.findMany({
    where: {
      status: "COMPLETED",
      thumbnailUrl: null,
      outputUrl: { not: null },
      type: {
        in: ["TEXT_TO_IMAGE", "IMAGE_TO_IMAGE", "INPAINT", "EDIT", "ARCHITECTURE"],
      },
    },
    select: {
      id: true,
      outputUrl: true,
      userId: true,
    },
  });

  console.log(`找到 ${generations.length} 条需要补充缩略图的记录`);

  let successCount = 0;
  let failCount = 0;

  for (const gen of generations) {
    if (!gen.outputUrl) continue;

    // 构建实际文件路径
    const outputFilename = path.basename(gen.outputUrl);
    const outputDir = path.join(process.cwd(), "public", "outputs", gen.userId);
    const filepath = path.join(outputDir, outputFilename);

    if (!fs.existsSync(filepath)) {
      console.log(`[跳过] 文件不存在: ${filepath}`);
      failCount++;
      continue;
    }

    try {
      const thumbFilename = `${gen.id}_thumb.jpg`;
      const thumbPath = path.join(outputDir, thumbFilename);
      const thumbnailUrl = `/outputs/${gen.userId}/${thumbFilename}`;

      await sharp(filepath).resize(256, 256, { fit: "inside" }).jpeg({ quality: 70 }).toFile(thumbPath);

      await prisma.generation.update({
        where: { id: gen.id },
        data: { thumbnailUrl },
      });

      console.log(`[成功] ${gen.id} -> ${thumbnailUrl}`);
      successCount++;
    } catch (err) {
      console.error(`[失败] ${gen.id}:`, err);
      failCount++;
    }
  }

  console.log(`\n完成! 成功: ${successCount}, 失败: ${failCount}`);
  await prisma.$disconnect();
}

backfillThumbnails().catch(console.error);
