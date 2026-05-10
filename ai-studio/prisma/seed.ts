import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 删除并重建 CreditPolicy 表（确保字段类型正确）
  try {
    await prisma.$executeRaw`DROP TABLE IF EXISTS CreditPolicy`;
    console.log("Dropped existing CreditPolicy table");
    
    await prisma.$executeRaw`CREATE TABLE CreditPolicy (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      cost INTEGER DEFAULT 1 NOT NULL,
      unit TEXT DEFAULT '次' NOT NULL,
      category TEXT DEFAULT 'image' NOT NULL,
      isActive INTEGER DEFAULT 1 NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`;
    console.log("Recreated CreditPolicy table with correct schema");
  } catch (e) {
    console.log("Error recreating CreditPolicy table:", e);
  }

  // 清理其他已有数据（按依赖顺序）
  await prisma.creditLog.deleteMany();
  await prisma.creditTransfer.deleteMany();
  await prisma.generation.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.template.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ==================== 创建测试用户 ====================
  const hashedPassword = await bcrypt.hash("123456", 12);

  const testUser = await prisma.user.create({
    data: {
      email: "test@test.com",
      password: hashedPassword,
      name: "测试用户",
      credits: 100,
      role: "USER",
      industry: "建筑设计",
    },
  });
  console.log(`Created test user: ${testUser.email}`);

  // 创建管理员账户
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@admin.com",
      password: hashedPassword,
      name: "管理员",
      credits: 9999,
      role: "ADMIN",
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  // ==================== 创建预设智能体 ====================
  const agents = await prisma.agent.createMany({
    data: [
      {
        name: "建筑漫游视频助手",
        description: "基于建筑效果图自动生成高质量漫游视频，支持多种视角和运镜方式",
        avatar: "/agents/arch-walkthrough.jpg",
        systemPrompt:
          "你是一个专业的建筑漫游视频生成助手。根据用户提供的建筑效果图或描述，生成逼真的建筑漫游视频。你需要理解建筑空间布局，选择合适的摄像机路径和运镜方式，确保视频流畅自然。",
        config: JSON.stringify({
          defaultParams: {
            duration: 10,
            fps: 30,
            resolution: "1920x1080",
            cameraPath: "orbit",
          },
          costPerGeneration: 5,
        }),
        isPublic: true,
        sortOrder: 1,
      },
      {
        name: "效果图生成助手",
        description: "根据文字描述或草图快速生成高质量建筑效果图",
        avatar: "/agents/render.jpg",
        systemPrompt:
          "你是一个专业的建筑效果图生成助手。根据用户提供的文字描述、草图或参考图片，生成高质量的建筑效果图。你需要理解建筑设计意图，选择合适的光照、材质和视角，确保效果图真实可信。",
        config: JSON.stringify({
          defaultParams: {
            width: 1920,
            height: 1080,
            steps: 30,
            cfgScale: 7.5,
          },
          costPerGeneration: 3,
        }),
        isPublic: true,
        sortOrder: 2,
      },
      {
        name: "室内设计风格转换",
        description: "将现有室内设计图片转换为不同的设计风格，如现代、中式、北欧等",
        avatar: "/agents/interior-style.jpg",
        systemPrompt:
          "你是一个专业的室内设计风格转换助手。根据用户提供的室内照片和目标风格描述，生成对应风格的室内设计效果图。支持现代简约、新中式、北欧、日式、工业风等多种风格转换。",
        config: JSON.stringify({
          defaultParams: {
            strength: 0.75,
            steps: 40,
            cfgScale: 8,
          },
          supportedStyles: [
            "现代简约",
            "新中式",
            "北欧风格",
            "日式和风",
            "工业风格",
            "法式浪漫",
            "美式轻奢",
            "地中海风格",
          ],
          costPerGeneration: 3,
        }),
        isPublic: true,
        sortOrder: 3,
      },
      {
        name: "场景渲染助手",
        description: "专业的3D场景渲染服务，支持室内外场景的高质量渲染输出",
        avatar: "/agents/scene-render.jpg",
        systemPrompt:
          "你是一个专业的3D场景渲染助手。根据用户提供的场景描述或模型信息，生成高质量的场景渲染图。你擅长处理光照计算、材质表现和环境氛围营造，能够输出照片级渲染效果。",
        config: JSON.stringify({
          defaultParams: {
            width: 2048,
            height: 1536,
            samples: 64,
            denoising: true,
          },
          costPerGeneration: 5,
        }),
        isPublic: true,
        sortOrder: 4,
      },
      {
        name: "图生图创意助手",
        description: "基于参考图片进行创意变换，支持风格迁移、元素替换和创意合成",
        avatar: "/agents/img2img.jpg",
        systemPrompt:
          "你是一个专业的图生图创意助手。根据用户提供的参考图片和创意描述，生成新的创意图像。你擅长风格迁移、元素替换、创意合成等操作，能够将用户的创意想法转化为视觉作品。",
        config: JSON.stringify({
          defaultParams: {
            strength: 0.6,
            steps: 45,
            cfgScale: 7,
          },
          costPerGeneration: 3,
        }),
        isPublic: true,
        sortOrder: 5,
      },
    ],
  });
  console.log(`Created ${agents.count} agents`);

  // ==================== 创建预设模板 ====================
  const templates = await prisma.template.createMany({
    data: [
      // 建筑风格模板 (2个)
      {
        title: "现代简约住宅",
        description: "极简线条与大面积玻璃幕墙结合的现代住宅建筑",
        coverImage: "/templates/modern-house.jpg",
        category: "建筑风格",
        tags: JSON.stringify(["现代", "简约", "住宅", "别墅"]),
        prompt:
          "一座现代简约风格的独栋住宅，大面积落地玻璃窗，白色外墙，平坦屋顶，极简线条设计，周围有精心修剪的草坪和少量景观树木，阳光充足，建筑摄影风格，高清",
        negativePrompt: "模糊, 低质量, 变形, 多余的建筑, 杂乱的背景",
        params: JSON.stringify({
          width: 1920,
          height: 1080,
          steps: 50,
          cfgScale: 7.5,
        }),
        isPublic: true,
        sortOrder: 1,
      },
      {
        title: "新中式庭院建筑",
        description: "融合传统中式元素与现代设计语言的庭院建筑",
        coverImage: "/templates/chinese-courtyard.jpg",
        category: "建筑风格",
        tags: JSON.stringify(["中式", "庭院", "传统", "文化"]),
        prompt:
          "一座新中式风格的庭院建筑，白墙黛瓦，飞檐翘角，木质结构细节，庭院中有假山流水和竹林，石板小路，传统与现代完美融合，建筑摄影，柔和自然光",
        negativePrompt: "模糊, 低质量, 西式建筑, 杂乱, 过度装饰",
        params: JSON.stringify({
          width: 1920,
          height: 1080,
          steps: 50,
          cfgScale: 7.5,
        }),
        isPublic: true,
        sortOrder: 2,
      },
      // 室内设计模板 (2个)
      {
        title: "北欧风客厅",
        description: "明亮简洁的北欧风格客厅设计，注重自然材质与舒适感",
        coverImage: "/templates/nordic-living.jpg",
        category: "室内设计",
        tags: JSON.stringify(["北欧", "客厅", "简约", "明亮"]),
        prompt:
          "一个北欧风格的客厅，大面积白色墙面，浅色木地板，灰色布艺沙发，原木茶几，简约吊灯，绿植点缀，大面积窗户引入自然光，温馨舒适的氛围，室内设计摄影，广角镜头",
        negativePrompt: "暗沉, 杂乱, 华丽装饰, 深色调, 拥挤",
        params: JSON.stringify({
          width: 1920,
          height: 1080,
          steps: 50,
          cfgScale: 7.5,
        }),
        isPublic: true,
        sortOrder: 3,
      },
      {
        title: "现代轻奢主卧",
        description: "低调奢华的现代主卧设计，注重质感与细节",
        coverImage: "/templates/luxury-bedroom.jpg",
        category: "室内设计",
        tags: JSON.stringify(["轻奢", "卧室", "现代", "质感"]),
        prompt:
          "一个现代轻奢风格的主卧室，灰色调为主，丝绒床头，金属质感灯具，大理石纹路装饰，柔软地毯，落地窗帘，柔和的暖色灯光，高级感十足，室内设计摄影",
        negativePrompt: "简陋, 杂乱, 过于花哨, 低端材料, 暗淡",
        params: JSON.stringify({
          width: 1920,
          height: 1080,
          steps: 50,
          cfgScale: 7.5,
        }),
        isPublic: true,
        sortOrder: 4,
      },
      // 景观设计模板 (2个)
      {
        title: "现代城市广场",
        description: "开放式的现代城市公共广场景观设计",
        coverImage: "/templates/urban-plaza.jpg",
        category: "景观设计",
        tags: JSON.stringify(["城市", "广场", "公共空间", "现代"]),
        prompt:
          "一个现代城市公共广场，大面积铺装地面，几何形花坛和绿化带，现代雕塑作为视觉焦点，舒适的户外座椅，行道树提供遮荫，夜景照明设计，鸟瞰视角，建筑景观摄影",
        negativePrompt: "荒废, 杂乱, 旧式, 车辆过多, 污染",
        params: JSON.stringify({
          width: 1920,
          height: 1080,
          steps: 50,
          cfgScale: 7.5,
        }),
        isPublic: true,
        sortOrder: 5,
      },
      {
        title: "日式枯山水庭院",
        description: "宁静禅意的日式枯山水庭院景观设计",
        coverImage: "/templates/zen-garden.jpg",
        category: "景观设计",
        tags: JSON.stringify(["日式", "枯山水", "禅意", "庭院"]),
        prompt:
          "一个日式枯山水庭院，白色砂石铺设的枯山水景观，精心摆放的景石，苔藓覆盖的地面，修剪整齐的松树和竹子，石灯笼，木质回廊，宁静禅意的氛围，微距摄影风格",
        negativePrompt: "杂乱, 现代, 喧闹, 色彩鲜艳, 宽阔",
        params: JSON.stringify({
          width: 1920,
          height: 1080,
          steps: 50,
          cfgScale: 7.5,
        }),
        isPublic: true,
        sortOrder: 6,
      },
      // 效果图模板 (2个)
      {
        title: "商业综合体夜景",
        description: "城市商业综合体的夜景效果图，展示灯光与建筑的完美结合",
        coverImage: "/templates/commercial-night.jpg",
        category: "效果图",
        tags: JSON.stringify(["商业", "综合体", "夜景", "城市"]),
        prompt:
          "一座现代商业综合体的夜景效果图，玻璃幕墙反射着城市灯光，建筑外立面有LED灯光装饰，底层商业橱窗明亮，周围有城市街道和行人，黄昏时分的天际线，建筑可视化渲染，超高清",
        negativePrompt: "白天, 模糊, 低质量, 空旷, 破旧",
        params: JSON.stringify({
          width: 2048,
          height: 1536,
          steps: 64,
          cfgScale: 8,
        }),
        isPublic: true,
        sortOrder: 7,
      },
      {
        title: "高层办公大楼",
        description: "现代高层办公大楼的日景效果图，展示建筑与城市环境的融合",
        coverImage: "/templates/office-tower.jpg",
        category: "效果图",
        tags: JSON.stringify(["办公", "高层", "商业", "城市"]),
        prompt:
          "一座现代高层办公大楼的日景效果图，钢结构与玻璃幕墙设计，建筑造型简洁有力，蓝天白云背景，周围有城市道路和绿化带，建筑底部有大堂入口和景观设计，建筑可视化渲染，超高清",
        negativePrompt: "夜景, 模糊, 低质量, 旧式建筑, 杂乱",
        params: JSON.stringify({
          width: 2048,
          height: 1536,
          steps: 64,
          cfgScale: 8,
        }),
        isPublic: true,
        sortOrder: 8,
      },
    ],
  });
  console.log(`Created ${templates.count} templates`);

  // ==================== 创建积分日志 ====================
  await prisma.creditLog.create({
    data: {
      userId: testUser.id,
      type: "BONUS",
      amount: 80,
      balance: 100,
      remark: "新用户注册奖励",
    },
  });
  console.log("Created credit log for test user");

  // ==================== 创建积分策略配置 ====================
  // 注意：不提供 createdAt 和 updatedAt，让 Prisma 使用 @default(now()) 自动处理
  const creditPolicies = await prisma.creditPolicy.createMany({
    data: [
      // 文生图
      {
        key: "text-to-image-flash",
        name: "文生图-Flash",
        description: "快速文生图模型",
        cost: 1,
        unit: "次",
        category: "image",
        isActive: true,
      },
      {
        key: "text-to-image-pro",
        name: "文生图-Pro",
        description: "高质量文生图模型",
        cost: 3,
        unit: "次",
        category: "image",
        isActive: true,
      },
      {
        key: "text-to-image-image2",
        name: "文生图-Image2",
        description: "超强图像生成模型",
        cost: 50,
        unit: "次",
        category: "image",
        isActive: true,
      },
      // 图生图
      {
        key: "image-to-image-flash",
        name: "图生图-Flash",
        description: "快速图生图模型",
        cost: 1,
        unit: "次",
        category: "image",
        isActive: true,
      },
      {
        key: "image-to-image-pro",
        name: "图生图-Pro",
        description: "高质量图生图模型",
        cost: 3,
        unit: "次",
        category: "image",
        isActive: true,
      },
      {
        key: "image-to-image-image2",
        name: "图生图-Image2",
        description: "超强图像生成模型",
        cost: 50,
        unit: "次",
        category: "image",
        isActive: true,
      },
      // 进阶设计
      {
        key: "advanced-flash",
        name: "进阶设计-Flash",
        description: "SU高清渲染/CAD转3D",
        cost: 3,
        unit: "次",
        category: "image",
        isActive: true,
      },
      {
        key: "advanced-pro",
        name: "进阶设计-Pro",
        description: "SU高清渲染/CAD转3D",
        cost: 3,
        unit: "次",
        category: "image",
        isActive: true,
      },
      // 图片编辑（局部重绘）
      {
        key: "edit-flash",
        name: "图片编辑-Flash",
        description: "局部重绘",
        cost: 1,
        unit: "次",
        category: "image",
        isActive: true,
      },
      {
        key: "edit-pro",
        name: "图片编辑-Pro",
        description: "局部重绘",
        cost: 3,
        unit: "次",
        category: "image",
        isActive: true,
      },
      // 视频生成
      {
        key: "video-generation",
        name: "视频生成",
        description: "AI视频生成",
        cost: 50,
        unit: "秒",
        category: "video",
        isActive: true,
      },
    ],
  });
  console.log(`Created ${creditPolicies.count} credit policies`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
