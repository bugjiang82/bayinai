import React from "react";
import { LayoutTemplate, Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const templateCategories = [
  { id: "architecture", name: "建筑" },
  { id: "interior", name: "室内" },
  { id: "landscape", name: "景观" },
  { id: "product", name: "产品" },
  { id: "portrait", name: "人物" },
  { id: "scene", name: "场景" },
];

const templates = [
  {
    id: 1,
    title: "现代简约风格",
    category: "architecture",
    description: "现代简约风格的建筑设计，干净利落的线条，大面积的玻璃幕墙",
    thumbnail: "https://picsum.photos/seed/arch1/400/300",
    prompts: ["现代简约风格建筑", "玻璃幕墙", "干净利落的线条"],
  },
  {
    id: 2,
    title: "日式和风",
    category: "interior",
    description: "日式和风室内设计，木质元素，自然光线，简洁舒适",
    thumbnail: "https://picsum.photos/seed/interior1/400/300",
    prompts: ["日式和风室内", "木质元素", "自然光线"],
  },
  {
    id: 3,
    title: "自然景观",
    category: "landscape",
    description: "自然景观设计，山水环绕，绿色植被，宁静致远",
    thumbnail: "https://picsum.photos/seed/landscape1/400/300",
    prompts: ["自然景观", "山水环绕", "绿色植被"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <LayoutTemplate className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">模板市场</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="搜索模板..." 
            className="pl-10 bg-[#0f0f0f] border-white/[0.08] text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px] bg-[#0f0f0f] border-white/[0.08] text-zinc-200">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/[0.08] text-zinc-200">
              <SelectItem value="all">全部</SelectItem>
              {templateCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 border border-white/[0.08] text-zinc-400 hover:text-white">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="bg-[#0f0f0f] border-white/[0.08] overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative h-48">
                <img 
                  src={template.thumbnail} 
                  alt={template.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-indigo-500/80 text-white text-xs px-2 py-1 rounded">
                  {templateCategories.find(c => c.id === template.category)?.name}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg font-semibold text-white">{template.title}</CardTitle>
              <CardDescription className="text-zinc-400 mt-1">
                {template.description}
              </CardDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                {template.prompts.map((prompt, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-white/[0.04] rounded-full text-zinc-400">
                    {prompt}
                  </span>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-white/[0.06]">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                使用模板
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Add Template Button */}
      <div className="mt-8 text-center">
        <Button variant="ghost" className="border border-dashed border-white/[0.12] text-zinc-400 hover:text-white hover:border-white/[0.2]">
          <Plus className="w-4 h-4 mr-2" />
          上传模板
        </Button>
      </div>
    </div>
  );
}