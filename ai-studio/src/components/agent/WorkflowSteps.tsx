"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface WorkflowStepDef {
  key: string;
  label: string;
}

const STEPS: WorkflowStepDef[] = [
  { key: "idle", label: "空闲" },
  { key: "analyzing", label: "需求分析" },
  { key: "confirming", label: "确认方案" },
  { key: "generating", label: "生成中" },
  { key: "refining", label: "迭代优化" },
];

export interface WorkflowStepsProps {
  currentStep: string;
  className?: string;
}

export default function WorkflowSteps({
  currentStep,
  className,
}: WorkflowStepsProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium transition-all duration-300",
                  isCompleted &&
                    "border-indigo-500 bg-indigo-500 text-white",
                  isCurrent &&
                    "border-indigo-500 bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30",
                  isPending &&
                    "border-border bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] whitespace-nowrap transition-colors",
                  isCurrent && "text-indigo-400 font-medium",
                  isCompleted && "text-foreground",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 mx-1 mt-[-18px]">
                <div
                  className={cn(
                    "h-[2px] w-full rounded-full transition-colors duration-300",
                    index < currentIndex
                      ? "bg-indigo-500"
                      : "bg-border"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
