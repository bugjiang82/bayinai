"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logger from "@/lib/logger";
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
import { TaskStatus, SubTask, Agent } from "@/types/ai-agent";
import { useAIOrchestratorStore } from "@/stores/aiOrchestratorStore";
import { StepIndicator } from "@/components/ai/StepIndicator";
import { AgentCard } from "@/components/ai/AgentCard";

interface StreamMessage {
  type: "text" | "image" | "waiting" | "done" | "error";
  content: string;
  thumbUrl?: string;
  index?: number;
  imageUrls?: string[];
}

export default function AllRoundTestPage() {
  const [input, setInput] = useState("");
  const store = useAIOrchestratorStore();
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [isWaitingForInteraction, setIsWaitingForInteraction] = useState(false);
  const [interactionPrompt, setInteractionPrompt] = useState("");
  const [interactionOptions, setInteractionOptions] = useState<{id: string; label: string}[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const REQUIRED_CREDITS = 500;

  const scrollToBottom = useCallback(() => {
    if (contentScrollRef.current) {
      requestAnimationFrame(() => {
        if (contentScrollRef.current) {
          contentScrollRef.current.scrollTop = contentScrollRef.current.scrollHeight;
        }
      });
    }
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [store.logs]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // 页面加载时获取用户积分
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setCreditsLoading(true);
        const res = await fetch("/api/credits/balance");
        const json = await res.json();
        if (json.code === 0 && json.data?.balance !== undefined) {
          setCredits(json.data.balance);
        }
      } catch {
        logger.error("获取积分失败");
      } finally {
        setCreditsLoading(false);
      }
    };
    fetchCredits();
  }, []);

  const handleStart = async () => {
    if (!input.trim()) return;

    // 前端积分检查
    if (credits !== null && credits < REQUIRED_CREDITS) {
      setShowInsufficientCredits(true);
      store.addLog(`积分不足 // INSUFFICIENT CREDITS: 需要 ${REQUIRED_CREDITS} 积分，当前 ${credits} 积分`);
      // 3秒后自动关闭提示
      setTimeout(() => setShowInsufficientCredits(false), 3000);
      return;
    }

    store.setInitializing(true);
    store.addLog(`初始化任务：${input}`);
    try {
      const response = await fetch("/api/ai-orchestrator/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: input }),
      });
      const data = await response.json();
      
      // 处理积分不足错误
      if (response.status === 402) {
        setShowInsufficientCredits(true);
        store.addLog(`积分不足 // INSUFFICIENT CREDITS: ${data.error || "需要500积分"}`);
        store.setInitializing(false);
        setTimeout(() => setShowInsufficientCredits(false), 5000);
        return;
      }
      
      if (!response.ok) throw new Error(data.error);

      // 更新积分显示
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      }

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

  const runOrchestrator = async (objective: string, tasks: SubTask[], agents: Agent[], startIndex: number, previousResults?: Record<string, string>) => {
    const results: Record<string, string> = previousResults || {};
    for (let i = 0; i < startIndex; i++) results[tasks[i].id] = tasks[i].result || "";

    for (let i = startIndex; i < tasks.length; i++) {
      const task = tasks[i];
      const agent = agents.find(a => a.id === task.agentId) || agents[0];
      store.setCurrentStep(i);
      store.setFocusedTaskId(task.id);
      store.updateTask(task.id, { status: TaskStatus.IN_PROGRESS, reasoning: "", imageUrl: undefined, imageUrls: [], progress: 0 });
      store.addLog(`部署节点：${agent.name}`);

      setCurrentText("");
      setIsWaitingForInteraction(false);
      setInteractionPrompt("");
      setInteractionOptions([]);

      try {
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
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            const lines = event.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const message: StreamMessage = JSON.parse(line.slice(6));

                  switch (message.type) {
                    case "text":
                      fullText += message.content;
                      setCurrentText(fullText);
                      store.updateTask(task.id, {
                        reasoning: fullText,
                        progress: Math.min(95, (fullText.length / 500) * 100)
                      });
                      break;
                    case "image":
                      // 收集多张图片 - 直接读取当前状态并追加
                      const currentTask = store.tasks.find(t => t.id === task.id);
                      const existingUrls = (currentTask as any)?.imageUrls || [];
                      const newUrls = [...existingUrls, message.content];
                      store.updateTask(task.id, {
                        imageUrl: message.content, // 兼容旧版：保留最新一张
                        imageUrls: newUrls,
                      });
                      store.addLog(`资产已生成 (${newUrls.length}/${newUrls.length})`);
                      break;
                    case "waiting":
                    case "done":
                      fullText = message.content;
                      setCurrentText(message.content);
                      store.updateTask(task.id, {
                        reasoning: message.content,
                        status: TaskStatus.COMPLETED
                      });
                      break;
                    case "error":
                      throw new Error(message.content);
                  }
                } catch (parseErr) {
                  logger.error("Parse error:", parseErr);
                }
              }
            }
          }
        }

        if (!useAIOrchestratorStore.getState().isExecuting) return;

        while (useAIOrchestratorStore.getState().isPaused) {
          await new Promise(r => setTimeout(r, 500));
          if (!useAIOrchestratorStore.getState().isExecuting) return;
        }

        if (fullText.includes("USER_DECISION:") && !fullText.includes("USER_DECISION_CAPTURED")) {
          store.addLog("检测到决策请求，正在生成交互选项... // GEN_INTERACTION");
          try {
            const intResponse = await fetch("/api/ai-orchestrator/interactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ task, reasoning: fullText }),
            });
            const interaction = await intResponse.json();
            store.updateTask(task.id, { status: TaskStatus.WAITING_FOR_USER, result: fullText });

            store.addInteraction({
              id: `int-${Date.now()}`,
              type: "choice",
              prompt: interaction.prompt || "请选择一个选项继续：",
              options: interaction.options?.map((o: { id: string; label: string }) => ({ ...o, value: o.id })) || [],
              taskId: task.id
            });

            setCurrentText(fullText);
            setInteractionPrompt(interaction.prompt || "请选择一个选项继续：");
            setInteractionOptions(interaction.options || []);
            setIsWaitingForInteraction(true);
            store.setExecuting(false);
            store.addLog("交互协议已准备就绪，等待用户指令。 // AWAIT_USER");
            return;
          } catch {
            store.addLog("生成交互选项失败，尝试直接继续... // ERR_INTERACTION");
          }
        }

        results[task.id] = fullText;
        store.updateTask(task.id, {
          status: TaskStatus.COMPLETED,
          result: fullText,
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
    if (!interaction) {
      store.addLog("错误：未找到交互信息");
      return;
    }

    const selectedOption = interaction.options?.find(o => o.id === optionId);
    const optionLabel = selectedOption?.label || optionId;
    const currentTaskId = interaction.taskId;
    const currentStepIndex = store.currentStepIndex;

    store.addLog(`决策已捕获：${optionLabel}`);

    setCurrentText(prev => prev + `\n\n[用户选择: ${optionLabel}]`);
    setIsWaitingForInteraction(false);
    setInteractionPrompt("");
    setInteractionOptions([]);

    store.updateTask(currentTaskId, {
      status: TaskStatus.COMPLETED,
      result: `USER_DECISION_CAPTURED: ${optionLabel}`,
      progress: 100
    });

    store.clearInteractions();

    const results: Record<string, string> = {};
    for (let i = 0; i <= currentStepIndex; i++) {
      const task = store.tasks[i];
      if (task) results[task.id] = task.result || "";
    }

    store.setExecuting(true);
    runOrchestrator(store.objective, store.tasks, store.agents, currentStepIndex + 1, results);
  };

  const focusedTask = store.tasks.find(t => t.id === store.focusedTaskId);

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex overflow-hidden">
      <aside className="w-[340px] border-r border-white/5 bg-glass/20 flex flex-col backdrop-blur-3xl shrink-0">
        <div className="p-8 border-b border-white/5 space-y-1">
          <div className="flex items-center gap-3 text-[var(--accent-blue)] mb-2">
            <Layers className="w-5 h-5" />
            <h1 className="font-bold text-xl tracking-tight text-glow-blue uppercase">六维AI创意工作平台</h1>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">操作单元 v2.4.1 // OPERATIONAL UNIT</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <label className="text-[10px] text-[var(--accent-blue)] uppercase tracking-widest block mb-4">指令输入 // COMMAND INPUT</label>

            {/* 积分不足提示 */}
            {showInsufficientCredits && (
              <div className="mb-4 p-4 rounded-xl border-2 border-red-500/60 bg-red-500/10 backdrop-blur-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-400 mb-1">积分不足</p>
                    <p className="text-xs text-red-300/80">
                      执行该操作需要 <span className="font-bold text-red-300">{REQUIRED_CREDITS} 积分</span>，当前可用积分：<span className="font-bold">{credits ?? 0} 积分</span>
                    </p>
                    <p className="text-[10px] text-white/30 mt-2">请前往充值页面获取积分后重试</p>
                  </div>
                </div>
              </div>
            )}

            {/* 积分显示 */}
            {credits !== null && (
              <div className="mb-4 flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">当前积分</span>
                <span className={`text-sm font-bold ${credits >= REQUIRED_CREDITS ? 'text-green-400' : 'text-red-400'}`}>
                  {credits} / {REQUIRED_CREDITS}
                </span>
              </div>
            )}

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
                  任务流 // MISSION STREAM: {focusedTask?.title || "空闲 // IDLE"}
                </h2>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full border border-white/20" />
                <div className="w-1.5 h-1.5 rounded-full border border-white/20" />
                <div className="w-1.5 h-1.5 rounded-full border border-white/20" />
              </div>
            </div>

            <Card className="flex-1 mx-8 my-6 rounded-2xl backdrop-blur-md bg-white/[0.02] border border-white/5 overflow-hidden">
              <div className="h-full flex flex-col">
                <div
                  ref={contentScrollRef}
                  className="flex-1 overflow-y-auto p-6"
                >
                  {store.tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-10">
                      <Terminal className="w-16 h-16" />
                      <p className="text-[12px] uppercase tracking-[0.4em] max-w-xs leading-loose">Waiting for Command Deployment Control Hub Active...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-[14px] leading-relaxed text-white/70 whitespace-pre-wrap">
                        {(store.focusedTaskId === store.tasks[store.currentStepIndex]?.id ? currentText : focusedTask?.reasoning) || (focusedTask?.status === TaskStatus.IN_PROGRESS ? "正在处理..." : "等待执行...")}
                        {store.isExecuting && focusedTask?.status === TaskStatus.IN_PROGRESS && (
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="inline-block w-2 h-4 bg-[var(--accent-blue)] ml-1 align-middle"
                          />
                        )}
                      </div>

                      {(focusedTask?.imageUrl || (focusedTask as any)?.imageUrls?.length > 0) && (
                        <div className="mt-4 space-y-4">
                          {((focusedTask as any).imageUrls || (focusedTask?.imageUrl ? [focusedTask.imageUrl] : [])).map((url: string, idx: number) => (
                            <div key={idx} className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                              <img
                                src={url}
                                alt={`生成图片 ${idx + 1}`}
                                className="w-full h-auto"
                                referrerPolicy="no-referrer"
                              />
                              <div className="p-2 bg-white/5 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest">资产 {idx + 1}</span>
                                <Activity className="w-3 h-3 text-[var(--accent-blue)] opacity-50" />
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] text-white/30 uppercase tracking-widest">已生成资产 ({((focusedTask as any).imageUrls || (focusedTask?.imageUrl ? [focusedTask.imageUrl] : [])).length}) // GENERATED ASSETS</span>
                            <Activity className="w-3 h-3 text-[var(--accent-blue)] opacity-50" />
                          </div>
                        </div>
                      )}

                      {isWaitingForInteraction && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 pt-6 border-t border-white/10"
                        >
                          <p className="text-[13px] text-orange-400/80 italic mb-4">
                            {interactionPrompt}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {interactionOptions.map((option) => (
                              <Button
                                key={option.id}
                                onClick={() => handleInteractionSelect(option.id)}
                                variant="outline"
                                size="sm"
                                className="px-4 py-2 rounded-xl bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-[12px]"
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {store.tasks[store.currentStepIndex] && (
                      <>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            store.tasks[store.currentStepIndex].status === TaskStatus.COMPLETED ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            store.tasks[store.currentStepIndex].status === TaskStatus.IN_PROGRESS ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20" :
                            store.tasks[store.currentStepIndex].status === TaskStatus.WAITING_FOR_USER ? "bg-orange-400/10 text-orange-400 border-orange-400/20" :
                            "bg-white/5 text-white/40 border-white/10"
                          }`}
                        >
                          {store.tasks[store.currentStepIndex].status === TaskStatus.COMPLETED ? "已完成" :
                           store.tasks[store.currentStepIndex].status === TaskStatus.IN_PROGRESS ? "执行中" :
                           store.tasks[store.currentStepIndex].status === TaskStatus.WAITING_FOR_USER ? "等待输入" : "就绪"}
                        </Badge>
                        <span className="text-[10px] text-white/30">
                          {store.currentStepIndex + 1} / {store.tasks.length}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/30">
                    <Activity className="w-3 h-3" />
                    <span>实时输出</span>
                  </div>
                </div>
              </div>
            </Card>
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