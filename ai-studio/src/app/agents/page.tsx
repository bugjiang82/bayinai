import React from "react";
import { Bot, MessageSquare, Building2, Home, TreePine, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const agents = [
  {
    id: 1,
    name: "建筑大师",
    icon: Building2,
    description: "专业的建筑设计助手，帮助你生成建筑效果图和设计方案",
    avatar: "https://picsum.photos/seed/agent1/100/100",
    skills: ["建筑设计", "效果图生成", "空间规划"],
  },
  {
    id: 2,
    name: "室内设计师",
    icon: Home,
    description: "专业的室内设计助手，帮助你打造理想的居住和工作空间",
    avatar: "https://picsum.photos/seed/agent2/100/100",
    skills: ["室内设计", "家具布局", "色彩搭配"],
  },
  {
    id: 3,
    name: "景观规划师",
    icon: TreePine,
    description: "专业的景观设计助手，帮助你规划和设计户外空间",
    avatar: "https://picsum.photos/seed/agent3/100/100",
    skills: ["景观设计", "植物配置", "户外空间规划"],
  },
  {
    id: 4,
    name: "视频导演",
    icon: Film,
    description: "专业的视频创作助手，帮助你制作建筑漫游和展示视频",
    avatar: "https://picsum.photos/seed/agent4/100/100",
    skills: ["视频制作", "动画效果", "剪辑编辑"],
  },
];

export default function AgentsPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">AI 智能体</h1>
      </div>

      {/* Introduction */}
      <div className="mb-8 p-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <h2 className="text-lg font-semibold text-white mb-2">智能体介绍</h2>
        <p className="text-zinc-400">
          AI 智能体是基于大语言模型的专业助手，能够理解你的需求并提供专业的设计建议和解决方案。
          选择一个智能体开始对话，它会帮助你生成创意内容、解决设计问题。
        </p>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="bg-[#0f0f0f] border-white/[0.08] overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src={agent.avatar} 
                      alt={agent.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">{agent.name}</CardTitle>
                    <CardDescription className="text-zinc-400">
                      <Icon className="w-4 h-4 inline mr-1" />
                      {agent.skills.join("、")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-zinc-400 text-sm">
                  {agent.description}
                </p>
              </CardContent>
              <CardFooter className="p-4 border-t border-white/[0.06]">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  开始对话
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}