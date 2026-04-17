"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import MessageBubble, {
  type MessageOption,
  type DesignBriefData,
} from "./MessageBubble";
import DesignBrief from "./DesignBrief";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  options?: MessageOption[];
  designBrief?: DesignBriefData;
}

export interface WelcomeData {
  agentName: string;
  agentDescription: string;
  agentAvatar?: string;
  examplePrompts: { icon: React.ReactNode; title: string; description: string; prompt: string }[];
}

export interface ChatAreaProps {
  messages: ChatMessage[];
  welcome?: WelcomeData;
  onOptionClick?: (action: string) => void;
  onPromptClick?: (prompt: string) => void;
  onBriefConfirm?: () => void;
  onBriefAdjust?: () => void;
  isTyping?: boolean;
  className?: string;
}

export default function ChatArea({
  messages,
  welcome,
  onOptionClick,
  onPromptClick,
  onBriefConfirm,
  onBriefAdjust,
  isTyping,
  className,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const showWelcome = messages.length === 0 && welcome;

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden",
        className
      )}
    >
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Welcome page */}
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            {/* Agent avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-4xl mb-4">
              {welcome.agentAvatar || "AI"}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {welcome.agentName}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md">
              {welcome.agentDescription}
            </p>

            {/* Example prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {welcome.examplePrompts.map((ep, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onPromptClick?.(ep.prompt)}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                    {ep.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:text-indigo-300">
                      {ep.title}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {ep.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {!showWelcome &&
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              id={msg.id}
              role={msg.role}
              content={msg.content}
              images={msg.images}
              options={msg.options}
              designBrief={msg.designBrief}
              onOptionClick={onOptionClick}
              onBriefConfirm={onBriefConfirm}
              onBriefAdjust={onBriefAdjust}
            />
          ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-3">
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
            <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
