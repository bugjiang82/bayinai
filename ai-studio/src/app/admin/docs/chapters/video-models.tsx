"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check, FileCode, ArrowRight, Video } from "lucide-react";

export const videoModelsChapter = {
  id: "video-models",
  title: "添加视频大模型",
  sections: [
    {
      id: "video-overview",
      title: "概述",
      content: (
        <div className="space-y-4">
          <p>
            视频大模型统一注册在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/videoModels.ts</code> 文件中。
            添加新模型只需修改两个文件。
          </p>
        </div>
      ),
    },
    {
      id: "video-step1",
      title: "步骤一：注册模型信息",
      content: (
        <div className="space-y-4">
          <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">VIDEO_MODELS</code> 对象中添加新模型：</p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">src/models/videoModels.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{`export const VIDEO_MODELS: Record<VideoModelId, VideoModelInfo> = {
  // ... 已有模型
  "pika-2.0-t2v": {
    id: "pika-2.0-t2v",
    name: "Pika 2.0",
    displayName: "Pika 2.0",
    category: "video",
    description: "文生视频，支持风格控制",
    supportedResolutions: ["720P", "1080P"],
    supportedDurations: [5, 10],
    supportsTextToVideo: true,
    supportsImageToVideo: false,
    isWan22: false,
    isWan27: false,
    isHappyHorse: false,
  },
};`}</code>
            </pre>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="font-medium text-indigo-400">supportedResolutions</span>
              <p className="text-slate-400 mt-1">支持的分辨率：480P, 720P, 1080P</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="font-medium text-indigo-400">supportedDurations</span>
              <p className="text-slate-400 mt-1">支持的时长（秒）：3, 5, 10, 15</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="font-medium text-indigo-400">支持模式</span>
              <p className="text-slate-400 mt-1">supportsTextToVideo / supportsImageToVideo</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "video-step2",
      title: "步骤二：配置积分规则",
      content: (
        <div className="space-y-4">
          <p>在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/creditRules.ts</code> 中添加按秒计费规则：</p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">src/models/creditRules.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code>{`export const DEFAULT_VIDEO_CREDIT_RULES: VideoCreditRule[] = [
  // ... 已有规则
  { policyKey: "pika-2-0-t2v__720p", modelId: "pika-2.0-t2v", resolution: "720P", name: "Pika 2.0 - 720P", costPerSecond: 45, unit: "秒" },
  { policyKey: "pika-2-0-t2v__1080p", modelId: "pika-2.0-t2v", resolution: "1080P", name: "Pika 2.0 - 1080P", costPerSecond: 70, unit: "秒" },
];`}</code>
            </pre>
          </div>
          <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm">
            <p className="text-amber-400 font-medium">提示：policyKey 格式</p>
            <p className="text-slate-300 mt-1">policyKey 必须将模型 ID 中的点替换为连字符：<code className="px-1 bg-slate-800 rounded">pika-2.0-t2v → pika-2-0-t2v__720p</code></p>
          </div>
        </div>
      ),
    },
  ],
} as const;