"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Brain, Code, FileText, Search, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
}

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required: boolean;
  }>;
}

const tools: Tool[] = [
  {
    name: "google_search",
    description: "Search the web for information",
    parameters: {
      query: {
        type: "string",
        description: "The search query",
        required: true,
      },
    },
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations",
    parameters: {
      expression: {
        type: "string",
        description: "The mathematical expression to evaluate",
        required: true,
      },
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file",
    parameters: {
      file_path: {
        type: "string",
        description: "The path to the file",
        required: true,
      },
    },
  },
  {
    name: "write_file",
    description: "Write content to a file",
    parameters: {
      file_path: {
        type: "string",
        description: "The path to the file",
        required: true,
      },
      content: {
        type: "string",
        description: "The content to write to the file",
        required: true,
      },
    },
  },
];

export default function AllRoundTestPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好！我是全能智能体，我可以帮助你完成各种任务。你可以问我问题、让我执行计算、搜索信息或者操作文件。请告诉我你需要什么帮助？",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolParameters, setToolParameters] = useState<Record<string, string>>({});
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
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 模拟AI思考过程
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟AI响应
      const assistantMessage: Message = {
        role: "assistant",
        content: `我收到了你的消息："${input}"。这是一个模拟响应，在实际应用中，我会根据你的请求执行相应的任务，可能会调用工具来获取信息或执行操作。`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉，我遇到了一些问题。请稍后再试。",
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

    // 验证参数
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
      content: `调用工具：${tool.name}`,
      toolCall: {
        name: tool.name,
        parameters: toolParameters,
      },
    };

    setMessages((prev) => [...prev, toolCallMessage]);
    setIsLoading(true);

    try {
      // 模拟工具执行
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 模拟工具结果
      let toolResult: any;
      switch (tool.name) {
        case "google_search":
          toolResult = {
            results: [
              {
                title: "AI Agent 介绍",
                snippet: "AI Agent 是一种能够自主执行任务的人工智能系统...",
                url: "https://example.com/ai-agent",
              },
              {
                title: "AI Agent 工具使用指南",
                snippet: "了解如何使用 AI Agent 的各种工具...",
                url: "https://example.com/ai-agent-tools",
              },
            ],
          };
          break;
        case "calculator":
          try {
            toolResult = { result: eval(toolParameters.expression) };
          } catch {
            toolResult = { error: "计算表达式无效" };
          }
          break;
        case "read_file":
          toolResult = { content: "这是文件的模拟内容..." };
          break;
        case "write_file":
          toolResult = { success: true, message: "文件写入成功" };
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
      };

      setMessages((prev) => [...prev, toolResultMessage]);

      // 模拟AI对工具结果的响应
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const assistantResponse: Message = {
        role: "assistant",
        content: `工具执行结果：${JSON.stringify(toolResult, null, 2)}`,
      };

      setMessages((prev) => [...prev, assistantResponse]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "工具执行失败，请稍后再试。",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedTool(null);
      setToolParameters({});
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/80 border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              全能测试
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <Brain className="w-4 h-4 mr-2" />
              智能模式
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <Code className="w-4 h-4 mr-2" />
              代码模式
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[70vh] bg-[#0f0f0f] border-white/[0.06] overflow-hidden">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-lg font-semibold">聊天对话</CardTitle>
                <CardDescription className="text-zinc-400">
                  与全能智能体交流，它可以帮助你完成各种任务
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(70vh-140px)]">
                  <div className="p-4 space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3 p-3 rounded-lg",
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            message.role === "user"
                              ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                              : message.role === "tool"
                              ? "bg-gradient-to-br from-green-500 to-teal-600"
                              : "bg-gradient-to-br from-gray-700 to-gray-900"
                          )}
                        >
                          {message.role === "user" ? (
                            <Terminal className="w-4 h-4" />
                          ) : message.role === "tool" ? (
                            <Code className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          {message.toolCall && (
                            <div className="text-xs text-zinc-400 mb-1">
                              调用工具: {message.toolCall.name}
                            </div>
                          )}
                          {message.toolResult && (
                            <div className="text-xs text-zinc-400 mb-1">
                              工具结果: {message.toolResult.name}
                            </div>
                          )}
                          <div
                            className={cn(
                              "text-sm",
                              message.role === "user"
                                ? "text-white"
                                : message.role === "tool"
                                ? "text-green-300"
                                : "text-zinc-300"
                            )}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 p-3 rounded-lg">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-zinc-300">思考中...</div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t border-white/[0.06] p-4">
                <div className="flex gap-2 w-full">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="输入你的问题或命令..."
                    className="flex-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-500"
                  />
                  <Button onClick={handleSend} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Tools Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-[#0f0f0f] border-white/[0.06]">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-lg font-semibold">工具列表</CardTitle>
                <CardDescription className="text-zinc-400">
                  选择并配置工具来执行特定任务
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="available" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">可用工具</TabsTrigger>
                    <TabsTrigger value="history">使用历史</TabsTrigger>
                  </TabsList>
                  <TabsContent value="available" className="mt-4 space-y-4">
                    {tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="p-3 rounded-lg border border-white/[0.06] hover:border-indigo-500/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTool(tool.name)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white">{tool.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTool(tool.name);
                            }}
                          >
                            <Code className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">{tool.description}</p>
                        <div className="space-y-1">
                          {Object.entries(tool.parameters).map(([name, param]) => (
                            <div key={name} className="text-xs text-zinc-500">
                              {name} ({param.required ? "必填" : "可选"}): {param.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="history" className="mt-4">
                    <div className="text-center text-zinc-400 py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>暂无使用历史</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Tool Configuration */}
            {selectedTool && (
              <Card className="mt-4 bg-[#0f0f0f] border-white/[0.06]">
                <CardHeader className="border-b border-white/[0.06] pb-4">
                  <CardTitle className="text-lg font-semibold">工具配置</CardTitle>
                  <CardDescription className="text-zinc-400">
                    配置 {selectedTool} 工具的参数
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tools
                    .find((t) => t.name === selectedTool)
                    ?.parameters?.map((param, name) => (
                      <div key={name} className="mb-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          {name} {param.required && <span className="text-red-400">*</span>}
                        </label>
                        <Input
                          value={toolParameters[name] || ""}
                          onChange={(e) =>
                            setToolParameters((prev) => ({
                              ...prev,
                              [name]: e.target.value,
                            }))
                          }
                          placeholder={param.description}
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-500"
                        />
                        <p className="text-xs text-zinc-500 mt-1">{param.description}</p>
                      </div>
                    ))}
                </CardContent>
                <CardFooter className="border-t border-white/[0.06] p-4">
                  <Button onClick={handleToolCall} className="w-full">
                    执行工具
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
