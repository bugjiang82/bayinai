"use client";

import React, { useState, useCallback, useEffect } from "react";
import { X, Sparkles, Lightbulb, Image, Clipboard, Check } from "lucide-react";
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPrompt, setExtractedPrompt] = useState("");
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // 提取提示词功能
  const handleExtractPrompt = useCallback(async () => {
    setIsExtracting(true);
    setExtractedPrompt("");
    setShowCopyButton(false);
    
    try {
      // 创建文件输入
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
          // 读取文件为 base64
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64Data = event.target?.result as string;
            const imageBase64 = base64Data.split(',')[1]; // 移除 data:image/jpeg;base64, 前缀
            
            // 调用 API
            const response = await fetch('/api/extract-prompt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageBase64,
                mimeType: file.type,
              }),
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                const prompt = result.data.prompt;
                setExtractedPrompt(prompt);
                setShowCopyButton(true);
                // 自动将提取的提示词插入到文本框中
                onChange(prompt);
                if (storageKey) {
                  localStorage.setItem(storageKey, prompt);
                }
              }
            }
          };
          reader.readAsDataURL(file);
        }
        
        setIsExtracting(false);
      };
      
      input.click();
    } catch (error) {
      console.error('提取提示词失败:', error);
      setIsExtracting(false);
    }
  }, []);

  // 复制提示词
  const handleCopyPrompt = useCallback(() => {
    if (extractedPrompt) {
      navigator.clipboard.writeText(extractedPrompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [extractedPrompt]);

  // 插入提取的提示词
  const handleInsertExtractedPrompt = useCallback(() => {
    if (extractedPrompt) {
      onChange(extractedPrompt);
      if (storageKey) {
        localStorage.setItem(storageKey, extractedPrompt);
      }
    }
  }, [extractedPrompt, onChange, storageKey]);

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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
            onClick={handleExtractPrompt}
            disabled={isExtracting}
          >
            <Image className="w-3.5 h-3.5 mr-1" />
            {isExtracting ? "提取中..." : "提取提示词"}
          </Button>
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

      {/* 提取的提示词 */}
      {extractedPrompt && (
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xs font-medium text-indigo-300">提取的提示词</h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                onClick={handleInsertExtractedPrompt}
              >
                插入
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                onClick={handleCopyPrompt}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    已复制
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3 mr-1" />
                    复制
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-zinc-300 whitespace-pre-wrap break-words">
            {extractedPrompt}
          </p>
        </div>
      )}

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
