"use client";

import { motion } from "framer-motion";
import { InteractionCard } from "@/types/ai-agent";

interface InteractionViewProps {
  key?: string;
  interaction: InteractionCard;
  onSelect: (optionId: string) => void;
}

export function InteractionView({ interaction, onSelect }: InteractionViewProps) {
  if (!interaction) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
      <div className="text-[11px] text-orange-400/60 uppercase tracking-tighter mb-2 italic">
        {interaction.prompt}
      </div>
      <div className="flex flex-wrap gap-2">
        {interaction.options?.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="px-3 py-1.5 rounded-md bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-[12px] text-orange-400 font-medium transition-colors"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}