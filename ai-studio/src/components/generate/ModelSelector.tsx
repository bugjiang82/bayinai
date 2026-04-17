"use client";

import React from "react";
import { Zap, Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModelType = "flash" | "pro";

interface ModelOption {
  type: ModelType;
  name: string;
  description: string;
  credits: number;
  speed: string;
  quality: string;
}

const MODELS: ModelOption[] = [
  {
    type: "flash",
    name: "Flash",
    description: "快速生成，适合日常创作",
    credits: 1,
    speed: "~10s",
    quality: "标准",
  },
  {
    type: "pro",
    name: "Pro",
    description: "高质量输出，细节更丰富",
    credits: 3,
    speed: "~30s",
    quality: "高清",
  },
];

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: ModelType) => void;
  className?: string;
}

export default function ModelSelector({
  value,
  onChange,
  className,
}: ModelSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-zinc-300">模型选择</label>
      <div className="grid grid-cols-2 gap-2">
        {MODELS.map((model) => {
          const isSelected = value === model.type;
          const Icon = model.type === "flash" ? Zap : Crown;

          return (
            <button
              key={model.type}
              className={cn(
                "relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left",
                isSelected
                  ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20"
                  : "bg-[#0f0f0f] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
              )}
              onClick={() => onChange(model.type)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isSelected ? "text-indigo-400" : "text-zinc-500"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isSelected ? "text-indigo-300" : "text-zinc-300"
                  )}
                >
                  {model.name}
                </span>
              </div>
              <p
                className={cn(
                  "text-xs mb-2",
                  isSelected ? "text-zinc-400" : "text-zinc-600"
                )}
              >
                {model.description}
              </p>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    isSelected
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "bg-white/[0.04] text-zinc-500"
                  )}
                >
                  {model.credits} 积分/张
                </span>
                <span className="text-xs text-zinc-600">{model.speed}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
