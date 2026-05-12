"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Settings2,
  Sparkles,
  Loader2,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PromptInput from "@/components/generate/PromptInput";
import ModelSelector, { type ModelType } from "@/components/generate/ModelSelector";
import DropdownSelector from "@/components/generate/DropdownSelector";

export interface SizeOption {
  label: string;
  ratio: string;
}

// 官方文档支持的宽高比选项
export const SIZE_OPTIONS: SizeOption[] = [
  { label: "1:1", ratio: "1:1" },
  { label: "16:9", ratio: "16:9" },
  { label: "9:16", ratio: "9:16" },
  { label: "4:3", ratio: "4:3" },
  { label: "3:4", ratio: "3:4" },
  { label: "3:2", ratio: "3:2" },
  { label: "2:3", ratio: "2:3" },
  { label: "21:9", ratio: "21:9" },
];

// 官方文档支持的分辨率选项
export const RESOLUTION_OPTIONS = [
  { label: "512", value: "512" },
  { label: "1K", value: "1K" },
  { label: "2K", value: "2K" },
  { label: "4K", value: "4K" },
];

// 官方文档支持的思考级别（仅 gemini-3.1-flash-image-preview）
export const THINKING_OPTIONS = [
  { label: "快速（Minimal）", value: "minimal" },
  { label: "精细（High）", value: "high" },
];

export const IMAGE2_COUNT_OPTIONS = [
  { value: "1", label: "1张" },
  { value: "2", label: "2张" },
  { value: "3", label: "3张" },
  { value: "4", label: "4张" },
];

export const IMAGE2_THINKING_OPTIONS = [
  { value: "off", label: "关闭" },
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];

interface ParamPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  selectedSize: SizeOption;
  onSizeChange: (size: SizeOption) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  thinkingLevel: string;
  onThinkingLevelChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  credits: number;
  className?: string;
  storageKey?: string;
  image2Count?: number;
  onImage2CountChange?: (count: number) => void;
  image2Thinking?: string;
  onImage2ThinkingChange?: (thinking: string) => void;
}

export default function ParamPanel({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  model,
  onModelChange,
  selectedSize,
  onSizeChange,
  resolution,
  onResolutionChange,
  thinkingLevel,
  onThinkingLevelChange,
  onGenerate,
  isGenerating,
  credits,
  className,
  storageKey = "text-to-image-prompt",
  image2Count = 1,
  onImage2CountChange,
  image2Thinking = "off",
  onImage2ThinkingChange,
}: ParamPanelProps) {
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const creditsPerImage = model === "flash" ? 1 : (model === "image2" ? 60 * image2Count : 3);
  const canGenerate = prompt.trim().length > 0 && credits >= creditsPerImage;

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden",
        className
      )}
    >
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {/* Prompt */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">
            提示词
          </label>
          <PromptInput
            value={prompt}
            onChange={onPromptChange}
            showQuickPrompts
            storageKey={storageKey}
          />
        </div>

        {/* Negative prompt (collapsible) */}
        <div>
          <button
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors w-full cursor-pointer"
            onClick={() => setShowNegativePrompt(!showNegativePrompt)}
          >
            {showNegativePrompt ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            负面提示词
            {negativePrompt && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
          {showNegativePrompt && (
            <div className="mt-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <textarea
                value={negativePrompt}
                onChange={(e) => {
                  const value = e.target.value;
                  onNegativePromptChange(value);
                  // 保存到本地存储
                  const negativeStorageKey = storageKey.replace("prompt", "negative-prompt");
                  localStorage.setItem(negativeStorageKey, value);
                }}
                placeholder="输入不希望出现在图像中的内容..."
                className="w-full min-h-[60px] resize-none rounded-lg bg-[#0f0f0f] border border-white/[0.08] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30"
              />
            </div>
          )}
        </div>

        {/* Model selector */}
        <ModelSelector value={model} onChange={onModelChange} />

        {/* Aspect ratio selection */}
        <DropdownSelector
          label="宽高比"
          value={selectedSize.ratio}
          options={SIZE_OPTIONS.map((s) => ({ value: s.ratio, label: s.label }))}
          onChange={(val) => {
            const size = SIZE_OPTIONS.find((s) => s.ratio === val);
            if (size) onSizeChange(size);
          }}
        />

        {/* Advanced params (collapsible) */}
        <div>
          <button
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors w-full cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings2 className="w-4 h-4" />
            高级参数
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              {/* Resolution */}
              {model !== "image2" && (
                <DropdownSelector
                  label="分辨率"
                  value={resolution}
                  options={RESOLUTION_OPTIONS}
                  onChange={onResolutionChange}
                />
              )}

              {/* Thinking level (only for flash model) */}
              {model === "flash" && (
                <DropdownSelector
                  label="思考级别"
                  value={thinkingLevel}
                  options={THINKING_OPTIONS}
                  onChange={onThinkingLevelChange}
                />
              )}

              {/* Image2 专用参数 */}
              {model === "image2" && (
                <>
                  <DropdownSelector
                    label="生成数量"
                    value={image2Count.toString()}
                    options={IMAGE2_COUNT_OPTIONS}
                    onChange={(val) => onImage2CountChange?.(parseInt(val))}
                  />
                  <DropdownSelector
                    label="思考级别"
                    value={image2Thinking}
                    options={IMAGE2_THINKING_OPTIONS}
                    onChange={(val) => onImage2ThinkingChange?.(val)}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Generate button + credits */}
      <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Coins className="w-3.5 h-3.5" />
            <span>
              余额 <span className="text-zinc-300 font-medium">{credits}</span> 积分
            </span>
          </div>
          <span className="text-xs text-zinc-600">
            本次消耗{" "}
            <span
              className={cn(
                "font-medium",
                credits < creditsPerImage ? "text-red-400" : "text-zinc-400"
              )}
            >
              {creditsPerImage}
            </span>{" "}
            积分
          </span>
        </div>
        <Button
          className={cn(
            "w-full h-11 text-sm font-semibold rounded-xl transition-all duration-300",
            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
            "text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          )}
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              开始生成
            </>
          )}
        </Button>
        {!canGenerate && prompt.trim().length === 0 && (
          <p className="text-xs text-zinc-600 text-center mt-2">
            请输入提示词后开始生成
          </p>
        )}
        {!canGenerate && prompt.trim().length > 0 && credits < creditsPerImage && (
          <p className="text-xs text-red-400/80 text-center mt-2">
            积分不足，请充值后重试
          </p>
        )}
      </div>
    </div>
  );
}
