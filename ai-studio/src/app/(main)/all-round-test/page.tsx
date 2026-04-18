"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Brain, Code, FileText, Search, Terminal, Settings, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AnimatedSection from "@/components/shared/AnimatedSection";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCall?: {
    name: string;
    parameters: Record<string, any>;
  };
  toolResult?: {
    name: string;
    result: any;
  };
  timestamp: Date;
}

interface Tool {
  name: string;
  description: string;
  icon: React.ElementType;
  parameters: Record<string, {
    type: string;
    description: string;
    required: boolean;
  }>;
}

const tools: Tool[] = [
  {
    name: "google_search",
    description: "搜索网络获取最新信息",
    icon: Search,
    parameters: {
      query: {
        type: "string",
        description: "搜索关键词",
        required: true,
      },
    },
  },
  {
    name: "calculator",
    description: "执行数学计算和数值运算",
    icon: Brain,
    parameters: {
      expression: {
        type: "string",
        description: "数学表达式",
        required: true,
      },
    },
  },
  {
    name: "read_file",
    description: "读取文件内容",
    icon: FileText,
    parameters: {
      file_path: {
        type: "string",
        description: "文件路径",
        required: true,
      },
    },
  },
  {
    name: "write_file",
    description: "写入内容到文件",
    icon: Code,
    parameters: {
      file_path: {
        type: "string",
        description: "文件路径",
        required: true,
      },
      content: {
        type: "string",
        description: "要写入的内容",
        required: true,
      },
    },
  },
];

const quickActions = [
  { label: "查询天气", icon: Search, prompt: "帮我查询今天的天气" },
  { label: "计算数学题", icon: Brain, prompt: "计算 256 * 128 + 4096" },
  { label: "搜索技术文档", icon: FileText, prompt: "搜索 React 19 的新特性" },
  { label: "代码生成", icon: Code, prompt: "帮我写一个简单的排序算法" },
];

export default function AllRoundTestPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好！我是全能智能助手，我可以帮你完成各种任务。你可以问我问题、让我执行计算、搜索信息或者操作文件。告诉我你需要什么帮助？",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolParameters, setToolParameters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const responses = [
        `好的，我来帮你处理："${input}"。这个任务我正在分析最佳解决方案...`,
        `收到你的请求！关于"${input}"，让我为你提供详细的帮助。`,
        `没问题！我正在处理你的请求：${input}，请稍等片刻...`,
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const assistantMessage: Message = {
        role: "assistant",
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉，我遇到了一些问题。请稍后再试。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolCall = async () => {
    if (!selectedTool) return;

    const tool = tools.find((t) => t.name === selectedTool);
    if (!tool) return;

    const missingParams = Object.entries(tool.parameters)
      .filter(([_, param]) => param.required)
      .map(([name]) => name)
      .filter((name) => !toolParameters[name]);

    if (missingParams.length > 0) {
      alert(`缺少必要参数：${missingParams.join(", ")}`);
      return;
    }

    const toolCallMessage: Message = {
      role: "assistant",
      content: `正在调用 ${tool.name} 工具...`,
      toolCall: {
        name: tool.name,
        parameters: toolParameters,
      },
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, toolCallMessage]);
    setIsLoading(true);
    setActiveTab("chat");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let toolResult: any;
      switch (tool.name) {
        case "google_search":
          toolResult = {
            results: [
              {
                title: "AI 智能助手介绍",
                snippet: "AI 智能助手是一种能够自主执行任务的人工智能系统，具备学习和推理能力...",
                url: "https://example.com/ai-agent",
              },
              {
                title: "最新技术趋势 2025",
                snippet: "探索 2025 年最值得关注的技术发展趋势，包括 AI、云计算和量子计算...",
                url: "https://example.com/tech-trends",
              },
            ],
          };
          break;
        case "calculator":
          try {
            toolResult = { result: eval(toolParameters.expression) };
          } catch {
            toolResult = { error: "计算表达式无效，请检查输入" };
          }
          break;
        case "read_file":
          toolResult = { 
            content: "这是一个模拟文件的内容。\n\n在实际应用中，这里会显示真实文件的内容。\n\n包含多行文本和各种数据格式。",
            file_path: toolParameters.file_path,
            size: 1024
          };
          break;
        case "write_file":
          toolResult = { 
            success: true, 
            message: "文件写入成功",
            file_path: toolParameters.file_path,
            bytes_written: toolParameters.content.length
          };
          break;
        default:
          toolResult = { message: "工具执行成功" };
      }

      const toolResultMessage: Message = {
        role: "tool",
        content: JSON.stringify(toolResult, null, 2),
        toolResult: {
          name: tool.name,
          result: toolResult,
        },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, toolResultMessage]);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const summaryContent = toolResult.error 
        ? `工具执行遇到问题：${toolResult.error}`
        : tool.name === "calculator" 
        ? `计算结果：${toolResult.result}`
        : `工具 ${tool.name} 执行完成，结果已获取！`;

      const assistantResponse: Message = {
        role: "assistant",
        content: summaryContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantResponse]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "工具执行失败，请稍后再试。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedTool(null);
      setToolParameters({});
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const getSelectedToolData = () => tools.find((t) => t.name === selectedTool);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <AnimatedSection className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              全能测试平台
            </h1>
            <p className="text-zinc-400">
              探索 AI 智能体的强大能力，体验多种工具和功能
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/[0.06] border-white/[0.08] text-zinc-300">
              <Zap className="w-3 h-3 mr-1 text-yellow-400" />
              测试模式
            </Badge>
          </div>
        </div>
      </AnimatedSection>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chat Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <AnimatedSection delay={0.1}>
            <Card className="bg-[#0f0f0f] border-white/[0.06]">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium text-zinc-300">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={index}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickAction(action.prompt)}
                        className="bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-zinc-300 hover:text-white"
                      >
                        <Icon className="w-3.5 h-3.5 mr-1.5" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Chat Card */}
          <AnimatedSection delay={0.2}>
            <Card className="h-[60vh] bg-[#0f0f0f] border-white/[0.06] overflow-hidden flex flex-col">
              <CardHeader className="border-b border-white/[0.06] pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Bot className="w-5 h-5 text-indigo-400" />
                      智能对话
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-sm">
                      与全能智能体自然交流
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    在线
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3 p-3 rounded-xl transition-all duration-200",
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                            message.role === "user"
                              ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                              : message.role === "tool"
                              ? "bg-gradient-to-br from-green-500 to-teal-600"
                              : "bg-gradient-to-br from-gray-700 to-gray-900 border border-white/[0.08]"
                          )}
                        >
                          {message.role === "user" ? (
                            <Terminal className="w-4.5 h-4.5" />
                          ) : message.role === "tool" ? (
                            <Settings className="w-4.5 h-4.5" />
                          ) : (
                            <Bot className="w-4.5 h-4.5" />
                          )}
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-zinc-500">
                              {message.role === "user" ? "你" : message.role === "tool" ? "工具" : "AI助手"}
                            </span>
                            <span className="text-xs text-zinc-600">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          {message.toolCall && (
                            <div className="flex items-center gap-1.5 text-xs text-indigo-400 mb-2 bg-indigo-500/10 px-2 py-1 rounded-lg inline-block">
                              <Zap className="w-3 h-3" />
                              调用工具: {message.toolCall.name}
                            </div>
                          )}
                          {message.toolResult && (
                            <div className="flex items-center gap-1.5 text-xs text-green-400 mb-2 bg-green-500/10 px-2 py-1 rounded-lg inline-block">
                              <CheckCircle2 className="w-3 h-3" />
                              工具结果: {message.toolResult.name}
                            </div>
                          )}
                          <div
                            className={cn(
                              "text-sm leading-relaxed whitespace-pre-wrap",
                              message.role === "user"
                                ? "text-white"
                                : message.role === "tool"
                                ? "text-green-300 font-mono bg-green-500/5 p-2 rounded-lg border border-green-500/20"
                                : "text-zinc-300"
                            )}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 p-3 rounded-xl">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0 border border-white/[0.08]">
                          <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-zinc-400">思考中...</div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t border-white/[0.06] p-4 flex-shrink-0">
                <div className="flex gap-2 w-full">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="输入你的问题或命令..."
                    className="flex-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-indigo-500/50"
                  />
                  <Button onClick={handleSend} disabled={isLoading} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </AnimatedSection>
        </div>

        {/* Right Column - Tools Panel */}
        <div className="space-y-6">
          {/* Tools Card */}
          <AnimatedSection delay={0.3}>
            <Card className="bg-[#0f0f0f] border-white/[0.06]">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  工具箱
                </CardTitle>
                <CardDescription className="text-zinc-400 text-sm">
                  选择工具执行特定任务
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs defaultValue="tools" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-white/[0.04]">
                    <TabsTrigger value="tools">可用工具</TabsTrigger>
                    <TabsTrigger value="chat">对话模式</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tools" className="mt-4 space-y-3">
                    {tools.map((tool) => {
                      const Icon = tool.icon;
                      const isSelected = selectedTool === tool.name;
                      return (
                        <div
                          key={tool.name}
                          onClick={() => setSelectedTool(tool.name)}
                          className={cn(
                            "p-4 rounded-xl border transition-all duration-200 cursor-pointer group",
                            isSelected
                              ? "border-indigo-500/50 bg-indigo-500/10"
                              : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                isSelected
                                  ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                                  : "bg-white/[0.06] group-hover:bg-white/[0.08]"
                              )}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <h3 className="font-medium text-white">{tool.name}</h3>
                            </div>
                            {isSelected && (
                              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                                已选择
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">{tool.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(tool.parameters).map(([name, param]) => (
                              <span
                                key={name}
                                className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-500"
                              >
                                {name}
                                {param.required && <span className="text-red-400 ml-0.5">*</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                  <TabsContent value="chat" className="mt-4">
                    <div className="text-center text-zinc-400 py-8">
                      <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="mb-1">对话模式</p>
                      <p className="text-xs text-zinc-500">直接在左侧对话区域与 AI 交流</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Tool Configuration */}
          {selectedTool && (
            <AnimatedSection delay={0.4}>
              <Card className="bg-[#0f0f0f] border-white/[0.06]">
                <CardHeader className="border-b border-white/[0.06] pb-4">
                  <CardTitle className="text-lg font-semibold">工具配置</CardTitle>
                  <CardDescription className="text-zinc-400 text-sm">
                    配置 {selectedTool} 的参数
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {(() => {
                    const toolData = getSelectedToolData();
                    if (!toolData) return null;

                    return Object.entries(toolData.parameters).map(([name, param]) => (
                      <div key={name} className="mb-4 last:mb-0">
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                          {name}
                          {param.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {param.type === "string" && name === "content" ? (
                          <textarea
                            value={toolParameters[name] || ""}
                            onChange={(e) =>
                              setToolParameters((prev) => ({
                                ...prev,
                                [name]: e.target.value,
                              }))
                            }
                            placeholder={param.description}
                            rows={4}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        ) : (
                          <Input
                            value={toolParameters[name] || ""}
                            onChange={(e) =>
                              setToolParameters((prev) => ({
                                ...prev,
                                [name]: e.target.value,
                              }))
                            }
                            placeholder={param.description}
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-indigo-500/50"
                          />
                        )}
                        <p className="text-xs text-zinc-500 mt-1.5">{param.description}</p>
                      </div>
                    ));
                  })()}
                </CardContent>
                <CardFooter className="border-t border-white/[0.06] p-4 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedTool(null);
                      setToolParameters({});
                    }}
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06]"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleToolCall}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        执行中...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        执行工具
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
          )}

          {/* Info Card */}
          <AnimatedSection delay={0.5}>
            <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border-white/[0.06]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  使用提示
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="text-sm text-zinc-400">
                  • 在对话模式中，AI 会自动根据你的需求选择合适的工具
                </p>
                <p className="text-sm text-zinc-400">
                  • 在工具模式中，你可以手动选择和配置特定工具
                </p>
                <p className="text-sm text-zinc-400">
                  • 这是一个演示页面，实际功能需要后端 API 支持
                </p>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
