"use client";
import logger from "@/lib/logger";
import { useSession } from "next-auth/react";

import { useState, useEffect } from "react";
import {
  Database,
  KeyRound,
  Shield,
  Coins,
  CheckCircle2,
  Wand2,
  Building2,
  Pencil,
  Film,
  Zap,
  Check,
  Loader2,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditPolicyItem {
  key: string;
  name: string;
  description: string | null;
  cost: number;
  unit: string;
  category: string;
}

export function SettingsTab() {
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
      logger.error("Failed to fetch policies:", error);
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
      logger.error("Failed to save policies:", error);
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
    outpaint: "扩图",
    architecture: "进阶设计",
    edit: "图片编辑",
    video: "视频生成",
    workflow: "工作流",
    other: "其他",
  };

  const categoryIcons: Record<string, React.ElementType> = {
    image: Wand2,
    outpaint: ScanLine,
    architecture: Building2,
    edit: Pencil,
    video: Film,
    workflow: Zap,
    other: Coins,
  };

  return (
    <div className="space-y-6 max-w-3xl">
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