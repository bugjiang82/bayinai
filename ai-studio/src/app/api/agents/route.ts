import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { getAgents } from "@/services/agent.service";
import { success, error } from "@/types/api";

// 定义Mock数据
const MOCK_AGENTS = [
  {
    id: "video-creator",
    name: "视频创作助手",
    description: "帮你快速生成创意短视频脚本，支持多种风格和场景",
    avatar: "🎬",
    category: "video",
    usageCount: 12580,
  },
  {
    id: "image-generator",
    name: "AI 绘画大师",
    description: "根据文字描述生成高质量图片，支持多种艺术风格",
    avatar: "🎨",
    category: "image",
    usageCount: 34210,
  },
  {
    id: "design-assistant",
    name: "设计灵感助手",
    description: "提供设计灵感和方案，涵盖 UI/UX、品牌、海报等",
    avatar: "✨",
    category: "design",
    usageCount: 8930,
  },
  {
    id: "copy-writer",
    name: "文案创作专家",
    description: "帮你撰写营销文案、社媒内容、品牌故事等",
    avatar: "📝",
    category: "image",
    usageCount: 21760,
  },
  {
    id: "all-round-agent",
    name: "全能智能体",
    description: "集多种功能于一体的智能助手，支持聊天、创意生成、问题解决等多种任务",
    avatar: "🤖",
    category: "all",
    usageCount: 15670,
  },
];

export async function GET() {
  try {
    const agents = await getAgents();
    logger.info("Agents from DB:", agents);
    return NextResponse.json(success(agents));
  } catch (err) {
    logger.error("Error getting agents:", err);
    // 如果数据库查询失败，返回mock数据
    return NextResponse.json(success(MOCK_AGENTS));
  }
}
