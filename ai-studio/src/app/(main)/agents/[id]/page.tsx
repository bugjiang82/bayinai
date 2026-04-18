"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ChatArea from "@/components/agent/ChatArea";
import type { ChatMessage } from "@/components/agent/ChatArea";
import type { MessageOption } from "@/components/agent/MessageBubble";
import WorkflowSteps from "@/components/agent/WorkflowSteps";
import GalleryPanel, { type GalleryItem } from "@/components/agent/GalleryPanel";
import {
  Send,
  ArrowLeft,
  Video,
  Image,
  Palette,
  Sparkles,
  Film,
  Camera,
  Download,
} from "lucide-react";

interface AgentDetail {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
}

const MOCK_AGENTS: Record<string, AgentDetail> = {
  "video-creator": {
    id: "video-creator",
    name: "视频创作助手",
    description: "帮你快速生成创意短视频脚本，支持多种风格和场景。告诉我你的想法，我来帮你实现！",
    avatar: "🎬",
    systemPrompt: "你是一个专业的视频创作助手...",
  },
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
  "design-assistant": {
    id: "design-assistant",
    name: "设计灵感助手",
    description: "提供设计灵感和方案，涵盖 UI/UX、品牌、海报等。让我们一起探索创意！",
    avatar: "✨",
    systemPrompt: "你是一个专业的设计灵感助手...",
  },
};

const EXAMPLE_PROMPTS = [
  {
    icon: <Video className="h-5 w-5" />,
    title: "产品宣传视频",
    description: "生成一个科技产品的30秒宣传视频脚本",
    prompt: "帮我写一个科技产品宣传视频的脚本，时长30秒，风格现代简约",
  },
  {
    icon: <Image className="h-5 w-5" />,
    title: "社交媒体配图",
    description: "为社交媒体创作吸引眼球的配图",
    prompt: "帮我生成一张适合社交媒体的配图，主题是夏日海滩，色彩明亮",
  },
  {
    icon: <Palette className="h-5 w-5" />,
    title: "品牌视觉设计",
    description: "创建品牌视觉识别系统的设计方案",
    prompt: "帮我设计一个咖啡品牌的视觉方案，包括配色和风格建议",
  },
  {
    icon: <Film className="h-5 w-5" />,
    title: "短视频脚本",
    description: "创作一个有趣的短视频脚本",
    prompt: "帮我创作一个美食探店的短视频脚本，风格轻松有趣",
  },
];

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const { toast } = useToast();

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState("idle");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [currentGeneratePrompt, setCurrentGeneratePrompt] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch agent detail
  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && data.data) {
            setAgent(data.data);
          } else {
            setAgent(MOCK_AGENTS[agentId] || {
              id: agentId,
              name: "AI 助手",
              description: "你好！我是你的 AI 创作助手，有什么可以帮你的吗？",
              avatar: "🤖",
              systemPrompt: "",
            });
          }
        } else {
          setAgent(MOCK_AGENTS[agentId] || {
            id: agentId,
            name: "AI 助手",
            description: "你好！我是你的 AI 创作助手，有什么可以帮你的吗？",
            avatar: "🤖",
            systemPrompt: "",
          });
        }
      } catch {
        setAgent(MOCK_AGENTS[agentId] || {
          id: agentId,
          name: "AI 助手",
          description: "你好！我是你的 AI 创作助手，有什么可以帮你的吗？",
          avatar: "🤖",
          systemPrompt: "",
        });
      }
    }
    fetchAgent();
  }, [agentId]);

  const parseAIContent = useCallback((text: string) => {
    const result = {
      content: text,
      designBrief: null as any,
      options: [] as MessageOption[],
      generatePrompt: "",
    };

    try {
      const designBriefMatch = text.match(/【设计简报】\s*```json\s*([\s\S]*?)\s*```/);
      if (designBriefMatch) {
        const briefJson = designBriefMatch[1].replace(/"辅助色"/g, '"辅助色"');
        result.designBrief = JSON.parse(briefJson);
        result.generatePrompt = result.designBrief.generatePrompt || "";
      }

      const optionsMatch = text.match(/【选项卡片】\s*```json\s*([\s\S]*?)\s*```/);
      if (optionsMatch) {
        const optionsJson = JSON.parse(optionsMatch[1]);
        result.options = optionsJson.map((opt: any, idx: number) => ({
          icon: opt.icon,
          title: opt.label,
          description: opt.desc,
          action: idx === 0 ? "generate" : idx === 1 ? "style" : "adjust",
        }));
      }
    } catch (e) {
      console.error("Failed to parse AI content:", e);
    }

    return result;
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setCurrentStep("analyzing");

    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentStep("generating");

        setTimeout(() => {
          setCurrentStep("confirming");
        }, 800);

        setTimeout(() => {
          const responseText = data.data?.text || data.data?.content || "好的，我来帮你处理这个需求。让我分析一下...";
          const parsed = parseAIContent(responseText);
          
          if (parsed.generatePrompt) {
            setCurrentGeneratePrompt(parsed.generatePrompt);
          }

          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: parsed.content,
            options: parsed.options,
            designBrief: parsed.designBrief,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          setCurrentStep("idle");
        }, 1500);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: "收到你的需求！让我来帮你分析一下。这是一个很好的创意方向，我建议我们可以从以下几个角度来思考...",
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        setCurrentStep("idle");
      }, 1000);
    }
  }, [inputValue, isTyping, messages, agentId, parseAIContent]);

  const handlePromptClick = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const generateImage = useCallback(async (prompt: string) => {
    try {
      setIsTyping(true);
      setCurrentStep("generating");

      const res = await fetch("/api/generate/agent-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agentId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && data.data?.outputUrl) {
          const imageUrl = data.data.outputUrl;
          
          const aiMsg: ChatMessage = {
            id: `ai-image-${Date.now()}`,
            role: "assistant",
            content: "好的！这是为你生成的图片：",
            images: [imageUrl],
          };
          setMessages((prev) => [...prev, aiMsg]);

          const newGalleryItem: GalleryItem = {
            id: `gallery-${Date.now()}`,
            url: imageUrl,
            prompt,
          };
          setGalleryItems((prev) => [...prev, newGalleryItem]);

          toast({
            title: "生成成功",
            description: "图片已生成并保存到图库",
          });
        }
      } else {
        throw new Error("生成失败");
      }
    } catch (err) {
      toast({
        title: "生成失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      setCurrentStep("idle");
    }
  }, [agentId, toast]);

  const handleOptionClick = useCallback((action: string) => {
    if (action === "generate" && currentGeneratePrompt) {
      generateImage(currentGeneratePrompt);
    } else if (action === "style") {
      setInputValue("帮我尝试不同的艺术风格，比如赛博朋克、极简主义、手绘等");
    } else if (action === "adjust") {
      setInputValue("帮我微调一下设计参数，比如颜色、构图或添加特定元素");
    }
  }, [currentGeneratePrompt, generateImage]);

  const handleDownload = useCallback((item: GalleryItem) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = `generated-${item.id}.png`;
    link.target = "_blank";
    link.click();
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col -m-4 md:-m-6 lg:-m-8">
      {/* Top bar: agent info + workflow */}
      <div className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => router.push("/agents")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {agent && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl">{agent.avatar}</span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">
                {agent.name}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {agent.description}
              </p>
            </div>
          </div>
        )}

        <div className="hidden md:block flex-1 max-w-md">
          <WorkflowSteps currentStep={currentStep} />
        </div>
      </div>

      {/* Main content: two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat area (70%) */}
        <div className="flex flex-1 flex-col border-r border-border min-w-0">
          <ChatArea
            messages={messages}
            welcome={
              agent
                ? {
                    agentName: agent.name,
                    agentDescription: agent.description,
                    agentAvatar: agent.avatar,
                    examplePrompts: EXAMPLE_PROMPTS,
                  }
                : undefined
            }
            onPromptClick={handlePromptClick}
            onOptionClick={handleOptionClick}
            isTyping={isTyping}
            className="flex-1"
          />

          {/* Input area */}
          <div className="border-t border-border bg-card p-4">
            <div className="flex items-end gap-3">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述你的创意需求..."
                className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
                rows={1}
              />
              <Button
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Gallery panel (30%) */}
        <div className="hidden lg:flex w-[320px] shrink-0 border-l border-border">
          <GalleryPanel
            items={galleryItems}
            onDownload={handleDownload}
            className="w-full border-0 rounded-none"
          />
        </div>
      </div>
    </div>
  );
}
