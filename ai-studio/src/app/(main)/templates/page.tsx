"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Users,
  Loader2,
  LayoutTemplate,
  Sparkles,
  Building2,
  Sofa,
  TreePine,
  Image,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

type TemplateCategory =
  | "all"
  | "architecture"
  | "interior"
  | "landscape"
  | "rendering";

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnail: string;
  prompt: string;
  negativePrompt?: string;
  params: {
    width: number;
    height: number;
    guidanceScale: number;
    model: string;
  };
  usageCount: number;
  author: string;
}

interface TemplatesResponse {
  templates?: Template[];
  total?: number;
  list?: Template[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  all: "全部",
  architecture: "建筑风格",
  interior: "室内设计",
  landscape: "景观设计",
  rendering: "效果图",
};

const CATEGORY_ICONS: Record<TemplateCategory, React.ReactNode> = {
  all: <LayoutTemplate className="h-3.5 w-3.5" />,
  architecture: <Building2 className="h-3.5 w-3.5" />,
  interior: <Sofa className="h-3.5 w-3.5" />,
  landscape: <TreePine className="h-3.5 w-3.5" />,
  rendering: <Image className="h-3.5 w-3.5" />,
};

const GRADIENTS = [
  "from-violet-600/40 to-indigo-600/40",
  "from-rose-600/40 to-orange-600/40",
  "from-emerald-600/40 to-teal-600/40",
  "from-cyan-600/40 to-blue-600/40",
  "from-fuchsia-600/40 to-pink-600/40",
  "from-amber-600/40 to-yellow-600/40",
  "from-lime-600/40 to-green-600/40",
  "from-sky-600/40 to-indigo-600/40",
  "from-red-600/40 to-rose-600/40",
  "from-teal-600/40 to-cyan-600/40",
  "from-purple-600/40 to-violet-600/40",
  "from-orange-600/40 to-amber-600/40",
];

function getGradient(id: string): string {
  const index =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    GRADIENTS.length;
  return GRADIENTS[index];
}

// ─── Mock data ───────────────────────────────────────────────────────────────

function generateMockTemplates(): Template[] {
  return [
    {
      id: "tpl-1",
      name: "现代极简住宅",
      category: "architecture",
      thumbnail: "",
      prompt:
        "现代极简主义住宅建筑外观，白色混凝土立面，大面积落地玻璃窗，简洁线条，蓝天背景，建筑摄影风格",
      negativePrompt: "模糊, 低质量, 变形",
      params: { width: 1024, height: 768, guidanceScale: 7.5, model: "imagen-3" },
      usageCount: 1280,
      author: "AI Studio",
    },
    {
      id: "tpl-2",
      name: "北欧风客厅",
      category: "interior",
      thumbnail: "",
      prompt:
        "北欧风格客厅室内设计，原木地板，浅灰色沙发，绿植点缀，大面积窗户自然采光，温馨氛围，3D渲染",
      negativePrompt: "杂乱, 暗色调",
      params: { width: 1024, height: 768, guidanceScale: 8, model: "imagen-3" },
      usageCount: 956,
      author: "AI Studio",
    },
    {
      id: "tpl-3",
      name: "日式枯山水庭院",
      category: "landscape",
      thumbnail: "",
      prompt:
        "日式禅意枯山水庭院设计，白砂石纹，苔藓覆盖的石头，竹篱笆，石灯笼，樱花树枝，宁静氛围",
      negativePrompt: "现代建筑, 城市",
      params: { width: 1024, height: 768, guidanceScale: 7.5, model: "imagen-3" },
      usageCount: 743,
      author: "AI Studio",
    },
    {
      id: "tpl-4",
      name: "商业综合体效果图",
      category: "rendering",
      thumbnail: "",
      prompt:
        "大型商业综合体建筑效果图，玻璃幕墙反射天空，入口广场，绿化景观，人流量适中，黄昏光线，照片级真实感",
      negativePrompt: "卡通, 手绘",
      params: { width: 1536, height: 1024, guidanceScale: 9, model: "imagen-4" },
      usageCount: 2105,
      author: "AI Studio",
    },
    {
      id: "tpl-5",
      name: "工业风LOFT",
      category: "interior",
      thumbnail: "",
      prompt:
        "工业风格LOFT公寓室内设计，裸露砖墙，金属管道，大型落地窗，复古家具，开放式厨房，暖色灯光",
      negativePrompt: "传统风格, 简约",
      params: { width: 1024, height: 768, guidanceScale: 7.5, model: "imagen-3" },
      usageCount: 632,
      author: "AI Studio",
    },
    {
      id: "tpl-6",
      name: "未来科技大厦",
      category: "architecture",
      thumbnail: "",
      prompt:
        "未来主义科技大厦建筑外观，流线型设计，参数化曲面，LED灯光效果，夜间城市背景，科幻风格",
      negativePrompt: "传统建筑, 古典",
      params: { width: 1024, height: 1536, guidanceScale: 8.5, model: "imagen-4" },
      usageCount: 1587,
      author: "AI Studio",
    },
    {
      id: "tpl-7",
      name: "热带度假村",
      category: "landscape",
      thumbnail: "",
      prompt:
        "热带度假村景观设计，无边泳池，棕榈树，木栈道，海景，日落光线，休闲躺椅，奢华度假氛围",
      negativePrompt: "冬季, 寒冷",
      params: { width: 1536, height: 1024, guidanceScale: 7.5, model: "imagen-3" },
      usageCount: 891,
      author: "AI Studio",
    },
    {
      id: "tpl-8",
      name: "新中式别墅",
      category: "rendering",
      thumbnail: "",
      prompt:
        "新中式别墅建筑效果图，白墙灰瓦，庭院回廊，假山流水，现代与传统融合，鸟瞰视角，高品质渲染",
      negativePrompt: "西式建筑, 现代",
      params: { width: 1536, height: 1024, guidanceScale: 8, model: "imagen-4" },
      usageCount: 1134,
      author: "AI Studio",
    },
    {
      id: "tpl-9",
      name: "地中海风格花园",
      category: "landscape",
      thumbnail: "",
      prompt:
        "地中海风格花园景观设计，陶罐花器，薰衣草，橄榄树，石板小径，铁艺座椅，阳光明媚",
      negativePrompt: "现代, 极简",
      params: { width: 1024, height: 768, guidanceScale: 7.5, model: "imagen-3" },
      usageCount: 478,
      author: "AI Studio",
    },
    {
      id: "tpl-10",
      name: "高层办公楼夜景",
      category: "rendering",
      thumbnail: "",
      prompt:
        "超高层办公楼夜景效果图，LED灯光幕墙，城市天际线，车流光轨，倒影水面，照片级真实感，广角镜头",
      negativePrompt: "白天, 简单",
      params: { width: 1536, height: 1024, guidanceScale: 9, model: "imagen-4" },
      usageCount: 1678,
      author: "AI Studio",
    },
    {
      id: "tpl-11",
      name: "轻奢主卧套房",
      category: "interior",
      thumbnail: "",
      prompt:
        "轻奢风格主卧套房设计，大理石地面，丝绒床品，水晶吊灯，落地窗帘，梳妆台，柔和灯光，高级质感",
      negativePrompt: "简约, 简陋",
      params: { width: 1024, height: 768, guidanceScale: 8, model: "imagen-3" },
      usageCount: 823,
      author: "AI Studio",
    },
    {
      id: "tpl-12",
      name: "参数化展馆",
      category: "architecture",
      thumbnail: "",
      prompt:
        "参数化设计展览馆，有机曲面造型，穿孔铝板表皮，自然光线透过，公园环境，建筑摄影，白色基调",
      negativePrompt: "方形, 传统",
      params: { width: 1024, height: 768, guidanceScale: 8.5, model: "imagen-4" },
      usageCount: 567,
      author: "AI Studio",
    },
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Custom template form state
  const [customName, setCustomName] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customCategory, setCustomCategory] = useState<TemplateCategory>("architecture");
  const [creating, setCreating] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        ...(searchQuery ? { q: searchQuery } : {}),
      });

      const res = await fetch(`/api/templates?${params}`);
      if (res.ok) {
        const json = await res.json();
        const data: TemplatesResponse = json.code === 0 ? json.data : null;
        if (data && Array.isArray(data.list)) {
          setTemplates(data.list);
        } else if (data && Array.isArray(data)) {
          setTemplates(data);
        } else {
          const mockTemplates = generateMockTemplates();
          setTemplates(mockTemplates);
        }
      } else {
        // Fallback to mock data
        const mockTemplates = generateMockTemplates();
        setTemplates(mockTemplates);
      }
    } catch {
      const mockTemplates = generateMockTemplates();
      setTemplates(mockTemplates);
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = templates.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (
      searchQuery &&
      !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleUseTemplate = (template: Template) => {
    const params = new URLSearchParams({
      prompt: template.prompt,
      ...(template.negativePrompt
        ? { negativePrompt: template.negativePrompt }
        : {}),
      width: String(template.params.width),
      height: String(template.params.height),
      guidanceScale: String(template.params.guidanceScale),
      model: template.params.model,
    });
    router.push(`/generate/text-to-image?${params.toString()}`);
  };

  const handleCreateTemplate = async () => {
    if (!customName.trim() || !customPrompt.trim()) return;

    setCreating(true);
    try {
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          prompt: customPrompt.trim(),
          category: customCategory,
        }),
      });
    } catch {
      // Silently handle error
    } finally {
      setCreating(false);
      setDialogOpen(false);
      setCustomName("");
      setCustomPrompt("");
      setCustomCategory("architecture");
    }
  };

  const formatUsageCount = (count: number): string => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">模板市场</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                创建自定义模板
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建自定义模板</DialogTitle>
                <DialogDescription>
                  创建一个可复用的提示词模板，方便快速生成作品
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">模板名称</label>
                  <Input
                    placeholder="输入模板名称..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">分类</label>
                  <Tabs
                    value={customCategory}
                    onValueChange={(v) =>
                      setCustomCategory(v as TemplateCategory)
                    }
                  >
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="architecture">建筑风格</TabsTrigger>
                      <TabsTrigger value="interior">室内设计</TabsTrigger>
                      <TabsTrigger value="landscape">景观设计</TabsTrigger>
                      <TabsTrigger value="rendering">效果图</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">提示词</label>
                  <textarea
                    placeholder="输入详细的提示词描述..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-[10px] border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
                  onClick={handleCreateTemplate}
                  disabled={
                    !customName.trim() || !customPrompt.trim() || creating
                  }
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  创建模板
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category filters */}
      <Tabs
        value={category}
        onValueChange={(v) => setCategory(v as TemplateCategory)}
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            {CATEGORY_ICONS.all}
            全部
          </TabsTrigger>
          <TabsTrigger value="architecture" className="gap-1.5">
            {CATEGORY_ICONS.architecture}
            建筑风格
          </TabsTrigger>
          <TabsTrigger value="interior" className="gap-1.5">
            {CATEGORY_ICONS.interior}
            室内设计
          </TabsTrigger>
          <TabsTrigger value="landscape" className="gap-1.5">
            {CATEGORY_ICONS.landscape}
            景观设计
          </TabsTrigger>
          <TabsTrigger value="rendering" className="gap-1.5">
            {CATEGORY_ICONS.rendering}
            效果图
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-5 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                <div className="h-9 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Templates grid */}
      {!loading && (
        <>
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <LayoutTemplate className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">没有找到模板</h3>
              <p className="text-muted-foreground max-w-md">
                试试调整搜索关键词或切换分类筛选
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group overflow-hidden hover:border-primary/50 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${getGradient(
                          template.id
                        )} flex items-center justify-center`}
                      >
                        <Sparkles className="h-12 w-12 text-white/30" />
                      </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-black/50 backdrop-blur-sm border-0 text-white"
                      >
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </div>

                    {/* Usage count */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-black/50 backdrop-blur-sm border-0 text-white gap-1"
                      >
                        <Users className="h-3 w-3" />
                        {formatUsageCount(template.usageCount)}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm mb-1">
                        {template.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.prompt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{template.params.model}</span>
                        <span className="text-border">|</span>
                        <span>
                          {template.params.width}x{template.params.height}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      使用模板
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
