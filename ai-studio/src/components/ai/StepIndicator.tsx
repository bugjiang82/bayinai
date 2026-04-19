"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { SubTask, TaskStatus } from "@/types/ai-agent";
import { useAIOrchestratorStore } from "@/stores/aiOrchestratorStore";

interface StepIndicatorProps {
  tasks: SubTask[];
}

export function StepIndicator({ tasks }: StepIndicatorProps) {
  const store = useAIOrchestratorStore();

  return (
    <div className="flex items-center w-full px-4 gap-12 overflow-x-auto scroll-smooth">
      {tasks.map((task, index) => {
        const isFocused = store.focusedTaskId === task.id;

        return (
        <div
          key={task.id}
          onClick={() => {
            if (task.status !== TaskStatus.PENDING || store.currentStepIndex === index) {
              store.setFocusedTaskId(task.id);
            }
          }}
          className={`flex items-center gap-6 shrink-0 group transition-all ${
            task.status !== TaskStatus.PENDING || store.currentStepIndex === index ? 'cursor-pointer opacity-100' : 'opacity-40 grayscale cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: task.status === TaskStatus.COMPLETED ? "var(--accent-purple)" :
                                   task.status === TaskStatus.IN_PROGRESS ? "var(--accent-blue)" : "transparent",
                  borderColor: isFocused ? "var(--accent-blue)" : (task.status === TaskStatus.IN_PROGRESS ? "var(--accent-blue)" : "rgba(255,255,255,0.1)"),
                  boxShadow: isFocused ? "0 0 20px var(--accent-blue)" : (task.status === TaskStatus.IN_PROGRESS ? "0 0 20px var(--accent-blue)" : "none"),
                  scale: isFocused ? 1.1 : 1,
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 overflow-hidden relative ${isFocused ? 'border-2' : ''}`}
              >
                {task.status === TaskStatus.IN_PROGRESS && (
                   <motion.div
                     animate={{ y: ["-100%", "100%"] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 bg-white/10"
                   />
                )}
                {task.status === TaskStatus.COMPLETED ? (
                  <Check className="w-4 h-4 text-black" />
                ) : (
                  <span className={`text-[10px] font-mono font-bold ${task.status === TaskStatus.IN_PROGRESS ? 'text-black' : 'text-white/20'}`}>
                    0{index + 1}
                  </span>
                )}
              </motion.div>
            </div>

            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                task.status === TaskStatus.IN_PROGRESS ? 'text-[var(--accent-blue)]' :
                task.status === TaskStatus.COMPLETED ? 'text-[var(--accent-purple)]' : 'text-white/20'
              }`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1 h-1 rounded-full ${
                  task.status === TaskStatus.COMPLETED ? 'bg-[var(--accent-purple)]' :
                  task.status === TaskStatus.IN_PROGRESS ? 'bg-[var(--accent-blue)] animate-pulse' : 'bg-white/5'
                }`} />
                <span className="text-[8px] text-white/20 uppercase tracking-widest">
                  状态 // STATE::{task.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {index < tasks.length - 1 && (
            <div className="w-16 h-px bg-white/5 relative shrink-0">
               {task.status === TaskStatus.COMPLETED && (
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: "100%" }}
                   className="absolute top-0 left-0 h-full bg-[var(--accent-purple)] shadow-[0_0_10px_#a855f7]"
                 />
               )}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}