"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface DropdownSelectorProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DropdownSelector({
  label,
  value,
  options,
  onChange,
  placeholder = "请选择",
  className,
}: DropdownSelectorProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-[#0f0f0f] border-white/[0.08] text-zinc-200 hover:bg-white/[0.02] hover:border-white/[0.15] focus:ring-indigo-500/30 focus:border-indigo-500/30">
          <SelectValue placeholder={placeholder}>
            {selectedOption ? (
              <div className="flex items-center gap-2">
                <span>{selectedOption.label}</span>
                {selectedOption.description && (
                  <span className="text-xs text-zinc-500">
                    {selectedOption.description}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-zinc-500">{placeholder}</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#0f0f0f] border-white/[0.08] text-zinc-200 max-h-[300px]">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="hover:bg-white/[0.05] focus:bg-white/[0.05] cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-zinc-500 ml-2">
                    {option.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
