"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Image,
  Video,
  Bot,
  ArrowRight,
  ImageIcon,
  Layers,
  Coins,
  Users,
  Loader2,
  Sparkles,
  Wand2,
  Film,
  Cpu,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  email: string;
  image?: string;
  credits: number;
  totalWorks: number;
  monthlyGenerations: number;
  teamCount: number;
}

interface HistoryItem {
  id: string;
  type: "image" | "video";
  thumbnail: string;
  prompt: string;
  createdAt: string;
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GRADIENTS = [
  "from-violet-600/40 to-indigo-600/40",
  "from-rose-600/40 to-orange-600/40",
  "from-emerald-600/40 to-teal-600/40",
  "from-cyan-600/40 to-blue-600/40",
  "from-fuchsia-600/40 to-pink-600/40",
  "from-amber-600/40 to-yellow-600/40",
];

function getGradient(id: string): string {
  const index =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    GRADIENTS.length;
  return GRADIENTS[index];
}

const QUICK_ACTIONS = [
  {
    title: "文生图",
    description: "输入文字描述生成建筑效果图",
    icon: Wand2,
    href: "/generate/text-to-image",
    gradient: "from-violet-500/20 to-indigo-500/20",
    iconColor: "text-violet-400",
  },
  {
    title: "图生图",
    description: "基于参考图生成新设计",
    icon: ImageIcon,
    href: "/generate/image-to-image",
    gradient: "from-rose-500/20 to-orange-500/20",
    iconColor: "text-rose-400",
  },
  {
    title: "视频生成",
    description: "AI 生成建筑漫游视频",
    icon: Film,
    href: "/generate/video",
    gradient: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-cyan-400",
  },
  {
    title: "智能体",
    description: "AI 助手辅助设计创作",
    icon: Cpu,
    href: "/agents",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
];

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_PROFILE: UserProfile = {
  name: "设计师",
  email: "designer@example.com",
  credits: 2580,
  totalWorks: 156,
  monthlyGenerations: 42,
  teamCount: 3,
};

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "hist-1",
    type: "image",
    thumbnail: "",
    prompt: "现代极简主义建筑外观，玻璃幕墙",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "hist-2",
    type: "image",
    thumbnail: "",
    prompt: "北欧风格客厅室内设计，原木家具",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "hist-3",
    type: "video",
    thumbnail: "",
    prompt: "建筑漫游动画，未来城市",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "hist-4",
    type: "image",
    thumbnail: "",
    prompt: "日式禅意庭院，枯山水设计",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "hist-5",
    type: "image",
    thumbnail: "",
    prompt: "地中海风格别墅，白色墙壁",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "hist-6",
    type: "image",
    thumbnail: "",
    prompt: "工业风格LOFT公寓，裸露砖墙",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentWorks, setRecentWorks] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const profileRes = await fetch("/api/user/profile");
      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.code === 0 && data.data) {
          setProfile(data.data);
        } else {
          setProfile(MOCK_PROFILE);
        }
      } else {
        setProfile(MOCK_PROFILE);
      }

      // Fetch recent history
      const historyRes = await fetch("/api/generate/history?limit=6");
      if (historyRes.ok) {
        const data = await historyRes.json();
        if (data.code === 0) {
          setRecentWorks(data.data?.list || (Array.isArray(data.data) ? data.data : []));
        } else {
          setRecentWorks(MOCK_HISTORY);
        }
      } else {
        setRecentWorks(MOCK_HISTORY);
      }
    } catch {
      setProfile(MOCK_PROFILE);
      setRecentWorks(MOCK_HISTORY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "夜深了";
    if (hour < 12) return "早上好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
          <div className="h-4 bg-muted rounded w-40 animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`stat-skeleton-${i}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-7 bg-muted rounded w-20 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent works skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`work-skeleton-${i}`}
                  className="aspect-square bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`action-skeleton-${i}`} className="h-32">
              <CardContent className="p-5 h-full flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-32 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─── Main content ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}，{profile?.name || "用户"}
          </h1>
          <p className="text-muted-foreground mt-1">
            欢迎回到 AI Studio，继续你的创作之旅
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-400" />
          <span className="text-lg font-semibold">
            {profile?.credits?.toLocaleString() || 0}
          </span>
          <span className="text-sm text-muted-foreground">积分余额</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总作品数</p>
                <p className="text-2xl font-bold">
                  {profile?.totalWorks?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">本月生成</p>
                <p className="text-2xl font-bold">
                  {profile?.monthlyGenerations?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">剩余积分</p>
                <p className="text-2xl font-bold">
                  {profile?.credits?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">团队数</p>
                <p className="text-2xl font-bold">
                  {profile?.teamCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent works */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">最近作品</CardTitle>
            <CardDescription>你最近生成的作品</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => router.push("/gallery")}
          >
            查看全部
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                还没有作品
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push("/generate/text-to-image")
                }
              >
                开始创作
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {recentWorks.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => router.push("/gallery")}
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${getGradient(
                        item.id
                      )} flex items-center justify-center`}
                    >
                      {item.type === "video" ? (
                        <Video className="h-8 w-8 text-white/30" />
                      ) : (
                        <Image className="h-8 w-8 text-white/30" />
                      )}
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-white/60" />
                        <span className="text-[10px] text-white/60">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className="absolute top-1.5 right-1.5">
                    <Badge
                      variant="secondary"
                      className="text-[9px] bg-black/50 backdrop-blur-sm border-0 text-white px-1.5 py-0"
                    >
                      {item.type === "video" ? "视频" : "图片"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold mb-3">快捷入口</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Card
              key={action.title}
              className="group cursor-pointer hover:border-primary/50 transition-all duration-300 overflow-hidden"
              onClick={() => router.push(action.href)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0`}
                  >
                    <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
