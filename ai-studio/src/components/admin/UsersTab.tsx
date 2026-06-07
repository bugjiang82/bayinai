"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  Check,
  X,
  UserCog,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "./Pagination";
import { ConfirmDialog } from "./ConfirmDialog";
import { formatDate } from "./shared/helpers";
import type { UserRecord } from "./shared/types";

export function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingCreditsId, setEditingCreditsId] = useState<string | null>(null);
  const [editingCreditsValue, setEditingCreditsValue] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);

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

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  useEffect(() => {
    fetchUsers(1, debouncedSearch, roleFilter);
  }, [debouncedSearch, roleFilter, fetchUsers]);

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

      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_1fr_80px_80px_100px_140px] gap-2 px-4 py-3 border-b border-white/[0.06] text-xs text-zinc-500 font-medium">
            <span>姓名</span>
            <span>邮箱</span>
            <span>角色</span>
            <span>积分</span>
            <span>注册时间</span>
            <span className="text-right">操作</span>
          </div>

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

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {!loading && !error && (
        <p className="text-xs text-zinc-500 text-center">
          共 {total} 个用户
        </p>
      )}

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