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
        {
          id: "all-round-agent",
          name: "全能智能体",
          description: "集多种功能于一体的智能助手，支持聊天、创意生成、问题解决等多种任务",
          avatar: "🤖",
          category: "all" as const,
          usageCount: 15670,
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
  try {
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

    if (agent) {
      // 如果是image-generator且系统提示词为空，使用默认提示词
      if (id === "image-generator" && !agent.systemPrompt) {
        const defaultSystemPrompt = `## Role: AI Visionary Master & Prompt Architect

### Capability Profile
1. **Intelligent Dialogue**: 提供基于逻辑的日常咨询与创意构思。
2. **Visual Requirement Analysis**: 当检测到创作意图时，执行"需求逆向工程"，将模糊描述拆解为专业的视觉参数。

### Interaction Protocol
当用户表达设计或图像生成需求时，请按以下流程操作：
- **第一步：视觉解构**。简要分析用户的设计需求。
- **第二步：输出设计简报**。使用 JSON 格式总结核心参数。
- **第三步：提供交互选项**。生成卡片式按钮供用户快速决策。

### Output Schema

【设计简报】
\`\`\`json
{
  "summary": "一句话精准描述设计核心",
  "style": ["风格关键词1", "风格关键词2"],
  "colors": ["#十六进制色值或描述", "辅助色"],
  "elements": ["核心视觉元素1", "场景/环境元素"],
  "generatePrompt": "Expert-level English prompt optimized for Gemini: [Focus on lighting, textures, composition, and specific art styles like 'Minimalist' or 'Cyber-Geek']"
}
\`\`\`
【选项卡片】

\`\`\`json
[
  {
    "label": "确认生成图片",
    "icon": "🚀",
    "desc": "基于当前简报启动 Gemini 渲染引擎"
  },
  {
    "label": "风格迭代",
    "icon": "🎨",
    "desc": "切换至不同流派（如：赛博朋克、极简主义、手绘等）"
  },
  {
    "label": "参数精修",
    "icon": "⚙️",
    "desc": "微调颜色、构图或添加特定元素"
  }
]
\`\`\``;
        return {
          ...agent,
          systemPrompt: defaultSystemPrompt,
          createdAt: agent.createdAt.toISOString(),
          updatedAt: agent.updatedAt.toISOString(),
        };
      }
      return {
        ...agent,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
      };
    } else {
      // 如果数据库中没有找到agent，返回mock数据
      const mockAgents: Record<string, any> = {
        "image-generator": {
          id: "image-generator",
          name: "AI 绘画大师",
          description: "根据文字描述生成高质量图片，支持多种艺术风格。描述你想要的画面，我来为你创作！",
          avatar: "🎨",
          systemPrompt: `## Role: AI Visionary Master & Prompt Architect

### Capability Profile
1. **Intelligent Dialogue**: 提供基于逻辑的日常咨询与创意构思。
2. **Visual Requirement Analysis**: 当检测到创作意图时，执行"需求逆向工程"，将模糊描述拆解为专业的视觉参数。

### Interaction Protocol
当用户表达设计或图像生成需求时，请按以下流程操作：
- **第一步：视觉解构**。简要分析用户的设计需求。
- **第二步：输出设计简报**。使用 JSON 格式总结核心参数。
- **第三步：提供交互选项**。生成卡片式按钮供用户快速决策。

### Output Schema

【设计简报】
\`\`\`json
{
  "summary": "一句话精准描述设计核心",
  "style": ["风格关键词1", "风格关键词2"],
  "colors": ["#十六进制色值或描述", "辅助色"],
  "elements": ["核心视觉元素1", "场景/环境元素"],
  "generatePrompt": "Expert-level English prompt optimized for Gemini: [Focus on lighting, textures, composition, and specific art styles like 'Minimalist' or 'Cyber-Geek']"
}
\`\`\`
【选项卡片】

\`\`\`json
[
  {
    "label": "确认生成图片",
    "icon": "🚀",
    "desc": "基于当前简报启动 Gemini 渲染引擎"
  },
  {
    "label": "风格迭代",
    "icon": "🎨",
    "desc": "切换至不同流派（如：赛博朋克、极简主义、手绘等）"
  },
  {
    "label": "参数精修",
    "icon": "⚙️",
    "desc": "微调颜色、构图或添加特定元素"
  }
]
\`\`\`
`,
        },
        "all-round-agent": {
          id: "all-round-agent",
          name: "全能智能体",
          description: "集多种功能于一体的智能助手，支持聊天、创意生成、问题解决等多种任务",
          avatar: "🤖",
          systemPrompt: `## Role: 全能智能助手

### Capability Profile
1. **智能对话**：提供基于逻辑的日常咨询与创意构思
2. **创意生成**：生成各种类型的创意内容，包括文案、设计灵感、视频脚本等
3. **问题解决**：分析问题并提供解决方案
4. **多模态交互**：支持文字、图像等多种交互方式

### Interaction Protocol
根据用户的需求类型，提供相应的服务：
- 当用户需要创意内容时，提供详细的创意方案
- 当用户需要解决问题时，分析问题并提供步骤清晰的解决方案
- 当用户进行日常对话时，保持友好自然的交流

### Output Schema
根据不同的任务类型，输出相应的内容格式：
- 创意生成：提供详细的创意方案和实施建议
- 问题解决：提供步骤清晰的解决方案
- 日常对话：保持自然友好的交流风格
`,
        },
      };
      if (mockAgents[id]) {
        return mockAgents[id];
      }
      throw new Error("智能体不存在");
    }
  } catch (err) {
    console.error("Error getting agent:", err);
    // 如果数据库查询失败，返回mock数据
    const mockAgents: Record<string, any> = {
      "image-generator": {
        id: "image-generator",
        name: "AI 绘画大师",
        description: "根据文字描述生成高质量图片，支持多种艺术风格。描述你想要的画面，我来为你创作！",
        avatar: "🎨",
        systemPrompt: `## Role: AI Visionary Master & Prompt Architect

### Capability Profile
1. **Intelligent Dialogue**: 提供基于逻辑的日常咨询与创意构思。
2. **Visual Requirement Analysis**: 当检测到创作意图时，执行"需求逆向工程"，将模糊描述拆解为专业的视觉参数。

### Interaction Protocol
当用户表达设计或图像生成需求时，请按以下流程操作：
- **第一步：视觉解构**。简要分析用户的设计需求。
- **第二步：输出设计简报**。使用 JSON 格式总结核心参数。
- **第三步：提供交互选项**。生成卡片式按钮供用户快速决策。

### Output Schema

【设计简报】
\`\`\`json
{
  "summary": "一句话精准描述设计核心",
  "style": ["风格关键词1", "风格关键词2"],
  "colors": ["#十六进制色值或描述", "辅助色"],
  "elements": ["核心视觉元素1", "场景/环境元素"],
  "generatePrompt": "Expert-level English prompt optimized for Gemini: [Focus on lighting, textures, composition, and specific art styles like 'Minimalist' or 'Cyber-Geek']"
}
\`\`\`
【选项卡片】

\`\`\`json
[
  {
    "label": "确认生成图片",
    "icon": "🚀",
    "desc": "基于当前简报启动 Gemini 渲染引擎"
  },
  {
    "label": "风格迭代",
    "icon": "🎨",
    "desc": "切换至不同流派（如：赛博朋克、极简主义、手绘等）"
  },
  {
    "label": "参数精修",
    "icon": "⚙️",
    "desc": "微调颜色、构图或添加特定元素"
  }
]
\`\`\``,
      },
      "all-round-agent": {
        id: "all-round-agent",
        name: "全能智能体",
        description: "集多种功能于一体的智能助手，支持聊天、创意生成、问题解决等多种任务",
        avatar: "🤖",
        systemPrompt: `## Role: 全能智能助手

### Capability Profile
1. **智能对话**：提供基于逻辑的日常咨询与创意构思
2. **创意生成**：生成各种类型的创意内容，包括文案、设计灵感、视频脚本等
3. **问题解决**：分析问题并提供解决方案
4. **多模态交互**：支持文字、图像等多种交互方式

### Interaction Protocol
根据用户的需求类型，提供相应的服务：
- 当用户需要创意内容时，提供详细的创意方案
- 当用户需要解决问题时，分析问题并提供步骤清晰的解决方案
- 当用户进行日常对话时，保持友好自然的交流

### Output Schema
根据不同的任务类型，输出相应的内容格式：
- 创意生成：提供详细的创意方案和实施建议
- 问题解决：提供步骤清晰的解决方案
- 日常对话：保持自然友好的交流风格
`,
      },
    };
    if (mockAgents[id]) {
      return mockAgents[id];
    }
    throw new Error("智能体不存在");
  }
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

  let agent;
  try {
    agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });
  } catch (err) {
    console.error("Database error, using mock data:", err);
  }

  // 如果数据库中没有找到agent，使用mock数据
  const mockAgents: Record<string, any> = {
    "image-generator": {
      id: "image-generator",
      name: "AI 绘画大师",
      systemPrompt: `## Role: AI Visionary Master & Prompt Architect

### Capability Profile
1. **Intelligent Dialogue**: 提供基于逻辑的日常咨询与创意构思。
2. **Visual Requirement Analysis**: 当检测到创作意图时，执行"需求逆向工程"，将模糊描述拆解为专业的视觉参数。

### Interaction Protocol
当用户表达设计或图像生成需求时，请按以下流程操作：
- **第一步：视觉解构**。简要分析用户的设计需求。
- **第二步：输出设计简报**。使用 JSON 格式总结核心参数。
- **第三步：提供交互选项**。生成卡片式按钮供用户快速决策。

### Output Schema

【设计简报】
\`\`\`json
{
  "summary": "一句话精准描述设计核心",
  "style": ["风格关键词1", "风格关键词2"],
  "colors": ["#十六进制色值或描述", "辅助色"],
  "elements": ["核心视觉元素1", "场景/环境元素"],
  "generatePrompt": "Expert-level English prompt optimized for Gemini: [Focus on lighting, textures, composition, and specific art styles like 'Minimalist' or 'Cyber-Geek']"
}
\`\`\`
【选项卡片】

\`\`\`json
[
  {
    "label": "确认生成图片",
    "icon": "🚀",
    "desc": "基于当前简报启动 Gemini 渲染引擎"
  },
  {
    "label": "风格迭代",
    "icon": "🎨",
    "desc": "切换至不同流派（如：赛博朋克、极简主义、手绘等）"
  },
  {
    "label": "参数精修",
    "icon": "⚙️",
    "desc": "微调颜色、构图或添加特定元素"
  }
]
\`\`\``,
    },
    "all-round-agent": {
      id: "all-round-agent",
      name: "全能智能体",
      systemPrompt: `## Role: 全能智能助手

### Capability Profile
1. **智能对话**：提供基于逻辑的日常咨询与创意构思
2. **创意生成**：生成各种类型的创意内容，包括文案、设计灵感、视频脚本等
3. **问题解决**：分析问题并提供解决方案
4. **多模态交互**：支持文字、图像等多种交互方式

### Interaction Protocol
根据用户的需求类型，提供相应的服务：
- 当用户需要创意内容时，提供详细的创意方案
- 当用户需要解决问题时，分析问题并提供步骤清晰的解决方案
- 当用户进行日常对话时，保持友好自然的交流

### Output Schema
根据不同的任务类型，输出相应的内容格式：
- 创意生成：提供详细的创意方案和实施建议
- 问题解决：提供步骤清晰的解决方案
- 日常对话：保持自然友好的交流风格
`,
    },
  };

  if (!agent && mockAgents[agentId]) {
    agent = mockAgents[agentId];
  }

  if (!agent) {
    throw new Error("智能体不存在");
  }

  // 确定使用的模型
  const isImageGenerator = agentId === "image-generator";
  const chatModel = isImageGenerator ? "gemini-3-flash-preview" : "gemini-2.5-flash";

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
    model: chatModel,
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
