"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "./Pagination";
import {
  formatTime,
  getTypeIcon,
  getTypeLabel,
  getStatusBadge,
} from "./shared/helpers";
import type { GenerationRecord } from "./shared/types";

export function ContentTab() {
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

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {!loading && !error && (
        <p className="text-xs text-zinc-500 text-center">
          共 {total} 条记录
        </p>
      )}
    </div>
  );
}