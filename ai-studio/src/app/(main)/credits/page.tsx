"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Zap,
  Crown,
  Building2,
  Send,
  Clock,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Bot,
  Sparkles,
  RefreshCw,
  Image,
  Video,
  CreditCard,
} from "lucide-react";

interface CreditLogItem {
  id: string;
  type: string;
  amount: number;
  balance: number;
  remark: string | null;
  refId: string | null;
  createdAt: string;
  modelDisplay: string;
  featureDisplay: string;
}

interface PaginatedResult {
  data: {
    list: CreditLogItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

const CREDIT_TYPE_OPTIONS = [
  { value: "ALL", label: "全部类型" },
  { value: "GENERATE", label: "AI生成" },
  { value: "RECHARGE", label: "充值" },
  { value: "TRANSFER_IN", label: "转入" },
  { value: "TRANSFER_OUT", label: "转出" },
  { value: "BONUS", label: "赠送" },
  { value: "SIGN_IN", label: "签到" },
];

const MODEL_OPTIONS = [
  { value: "", label: "全部模型" },
  { value: "Gemini 2.0 Flash", label: "Gemini 2.0 Flash" },
  { value: "Gemini 2.5 Pro", label: "Gemini 2.5 Pro" },
  { value: "GPT Image-2", label: "GPT Image-2" },
  { value: "Sora 2", label: "Sora 2" },
  { value: "Kling", label: "Kling" },
  { value: "Hailuo", label: "Hailuo" },
];

const TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  GENERATE: <Sparkles className="h-4 w-4" />,
  RECHARGE: <Plus className="h-4 w-4" />,
  TRANSFER_IN: <ArrowDownRight className="h-4 w-4" />,
  TRANSFER_OUT: <ArrowUpRight className="h-4 w-4" />,
  BONUS: <Gift className="h-4 w-4" />,
  SIGN_IN: <CheckCircle2 className="h-4 w-4" />,
};

const TYPE_LABEL_MAP: Record<string, string> = {
  GENERATE: "AI生成",
  RECHARGE: "充值",
  TRANSFER_IN: "转入",
  TRANSFER_OUT: "转出",
  BONUS: "赠送",
  SIGN_IN: "签到",
};

const TYPE_COLOR_MAP: Record<string, string> = {
  GENERATE: "text-blue-400",
  RECHARGE: "text-emerald-400",
  TRANSFER_IN: "text-blue-400",
  TRANSFER_OUT: "text-orange-400",
  BONUS: "text-violet-400",
  SIGN_IN: "text-amber-400",
};

const FEATURE_ICON_MAP: Record<string, React.ReactNode> = {
  图片生成: <Image className="h-3.5 w-3.5 text-blue-400" />,
  图生图: <Image className="h-3.5 w-3.5 text-cyan-400" />,
  视频生成: <Video className="h-3.5 w-3.5 text-purple-400" />,
  图片编辑: <svg className="h-3.5 w-3.5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  局部重绘: <svg className="h-3.5 w-3.5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  建筑方案: <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 21V10l7-5 7 5v11"/></svg>,
  AI绘图: <Sparkles className="h-3.5 w-3.5 text-indigo-400" />,
};

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function CreditPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-6">
      <span className="text-xs text-muted-foreground">
        共 {total} 条记录
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-2 text-xs"
        >
          上一页
        </Button>
        {start > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(1)}
              className="h-8 w-8 p-0 text-xs"
            >
              1
            </Button>
            {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
          </>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 p-0 text-xs ${
              p === page ? "bg-indigo-600 hover:bg-indigo-700" : ""
            }`}
          >
            {p}
          </Button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-muted-foreground">...</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 p-0 text-xs"
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-2 text-xs"
        >
          下一页
        </Button>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const [balance, setBalance] = useState({ total: 0, available: 0, frozen: 0 });
  const [records, setRecords] = useState<CreditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("packages");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 15;

  const [filterType, setFilterType] = useState("ALL");
  const [filterModel, setFilterModel] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "amount">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (filterType !== "ALL") params.set("type", filterType);
      if (filterModel) params.set("model", filterModel);
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);
      if (filterMinAmount) params.set("minAmount", filterMinAmount);
      if (filterMaxAmount) params.set("maxAmount", filterMaxAmount);
      if (filterSearch) params.set("search", filterSearch);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/credits/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          const list = data.data?.list || [];
          setRecords(list);
          setTotalPages(data.data?.totalPages || 1);
          setTotalRecords(data.data?.total || 0);
        }
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [
    page,
    filterType,
    filterModel,
    filterStartDate,
    filterEndDate,
    filterMinAmount,
    filterMaxAmount,
    filterSearch,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/credits/balance");
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0) {
            const raw = data.data;
            if (raw && typeof raw.balance === "number") {
              setBalance({ total: raw.balance, available: raw.balance, frozen: 0 });
            } else if (raw && typeof raw.available === "number") {
              setBalance(raw);
            }
          }
        }
      } catch {
        // ignore
      }
    }
    fetchBalance();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterReset = () => {
    setFilterType("ALL");
    setFilterModel("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setFilterSearch("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters =
    filterType !== "ALL" ||
    filterModel !== "" ||
    filterStartDate !== "" ||
    filterEndDate !== "" ||
    filterMinAmount !== "" ||
    filterMaxAmount !== "" ||
    filterSearch !== "";

  const handlePurchase = async (pkg: CreditPackage) => {
    try {
      const res = await fetch("/api/credits/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          try {
            const balanceRes = await fetch("/api/credits/balance");
            if (balanceRes.ok) {
              const balanceData = await balanceRes.json();
              if (balanceData.code === 0) {
                const raw = balanceData.data;
                if (raw && typeof raw.balance === "number") {
                  setBalance({ total: raw.balance, available: raw.balance, frozen: 0 });
                } else if (raw && typeof raw.available === "number") {
                  setBalance(raw);
                }
              }
            }
          } catch {
            // silently ignore
          }
        }
      }
    } catch {
      // Handle error silently
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget.trim() || !transferAmount.trim()) return;
    const amount = parseInt(transferAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    setTransferLoading(true);
    setTransferMessage(null);

    try {
      const res = await fetch("/api/credits/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: transferTarget.trim(), amount }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          try {
            const balanceRes = await fetch("/api/credits/balance");
            if (balanceRes.ok) {
              const balanceData = await balanceRes.json();
              if (balanceData.code === 0) {
                const raw = balanceData.data;
                if (raw && typeof raw.balance === "number") {
                  setBalance({ total: raw.balance, available: raw.balance, frozen: 0 });
                } else if (raw && typeof raw.available === "number") {
                  setBalance(raw);
                }
              }
            }
          } catch {
            // silently ignore
          }
          setTransferTarget("");
          setTransferAmount("");
          setTransferMessage({ type: "success", text: "划转成功！" });
        } else {
          setTransferMessage({ type: "error", text: "划转失败，请检查目标账户和余额" });
        }
      }
    } catch {
      setTransferMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">积分中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理你的积分余额、充值、划转和交易记录
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/80">可用积分</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">
            {balance.available.toLocaleString()}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>总计: {balance.total.toLocaleString()}</span>
            {balance.frozen > 0 && (
              <span>冻结: {balance.frozen.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="packages">充值套餐</TabsTrigger>
          <TabsTrigger value="records">积分记录</TabsTrigger>
          <TabsTrigger value="transfer">积分划转</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  pkg.popular
                    ? "border-indigo-500/50 shadow-md shadow-indigo-500/10"
                    : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-bl-lg">
                    推荐
                  </div>
                )}
                <CardContent className="p-5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${pkg.color} text-white mb-4`}
                  >
                    {pkg.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-foreground">
                      {pkg.credits}
                    </span>
                    <span className="text-xs text-muted-foreground">积分</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <Gift className="h-3 w-3 text-indigo-400" />
                      <span className="text-xs text-indigo-400">
                        额外赠送 {pkg.bonus} 积分
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-xs text-muted-foreground">¥</span>
                    <span className="text-lg font-bold text-foreground">
                      {pkg.price}
                    </span>
                  </div>
                  <Button
                    className={`w-full text-white ${
                      pkg.popular
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                    onClick={() => handlePurchase(pkg)}
                  >
                    立即充值
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索交易描述..."
                    value={filterSearch}
                    onChange={(e) => {
                      setFilterSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 gap-1.5 ${showFilters || hasActiveFilters ? "border-indigo-500/50 text-indigo-400" : ""}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  筛选
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1 text-muted-foreground"
                    onClick={handleFilterReset}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    重置
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v as "createdAt" | "amount"); setPage(1); }}>
                  <SelectTrigger className="h-9 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">时间</SelectItem>
                    <SelectItem value="amount">金额</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                    setPage(1);
                  }}
                  title={sortOrder === "desc" ? "降序" : "升序"}
                >
                  <ArrowUpDown className={`h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>

            {showFilters && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">交易类型</label>
                      <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CREDIT_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">大模型</label>
                      <Select value={filterModel} onValueChange={(v) => { setFilterModel(v); setPage(1); }}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODEL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">开始日期</label>
                      <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">结束日期</label>
                      <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">最小金额</label>
                      <Input
                        type="number"
                        placeholder="最低积分"
                        value={filterMinAmount}
                        onChange={(e) => { setFilterMinAmount(e.target.value); setPage(1); }}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">最大金额</label>
                      <Input
                        type="number"
                        placeholder="最高积分"
                        value={filterMaxAmount}
                        onChange={(e) => { setFilterMaxAmount(e.target.value); setPage(1); }}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">积分记录</CardTitle>
                  {!loading && hasActiveFilters && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      已筛选
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={handleFilterReset}
                      />
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="h-9 w-9 rounded-lg bg-muted" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 w-32 rounded bg-muted" />
                          <div className="h-3 w-24 rounded bg-muted" />
                        </div>
                        <div className="h-4 w-16 rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters ? "没有匹配的积分记录" : "暂无积分记录"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {hasActiveFilters ? "尝试调整筛选条件" : "使用网站功能产生积分变动后将在此显示"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      {records.map((record) => {
                        const isPositive = record.amount > 0;
                        const typeColor = TYPE_COLOR_MAP[record.type] || "text-zinc-400";
                        const typeIcon = TYPE_ICON_MAP[record.type] || <Clock className="h-4 w-4" />;
                        const typeLabel = TYPE_LABEL_MAP[record.type] || record.type;

                        return (
                          <div
                            key={record.id}
                            className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50 group"
                          >
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                isPositive
                                  ? "bg-emerald-500/10"
                                  : "bg-muted"
                              } ${typeColor}`}
                            >
                              {typeIcon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {record.featureDisplay}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${typeColor} border-current/20`}
                                >
                                  {typeLabel}
                                </Badge>
                                {record.modelDisplay && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-5 shrink-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  >
                                    <Bot className="h-3 w-3 mr-0.5" />
                                    {record.modelDisplay}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {FEATURE_ICON_MAP[record.featureDisplay] && (
                                  <span className="shrink-0">
                                    {FEATURE_ICON_MAP[record.featureDisplay]}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground truncate">
                                  {formatDateTime(record.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p
                                className={`text-sm font-semibold tabular-nums ${
                                  isPositive ? "text-emerald-400" : "text-foreground"
                                }`}
                              >
                                {isPositive ? "+" : ""}
                                {record.amount}
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                余额 {record.balance}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <CreditPagination
                      page={page}
                      totalPages={totalPages}
                      total={totalRecords}
                      onPageChange={setPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transfer" className="mt-6">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">积分划转</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  对方邮箱 / 团队ID
                </label>
                <Input
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  placeholder="请输入对方邮箱或团队ID"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  划转积分
                </label>
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="请输入划转积分数量"
                  min={1}
                  max={balance.available}
                />
                <p className="text-xs text-muted-foreground">
                  当前可用积分: {balance.available.toLocaleString()}
                </p>
              </div>

              {transferMessage && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    transferMessage.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {transferMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {transferMessage.text}
                </div>
              )}

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleTransfer}
                disabled={
                  !transferTarget.trim() ||
                  !transferAmount.trim() ||
                  transferLoading
                }
              >
                {transferLoading ? (
                  "处理中..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    确认划转
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonus: number;
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
}

const PACKAGES: CreditPackage[] = [
  {
    id: "basic",
    name: "基础包",
    price: 10,
    credits: 100,
    bonus: 0,
    icon: <Zap className="h-5 w-5" />,
    color: "from-slate-600 to-slate-700",
  },
  {
    id: "standard",
    name: "标准包",
    price: 50,
    credits: 600,
    bonus: 50,
    icon: <ShoppingBag className="h-5 w-5" />,
    popular: true,
    color: "from-indigo-600 to-indigo-700",
  },
  {
    id: "pro",
    name: "专业包",
    price: 100,
    credits: 1500,
    bonus: 200,
    icon: <Crown className="h-5 w-5" />,
    color: "from-violet-600 to-violet-700",
  },
  {
    id: "enterprise",
    name: "企业包",
    price: 500,
    credits: 8000,
    bonus: 1500,
    icon: <Building2 className="h-5 w-5" />,
    color: "from-amber-600 to-amber-700",
  },
];