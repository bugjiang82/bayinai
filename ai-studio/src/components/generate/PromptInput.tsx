"use client";

import React, { useState, useCallback, useEffect } from "react";
import { X, Sparkles, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK_PROMPTS = [
  "一座现代风格的建筑，玻璃幕墙，蓝天白云",
  "温馨的日式室内设计，木质家具，自然光线",
  "未来科技感城市夜景，霓虹灯光，赛博朋克风格",
  "写实人物肖像，柔和光线，电影质感",
  "水彩风格风景画，山间溪流，春日氛围",
  "极简主义产品设计，白色背景，柔和阴影",
];

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  showQuickPrompts?: boolean;
  storageKey?: string;
}

export default function PromptInput({
  value,
  onChange,
  placeholder = "描述你想要生成的图像，越详细效果越好...\n\n例如：一座现代风格的建筑，玻璃幕墙，蓝天白云，高清摄影",
  maxLength = 2000,
  className,
  showQuickPrompts = true,
  storageKey = "prompt-input",
}: PromptInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 从本地存储加载数据
  useEffect(() => {
    if (storageKey && !value) {
      const storedValue = localStorage.getItem(storageKey);
      if (storedValue) {
        onChange(storedValue);
      }
    }
  }, [storageKey, value, onChange]);

  // 保存数据到本地存储
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, value);
    }
  }, [storageKey, value]);

  const handleClear = useCallback(() => {
    onChange("");
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [onChange, storageKey]);

  const handleInsertPrompt = useCallback(
    (prompt: string) => {
      const newValue = value ? value + "，" + prompt : prompt;
      onChange(newValue);
      if (storageKey) {
        localStorage.setItem(storageKey, newValue);
      }
      setShowSuggestions(false);
    },
    [value, onChange, storageKey]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "min-h-[120px] resize-none pr-10 bg-[#0f0f0f] border-white/[0.08] text-sm text-zinc-200 placeholder:text-zinc-600",
            "focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/30"
          )}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
            onClick={handleClear}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showQuickPrompts && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <Lightbulb className="w-3.5 h-3.5 mr-1" />
              灵感提示
            </Button>
          )}
        </div>
        <span
          className={cn(
            "text-xs tabular-nums",
            value.length > maxLength * 0.9
              ? "text-amber-500"
              : "text-zinc-600"
          )}
        >
          {value.length}/{maxLength}
        </span>
      </div>

      {showSuggestions && (
        <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {QUICK_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors truncate cursor-pointer"
              onClick={() => handleInsertPrompt(prompt)}
            >
              <Sparkles className="w-3 h-3 inline-block mr-1.5 text-zinc-600" />
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
