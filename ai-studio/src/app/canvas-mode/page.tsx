"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel,
  Node,
  Edge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./canvas.css";

import ImageNode from "@/components/canvas-mode/ImageNode";
import PromptNode from "@/components/canvas-mode/PromptNode";

const nodeTypes = {
  imageNode: ImageNode,
  promptNode: PromptNode,
};

let idCounter = 1;
const getId = () => `node_${idCounter++}`;

export default function CanvasModePage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);
  const connectingPosition = useRef<{ x: number; y: number } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showNodeTypeModal, setShowNodeTypeModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setNodes([
      {
        id: 'node_1',
        type: 'imageNode',
        position: { x: 100, y: 100 },
        data: { image: null, prompt: '' }
      }
    ]);
    idCounter = 2;
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onConnectStart = useCallback((_: any, { nodeId }: { nodeId: string | null }) => {
    connectingNodeId.current = nodeId;
    setShowHint(true);
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      setShowHint(false);
      if (!connectingNodeId.current) return;

      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');

      if (targetIsPane) {
        const { top, left } = reactFlowWrapper.current!.getBoundingClientRect();
        const clientX = 'clientX' in event ? event.clientX : (event as TouchEvent).touches[0].clientX;
        const clientY = 'clientY' in event ? event.clientY : (event as TouchEvent).touches[0].clientY;
        
        const flowPos = screenToFlowPosition({
          x: clientX - left,
          y: clientY - top
        });
        connectingPosition.current = flowPos;
        setMenuPosition({ x: clientX, y: clientY });
        setShowNodeTypeModal(true);
      }
    },
    [screenToFlowPosition]
  );

  const handleNodeTypeSelect = useCallback((type: 'extract' | 'edit') => {
    setShowNodeTypeModal(false);
    if (!connectingNodeId.current || !connectingPosition.current) return;

    const parentNode = nodes.find(n => n.id === connectingNodeId.current);
    const parentImage = parentNode?.data?.image;
    const newNodeId = getId();

    let newNode: Node;

    if (type === 'extract') {
      newNode = {
        id: newNodeId,
        type: 'promptNode',
        position: connectingPosition.current,
        data: {
          inheritImage: parentImage,
          extractedPrompt: '',
          editedPrompt: ''
        }
      };
    } else {
      newNode = {
        id: newNodeId,
        type: 'imageNode',
        position: connectingPosition.current,
        data: {
          image: null,
          prompt: '',
          inheritImage: parentImage
        }
      };
    }

    const newEdge: Edge = {
      id: `e${connectingNodeId.current}-${newNodeId}`,
      source: connectingNodeId.current,
      target: newNodeId,
      animated: true
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));

    connectingNodeId.current = null;
    connectingPosition.current = null;
  }, [nodes, setNodes, setEdges]);

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: getId(),
      type: 'imageNode',
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200
      },
      data: { image: null, prompt: '' }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    idCounter = 1;
  }, [setNodes, setEdges]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full canvas-mode">
      <div className="cyber-grid" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Background color="rgba(0, 245, 255, 0.1)" gap={50} size={1} />
        <Controls className="glass !bg-[#14141f]/80 !border-cyber-cyan/30" />
        <MiniMap
          className="glass !bg-[#14141f]/80 !border-cyber-cyan/30"
          nodeColor={(node) => {
            if (node.type === 'promptNode') return '#f59e0b';
            return node.data?.image ? '#00f5ff' : '#ff00ff';
          }}
          maskColor="rgba(10, 10, 15, 0.8)"
        />

        <Panel position="top-center">
          <div className="flex gap-2">
            <button
              onClick={addNode}
              className="px-4 py-2 glass rounded-lg text-cyber-cyan font-medium hover:bg-cyber-cyan/20 transition-all"
            >
              + 添加节点
            </button>
            <button
              onClick={clearCanvas}
              className="px-4 py-2 glass rounded-lg text-cyber-magenta font-medium hover:bg-cyber-magenta/20 transition-all"
            >
              清空画布
            </button>
          </div>
        </Panel>

        {showHint && (
          <Panel position="center">
            <div className="glass px-6 py-3 rounded-lg text-cyber-magenta font-medium">
              拖拽到空白处创建新节点
            </div>
          </Panel>
        )}

        <Panel position="bottom-left">
          <div className="glass p-4 rounded-xl max-w-xs">
            <h4 className="text-cyber-cyan font-semibold mb-2 text-sm">💡 操作指南</h4>
            <div className="text-xs text-gray-300 space-y-1">
              <p>• 点击 <span className="text-cyber-cyan">+ 添加节点</span> 创建新节点</p>
              <p>• 从节点右侧的 <span className="text-cyber-cyan">●</span> 拖拽到空白处</p>
              <p>• 选择<span className="text-cyber-cyan">提取提示词</span>分析并编辑父节点图像</p>
              <p>• 选择<span className="text-cyber-magenta">图生图编辑</span>基于父节点生成新图</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* 节点类型选择弹窗 */}
      {showNodeTypeModal && (
        <div
          className="fixed z-[9999] glass rounded-xl p-2 min-w-[180px]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translate(-50%, 10px)'
          }}
        >
          <div className="text-xs text-white/50 px-3 py-1 mb-1 border-b border-white/10">
            选择节点类型
          </div>

          <button
            onClick={() => handleNodeTypeSelect('extract')}
            className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-cyber-cyan/20 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-cyber-cyan/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-white group-hover:text-cyber-cyan transition-colors">
                提取提示词
              </span>
              <p className="text-[10px] text-white/40">
                分析并编辑父节点图像
              </p>
            </div>
          </button>

          <button
            onClick={() => handleNodeTypeSelect('edit')}
            className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-cyber-magenta/20 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-cyber-magenta/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyber-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-white group-hover:text-cyber-magenta transition-colors">
                图生图编辑
              </span>
              <p className="text-[10px] text-white/40">
                基于父节点生成新图
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowNodeTypeModal(false);
              connectingNodeId.current = null;
              connectingPosition.current = null;
            }}
            className="w-full px-3 py-1.5 mt-1 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}