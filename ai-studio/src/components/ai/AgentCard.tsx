"use client";

import { motion } from "framer-motion";
import * as Progress from "@radix-ui/react-progress";
import { Cpu, ShieldCheck, Zap, Crosshair } from "lucide-react";
import { Agent } from "@/types/ai-agent";
import { useAIOrchestratorStore } from "@/stores/aiOrchestratorStore";

interface AgentCardProps {
  agent: Agent;
  isExecuting: boolean;
  progress?: number;
}

export function AgentCard({ agent, isExecuting, progress }: AgentCardProps) {
  const store = useAIOrchestratorStore();
  const associatedTask = store.tasks.find(t => t.agentId === agent.id);
  const isFocused = store.focusedTaskId === associatedTask?.id;

  const handleFocus = () => {
    if (associatedTask) {
      store.setFocusedTaskId(associatedTask.id);
      store.addLog(`视角切换：${agent.name}`);
    }
  };

  return (
    <motion.div
      layout
      onClick={handleFocus}
      className={`relative group p-4 rounded-xl border transition-all duration-500 cursor-pointer ${
        isFocused
          ? "border-[var(--accent-blue)]/60 bg-[var(--accent-blue)]/[0.08] shadow-[0_0_40px_rgba(34,211,238,0.15)] ring-1 ring-[var(--accent-blue)]/20"
          : isExecuting
            ? "border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/[0.03]"
            : "border-white/5 bg-white/[0.01] hover:border-white/20"
      }`}
    >
      {isFocused && (
        <div className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-[var(--accent-blue)] flex items-center justify-center shadow-[0_0_10px_#38bdf8] z-20">
           <Crosshair className="w-2.5 h-2.5 text-black" />
        </div>
      )}

      {(isExecuting || isFocused) && (
        <>
          <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${isFocused ? 'border-[var(--accent-blue)]' : 'border-[var(--accent-blue)]/40'}`} />
          <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${isFocused ? 'border-[var(--accent-blue)]' : 'border-[var(--accent-blue)]/40'}`} />
          <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${isFocused ? 'border-[var(--accent-blue)]' : 'border-[var(--accent-blue)]/40'}`} />
          <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${isFocused ? 'border-[var(--accent-blue)]' : 'border-[var(--accent-blue)]/40'}`} />
        </>
      )}

      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border transition-colors ${
          isExecuting ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/30' : 'bg-white/5 border-white/10'
        }`}>
          {agent.name.toLowerCase().includes("code") ? <Cpu className="w-5 h-5 text-[var(--accent-blue)]" /> :
           agent.name.toLowerCase().includes("research") ? <ShieldCheck className="w-5 h-5 text-[var(--accent-purple)]" /> :
           <Zap className="w-5 h-5 text-[var(--accent-blue)]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate tracking-wide">{agent.name}</h3>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">战术单元 // Tactical Unit</p>
            </div>
            {isExecuting && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20">
                <div className="w-1 h-1 bg-[var(--accent-blue)] rounded-full animate-pulse shadow-[0_0_8px_#38bdf8]" />
                <span className="text-[8px] font-bold text-[var(--accent-blue)] uppercase tracking-[0.2em]">活跃 // Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
          {agent.persona}
        </p>
      </div>

      {isExecuting && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[9px] text-[var(--accent-blue)] uppercase tracking-widest tabular-nums">
            <span>正在同步逻辑... // Syncing Logic</span>
            <span>{Math.round(progress || 0)}%</span>
          </div>
          <Progress.Root
            className="relative overflow-hidden bg-white/5 rounded-full w-full h-1"
            style={{ transform: 'translateZ(0)' }}
            value={progress}
          >
            <Progress.Indicator
              className="bg-[var(--accent-blue)] w-full h-full transition-transform duration-[660ms] ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ transform: `translateX(-${100 - (progress || 0)}%)` }}
            />
          </Progress.Root>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
        {agent.capabilities.map((cap, i) => (
          <span key={i} className="px-1.5 py-0.5 bg-white/5 text-[8px] text-white/60 rounded border border-white/5 uppercase tracking-tighter">
            {cap}
          </span>
        ))}
      </div>
    </motion.div>
  );
}