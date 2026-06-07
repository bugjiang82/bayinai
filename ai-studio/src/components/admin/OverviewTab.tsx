"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Image,
  Coins,
  Activity,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsSkeleton } from "./shared/StatsSkeleton";
import { ListSkeleton } from "./shared/ListSkeleton";
import {
  formatTime,
  getTypeIcon,
  getStatusBadge,
} from "./shared/helpers";
import type { AdminStats, UserRecord, GenerationRecord } from "./shared/types";

export function OverviewTab() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserRecord[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, usersRes, gensRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users?limit=5"),
          fetch("/api/admin/generations?limit=5"),
        ]);

        if (!statsRes.ok || !usersRes.ok || !gensRes.ok) {
          throw new Error("获取数据失败");
        }

        const statsJson = await statsRes.json();
        const usersJson = await usersRes.json();
        const gensJson = await gensRes.json();

        if (!cancelled) {
          setStats(statsJson.data);
          setRecentUsers(usersJson.data?.users || []);
          setRecentGenerations(gensJson.data?.generations || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "未知错误");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-28 bg-white/[0.06]" />
            </CardHeader>
            <CardContent>
              <ListSkeleton rows={5} />
            </CardContent>
          </Card>
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-28 bg-white/[0.06]" />
            </CardHeader>
            <CardContent>
              <ListSkeleton rows={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">加载失败</h2>
        <p className="text-sm text-zinc-400 mb-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">总用户数</p>
                <p className="text-2xl font-bold text-white">
                  {(stats?.totalUsers ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Image className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">总作品数</p>
                <p className="text-2xl font-bold text-white">
                  {(stats?.totalWorks ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">总积分消耗</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalCreditsUsed != null
                    ? (stats.totalCreditsUsed / 10000).toFixed(1) + "万"
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">今日活跃</p>
                <p className="text-2xl font-bold text-white">
                  {(stats?.todayActive ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base text-white">最近注册用户</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-300"
              onClick={() => router.push("/admin/users")}
            >
              查看全部
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">
                  暂无用户数据
                </p>
              ) : (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-sm font-semibold text-indigo-300">
                        {user.name?.[0] || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {user.name}
                          </p>
                          {user.role === "ADMIN" && (
                            <Badge className="text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-1.5 py-0">
                              管理员
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">
                        {formatTime(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base text-white">最近生成记录</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-300"
              onClick={() => router.push("/admin/content")}
            >
              查看全部
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGenerations.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">
                  暂无生成记录
                </p>
              ) : (
                recentGenerations.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          record.type === "VIDEO"
                            ? "bg-purple-500/10"
                            : record.type === "EDIT"
                            ? "bg-pink-500/10"
                            : record.type === "IMAGE_TO_IMAGE"
                            ? "bg-cyan-500/10"
                            : "bg-blue-500/10"
                        }`}
                      >
                        {getTypeIcon(record.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {record.prompt}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            {record.user?.name || "未知用户"}
                          </span>
                          <span className="text-xs text-zinc-600">|</span>
                          <span className="text-xs text-zinc-500">
                            {record.cost > 0
                              ? `-${record.cost} 积分`
                              : "免费"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}