"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export default function OptionCard({
  icon,
  title,
  description,
  onClick,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200",
        "hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:shadow-md hover:shadow-indigo-500/10",
        "cursor-pointer",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground transition-colors group-hover:text-indigo-300">
          {title}
        </div>
        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {description}
        </div>
      </div>
    </button>
  );
}
