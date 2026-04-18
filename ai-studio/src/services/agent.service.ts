import prisma from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "" });

export async function getAgents() {
  try {
    const agents = await prisma.agent.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        isPublic: true,
        sortOrder: true,
        _count: {
          select: { generations: true },
        },
      },
    });

    if (agents.length === 0) {
      // 如果数据库中没有智能体，返回mock数据
      return [
        {
          id: "video-creator",
          name: "视频创作助手",
          description: "帮你快速生成创意短视频脚本，支持多种风格和场景",
          avatar: "🎬",
          category: "video" as const,
          usageCount: 12580,
        },
        {
          id: "image-generator",
          name: "AI 绘画大师",
          description: "根据文字描述生成高质量图片，支持多种艺术风格",
          avatar: "🎨",
          category: "image" as const,
          usageCount: 34210,
        },
        {
          id: "design-assistant",
          name: "设计灵感助手",
          description: "提供设计灵感和方案，涵盖 UI/UX、品牌、海报等",
          avatar: "✨",
          category: "design" as const,
          usageCount: 8930,
        },
        {
          id: "copy-writer",
          name: "文案创作专家",
          description: "帮你撰写营销文案、社媒内容、品牌故事等",
          avatar: "📝",
          category: "image" as const,
          usageCount: 21760,
        },
      ];
    }

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar: agent.avatar || "🤖",
      category: "image" as const, // 默认分类为 image
      isPublic: agent.isPublic,
      sortOrder: agent.sortOrder,
      usageCount: agent._count.generations,
    }));
  } catch (err) {
    console.error("Error fetching agents from DB:", err);
    // 如果数据库查询失败，返回mock数据
    return [
      {
        id: "video-creator",
        name: "视频创作助手",
        description: "帮你快速生成创意短视频脚本，支持多种风格和场景",
        avatar: "🎬",
        category: "video" as const,
        usageCount: 12580,
      },
      {
        id: "image-generator",
        name: "AI 绘画大师",
        description: "根据文字描述生成高质量图片，支持多种艺术风格",
        avatar: "🎨",
        category: "image" as const,
        usageCount: 34210,
      },
      {
        id: "design-assistant",
        name: "设计灵感助手",
        description: "提供设计灵感和方案，涵盖 UI/UX、品牌、海报等",
        avatar: "✨",
        category: "design" as const,
        usageCount: 8930,
      },
      {
        id: "copy-writer",
        name: "文案创作专家",
        description: "帮你撰写营销文案、社媒内容、品牌故事等",
        avatar: "📝",
        category: "image" as const,
        usageCount: 21760,
      },
    ];
  }
}

export async function getAgentById(id: string) {
  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      avatar: true,
      systemPrompt: true,
      config: true,
      isPublic: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!agent) {
    throw new Error("智能体不存在");
  }

  return {
    ...agent,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  };
}

export interface ChatWithAgentParams {
  agentId: string;
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ChatResponse {
  text: string;
  options?: Array<{
    id: string;
    label: string;
    description?: string;
    value: string;
  }>;
}

export async function chatWithAgent(
  params: ChatWithAgentParams
): Promise<ChatResponse> {
  const { agentId, message, history = [] } = params;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error("智能体不存在");
  }

  // 构建对话内容
  const contents = [
    ...history.map((msg) => ({
      role: msg.role as "user" | "model",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user" as const,
      parts: [{ text: message }],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: agent.systemPrompt,
    },
  });

  const text =
    response.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join("") || "抱歉，我无法回复。";

  return { text };
}
