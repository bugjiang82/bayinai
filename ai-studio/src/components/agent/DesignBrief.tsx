"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Palette,
  Layers,
  Sparkles,
} from "lucide-react";

export interface DesignBriefData {
  summary: string;
  style: string;
  colors: string[];
  elements: string[];
}

export interface DesignBriefProps {
  data: DesignBriefData;
  onConfirm?: () => void;
  onAdjust?: () => void;
  className?: string;
}

export default function DesignBrief({
  data,
  onConfirm,
  onAdjust,
  className,
}: DesignBriefProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">设计简报</h4>
          <p className="text-xs text-muted-foreground">请确认以下方案</p>
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-3">
        {/* Summary */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            需求概述
          </div>
          <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
        </div>

        {/* Style */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Palette className="h-3 w-3" />
            推荐风格
          </div>
          <p className="text-sm text-foreground">{data.style}</p>
        </div>

        {/* Colors */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Layers className="h-3 w-3" />
            推荐配色
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.colors.map((color, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div
                  className="h-5 w-5 rounded-md border border-border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">{color}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Elements */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Layers className="h-3 w-3" />
            关键元素
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {data.elements.map((el, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
              >
                {el}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          onClick={onConfirm}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Sparkles className="h-3.5 w-3.5" />
          确认生成
        </Button>
        <Button size="sm" variant="outline" onClick={onAdjust}>
          调整方案
        </Button>
      </div>
    </div>
  );
}
