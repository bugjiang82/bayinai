"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check, FileCode, ArrowRight, Bug, Calendar, GitBranch } from "lucide-react";

export const devlog20260601Chapter = {
  id: "2026-06-01-devlog",
  title: "2026-06-01 开发日志",
  sections: [
    {
      id: "0601-overview",
      title: "变更概览",
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            本次共完成 <span className="text-indigo-400 font-medium">1 项修复</span>，
            涉及 <span className="text-indigo-400 font-medium">1 个文件</span>（<code className="px-2 py-1 bg-slate-800 rounded text-sm">generation.service.ts</code>），
            修改约 <span className="text-green-400 font-medium">5 行</span>。
          </p>
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">变更影响范围</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-left text-slate-400 font-medium">变更文件</th>
                    <th className="px-4 py-2 text-left text-slate-400 font-medium">行数变化</th>
                    <th className="px-4 py-2 text-left text-slate-400 font-medium">影响功能</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr><td className="px-4 py-2 font-mono text-xs">generation.service.ts</td><td className="px-4 py-2">+5 / -5</td><td className="px-4 py-2">Seedance 1.5 Pro 视频时长</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "0601-fix1",
      title: "修复 #1 | Seedance 1.5 Pro 视频时长参数无效",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="text-[11px] bg-rose-500/10 text-rose-400 border-rose-500/20">Bug 修复</Badge>
            <Badge className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">generation.service.ts</Badge>
            <Badge className="text-[11px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Seedance 1.5 Pro</Badge>
          </div>

          <div className="p-4 bg-rose-900/20 border border-rose-700/50 rounded-lg">
            <h4 className="font-medium text-rose-400 mb-2">问题描述</h4>
            <p className="text-sm text-slate-300">
              在画布模式下选择 Seedance 1.5 Pro 视频大模型，将时长设置为 12 秒、10 秒或 8 秒等非默认值后，
              实际生成的视频始终只有 <span className="text-rose-300 font-medium">5 秒</span>。
            </p>
          </div>

          <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <h4 className="font-medium text-blue-400 mb-2">根因分析</h4>
            <p className="text-sm text-slate-300 mb-3">
              经过逐层追踪完整参数传递链路，前端参数传递每一步正确，问题出在
              <code className="px-1 bg-slate-800 rounded">generation.service.ts</code> 中向 Ark API 发送请求时参数结构错误。
            </p>
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">参数传递链路验证</span>
              </div>
              <pre className="p-4 text-xs overflow-x-auto text-slate-300 leading-relaxed">
                <code>{"前端 VideoNode.tsx (L106)\n  duration: Number(data.config.duration?.replace(\"s\", \"\") || 5)\n  \"12s\" -> 12 [OK]\n    |\n    v\n前端 aiService.ts (L120)\n  duration: config.duration || 5\n  12 -> /api/workflow/generate/video [OK]\n    |\n    v\n后端 route.ts (L41)\n  duration = 5 (default, overwritten by body)\n  Actual: 12 [OK]\n    |\n    v\n后端 generation.service.ts (L587)\n  duration = 5 (default, overwritten by param)\n  Actual: 12 [OK]\n    |\n    v\nArk API Request (L748-756) [FAIL]\n  parameters: { duration: 12 }\n  Ark API has no 'parameters' field!\n  duration ignored, defaults to 5s"}</code>
              </pre>
            </div>
            <p className="text-sm text-slate-300 mt-3">
              根据 <a href="https://www.volcengine.com/docs/82379/1520757" className="text-indigo-400 underline" target="_blank" rel="noopener noreferrer">Volcengine Ark API 文档</a>，
              <code className="px-1 bg-slate-800 rounded">POST /api/v3/contents/generations/tasks</code> 接口的
              <code className="px-1 bg-slate-800 rounded">duration</code>、<code className="px-1 bg-slate-800 rounded">resolution</code>、
              <code className="px-1 bg-slate-800 rounded">ratio</code>、<code className="px-1 bg-slate-800 rounded">watermark</code>
              均为顶层参数，不存在 <code className="px-1 bg-slate-800 rounded">parameters</code> 嵌套结构。
            </p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-400 mb-3">修复方案</h4>
              <p className="text-sm text-slate-300 mb-4">
                将 duration、resolution、ratio、watermark 从嵌套的 parameters 对象中提升到请求体顶层。
              </p>
              <div className="bg-slate-900 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">修复前后对比</span>
                </div>
                <pre className="p-4 text-xs overflow-x-auto">
                  <code>{"// [BEFORE] Parameters nested inside 'parameters' object\nrequestBody = {\n  model: \"doubao-seedance-1-5-pro-251215\",\n  content,\n  parameters: {          // Ark API does NOT recognize this\n    resolution: arkResolution,\n    ratio,\n    duration,            // ignored, defaults to 5\n    watermark: false,\n  },\n  return_last_frame: !!lastFrame,\n};\n\n// [AFTER] Parameters at top level\nrequestBody = {\n  model: \"doubao-seedance-1-5-pro-251215\",\n  content,\n  resolution: arkResolution,  // top-level\n  ratio,                      // top-level\n  duration,                   // top-level, recognized by API\n  watermark: false,           // top-level\n  return_last_frame: !!lastFrame,\n};"}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-sm">
            <p className="text-green-400 font-medium">验证结果</p>
            <p className="text-slate-300 mt-1">
              修复后 Seedance 1.5 Pro 支持的所有时长（4s/5s/8s/10s/12s）均可正常传递给 Ark API，
              生成的视频时长与用户选择一致。TypeScript 编译零错误。
            </p>
          </div>
        </div>
      ),
    },
  ],
} as const;