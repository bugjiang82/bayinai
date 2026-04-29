"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel,
  Node,
  Edge,
  Connection,
  ConnectionLineType,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./canvas.css";

import { ImageNode } from "@/components/canvas-mode/ImageNode";
import { TextNode } from "@/components/canvas-mode/TextNode";
import { VideoNode } from "@/components/canvas-mode/VideoNode";
import { cn } from "@/lib/utils";
import {
  Plus,
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Palette,
  MousePointer2,
  BoxSelect,
  Layers,
  Sparkles,
  Waves,
  Box,
  Upload,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
};

type NodeType = "text" | "image" | "video";

const WorkflowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    sourceNode?: string;
    sourceHandle?: string;
  } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);

  const onConnect: (params: Connection) => void = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            type: "smoothstep",
            style: { strokeWidth: 3, stroke: "#6366f1" },
          } as Edge,
          eds
        )
      ),
    [setEdges]
  );

  const onConnectStart = useCallback(
    (_: any, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
      connectingNodeId.current = nodeId;
      connectingHandleId.current = handleId;
    },
    []
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingNodeId.current) return;

      const targetIsPane = (event.target as Element).classList.contains("react-flow__pane");

      if (targetIsPane) {
        const clientX = "clientX" in event ? event.clientX : (event as TouchEvent).touches[0].clientX;
        const clientY = "clientY" in event ? event.clientY : (event as TouchEvent).touches[0].clientY;

        const position = screenToFlowPosition({ x: clientX, y: clientY });

        setMenu({
          x: clientX,
          y: clientY,
          canvasX: position.x,
          canvasY: position.y,
          sourceNode: connectingNodeId.current,
          sourceHandle: connectingHandleId.current || undefined,
        });
      }
    },
    [screenToFlowPosition]
  );

  const addNode = (type: NodeType, x: number, y: number, sourceNodeId?: string, sourceHandle?: string) => {
    const parentNode = sourceNodeId ? nodes.find((n) => n.id === sourceNodeId) : null;
    const inheritImage = parentNode ? (parentNode.data.output || parentNode.data.sourceImage) : undefined;
    const inheritPrompt = parentNode ? parentNode.data.prompt : undefined;

    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x, y },
      data: {
        label: `Untitled ${type}`,
        type,
        prompt: inheritPrompt || "",
        credits: type === "text" ? 1 : type === "image" ? 5 : 20,
        inheritImage,
        inheritPrompt,
        config: {
          model: type === "text" ? "gemini-3.1-flash" : type === "image" ? "imagen-3" : "veo-3.1",
          quality: "standard",
          aspectRatio: "1:1",
          duration: "5s",
          mode: "t2v",
        },
      },
    };

    setNodes((nds) => nds.concat(newNode));

    if (sourceNodeId) {
      setEdges((eds) =>
        addEdge(
          {
            id: `e-${sourceNodeId}-${id}`,
            source: sourceNodeId,
            target: id,
            sourceHandle: sourceHandle || "right",
            targetHandle: "left",
            animated: true,
          } as Edge,
          eds
        )
      );
    }

    setMenu(null);
    connectingNodeId.current = null;
    connectingHandleId.current = null;
  };

  const handlePaneDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    setMenu({
      x: event.clientX,
      y: event.clientY,
      canvasX: position.x,
      canvasY: position.y,
    });
  };

  const openAddMenuAtCenter = () => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const position = screenToFlowPosition({ x, y });
    setMenu({ x, y, canvasX: position.x, canvasY: position.y });
  };

  const handleGroupSelection = () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length < 2) return;

    const groupId = `group-${Date.now()}`;
    const minX = Math.min(...selectedNodes.map((n) => n.position.x));
    const minY = Math.min(...selectedNodes.map((n) => n.position.y));
    const maxX = Math.max(...selectedNodes.map((n) => n.position.x + 280));
    const maxY = Math.max(...selectedNodes.map((n) => n.position.y + 400));

    const groupNode: Node = {
      id: groupId,
      type: "group",
      data: { label: "Group" },
      position: { x: minX - 20, y: minY - 40 },
      style: {
        width: maxX - minX + 40,
        height: maxY - minY + 60,
        backgroundColor: "rgba(79, 70, 229, 0.05)",
        border: "2px dashed rgba(99, 102, 241, 0.4)",
        borderRadius: "16px",
        zIndex: -1,
      },
    };

    setNodes((nds) => [
      groupNode,
      ...nds.map((n) => {
        if (n.selected) {
          return {
            ...n,
            parentId: groupId,
            extent: "parent" as const,
            position: { x: n.position.x - (minX - 20), y: n.position.y - (minY - 40) },
          };
        }
        return n;
      }),
    ]);
  };

  return (
    <div className="w-full h-full bg-[#050608] relative overflow-hidden" ref={reactFlowWrapper}>
      <div className="absolute inset-0 canvas-grid pointer-events-none" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        connectionLineStyle={{ stroke: "#6366f1", strokeWidth: 3 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { strokeWidth: 3, stroke: "#6366f1" },
        }}
        onPaneClick={() => setMenu(null)}
        onPaneContextMenu={(e) => e.preventDefault()}
        onDoubleClick={handlePaneDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        selectionMode={SelectionMode.Partial}
        panOnScroll
        selectionOnDrag
        colorMode="dark"
      >
        <Background color="transparent" />
        <Controls showInteractive={false} position="bottom-left" />

        {/* Left Sidebar Toolbar */}
        <Panel position="top-left" className="h-[calc(100vh-2rem)] flex flex-col items-center justify-center pointer-events-none ml-4">
          <div className="flex flex-col gap-2 p-2 bg-[#13141c]/90 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl pointer-events-auto">
            <button
              onClick={openAddMenuAtCenter}
              className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
            >
              <Plus size={20} />
            </button>
            <div className="w-8 h-px bg-white/5 mx-auto my-1" />
            <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
              <BoxSelect size={20} />
            </button>
            <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
              <Layers size={20} />
            </button>
            <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
              <Sparkles size={20} />
            </button>
            <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
              <ImageIcon size={20} />
            </button>
            <div className="mt-auto">
              <button className="w-12 h-12 bg-white/5 flex items-center justify-center text-slate-100 font-black rounded-2xl">
                N
              </button>
            </div>
          </div>
        </Panel>

        {/* Top Header */}
        <Panel position="top-left" className="w-[calc(100vw-2rem)] flex items-center justify-between pointer-events-none mt-4 ml-4">
          <div className="flex items-center gap-4 bg-[#13141c]/90 backdrop-blur-3xl border border-white/10 rounded-2xl px-5 py-2.5 shadow-2xl pointer-events-auto">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">新手教学</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto mr-4">
            <div className="flex items-center gap-3 bg-[#13141c]/90 backdrop-blur-3xl border border-white/10 rounded-2xl px-4 py-2 shadow-xl">
              <div className="flex items-center gap-2 text-slate-400">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-sm font-bold">198</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                <Layers size={14} />
                <span className="text-xs font-bold">社区</span>
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={openAddMenuAtCenter} className="text-slate-300 hover:text-white transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </Panel>

        {/* Global Toolbar (Top Center) */}
        <Panel position="top-center" className="mt-4 pointer-events-none">
          <div className="bg-[#13141c]/90 backdrop-blur-3xl border border-white/10 rounded-[20px] px-2 py-1.5 shadow-2xl flex items-center gap-1.5 pointer-events-auto">
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <MousePointer2 size={18} />
            </button>
            <button onClick={handleGroupSelection} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <BoxSelect size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Palette size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Sparkles size={18} />
            </button>
            <div className="w-[1px] h-6 bg-white/5 mx-1" />
            <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Layers size={18} />
            </button>
            <button onClick={openAddMenuAtCenter} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Plus size={18} />
            </button>
          </div>
        </Panel>

        {/* Right Sidebar Assistant */}
        <Panel position="top-right" className="h-[calc(100vh-2rem)] w-[320px] pointer-events-none mr-4 mt-4 mb-4">
          <div className="h-full bg-[#13141c]/90 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl p-6 flex flex-col pointer-events-auto overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-slate-500 hover:text-white">
                  <Plus size={14} />
                </button>
                <button className="text-slate-500 hover:text-white">
                  <Layers size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-2">
                <Sparkles size={32} className="text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Hi Gemini Tapper!</h2>
              <p className="text-sm text-slate-400 px-4">Ready to fuel your imagination? Start by adding a node or dragging from an existing one.</p>
            </div>

            <div className="mt-auto space-y-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-slate-300 font-medium">有什么新鲜事？</div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-slate-300 font-medium">今天我们要创作什么？</div>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="描述操作或用 @ 引用..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Add Node Context Menu */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
            style={{ top: menu.y, left: menu.x }}
            className="fixed z-[1000] bg-[#1a1c24] border border-white/10 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] p-2 w-[240px] backdrop-blur-3xl overflow-hidden"
          >
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">添加节点</div>
            <div className="space-y-1">
              <button
                onClick={() => addNode("text", menu.canvasX, menu.canvasY, menu.sourceNode, menu.sourceHandle)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left"
              >
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <Type size={18} className="text-indigo-400 group-hover:text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">文本</span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-tight">脚本、广告词、品牌文案</span>
                </div>
              </button>

              <button
                onClick={() => addNode("image", menu.canvasX, menu.canvasY, menu.sourceNode, menu.sourceHandle)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left"
              >
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <ImageIcon size={18} className="text-slate-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-bold text-slate-200">图片</span>
              </button>

              <button
                onClick={() => addNode("video", menu.canvasX, menu.canvasY, menu.sourceNode, menu.sourceHandle)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left"
              >
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <VideoIcon size={18} className="text-slate-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-bold text-slate-200">视频</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left opacity-40 cursor-not-allowed">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                  <Waves size={18} className="text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200">音频</span>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left opacity-40 cursor-not-allowed">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                  <Box size={18} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">3D 世界</span>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1 rounded font-bold">Beta</span>
                </div>
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-white/5">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">添加资源</div>
              <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <Upload size={18} className="text-slate-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-bold text-slate-200">上传</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CanvasModePage() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}