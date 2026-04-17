"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Users,
  Wallet,
  Calendar,
  ChevronRight,
  Building2,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string;
  industry: string;
  memberCount: number;
  sharedCredits: number;
  createdAt: string;
}

const INDUSTRY_OPTIONS = [
  "互联网/科技",
  "广告/营销",
  "电商/零售",
  "教育/培训",
  "金融/保险",
  "医疗/健康",
  "媒体/娱乐",
  "制造业",
  "其他",
];

const MOCK_TEAMS: Team[] = [
  {
    id: "team-1",
    name: "创意设计组",
    description: "负责品牌视觉设计和创意内容制作",
    industry: "广告/营销",
    memberCount: 8,
    sharedCredits: 5000,
    createdAt: "2025-01-10",
  },
  {
    id: "team-2",
    name: "产品研发部",
    description: "产品原型设计和UI/UX设计团队",
    industry: "互联网/科技",
    memberCount: 12,
    sharedCredits: 12000,
    createdAt: "2024-12-20",
  },
  {
    id: "team-3",
    name: "内容运营组",
    description: "社交媒体内容创作和运营",
    industry: "媒体/娱乐",
    memberCount: 5,
    sharedCredits: 3000,
    createdAt: "2025-01-05",
  },
];

export default function TeamPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Create team dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    industry: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && Array.isArray(data.data)) {
            setTeams(data.data);
          } else {
            setTeams(MOCK_TEAMS);
          }
        } else {
          setTeams(MOCK_TEAMS);
        }
      } catch {
        setTeams(MOCK_TEAMS);
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim() || !newTeam.industry) return;

    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && data.data) {
          setTeams((prev) => [data.data, ...prev]);
          setDialogOpen(false);
          setNewTeam({ name: "", industry: "", description: "" });
        }
      }
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">团队管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            创建和管理你的团队，共享积分与资源
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4" />
              创建团队
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新团队</DialogTitle>
              <DialogDescription>
                创建一个团队，邀请成员一起协作创作
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  团队名称
                </label>
                <Input
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="请输入团队名称"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  所属行业
                </label>
                <Select
                  value={newTeam.industry}
                  onValueChange={(value) =>
                    setNewTeam((prev) => ({ ...prev, industry: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择行业" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  团队描述
                </label>
                <Textarea
                  value={newTeam.description}
                  onChange={(e) =>
                    setNewTeam((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="简要描述团队的用途和目标"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleCreateTeam}
                disabled={!newTeam.name.trim() || !newTeam.industry || creating}
              >
                {creating ? "创建中..." : "确认创建"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 w-32 rounded bg-muted mb-3" />
                <div className="h-3 w-full rounded bg-muted mb-2" />
                <div className="h-3 w-2/3 rounded bg-muted mb-4" />
                <div className="flex gap-4">
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              暂无团队
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              创建一个团队，开始协作创作
            </p>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              创建团队
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="group cursor-pointer transition-all duration-300 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
              onClick={() => router.push(`/team/${team.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {team.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {team.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.memberCount} 成员
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    {team.sharedCredits.toLocaleString()} 积分
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  创建于 {team.createdAt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
