"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Check, FileCode, ArrowRight } from "lucide-react";

export const creditRulesChapter = {
  id: "credit-rules",
  title: "配置积分规则",
  sections: [
    {
      id: "credit-overview",
      title: "概述",
      content: (
        <div className="space-y-4">
          <p>
            积分规则定义在 <code className="px-2 py-1 bg-slate-800 rounded text-sm">src/models/creditRules.ts</code> 中，分为图片规则和视频规则两类。
            规则会自动同步到管理后台的积分策略配置页面。
          </p>
        </div>
      ),
    },
    {
      id: "credit-policy-key",
      title: "Policy Key 命名规范",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h4 className="font-medium text-indigo-400 mb-2">图片模型</h4>
                <code className="text-sm bg-slate-900 px-2 py-1 rounded">modelId__quality</code>
                <div className="mt-2 space-y-1 text-sm text-slate-400">
                  <p>flash__1k, flash__2k, flash__4k</p>
                  <p>pro__512, pro__1k, pro__2k</p>
                  <p>image2__1k, image2__2k</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <h4 className="font-medium text-indigo-400 mb-2">视频模型</h4>
                <code className="text-sm bg-slate-900 px-2 py-1 rounded">modelId__resolution</code>
                <div className="mt-2 space-y-1 text-sm text-slate-400">
                  <p>wan2-2-kf2v-flash__720p</p>
                  <p>wan2-7-t2v__1080p</p>
                  <p>happyhorse-1-0-t2v__720p</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm">
            <p className="text-blue-400 font-medium">重要提示</p>
            <p className="text-slate-300 mt-1">Policy Key 中的模型 ID 需要将点（.）替换为连字符（-），质量/分辨率使用小写字母。</p>
          </div>
        </div>
      ),
    },
    {
      id: "credit-auto-sync",
      title: "自动同步机制",
      content: (
        <div className="space-y-4">
          <p>当访问管理后台的积分策略页面时，系统会自动检查数据库中的规则与默认规则是否一致。如果数据库中缺少某些规则，系统会自动补充。</p>
          <div className="flex items-center gap-2 p-4 bg-slate-800/50 rounded-lg">
            <ArrowRight className="w-4 h-4 text-indigo-400" />
            <span className="text-sm">修改默认规则后，刷新管理后台页面即可自动同步到数据库</span>
          </div>
        </div>
      ),
    },
  ],
} as const;