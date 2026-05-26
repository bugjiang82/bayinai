"use client";

import React from "react";
import { Zap, Crown, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGE_MODELS, IMAGE_MODEL_OPTIONS, type ImageModelId, type ImageQuality } from "@/models";
import { useCreditPolicies, prefetchCreditPolicies } from "@/hooks/useCreditPolicies";

export type ModelType = ImageModelId;

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: ModelType) => void;
  quality?: ImageQuality;
  className?: string;
}

prefetchCreditPolicies();

export default function ModelSelector({
  value,
  onChange,
  quality = "1K",
  className,
}: ModelSelectorProps) {
  const { getImageCostFromApi } = useCreditPolicies();

  const getIcon = (type: ModelType) => {
    switch (type) {
      case "flash": return Zap;
      case "pro": return Crown;
      case "image2": return Sparkles;
      default: return Zap;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-zinc-300">模型选择</label>
      <div className="grid grid-cols-2 gap-2">
        {IMAGE_MODEL_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          const Icon = getIcon(opt.value as ModelType);
          const modelInfo = IMAGE_MODELS[opt.value as ImageModelId];
          if (!modelInfo) return null;

          const credits = getImageCostFromApi(opt.value as ImageModelId, quality);

          return (
            <button
              key={opt.value}
              className={cn(
                "relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left",
                isSelected
                  ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20"
                  : "bg-[#0f0f0f] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
              )}
              onClick={() => onChange(opt.value as ModelType)}
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
                  {opt.label}
                </span>
              </div>
              <p
                className={cn(
                  "text-xs mb-2",
                  isSelected ? "text-zinc-400" : "text-zinc-600"
                )}
              >
                {opt.description}
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
                  {credits} 积分/张
                </span>
                <span className="text-xs text-zinc-600">~{modelInfo.isFlashModel ? "10s" : modelInfo.isProModel ? "30s" : "60s"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}