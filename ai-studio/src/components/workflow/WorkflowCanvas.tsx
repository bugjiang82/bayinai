'use client';

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  OnConnect,
  useNodesState,
  useEdgesState,
  Panel,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TextNode } from './nodes/TextNode';
import { ImageNode } from './nodes/ImageNode';
import { VideoNode } from './nodes/VideoNode';
import { cn } from './lib/utils';
import { NodeType } from './types';
import { chatWithAssistant, Message } from './services/aiService';
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
  Upload,
  Send,
  Home,
  History,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DraggingContext = createContext<boolean>(false);
const MultiSelectContext = createContext<boolean>(false);

export const useDragging = () => useContext(DraggingContext);
export const useMultiSelect = () => useContext(MultiSelectContext);

const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
  'image-edit': ImageNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function isValidImageSource(src: string | null | undefined): boolean {
  if (!src) return false;
  if (typeof src !== 'string') return false;
  if (src.trim() === "") return false;
  if (src.includes("placeholder")) return false;
  if (src.includes("undefined")) return false;
  if (src.includes("null")) return false;
  if (src.toLowerCase().includes("http") && !src.startsWith("http")) return false;
  return true;
}


const WorkflowCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [menu, setMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number; sourceNode?: string; sourceHandle?: string } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyTab, setHistoryTab] = useState<'image' | 'video'>('image');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '你好！我是八音画布助手。开始创建你的作品吧，可以通过添加节点或直接告诉我你想要什么。' }
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/user/credits');
        const result = await response.json();
        if (result.code === 0) {
          setUserCredits(result.data.credits);
        }
      } catch (err) {
        console.error("获取积分失败:", err);
      }
    };
    fetchCredits();
  }, []);

  useEffect(() => {
    if (showHistoryDialog) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const types = historyTab === 'image'
            ? 'TEXT_TO_IMAGE&type=IMAGE_TO_IMAGE&type=EDIT&type=INPAINT'
            : 'VIDEO';
          const response = await fetch(`/api/generate/history?type=${types}&pageSize=50`);
          const result = await response.json();
          if (result.code === 0) {
            const validItems = (result.data.list || []).filter((item: any) => {
              const imageUrl = item.thumbnailUrl || item.outputUrl;
              return isValidImageSource(imageUrl);
            });
            setHistoryItems(validItems);
            setHistoryTotal(validItems.length);
          }
        } catch (err) {
          console.error("获取历史失败:", err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [showHistoryDialog, historyTab]);

  const handleHistoryItemClick = (item: any) => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const nodeType = historyTab === 'image' ? 'image' : 'video';
    const id = `${nodeType}-${Date.now()}`;

    const newNode: Node = {
      id,
      type: nodeType,
      position,
      data: {
        label: `${nodeType === 'image' ? '图片' : '视频'}-${Date.now()}`,
        type: nodeType,
        prompt: item.prompt || '',
        credits: userCredits,
        output: item.thumbnailUrl || item.outputUrl, // 显示用缩略图
        sourceImage: item.outputUrl || item.thumbnailUrl, // 下载/生成用原始图
        isUploaded: true,
        config: {
          model: item.params?.model || (nodeType === 'image' ? 'gemini-3.1-flash-image-preview' : 'wan2.2-kf2v-flash'),
          quality: 'standard',
          aspectRatio: '1:1',
        }
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setShowHistoryDialog(false);
  };

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
        animated: false,
        style: { strokeWidth: 1, stroke: '#6b7280' }
      } as Edge, eds));

      setNodes((nds) => nds.map(node => {
        if (node.id === params.target) {
          const sourceNode = nds.find(n => n.id === params.source);
          if (sourceNode) {
            const currentRefs = (node.data.referencedParentIds || []) as string[];
            if (!currentRefs.includes(sourceNode.id)) {
              const newRefs = [...currentRefs, sourceNode.id];
              const newPrompt = node.data.prompt || sourceNode.data.prompt || '';
              return {
                ...node,
                data: {
                  ...node.data,
                  referencedParentIds: newRefs,
                  prompt: newPrompt,
                  inheritImage: sourceNode.data.output || sourceNode.data.sourceImage,
                  inheritPrompt: sourceNode.data.prompt
                }
              };
            }
          }
        }
        return node;
      }));

      setIsConnecting(false);
    },
    [setEdges, setNodes],
  );

  const onConnectStart = useCallback((_: any, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
    setIsConnecting(true);
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      setIsConnecting(false);
      if (!connectingNodeId.current) return;

      const target = event.target as Element;

      const nodeElement = target.closest('.react-flow__node');
      if (nodeElement) {
        const targetNodeId = nodeElement.getAttribute('data-id');
        if (targetNodeId && targetNodeId !== connectingNodeId.current) {
          onConnect({
            source: connectingNodeId.current,
            sourceHandle: connectingHandleId.current,
            target: targetNodeId,
            targetHandle: 'left'
          } as Connection);
          return;
        }
      }

      const targetIsPane = target.classList.contains('react-flow__pane');
      const targetIsBackground = target.classList.contains('react-flow__background');

      if (targetIsPane || targetIsBackground) {
        let clientX, clientY;

        if ('clientX' in event) {
          clientX = event.clientX;
          clientY = event.clientY;
        } else {
          const touch = (event as TouchEvent).changedTouches[0];
          clientX = touch.clientX;
          clientY = touch.clientY;
        }

        const position = screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        setTimeout(() => {
          setMenu({
            x: clientX,
            y: clientY,
            canvasX: position.x,
            canvasY: position.y,
            sourceNode: connectingNodeId.current || undefined,
            sourceHandle: connectingHandleId.current || undefined
          });
        }, 30);
      }
    },
    [screenToFlowPosition]
  );

  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onNodeDragStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onSelectionChange = useCallback((params: { nodes: Node[] }) => {
    setIsMultiSelect(params.nodes.length > 1);
  }, []);

  const addNode = (type: NodeType, x: number, y: number, sourceNodeId?: string, sourceHandle?: string, initialData?: { prompt?: string, label?: string }) => {
    const parentNode = sourceNodeId ? nodes.find(n => n.id === sourceNodeId) : null;
    const inheritImage = parentNode ? (parentNode.data.output || parentNode.data.sourceImage) : undefined;
    const inheritPrompt = parentNode ? parentNode.data.prompt : undefined;

    const id = `${type}-${Date.now()}`;
    const typeCount = nodes.filter(n => n.type === type).length + 1;
    const label = initialData?.label || `${type}${typeCount}`;

    const newNode: Node = {
      id,
      type,
      position: { x, y },
      data: {
        label,
        type,
        prompt: initialData?.prompt || inheritPrompt || '',
        credits: userCredits,
        inheritImage,
        inheritPrompt,
        referencedParentIds: sourceNodeId ? [sourceNodeId] : [],
        config: {
          model: type === 'text' ? 'gemini-3-flash-preview' : (type === 'image' || type === 'image-edit') ? 'gemini-3.1-flash-image-preview' : 'veo-3.1-lite-generate-preview',
          quality: 'standard',
          aspectRatio: type === 'video' ? '16:9' : '1:1',
          duration: '5s',
          mode: 't2v'
        }
      },
    };

    setNodes((nds) => nds.concat(newNode));

    if (sourceNodeId) {
      setEdges((eds) => addEdge({
        id: `e-${sourceNodeId}-${id}`,
        source: sourceNodeId,
        target: id,
        sourceHandle: sourceHandle || 'right',
        targetHandle: 'left',
        animated: false,
        style: { strokeWidth: 1, stroke: '#6b7280' },
      } as Edge, eds));
    }

    setMenu(null);
    connectingNodeId.current = null;
    connectingHandleId.current = null;
    return id;
  };

  const executeToolCall = useCallback((call: any) => {
    const { name, args } = call.functionCall;

    if (name === 'add_node') {
      const position = screenToFlowPosition({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 400
      });
      addNode(args.type as NodeType, position.x, position.y, undefined, undefined, {
        prompt: args.prompt,
        label: args.label
      });
    } else if (name === 'update_node') {
      setNodes((nds) => nds.map((node) => {
        if (node.id === args.nodeId || node.data.label === args.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              prompt: args.prompt || node.data.prompt,
              label: args.label || node.data.label
            }
          };
        }
        return node;
      }));
    } else if (name === 'connect_nodes') {
      const source = nodes.find(n => n.id === args.sourceId || n.data.label === args.sourceId);
      const target = nodes.find(n => n.id === args.targetId || n.data.label === args.targetId);

      if (source && target) {
        setEdges((eds) => addEdge({
          source: source.id,
          target: target.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          animated: false,
          style: { strokeWidth: 1, stroke: '#6b7280' },
        } as Edge, eds));
      }
    }
  }, [addNode, screenToFlowPosition, nodes, setEdges, setNodes]);

  const handleSendMessage = async () => {
    if (!assistantInput.trim() || isAssistantLoading) return;

    const userMessage: Message = { role: 'user', content: assistantInput };
    setMessages(prev => [...prev, userMessage]);
    setAssistantInput('');
    setIsAssistantLoading(true);

    try {
      const context = `Nodes: ${nodes.map(n => `@${n.data.label} (${n.id}, type: ${n.type})`).join(', ')}`;
      const response = await chatWithAssistant([...messages, userMessage], context);

      const modelMessage: Message = { role: 'model', content: response.text || 'Done!' };
      setMessages(prev => [...prev, modelMessage]);

      if (response.toolCalls && response.toolCalls.length > 0) {
        response.toolCalls.forEach(executeToolCall);
      }
    } catch (error) {
      console.error("Assistant send error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const onDragOverCanvas = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropCanvas = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const img = new Image();
            img.onload = () => {
              const ratio = img.width / img.height;

              const id = `image-${Date.now()}`;
              const selectedNode = nodes.find(n => n.selected);

              const newNode: Node = {
                id,
                type: 'image',
                position,
                data: {
                  label: 'Uploaded Image',
                  type: 'image',
                  credits: userCredits,
                  output: base64String,
                  sourceImage: base64String,
                  aspectRatio: ratio,
                  isUploaded: true,
                  config: {
                    model: 'gemini-2.5-flash-image',
                    quality: 'standard',
                    aspectRatio: '1:1',
                  }
                },
              };
              setNodes((nds) => nds.concat(newNode));

              if (selectedNode) {
                setEdges((eds) => [
                  ...eds,
                  {
                    id: `e-${selectedNode.id}-${id}`,
                    source: selectedNode.id,
                    target: id,
                    sourceHandle: 'right',
                    targetHandle: 'left',
                    animated: false,
                    style: { strokeWidth: 1, stroke: '#6b7280' },
                  }
                ]);
              }
            };
            img.src = base64String;
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    },
    [screenToFlowPosition, setNodes]
  );

  const handlePaneDoubleClick = (event: React.MouseEvent) => {
    const target = event.target as Element;
    const isPane = target.classList.contains('react-flow__pane');
    const isBackground = target.classList.contains('react-flow__background');

    if (!isPane && !isBackground) return;

    event.preventDefault();
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setMenu({
      x: event.clientX,
      y: event.clientY,
      canvasX: position.x,
      canvasY: position.y
    });
  };

  const handlePaneClick = (event: React.MouseEvent | React.TouchEvent) => {
    setMenu(null);
  };

  const openAddMenuAtCenter = () => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const position = screenToFlowPosition({ x, y });
    setMenu({
      x,
      y,
      canvasX: position.x,
      canvasY: position.y
    });
  };

  const handleGroupSelection = () => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length < 2) return;

    const groupId = `group-${Date.now()}`;
    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + 280));
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + 400));

    const groupNode: Node = {
      id: groupId,
      type: 'group',
      data: { label: 'Group' },
      position: { x: minX - 20, y: minY - 40 },
      style: {
        width: maxX - minX + 40,
        height: maxY - minY + 60,
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        border: '2px dashed rgba(99, 102, 241, 0.4)',
        borderRadius: '16px',
        zIndex: -1
      }
    };

    setNodes(nds => [
      groupNode,
      ...nds.map(n => {
        if (n.selected) {
           return {
             ...n,
             parentId: groupId,
             extent: 'parent' as const,
             position: { x: n.position.x - (minX - 20), y: n.position.y - (minY - 40) }
           };
        }
        return n;
      })
    ]);
  };

  return (
    <DraggingContext.Provider value={isDragging}>
      <MultiSelectContext.Provider value={isMultiSelect}>
        <div
        className="w-full h-full bg-[#050608] relative overflow-hidden"
        ref={reactFlowWrapper}
        onDoubleClick={handlePaneDoubleClick}
      >
        <div className="absolute inset-0 canvas-grid pointer-events-none" />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          connectionLineStyle={{ stroke: '#6b7280', strokeWidth: 1 }}
          defaultEdgeOptions={{
            animated: false,
            style: { strokeWidth: 1, stroke: '#6b7280' }
          }}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={(e) => e.preventDefault()}
          onDragOver={onDragOverCanvas}
          onDrop={onDropCanvas}
          nodeTypes={nodeTypes}
          fitView
          selectionMode={SelectionMode.Partial}
          zoomOnDoubleClick={false}
          panOnScroll
          panOnDrag={[2]}
          selectionOnDrag
          colorMode="dark"
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="transparent" />
          <Controls showInteractive={false} position="bottom-left" />

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
              <button
                onClick={() => setShowHistoryDialog(true)}
                className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
              >
                <History size={20} />
              </button>
              <div className="mt-auto">
                <button className="w-12 h-12 bg-white/5 flex items-center justify-center text-slate-100 font-black rounded-2xl">
                  N
                </button>
              </div>
            </div>
          </Panel>

          <Panel position="top-left" className="pointer-events-none mt-4 ml-4">
            <button
              onClick={() => setShowHomeDialog(true)}
              className="flex items-center gap-3 pointer-events-auto hover:opacity-80 transition-opacity"
            >
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
                 <Sparkles size={16} className="text-white" />
               </div>
               <span className="text-sm font-bold text-white tracking-tight">八音-六维画布工作台</span>
            </button>
          </Panel>

          <Panel position="top-center" className="mt-4 pointer-events-none">
            <div className="flex items-center gap-3 bg-[#13141c]/90 backdrop-blur-3xl border border-white/10 rounded-2xl px-4 py-2 shadow-xl pointer-events-auto">
              <div className="flex items-center gap-2 text-slate-400">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-sm font-bold text-white">{userCredits}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors px-2">
                <Layers size={14} />
                <span className="text-xs font-bold">探索</span>
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={openAddMenuAtCenter}
                className="text-slate-300 hover:text-white transition-colors px-2"
              >
                <Plus size={14} />
              </button>
            </div>
          </Panel>

          <Panel position="top-right" className="h-[calc(100vh-2rem)] w-[320px] pointer-events-none mr-4 mt-4 mb-4">
            <div className="h-full bg-[#13141c]/90 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl p-6 flex flex-col pointer-events-auto overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">助手</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <button className="text-slate-500 hover:text-white" onClick={() => setMessages([])}><Plus size={14} /></button>
                   <button className="text-slate-500 hover:text-white"><Layers size={14} /></button>
                 </div>
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
                 {messages.map((m, idx) => (
                   <div
                     key={idx}
                     className={cn(
                       "flex flex-col gap-1 max-w-[90%]",
                       m.role === 'user' ? "ml-auto items-end" : "items-start"
                     )}
                   >
                     <div
                       className={cn(
                         "px-4 py-2 rounded-2xl text-xs leading-relaxed shadow-sm",
                         m.role === 'user'
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white/5 text-slate-300 border border-white/5 rounded-tl-none"
                       )}
                     >
                       {m.content}
                     </div>
                   </div>
                 ))}
                 {isAssistantLoading && (
                   <div className="flex gap-1 ml-1 items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                   </div>
                 )}
                 {messages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 opacity-50">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Sparkles size={24} className="text-indigo-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">开始新对话</p>
                   </div>
                 )}
               </div>

               <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="告诉我你想要创作什么..."
                      value={assistantInput}
                      onChange={(e) => setAssistantInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isAssistantLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>
               </div>
            </div>
          </Panel>
        </ReactFlow>

        {menu && (
          <div
            style={{ top: menu.y, left: menu.x, transform: 'translateX(-50%)' }}
            className="fixed z-[1000] bg-[#1a1c24] border border-white/10 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] p-2 w-[240px] backdrop-blur-3xl overflow-hidden"
          >
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
                添加节点
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => addNode('text', menu.canvasX, menu.canvasY, menu.sourceNode, menu.sourceHandle)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Type size={18} className="text-indigo-400 group-hover:text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">文本</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-tight">脚本、广告、文案</span>
                  </div>
                </button>

                <button
                  onClick={() => addNode('image', menu.canvasX, menu.canvasY, menu.sourceNode, menu.sourceHandle)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <ImageIcon size={18} className="text-slate-400 group-hover:text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">图片</span>
                </button>

                <button
                  onClick={() => addNode('video', menu.canvasX, menu.canvasY, menu.sourceNode, menu.sourceHandle)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <VideoIcon size={18} className="text-slate-400 group-hover:text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">视频</span>
                </button>

                <button
                  onClick={() => addNode('image-edit', menu.canvasX, menu.canvasY, menu.sourceNode, menu.sourceHandle)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Palette size={18} className="text-slate-400 group-hover:text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">图片编辑</span>
                  </div>
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
                  资源
                </div>
                <button
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all group text-left opacity-40 cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Upload size={18} className="text-slate-400 group-hover:text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">上传内容</span>
                </button>
              </div>
          </div>
        )}

        {showHomeDialog && (
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowHomeDialog(false)}
          >
            <div
              className="absolute bg-[#1a1c24] border border-white/10 rounded-xl shadow-2xl overflow-hidden w-[180px]"
              style={{ top: '60px', left: '16px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="w-full px-4 py-3 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
              >
                <Home size={16} className="text-slate-400" />
                <span>返回首页</span>
              </button>
            </div>
          </div>
        )}

        {showHistoryDialog && (
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowHistoryDialog(false)}
          >
            <div
              className="absolute bg-[#1a1c24] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              style={{ top: '50%', left: '20%', transform: 'translate(-50%, -50%)', width: '450px', maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setHistoryTab('image')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      historyTab === 'image'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    图片历史 ({historyTab === 'image' ? historyTotal : '...'})
                  </button>
                  <button
                    onClick={() => setHistoryTab('video')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      historyTab === 'video'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    视频历史 ({historyTab === 'video' ? historyTotal : '...'})
                  </button>
                </div>
                <button
                  onClick={() => setShowHistoryDialog(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={24} className="animate-spin text-indigo-500/70" />
                      <span className="text-xs text-slate-400">加载中...</span>
                    </div>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon size={48} className="text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">暂无{historyTab === 'image' ? '图片' : '视频'}历史</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {historyItems.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => handleHistoryItemClick(item)}
                        className="relative aspect-square bg-white/5 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
                      >
                        <img
                          src={item.thumbnailUrl || item.outputUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] text-white truncate">
                            {item.prompt?.slice(0, 30) || '无描述'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </MultiSelectContext.Provider>
    </DraggingContext.Provider>
  );
};

export default WorkflowCanvas;
