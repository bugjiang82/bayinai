"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Layers,
  Users,
  Activity,
  Play,
  Pause,
  Square,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskStatus, SubTask, Agent } from "@/types/ai-agent";
import { useAIOrchestratorStore } from "@/stores/aiOrchestratorStore";
import { StepIndicator } from "@/components/ai/StepIndicator";
import { AgentCard } from "@/components/ai/AgentCard";
import { InteractionView } from "@/components/ai/InteractionView";

interface StreamMessage {
  type: "text" | "image" | "waiting" | "done" | "error";
  content: string;
}

export default function AllRoundTestPage() {
  const [input, setInput] = useState("");
  const store = useAIOrchestratorStore();
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [displayedReasoning, setDisplayedReasoning] = useState("");
  const [displayedImage, setDisplayedImage] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [store.logs]);

  useEffect(() => {
    scrollToBottom();
  }, [displayedReasoning, displayedImage, scrollToBottom]);

  const handleStart = async () => {
    if (!input.trim()) return;
    store.setInitializing(true);
    store.addLog(`初始化任务：${input}`);
    try {
      const response = await fetch("/api/ai-orchestrator/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      store.initializeSystem(data.tasks, data.agents);
      store.setObjective(input);
      store.setInitializing(false);
      store.setExecuting(true);
      runOrchestrator(input, data.tasks, data.agents, 0);
    } catch {
      store.addLog("系统关键错误 // CRITICAL_SYSTEM_ERROR");
      store.setInitializing(false);
    }
  };

  const runOrchestrator = async (objective: string, tasks: SubTask[], agents: Agent[], startIndex: number) => {
    const results: Record<string, string> = {};
    for (let i = 0; i < startIndex; i++) results[tasks[i].id] = tasks[i].result || "";

    for (let i = startIndex; i < tasks.length; i++) {
      const task = tasks[i];
      const agent = agents.find(a => a.id === task.agentId) || agents[0];
      store.setCurrentStep(i);
      store.setFocusedTaskId(task.id);
      store.updateTask(task.id, { status: TaskStatus.IN_PROGRESS, reasoning: "", progress: 0 });
      store.addLog(`部署节点：${agent.name}`);

      setDisplayedReasoning("");
      setDisplayedImage(null);

      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const response = await fetch("/api/ai-orchestrator/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objective, task, agent, previousResults: results }),
        });

        if (!response.ok) throw new Error("执行失败");

        if (!response.body) throw new Error("无响应体");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let currentImage: string | null = null;
        let finalResult = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const message: StreamMessage = JSON.parse(line.slice(6));

                switch (message.type) {
                  case "text":
                    fullText += message.content;
                    setDisplayedReasoning(fullText);
                    store.updateTask(task.id, {
                      reasoning: fullText,
                      progress: Math.min(95, (fullText.length / 500) * 100)
                    });
                    break;
                  case "image":
                    currentImage = message.content;
                    setDisplayedImage(message.content);
                    store.updateTask(task.id, { imageUrl: message.content });
                    break;
                  case "waiting":
                    finalResult = message.content;
                    break;
                  case "done":
                    finalResult = message.content;
                    break;
                  case "error":
                    throw new Error(message.content);
                }
              } catch (parseErr) {
                console.error("Parse error:", parseErr);
              }
            }
          }
        }

        if (!useAIOrchestratorStore.getState().isExecuting) return;

        while (useAIOrchestratorStore.getState().isPaused) {
          await new Promise(r => setTimeout(r, 500));
          if (!useAIOrchestratorStore.getState().isExecuting) return;
        }

        if (finalResult.includes("USER_DECISION:") && !finalResult.includes("USER_DECISION_CAPTURED")) {
          store.addLog("检测到决策请求，正在生成交互选项... // GEN_INTERACTION");
          try {
            const intResponse = await fetch("/api/ai-orchestrator/interactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ task, reasoning: finalResult }),
            });
            const interaction = await intResponse.json();
            store.updateTask(task.id, { status: TaskStatus.WAITING_FOR_USER, result: finalResult });
            store.addInteraction({
              id: `int-${Date.now()}`,
              type: "choice",
              prompt: interaction.prompt,
              options: interaction.options?.map((o: { id: string; label: string }) => ({ ...o, value: o.id })) || [],
              taskId: task.id
            });
            store.addLog("交互协议已准备就绪，等待用户指令。 // AWAIT_USER");
            store.setExecuting(false);
            return;
          } catch {
            store.addLog("生成交互选项失败，尝试直接继续... // ERR_INTERACTION");
          }
        }

        results[task.id] = finalResult || fullText;
        store.updateTask(task.id, {
          status: TaskStatus.COMPLETED,
          result: finalResult || fullText,
          reasoning: fullText,
          progress: 100
        });

      } catch {
        store.updateTask(task.id, { status: TaskStatus.FAILED });
        store.setExecuting(false);
        return;
      }
    }
    store.setExecuting(false);
    store.addLog("任务全部完成 // ALL_TASKS_COMPLETED");
  };

  const handleInteractionSelect = (optionId: string) => {
    const interaction = store.interactions[0];
    const selectedOption = interaction.options?.find(o => o.id === optionId);
    store.addLog(`决策已捕获：${selectedOption?.label}`);
    const taskToUpdate = store.tasks.find(t => t.id === interaction.taskId);
    if (taskToUpdate) {
      store.updateTask(taskToUpdate.id, {
        status: TaskStatus.COMPLETED,
        result: `${taskToUpdate.result}\n\nUSER_DECISION_CAPTURED: ${selectedOption?.label}`,
        progress: 100
      });
    }
    store.clearInteractions();
    store.setExecuting(true);
    const updatedTasks = useAIOrchestratorStore.getState().tasks;
    runOrchestrator(store.objective, updatedTasks, store.agents, store.currentStepIndex + 1);
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex overflow-hidden">
      <aside className="w-[340px] border-r border-white/5 bg-glass/20 flex flex-col backdrop-blur-3xl shrink-0">
        <div className="p-8 border-b border-white/5 space-y-1">
          <div className="flex items-center gap-3 text-[var(--accent-blue)] mb-2">
            <Layers className="w-5 h-5" />
            <h1 className="font-bold text-xl tracking-tight text-glow-blue uppercase">枢纽系统 // NEXUS OS</h1>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">操作单元 v2.4.1 // OPERATIONAL UNIT</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <label className="text-[10px] text-[var(--accent-blue)] uppercase tracking-widest block mb-4">指令输入 // COMMAND INPUT</label>
            <div className="relative group p-px rounded-xl bg-gradient-to-br from-white/10 to-transparent">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="请输入任务目标，如：分析任务参数并执行..."
                className="w-full h-32 p-4 bg-black/40 rounded-[11px] border-none focus:ring-1 focus:ring-[var(--accent-blue)]/50 text-sm text-white placeholder:text-white/10 resize-none transition-all leading-relaxed"
                disabled={store.isExecuting || store.isInitializing}
              />
              <Button
                size="icon"
                onClick={handleStart}
                disabled={!input.trim() || store.isExecuting || store.isInitializing}
                className="absolute bottom-3 right-3 rounded-lg bg-[var(--accent-blue)] text-black hover:bg-white transition-all disabled:opacity-30 disabled:grayscale"
              >
                {store.isInitializing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => store.setPaused(!store.isPaused)}
              disabled={!store.isExecuting}
              variant="outline"
              size="sm"
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border transition-all text-[10px] uppercase tracking-widest ${
                store.isPaused
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30"
                  : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 disabled:opacity-20"
              }`}
            >
              {store.isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
              {store.isPaused ? "继续" : "暂停"}
            </Button>
            <Button
              onClick={() => {
                if (store.currentStepIndex >= 0) {
                  store.updateTask(store.tasks[store.currentStepIndex].id, { status: TaskStatus.FAILED });
                }
                store.setExecuting(false);
                store.setPaused(false);
                if (eventSourceRef.current) {
                  eventSourceRef.current.close();
                }
                store.addLog("手动中止任务 // MISSION_ABORTED");
              }}
              disabled={!store.isExecuting && !store.isInitializing}
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all text-[10px] uppercase tracking-widest disabled:opacity-20"
            >
              <Square className="w-3 h-3 fill-current" />
              中止
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="text-[10px] text-white/30 uppercase tracking-widest block">系统诊断 // SYSTEM DIAGNOSTICS</label>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40 italic">核心状态 // CORE_STATUS:</span>
                <span className={store.isExecuting ? "text-[var(--accent-blue)]" : "text-green-500"}>
                  {store.isExecuting ? "正在运行 // ACTIVE" : "就绪 // READY"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40 italic">内存占用 // MEM_USAGE:</span>
                <span className="text-white/80">32.4 GB/S</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] text-white/30 uppercase tracking-widest block">实时日志 // LOG TICKER</label>
            <div ref={logsContainerRef} className="h-48 overflow-y-auto font-mono text-[10px] space-y-2 opacity-60">
              {store.logs.map((log, i) => (
                <div key={i} className="flex gap-2 text-white/50 leading-tight">
                  <span className="text-[var(--accent-blue)] shrink-0">{">>"}</span>
                  <span>{log}</span>
                </div>
              ))}
              {store.logs.length === 0 && <div className="italic opacity-30 select-none">等待系统引导... // Awaiting system boot...</div>}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/40">
          <div className="flex items-center gap-3 text-white/20">
            <Activity className="w-4 h-4" />
            <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-1/3 h-full bg-[var(--accent-blue)]/30"
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-24 border-b border-white/5 bg-black/40 flex items-center px-8 shrink-0 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <StepIndicator tasks={store.tasks} />
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <section className="w-[380px] border-r border-white/5 flex flex-col shrink-0">
            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-none">
              <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase">活动单元 // ACTIVE UNITS</h2>
              <span className="text-[9px] bg-[var(--accent-blue)]/10 px-1.5 py-0.5 rounded border border-[var(--accent-blue)]/20">{store.agents.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {store.agents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-10 grayscale">
                    <Users className="w-12 h-12" />
                    <p className="text-[10px] uppercase tracking-[0.1em]">暂无分配的活动单元 // NO ASSETS</p>
                  </div>
                ) : (
                  store.agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isExecuting={store.tasks[store.currentStepIndex]?.agentId === agent.id}
                      progress={store.tasks[store.currentStepIndex]?.progress}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="flex-1 flex flex-col bg-black/20 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-none">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase truncate">
                  任务流 // MISSION STREAM: {store.tasks.find(t => t.id === store.focusedTaskId)?.title || "空闲 // IDLE"}
                </h2>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full border border-white/20" />
                <div className="w-1.5 h-1.5 rounded-full border border-white/20" />
                <div className="w-1.5 h-1.5 rounded-full border border-white/20" />
              </div>
            </div>

            <ScrollArea className="flex-1 p-8">
              <div className="space-y-12">
                {store.tasks.filter(t => t.id === store.focusedTaskId).map((task) => {
                  const idx = store.tasks.findIndex(t => t.id === task.id);
                  const currentReasoning = task.id === store.focusedTaskId ? displayedReasoning : task.reasoning;
                  const currentImage = task.id === store.focusedTaskId ? displayedImage : task.imageUrl;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group relative h-full flex flex-col"
                    >
                      <div className="absolute -left-8 top-2 text-[10px] text-white/10 group-hover:text-[var(--accent-blue)]/40 transition-colors">0{idx + 1}</div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-px bg-white/10" />
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider">{task.title}</h3>
                          <Badge variant="secondary" className="bg-[var(--accent-purple)]/5 border border-[var(--accent-purple)]/20 text-[var(--accent-purple)]">NODE_{task.id.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          {task.status === TaskStatus.COMPLETED && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">成功 // SUCCESS</Badge>}
                          {task.status === TaskStatus.IN_PROGRESS && <Badge className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20 animate-pulse">执行中 // PROCESSING</Badge>}
                          {task.status === TaskStatus.WAITING_FOR_USER && <Badge className="bg-orange-400/10 text-orange-400 border-orange-400/20 animate-bounce">需用户交互 // ACTION_REQ</Badge>}
                        </div>
                      </div>

                      <Card className="rounded-2xl p-8 relative overflow-hidden flex-1 flex flex-col min-h-[400px] backdrop-blur-md bg-white/[0.02] border border-white/5">
                        <div className="absolute top-0 right-0 p-8 text-white/5 select-none pointer-events-none group-hover:text-[var(--accent-blue)]/10 transition-colors">
                          <Terminal className="w-32 h-32" />
                        </div>

                        <div
                          ref={contentRef}
                          className="relative z-10 text-[14px] leading-relaxed text-white/70 whitespace-pre-wrap overflow-y-auto flex-1 pr-4"
                        >
                          <div>
                            {currentReasoning || "正在引导专家协议... 链路已建立... 扫描内存映射..."}
                            {task.status === TaskStatus.IN_PROGRESS && (
                              <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                className="inline-block w-2.5 h-4 bg-[var(--accent-blue)] ml-2 align-middle"
                              />
                            )}
                          </div>

                          {currentImage && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-lg bg-black/40"
                            >
                              <img
                                src={currentImage}
                                alt={task.title}
                                className="w-full h-auto"
                                referrerPolicy="no-referrer"
                              />
                              <div className="p-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest">已生成资产 // GENERATED ASSET</span>
                                <Activity className="w-3 h-3 text-[var(--accent-blue)] opacity-50" />
                              </div>
                            </motion.div>
                          )}

                          <AnimatePresence>
                            {task.status === TaskStatus.WAITING_FOR_USER && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-8 pt-8 border-t border-white/5 shrink-0"
                              >
                                <InteractionView
                                  interaction={store.interactions.find(i => i.taskId === task.id) || store.interactions[0]}
                                  onSelect={handleInteractionSelect}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}

                {store.tasks.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-10">
                    <Terminal className="w-16 h-16" />
                    <p className="text-[12px] uppercase tracking-[0.4em] max-w-xs leading-loose">Waiting for Command Deployment Control Hub Active...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </section>
        </div>
      </main>

      <style jsx global>{`
        :root {
          --accent-blue: #22d3ee;
          --accent-purple: #a855f7;
          --glass: rgba(15, 23, 42, 0.7);
        }

        .cyber-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .text-glow-blue {
          text-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
        }

        .bg-glass {
          background-color: var(--glass);
        }
      `}</style>
    </div>
  );
}