import React from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  credits: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    container: "px-2 py-1 gap-1",
    icon: "w-3.5 h-3.5",
    text: "text-xs",
  },
  md: {
    container: "px-3 py-1.5 gap-1.5",
    icon: "w-4 h-4",
    text: "text-sm",
  },
  lg: {
    container: "px-4 py-2 gap-2",
    icon: "w-5 h-5",
    text: "text-base",
  },
};

export default function CreditBadge({
  credits,
  size = "md",
  showLabel = false,
  className,
}: CreditBadgeProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-white/[0.06] border border-white/[0.08]",
        styles.container,
        className
      )}
    >
      <Coins className={cn("text-yellow-400", styles.icon)} />
      {showLabel && (
        <span className={cn("text-zinc-400", styles.text)}>积分</span>
      )}
      <span className={cn("font-semibold text-zinc-200", styles.text)}>
        {credits.toLocaleString()}
      </span>
    </div>
  );
}
