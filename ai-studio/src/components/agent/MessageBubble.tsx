"use client";

import React from "react";
import { cn } from "@/lib/utils";
import MarkdownText from "./MarkdownText";
import OptionCard, { type OptionCardProps } from "./OptionCard";
import DesignBrief from "./DesignBrief";

export interface MessageOption {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}

export interface DesignBriefData {
  summary: string;
  style: string;
  colors: string[];
  elements: string[];
}

export interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  options?: MessageOption[];
  designBrief?: DesignBriefData;
  onOptionClick?: (action: string) => void;
  onBriefConfirm?: () => void;
  onBriefAdjust?: () => void;
  className?: string;
}

export default function MessageBubble({
  role,
  content,
  images,
  options,
  designBrief,
  onOptionClick,
  onBriefConfirm,
  onBriefAdjust,
  className,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </div>
      )}

      <div className={cn("max-w-[75%] space-y-3")}>
        {/* Text bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-indigo-600 text-white rounded-br-md"
              : "bg-card border border-border text-card-foreground rounded-bl-md"
          )}
        >
          {isUser ? (
            <p>{content}</p>
          ) : (
            <MarkdownText content={content} />
          )}
        </div>

        {/* Option cards */}
        {options && options.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((opt) => (
              <OptionCard
                key={opt.action}
                icon={opt.icon}
                title={opt.title}
                description={opt.description}
                onClick={() => onOptionClick?.(opt.action)}
              />
            ))}
          </div>
        )}

        {/* Design brief */}
        {designBrief && (
          <DesignBrief
            data={designBrief}
            onConfirm={onBriefConfirm}
            onAdjust={onBriefAdjust}
          />
        )}

        {/* Generated images */}
        {images && images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={url}
                  alt={`Generated ${idx + 1}`}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium">
          U
        </div>
      )}
    </div>
  );
}
