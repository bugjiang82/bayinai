"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Shield,
  ArrowLeft,
  Activity,
  Coins,
  Search,
  ChevronRight,
  ChevronLeft,
  Image,
  Video,
  Pencil,
  Trash2,
  RefreshCw,
  Check,
  X,
  Loader2,
  Database,
  KeyRound,
  UserCog,
  Zap,
  ImageIcon,
  Film,
  Wand2,
  Gift,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────────────────────────────────

type AdminTab = "overview" | "users" | "content" | "settings";

interface AdminStats {
  totalUsers: number;
  totalWorks: number;
  totalCreditsUsed: number;
  todayActive: number;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  createdAt: string;
  industry?: string;
}

interface GenerationRecord {
  id: string;
  type: string;
  status: string;
  prompt: string;
  cost: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

// ─── Sidebar Navigation ──────────────────────────────────────────────────────

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "概览", icon: LayoutDashboard },
  { id: "users", label: "用户管理", icon: Users },
  { id: "content", label: "内容管理", icon: FileText },
  { id: "settings", label: "系统设置", icon: Settings },
];

const OTHER_LINKS = [
  { href: "/admin/credit-policies", label: "积分策略", icon: Coins },
  { href: "/admin/docs", label: "开发文档", icon: BookOpen },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return `${days} 天前`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          已完成
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge className="text-[11px] bg-amber-500/10 text-amber-400 border-amber-500/20">
          处理中
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="text-[11px] bg-blue-500/10 text-blue-400 border-blue-500/20">
          等待中
        </Badge>
      );
    case "FAILED":
      return (
        <Badge className="text-[11px] bg-rose-500/10 text-rose-400 border-rose-500/20">
          失败
        </Badge>
      );
    default:
      return (
        <Badge className="text-[11px] bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
          {status}
        </Badge>
      );
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "VIDEO":
      return <Video className="w-4 h-4 text-purple-400" />;
    case "EDIT":
      return <Pencil className="w-4 h-4 text-pink-400" />;
    case "IMAGE_TO_IMAGE":
      return <Wand2 className="w-4 h-4 text-cyan-400" />;
    default:
      return <Image className="w-4 h-4 text-blue-400" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "TEXT_TO_IMAGE":
      return "文生图";
    case "IMAGE_TO_IMAGE":
      return "图生图";
    case "VIDEO":
      return "视频";
    case "EDIT":
      return "编辑";
    default:
      return type;
  }
}

// ─── Loading Skeletons ───────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-white/[0.06]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16 bg-white/[0.06]" />
                <Skeleton className="h-7 w-24 bg-white/[0.06]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full bg-white/[0.06]" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 bg-white/[0.06]" />
              <Skeleton className="h-3 w-40 bg-white/[0.06]" />
            </div>
          </div>
          <Skeleton className="h-4 w-16 bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

// ─── Pagination Component ────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="text-zinc-400 hover:text-zinc-300 disabled:opacity-30 h-8 w-8 p-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {start > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            className="text-zinc-400 hover:text-zinc-300 h-8 w-8 p-0"
          >
            1
          </Button>
          {start > 2 && <span className="text-zinc-600 px-1">...</span>}
        </>
      )}
      {pages.map((p) => (
        <Button
          key={p}
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(p)}
          className={`h-8 w-8 p-0 ${
            p === page
              ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          {p}
        </Button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-zinc-600 px-1">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="text-zinc-400 hover:text-zinc-300 h-8 w-8 p-0"
          >
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="text-zinc-400 hover:text-zinc-300 disabled:opacity-30 h-8 w-8 p-0"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        style={{ animation: "fadeIn 0.15s ease-out" }}
      />
      <div
        className="relative bg-[#141414] border border-white/[0.08] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        style={{ animation: "scaleIn 0.15s ease-out" }}
      >
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="text-zinc-400 hover:text-zinc-300"
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            确认删除
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
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
      {/* Stats Grid */}
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

      {/* Two column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base text-white">最近注册用户</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-300"
              onClick={() => {
                const event = new CustomEvent("admin-navigate", {
                  detail: "users",
                });
                window.dispatchEvent(event);
              }}
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

        {/* Recent Generations */}
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base text-white">最近生成记录</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-300"
              onClick={() => {
                const event = new CustomEvent("admin-navigate", {
                  detail: "content",
                });
                window.dispatchEvent(event);
              }}
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

// ─── Users Tab ───────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Credits editing
  const [editingCreditsId, setEditingCreditsId] = useState<string | null>(null);
  const [editingCreditsValue, setEditingCreditsValue] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Role toggling
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);

  // Debounce search
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchUsers = useCallback(
    async (p: number, s: string, role: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: "20",
        });
        if (s) params.set("search", s);
        if (role !== "ALL") params.set("role", role);

        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) throw new Error("获取用户列表失败");
        const json = await res.json();
        const data = json.data;

        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchUsers(1, debouncedSearch, roleFilter);
  }, [debouncedSearch, roleFilter, fetchUsers]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handlePageChange = (p: number) => {
    fetchUsers(p, debouncedSearch, roleFilter);
  };

  const handleToggleRole = async (user: UserRecord) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setTogglingRoleId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("切换角色失败");
      // Refresh the list
      await fetchUsers(page, debouncedSearch, roleFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "切换角色失败");
    } finally {
      setTogglingRoleId(null);
    }
  };

  const handleSaveCredits = async (userId: string) => {
    const newCredits = parseInt(editingCreditsValue, 10);
    if (isNaN(newCredits) || newCredits < 0) {
      alert("请输入有效的积分值（非负整数）");
      return;
    }
    setSavingCredits(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: newCredits }),
      });
      if (!res.ok) throw new Error("更新积分失败");
      setEditingCreditsId(null);
      setEditingCreditsValue("");
      await fetchUsers(page, debouncedSearch, roleFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新积分失败");
    } finally {
      setSavingCredits(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "删除用户失败");
      }
      setDeleteTarget(null);
      await fetchUsers(page, debouncedSearch, roleFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除用户失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="搜索邮箱或用户名..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-sm text-zinc-300 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 8px center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "20px",
            paddingRight: "32px",
          }}
        >
          <option value="ALL">全部角色</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_80px_80px_100px_140px] gap-2 px-4 py-3 border-b border-white/[0.06] text-xs text-zinc-500 font-medium">
            <span>姓名</span>
            <span>邮箱</span>
            <span>角色</span>
            <span>积分</span>
            <span>注册时间</span>
            <span className="text-right">操作</span>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-5 flex-1 bg-white/[0.06] rounded" />
                  <Skeleton className="h-5 flex-1 bg-white/[0.06] rounded" />
                  <Skeleton className="h-5 w-16 bg-white/[0.06] rounded" />
                  <Skeleton className="h-5 w-16 bg-white/[0.06] rounded" />
                  <Skeleton className="h-5 w-20 bg-white/[0.06] rounded" />
                  <Skeleton className="h-5 w-28 bg-white/[0.06] rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-rose-400 mb-3">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchUsers(page, debouncedSearch, roleFilter)}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                重试
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500">没有找到匹配的用户</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[1fr_1fr_80px_80px_100px_140px] gap-2 px-4 py-3 items-center text-sm hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-white font-medium truncate">
                    {user.name}
                  </span>
                  <span className="text-zinc-400 truncate">{user.email}</span>
                  <div>
                    {user.role === "ADMIN" ? (
                      <Badge className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        ADMIN
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                        USER
                      </Badge>
                    )}
                  </div>
                  <div>
                    {editingCreditsId === user.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={editingCreditsValue}
                          onChange={(e) =>
                            setEditingCreditsValue(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSaveCredits(user.id);
                            if (e.key === "Escape") {
                              setEditingCreditsId(null);
                              setEditingCreditsValue("");
                            }
                          }}
                          className="w-16 h-6 text-xs bg-white/[0.06] border border-white/[0.1] rounded px-1.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          autoFocus
                        />
                        {savingCredits ? (
                          <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleSaveCredits(user.id)}
                              className="p-0.5 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCreditsId(null);
                                setEditingCreditsValue("");
                              }}
                              className="p-0.5 text-zinc-500 hover:text-zinc-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCreditsId(user.id);
                          setEditingCreditsValue(String(user.credits));
                        }}
                        className="text-amber-400 hover:text-amber-300 text-xs font-mono cursor-pointer"
                        title="点击编辑积分"
                      >
                        {user.credits}
                      </button>
                    )}
                  </div>
                  <span className="text-zinc-500 text-xs">
                    {formatDate(user.createdAt)}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleRole(user)}
                      disabled={togglingRoleId === user.id}
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                      title={user.role === "ADMIN" ? "设为普通用户" : "设为管理员"}
                    >
                      {togglingRoleId === user.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserCog className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(user)}
                      disabled={user.role === "ADMIN"}
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={user.role === "ADMIN" ? "不能删除管理员" : "删除用户"}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Total count */}
      {!loading && !error && (
        <p className="text-xs text-zinc-500 text-center">
          共 {total} 个用户
        </p>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除用户"
        message={`确定要删除用户「${deleteTarget?.name}」(${deleteTarget?.email}) 吗？此操作不可撤销。`}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

// ─── Content Tab ─────────────────────────────────────────────────────────────

function ContentTab() {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenerations = useCallback(
    async (p: number, status: string, type: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: "20",
        });
        if (status !== "ALL") params.set("status", status);
        if (type !== "ALL") params.set("type", type);

        const res = await fetch(`/api/admin/generations?${params}`);
        if (!res.ok) throw new Error("获取生成记录失败");
        const json = await res.json();
        const data = json.data;

        setGenerations(data.generations || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchGenerations(1, statusFilter, typeFilter);
  }, [statusFilter, typeFilter, fetchGenerations]);

  const handlePageChange = (p: number) => {
    fetchGenerations(p, statusFilter, typeFilter);
  };

  const selectClass =
    "h-9 rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-sm text-zinc-300 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 8px center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "20px",
            paddingRight: "32px",
          }}
        >
          <option value="ALL">全部状态</option>
          <option value="PENDING">等待中</option>
          <option value="PROCESSING">处理中</option>
          <option value="COMPLETED">已完成</option>
          <option value="FAILED">失败</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectClass}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: "right 8px center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "20px",
            paddingRight: "32px",
          }}
        >
          <option value="ALL">全部类型</option>
          <option value="TEXT_TO_IMAGE">文生图</option>
          <option value="IMAGE_TO_IMAGE">图生图</option>
          <option value="VIDEO">视频</option>
          <option value="EDIT">编辑</option>
        </select>
      </div>

      {/* List */}
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4 bg-white/[0.06]" />
                    <Skeleton className="h-3 w-1/2 bg-white/[0.06]" />
                  </div>
                  <Skeleton className="h-5 w-16 bg-white/[0.06] rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-rose-400 mb-3">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  fetchGenerations(page, statusFilter, typeFilter)
                }
                className="text-zinc-400 hover:text-zinc-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                重试
              </Button>
            </div>
          ) : generations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500">没有找到匹配的记录</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {generations.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {record.prompt}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          {record.user?.name || "未知用户"}
                        </span>
                        <span className="text-xs text-zinc-600">|</span>
                        <span className="text-xs text-zinc-500">
                          {getTypeLabel(record.type)}
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
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-zinc-500">
                      {formatTime(record.createdAt)}
                    </span>
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Total count */}
      {!loading && !error && (
        <p className="text-xs text-zinc-500 text-center">
          共 {total} 条记录
        </p>
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab() {
  const systemInfo = [
    {
      icon: Database,
      label: "数据库状态",
      value: "已连接",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: KeyRound,
      label: "NextAuth",
      value: "已配置",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Shield,
      label: "管理员账户",
      value: "admin@admin.com",
      color: "text-zinc-300",
      bgColor: "bg-indigo-500/10",
    },
    {
      icon: Coins,
      label: "新用户默认积分",
      value: "20",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  interface CreditPolicyItem {
    key: string;
    name: string;
    description: string | null;
    cost: number;
    unit: string;
    category: string;
  }

  const [policies, setPolicies] = useState<CreditPolicyItem[]>([]);
  const [editingPolicies, setEditingPolicies] = useState<CreditPolicyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/credit-policies");
      const json = await res.json();
      if (json.success) {
        setPolicies(json.data);
        setEditingPolicies(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCostChange = (key: string, newCost: number) => {
    setEditingPolicies((prev) =>
      prev.map((p) => (p.key === key ? { ...p, cost: newCost } : p))
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/credit-policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies: editingPolicies }),
      });
      const json = await res.json();
      if (json.success) {
        setPolicies(editingPolicies);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save policies:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPolicies = editingPolicies.reduce((acc, policy) => {
    const category = policy.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(policy);
    return acc;
  }, {} as Record<string, CreditPolicyItem[]>);

  const categoryNames: Record<string, string> = {
    image: "图片生成",
    architecture: "进阶设计",
    edit: "图片编辑",
    video: "视频生成",
    workflow: "工作流",
    other: "其他",
  };

  const categoryIcons: Record<string, React.ElementType> = {
    image: Wand2,
    architecture: Building2,
    edit: Pencil,
    video: Film,
    workflow: Zap,
    other: Coins,
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* System Info */}
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-base text-white">系统信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {systemInfo.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-sm text-zinc-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">{item.value}</span>
                {(item.label === "数据库状态" || item.label === "NextAuth") && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Credit Policies */}
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-white">积分策略配置</CardTitle>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                保存中...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                已保存
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                保存修改
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            Object.entries(groupedPolicies).map(([category, categoryPolicies]) => {
              const Icon = categoryIcons[category] || Coins;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Icon className="w-4 h-4" />
                    <span>{categoryNames[category] || category}</span>
                  </div>
                  <div className="space-y-1.5 pl-4 border-l-2 border-white/[0.06]">
                    {categoryPolicies.map((policy) => (
                      <div
                        key={policy.key}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm text-zinc-200">{policy.name}</span>
                          {policy.description && (
                            <span className="text-xs text-zinc-500">{policy.description}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            value={policy.cost}
                            onChange={(e) =>
                              handleCostChange(policy.key, parseInt(e.target.value) || 0)
                            }
                            className="w-20 h-8 text-right bg-[#0f0f0f] border-white/[0.08] text-amber-400"
                          />
                          <span className="text-xs text-zinc-500 w-8">{policy.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Listen for navigation events from overview tab buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail === "users" ||
        customEvent.detail === "content"
      ) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("admin-navigate", handler);
    return () => window.removeEventListener("admin-navigate", handler);
  }, []);

  // ─── Main Layout ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .admin-tab-content {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>

      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-white/[0.01] hidden lg:flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">管理后台</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === item.id
                  ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300 border border-transparent"
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-1">
            {OTHER_LINKS.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-300"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-300"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              返回前台
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            {/* Mobile nav */}
            <div className="flex lg:hidden items-center gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === item.id
                      ? "bg-indigo-500/10 text-indigo-300"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                </button>
              ))}
            </div>
            <h1 className="text-lg font-semibold text-white">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label || "概览"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <div key={activeTab} className="admin-tab-content">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "content" && <ContentTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
