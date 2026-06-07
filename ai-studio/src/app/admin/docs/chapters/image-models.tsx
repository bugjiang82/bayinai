"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check, FileCode, ArrowRight } from "lucide-react";

export const imageModelsChapter = {
  id: "image-models",
  title: "添加图片大模型",
  sections: [
    {
      id: "image-overview",
      title: "概述",
      content: (
        <div className="space-y-4">
          <p>
            图片大模型统一注册在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/imageModels.ts</code> 文件中。
            添加新模型只需修改以下三个文件，无需改动其他业务代码。
          </p>
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-sm">网页模式自动同步</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-sm">画布模式自动同步</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-sm">积分规则自动适配</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "image-step1",
      title: "步骤一：注册模型信息",
      content: (
        <div className="space-y-4">
          <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/imageModels.ts</code> 的 <code className="px-2 py-1 bg-slate-800 rounded text-sm">IMAGE_MODELS</code> 对象中添加新模型：</p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">src/models/imageModels.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{`export const IMAGE_MODELS: Record<ImageModelId, ModelInfo> = {
  // ... 已有模型
  turbo: {
    id: "turbo",
    name: "GPT Turbo",
    category: "image",
    description: "超快速生成，适合批量创作",
    supportedQualities: ["1K", "2K"],
    isImage2Model: false,
    isProModel: false,
    isFlashModel: false,
  },
};`}</code>
            </pre>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="font-medium text-indigo-400">supportedQualities</span>
              <p className="text-slate-400 mt-1">支持的图片质量：512, 1K, 2K, 4K</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="font-medium text-indigo-400">布尔标志</span>
              <p className="text-slate-400 mt-1">isFlashModel/isProModel/isImage2Model 用于分类</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "image-step2",
      title: "步骤二：添加 API 名称映射",
      content: (
        <div className="space-y-4">
          <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">IMAGE_MODEL_API_NAMES</code> 对象中添加 API 调用名称：</p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">src/models/imageModels.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{`export const IMAGE_MODEL_API_NAMES: Record<ImageModelId, string> = {
  // ... 已有映射
  turbo: "openai/gpt-5-turbo-image",
};`}</code>
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: "image-step3",
      title: "步骤三：更新类型定义",
      content: (
        <div className="space-y-4">
          <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/types.ts</code> 中添加新模型 ID：</p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">src/models/types.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{`export type ImageModelId = "flash" | "pro" | "image2" | "turbo";`}</code>
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: "image-step4",
      title: "步骤四：配置积分规则",
      content: (
        <div className="space-y-4">
          <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/creditRules.ts</code> 中添加积分规则：</p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">src/models/creditRules.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{`export const DEFAULT_IMAGE_CREDIT_RULES: ImageCreditRule[] = [
  // ... 已有规则
  { policyKey: "turbo__1k", modelId: "turbo", quality: "1K", name: "Turbo - 1K", cost: 10, unit: "次" },
  { policyKey: "turbo__2k", modelId: "turbo", quality: "2K", name: "Turbo - 2K", cost: 20, unit: "次" },
];`}</code>
            </pre>
          </div>
          <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm">
            <p className="text-amber-400 font-medium">提示：policyKey 格式</p>
            <p className="text-slate-300 mt-1">policyKey 必须遵循格式：<code className="px-1 bg-slate-800 rounded">modelId__quality</code>（如 flash__1k、pro__4k）</p>
          </div>
        </div>
      ),
    },
  ],
} as const;