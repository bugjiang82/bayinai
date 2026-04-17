"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export default function ProgressBar({ progress, className }: ProgressBarProps) {
  const getStatusText = () => {
    if (progress < 20) return "分析提示词中...";
    if (progress < 40) return "构建图像结构...";
    if (progress < 60) return "渲染细节中...";
    if (progress < 80) return "优化图像质量...";
    if (progress < 100) return "即将完成...";
    return "生成完成";
  };

  const isComplete = progress >= 100;

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
            isComplete
              ? "bg-emerald-500 w-full"
              : "bg-gradient-to-r from-indigo-500 to-purple-500"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {!isComplete && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Status info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          )}
          <span
            className={cn(
              "text-sm",
              isComplete ? "text-emerald-400" : "text-zinc-400"
            )}
          >
            {getStatusText()}
          </span>
        </div>
        <span
          className={cn(
            "text-sm tabular-nums font-medium",
            isComplete ? "text-emerald-400" : "text-zinc-500"
          )}
        >
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
