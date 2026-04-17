"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
} from "lucide-react";

interface CreditBalance {
  total: number;
  available: number;
  frozen: number;
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

interface CreditRecord {
  id: string;
  type: "recharge" | "consume" | "refund" | "transfer_in" | "transfer_out" | "bonus";
  description: string;
  amount: number;
  balance: number;
  createdAt: string;
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

const MOCK_RECORDS: CreditRecord[] = [
  {
    id: "1",
    type: "recharge",
    description: "充值 - 标准包",
    amount: 650,
    balance: 1850,
    createdAt: "2025-01-15 14:30:00",
  },
  {
    id: "2",
    type: "consume",
    description: "AI 绘画大师 - 图片生成",
    amount: -10,
    balance: 1200,
    createdAt: "2025-01-15 13:20:00",
  },
  {
    id: "3",
    type: "consume",
    description: "视频创作助手 - 视频生成",
    amount: -50,
    balance: 1210,
    createdAt: "2025-01-15 11:05:00",
  },
  {
    id: "4",
    type: "bonus",
    description: "新用户注册赠送",
    amount: 100,
    balance: 1260,
    createdAt: "2025-01-14 10:00:00",
  },
  {
    id: "5",
    type: "transfer_in",
    description: "团队划转 - 从「设计团队」转入",
    amount: 200,
    balance: 1160,
    createdAt: "2025-01-13 16:45:00",
  },
  {
    id: "6",
    type: "consume",
    description: "设计灵感助手 - 方案生成",
    amount: -20,
    balance: 960,
    createdAt: "2025-01-13 09:30:00",
  },
];

const RECORD_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  recharge: {
    label: "充值",
    color: "text-emerald-400",
    icon: <Plus className="h-4 w-4" />,
  },
  consume: {
    label: "消费",
    color: "text-rose-400",
    icon: <ArrowDownRight className="h-4 w-4" />,
  },
  refund: {
    label: "退款",
    color: "text-amber-400",
    icon: <ArrowUpRight className="h-4 w-4" />,
  },
  transfer_in: {
    label: "转入",
    color: "text-blue-400",
    icon: <ArrowDownRight className="h-4 w-4" />,
  },
  transfer_out: {
    label: "转出",
    color: "text-orange-400",
    icon: <ArrowUpRight className="h-4 w-4" />,
  },
  bonus: {
    label: "赠送",
    color: "text-violet-400",
    icon: <Gift className="h-4 w-4" />,
  },
};

export default function CreditsPage() {
  const [balance, setBalance] = useState<CreditBalance>({
    total: 1850,
    available: 1850,
    frozen: 0,
  });
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("packages");

  // Transfer form
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [balanceRes, recordsRes] = await Promise.all([
          fetch("/api/credits/balance"),
          fetch("/api/credits/logs"),
        ]);
        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (data.code === 0) {
            const raw = data.data;
            // API 可能返回 { balance: number } 或 { total, available, frozen }
            if (raw && typeof raw.balance === "number") {
              setBalance({ total: raw.balance, available: raw.balance, frozen: 0 });
            } else if (raw && typeof raw.available === "number") {
              setBalance(raw);
            } else {
              setBalance({ total: 0, available: 0, frozen: 0 });
            }
          }
        }
        if (recordsRes.ok) {
          const data = await recordsRes.json();
          if (data.code === 0) {
            setRecords(data.data?.list || (Array.isArray(data.data) ? data.data : []));
          } else {
            setRecords(MOCK_RECORDS);
          }
        } else {
          setRecords(MOCK_RECORDS);
        }
      } catch {
        setRecords(MOCK_RECORDS);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
          // Re-fetch balance after recharge
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
        body: JSON.stringify({
          target: transferTarget.trim(),
          amount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          // Re-fetch balance after transfer
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">积分中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理你的积分余额和充值记录
        </p>
      </div>

      {/* Balance card */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="packages">充值套餐</TabsTrigger>
          <TabsTrigger value="records">积分记录</TabsTrigger>
          <TabsTrigger value="transfer">积分划转</TabsTrigger>
        </TabsList>

        {/* Packages tab */}
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

        {/* Records tab */}
        <TabsContent value="records" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">积分记录</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-9 w-9 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-40 rounded bg-muted" />
                        <div className="h-3 w-24 rounded bg-muted" />
                      </div>
                      <div className="h-4 w-16 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">暂无积分记录</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {records.map((record) => {
                    const config = RECORD_TYPE_CONFIG[record.type] || RECORD_TYPE_CONFIG.consume;
                    const isPositive = record.amount > 0;
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${config.color}`}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {record.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.createdAt}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-medium ${
                              isPositive ? "text-emerald-400" : "text-foreground"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {record.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            余额 {record.balance}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer tab */}
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
