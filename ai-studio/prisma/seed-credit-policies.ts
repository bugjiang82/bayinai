import { PrismaClient } from "@prisma/client";
import { getAllDefaultPolicies } from "../src/models/creditRules";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding credit policies with mock test data...\n");

  // ==================== 先清除所有旧策略 ====================
  await prisma.creditPolicy.deleteMany();
  console.log("✓ Cleared existing credit policies\n");

  // ==================== 写入精细化图片积分规则 ====================
  const imagePolicies = [
    // Flash 模型 - 4种质量
    { key: "flash__512", name: "Flash - 512", description: "Flash 模型 512 分辨率", cost: 1, unit: "次", category: "image" },
    { key: "flash__1k", name: "Flash - 1K", description: "Flash 模型 1K 分辨率（默认）", cost: 2, unit: "次", category: "image" },
    { key: "flash__2k", name: "Flash - 2K", description: "Flash 模型 2K 分辨率", cost: 4, unit: "次", category: "image" },
    { key: "flash__4k", name: "Flash - 4K", description: "Flash 模型 4K 分辨率", cost: 8, unit: "次", category: "image" },

    // Pro 模型 - 4种质量
    { key: "pro__512", name: "Pro - 512", description: "Pro 模型 512 分辨率", cost: 3, unit: "次", category: "image" },
    { key: "pro__1k", name: "Pro - 1K", description: "Pro 模型 1K 分辨率", cost: 5, unit: "次", category: "image" },
    { key: "pro__2k", name: "Pro - 2K", description: "Pro 模型 2K 分辨率", cost: 8, unit: "次", category: "image" },
    { key: "pro__4k", name: "Pro - 4K", description: "Pro 模型 4K 分辨率", cost: 15, unit: "次", category: "image" },

    // Image2 模型 - 3种质量 (不支持512)
    { key: "image2__1k", name: "Image2 - 1K", description: "Image2 模型 1K 分辨率", cost: 50, unit: "次", category: "image" },
    { key: "image2__2k", name: "Image2 - 2K", description: "Image2 模型 2K 分辨率", cost: 100, unit: "次", category: "image" },
    { key: "image2__4k", name: "Image2 - 4K", description: "Image2 模型 4K 分辨率", cost: 200, unit: "次", category: "image" },
  ];

  for (const p of imagePolicies) {
    await prisma.creditPolicy.create({ data: p });
  }
  console.log(`✓ Created ${imagePolicies.length} image credit policies (精细化1K/2K/4K规则)`);

  // ==================== 写入精细化视频积分规则（按秒计费） ====================
  const videoPolicies = [
    // 万相 2.2 - 3种分辨率
    { key: "wan2-2-kf2v-flash__480p", name: "万相 2.2 - 480P", description: "按秒计费", cost: 20, unit: "积分/秒", category: "video" },
    { key: "wan2-2-kf2v-flash__720p", name: "万相 2.2 - 720P", description: "按秒计费", cost: 30, unit: "积分/秒", category: "video" },
    { key: "wan2-2-kf2v-flash__1080p", name: "万相 2.2 - 1080P", description: "按秒计费", cost: 50, unit: "积分/秒", category: "video" },

    // 万相 2.7 图生视频 - 2种分辨率
    { key: "wan2-7-r2v__720p", name: "万相 2.7 (图生) - 720P", description: "按秒计费", cost: 40, unit: "积分/秒", category: "video" },
    { key: "wan2-7-r2v__1080p", name: "万相 2.7 (图生) - 1080P", description: "按秒计费", cost: 60, unit: "积分/秒", category: "video" },

    // 万相 2.7 文生视频 - 2种分辨率
    { key: "wan2-7-t2v__720p", name: "万相 2.7 (文生) - 720P", description: "按秒计费", cost: 40, unit: "积分/秒", category: "video" },
    { key: "wan2-7-t2v__1080p", name: "万相 2.7 (文生) - 1080P", description: "按秒计费", cost: 60, unit: "积分/秒", category: "video" },

    // HappyHorse 文生视频 - 2种分辨率
    { key: "happyhorse-1-0-t2v__720p", name: "HappyHorse (文生) - 720P", description: "按秒计费", cost: 35, unit: "积分/秒", category: "video" },
    { key: "happyhorse-1-0-t2v__1080p", name: "HappyHorse (文生) - 1080P", description: "按秒计费", cost: 55, unit: "积分/秒", category: "video" },

    // HappyHorse 图生视频 - 2种分辨率
    { key: "happyhorse-1-0-i2v__720p", name: "HappyHorse (图生) - 720P", description: "按秒计费", cost: 35, unit: "积分/秒", category: "video" },
    { key: "happyhorse-1-0-i2v__1080p", name: "HappyHorse (图生) - 1080P", description: "按秒计费", cost: 55, unit: "积分/秒", category: "video" },

    // Veo 3.1 - 1种分辨率
    { key: "veo-3-1-lite-generate-preview__720p", name: "Veo 3.1 - 720P", description: "按秒计费", cost: 50, unit: "积分/秒", category: "video" },
  ];

  for (const p of videoPolicies) {
    await prisma.creditPolicy.create({ data: p });
  }
  console.log(`✓ Created ${videoPolicies.length} video credit policies (精细化按秒计费规则)`);

  // ==================== 写入其他分类积分规则 ====================
  const otherPolicies = [
    { key: "architecture-flash", name: "进阶设计-Flash", description: "SU高清渲染/CAD转3D", cost: 3, unit: "次", category: "architecture" },
    { key: "architecture-pro", name: "进阶设计-Pro", description: "SU高清渲染/CAD转3D", cost: 3, unit: "次", category: "architecture" },
    { key: "edit-flash", name: "图片编辑-Flash", description: "局部重绘", cost: 1, unit: "次", category: "edit" },
    { key: "edit-pro", name: "图片编辑-Pro", description: "局部重绘", cost: 3, unit: "次", category: "edit" },
    { key: "workflow-image", name: "工作流-图片", description: "工作流图片节点", cost: 1, unit: "次", category: "workflow" },
    { key: "automation-test", name: "自动化测试", description: "AI编排自动化测试", cost: 10, unit: "次", category: "other" },
  ];

  for (const p of otherPolicies) {
    await prisma.creditPolicy.create({ data: p });
  }
  console.log(`✓ Created ${otherPolicies.length} other credit policies\n`);

  // ==================== 汇总统计 ====================
  const total = imagePolicies.length + videoPolicies.length + otherPolicies.length;
  console.log(`✅ 总计创建 ${total} 条积分策略`);
  console.log("\n--- 图片积分矩阵 ---");
  console.log("模型      | 512  | 1K   | 2K   | 4K");
  console.log("---------|------|------|------|------");
  console.log("Flash    |  1   |  2   |  4   |  8");
  console.log("Pro      |  3   |  5   |  8   |  15");
  console.log("Image2   |  -   |  50  | 100  | 200");

  console.log("\n--- 视频积分矩阵 (积分/秒) ---");
  console.log("模型                  | 480P | 720P | 1080P");
  console.log("--------------------|------|------|-------");
  console.log("万相 2.2             |  20  |  30  |  50");
  console.log("万相 2.7 (图生/文生) |  -   |  40  |  60");
  console.log("HappyHorse (文生/图生)|  -   |  35  |  55");
  console.log("Veo 3.1             |  -   |  50  |  -");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });