"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Video, Image, Palette, Users } from "lucide-react";

interface AgentCard {
  id: string;
  name: string;
  description: string;
  avatar: string;
  category: "video" | "image" | "design";
  usageCount: number;
}

const MOCK_AGENTS: AgentCard[] = [
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
    id: "brand-designer",
    name: "品牌设计顾问",
    description: "从 Logo 到完整品牌视觉系统的 AI 设计顾问",
    avatar: "🏷️",
    category: "design",
    usageCount: 5640,
  },
  {
    id: "thumbnail-maker",
    name: "封面图生成器",
    description: "一键生成吸引眼球的视频封面和社交媒体图片",
    avatar: "🖼️",
    category: "image",
    usageCount: 18920,
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  video: {
    label: "视频",
    icon: <Video className="h-3 w-3" />,
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  image: {
    label: "图片",
    icon: <Image className="h-3 w-3" />,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  design: {
    label: "设计",
    icon: <Palette className="h-3 w-3" />,
    color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
};

function formatUsageCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents");
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && Array.isArray(data.data)) {
            setAgents(data.data);
          } else {
            setAgents(MOCK_AGENTS);
          }
        } else {
          setAgents(MOCK_AGENTS);
        }
      } catch {
        setAgents(MOCK_AGENTS);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI 智能体</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          对话式 AI 创作助手
        </p>
      </div>

      {/* Agent grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const catConfig = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.image;
            return (
              <Card
                key={agent.id}
                className="group transition-all duration-300 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted overflow-hidden transition-transform duration-300 group-hover:scale-110">
                      {agent.avatar && agent.avatar.startsWith("/") ? (
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-3xl">🤖</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-3xl">{agent.avatar || "🤖"}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {agent.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 gap-1 text-[10px] px-1.5 py-0",
                            catConfig.color
                          )}
                        >
                          {catConfig.icon}
                          {catConfig.label}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {agent.description}
                      </p>

                      {/* Footer: usage + button */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {formatUsageCount(agent.usageCount)} 次使用
                        </span>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs"
                          onClick={() => router.push(`/agents/${agent.id}`)}
                        >
                          <MessageSquare className="h-3 w-3" />
                          开始对话
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
