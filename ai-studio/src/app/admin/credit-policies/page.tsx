"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Save,
  RefreshCw,
  Search,
  Coins,
  ImageIcon,
  Video,
  Check,
  X,
  Plus,
  Trash2,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreditPolicy {
  key: string;
  name: string;
  description: string | null;
  cost: number;
  unit: string;
  category: string;
  isActive: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  image: "图片生成",
  video: "视频生成",
  outpaint: "扩图",
  architecture: "进阶设计",
  edit: "图片编辑",
  workflow: "工作流",
  other: "其他",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  outpaint: <ScanLine className="w-4 h-4" />,
};

export default function CreditPoliciesPage() {
  const [policies, setPolicies] = useState<CreditPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "other">("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set());

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/credit-policies");
      const data = await res.json();
      if (data.success) {
        setPolicies(data.data);
      }
    } catch (error) {
      setMessage({ type: "error", text: "获取积分策略失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const updatePolicyField = (key: string, field: keyof CreditPolicy, value: string | number | boolean) => {
    setPolicies(prev =>
      prev.map(p => p.key === key ? { ...p, [field]: value } : p)
    );
    setEditedKeys(prev => new Set(prev).add(key));
  };

  const savePolicies = async () => {
    setSaving(true);
    setMessage(null);

    const changedPolicies = policies.filter(p => editedKeys.has(p.key));

    try {
      const res = await fetch("/api/admin/credit-policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies: changedPolicies }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message || "保存成功" });
        setEditedKeys(new Set());
      } else {
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!confirm("确定要重置为默认规则吗？这将覆盖当前所有自定义设置。")) return;

    try {
      const res = await fetch("/api/admin/credit-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "已重置为默认规则" });
        await fetchPolicies();
      }
    } catch (error) {
      setMessage({ type: "error", text: "重置失败" });
    }
  };

  const filteredPolicies = policies.filter(p => {
    const matchesSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.key.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || p.category === activeTab ||
      (activeTab === "other" && !["image", "video"].includes(p.category));
    return matchesSearch && matchesTab;
  });

  const groupedPolicies = filteredPolicies.reduce((acc, policy) => {
    const cat = policy.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(policy);
    return acc;
  }, {} as Record<string, CreditPolicy[]>);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">积分规则管理</h1>
            <p className="text-zinc-500 text-sm">
              管理所有功能模块的积分扣减规则，支持动态调整
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={resetDefaults}
              className="text-zinc-400 border-white/10 hover:bg-white/5"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重置默认
            </Button>
            <Button
              size="sm"
              onClick={savePolicies}
              disabled={editedKeys.size === 0 || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              保存修改 ({editedKeys.size})
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={cn(
              "mb-6 p-4 rounded-xl border flex items-center gap-3",
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            )}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="搜索策略名称或 key..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white/[0.04] border-white/[0.08] text-zinc-200"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "image", "video", "other"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-white/[0.04] text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab === "all" ? "全部" : CATEGORY_LABELS[tab] || tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPolicies).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  {CATEGORY_ICONS[category]}
                  <h2 className="text-lg font-semibold text-zinc-300">
                    {CATEGORY_LABELS[category] || category}
                  </h2>
                  <span className="text-sm text-zinc-600">({items.length} 条规则)</span>
                </div>

                <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                          规则名称
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                          Key
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                          描述
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                          积分消耗
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase">
                          状态
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((policy) => {
                        const isEdited = editedKeys.has(policy.key);
                        const isImageRule = category === "image";
                        const isVideoRule = category === "video";

                        return (
                          <tr
                            key={policy.key}
                            className={cn(
                              "border-b border-white/[0.04] transition-colors",
                              isEdited && "bg-indigo-500/5"
                            )}
                          >
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                {isEdited && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                )}
                                <Input
                                  value={policy.name}
                                  onChange={e => updatePolicyField(policy.key, "name", e.target.value)}
                                  className="bg-transparent border-0 p-0 h-auto text-sm text-zinc-200 focus-visible:ring-0 min-w-[140px]"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <code className="text-xs text-zinc-600 bg-white/[0.04] px-2 py-1 rounded">
                                {policy.key}
                              </code>
                            </td>
                            <td className="px-6 py-3">
                              <Input
                                value={policy.description || ""}
                                onChange={e => updatePolicyField(policy.key, "description", e.target.value)}
                                placeholder="规则描述"
                                className="bg-transparent border-0 p-0 h-auto text-sm text-zinc-500 focus-visible:ring-0"
                              />
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  value={policy.cost}
                                  onChange={e => updatePolicyField(policy.key, "cost", Number(e.target.value))}
                                  className="w-20 bg-white/[0.04] border-white/[0.08] text-sm text-right text-zinc-200 rounded-lg px-3 py-1.5"
                                />
                                <span className="text-xs text-zinc-600 min-w-[32px]">
                                  {policy.unit || (isVideoRule ? "积分/秒" : "积分/次")}
                                </span>
                                {isVideoRule && (
                                  <Coins className="w-3.5 h-3.5 text-zinc-600" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              <button
                                onClick={() => updatePolicyField(policy.key, "isActive", !policy.isActive)}
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                                  policy.isActive
                                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                )}
                              >
                                {policy.isActive ? "启用" : "禁用"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {items.length > 0 && (
                  <div className="mt-2 flex gap-6 text-xs text-zinc-600 px-6">
                    {category === "video" && (
                      <span>视频规则按秒计费，生成时长 × 每秒消耗 = 总消耗积分</span>
                    )}
                    {category === "image" && (
                      <span>图片规则按张计费，模型 × 质量 = 单张消耗积分</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredPolicies.length === 0 && (
              <div className="text-center py-20 text-zinc-600">
                <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>没有找到匹配的积分规则</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}