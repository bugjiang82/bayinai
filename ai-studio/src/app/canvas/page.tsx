'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Plus, Save, Trash2, FolderOpen, LogOut, User, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import ImageNode from '@/components/canvas/ImageNode';
import PromptNode from '@/components/canvas/PromptNode';
import Toolbar from '@/components/canvas/Toolbar';
import { NodeTypeModal } from '@/components/canvas/NodeTypeModal';
import { CanvasList } from '@/components/canvas/CanvasList';

const nodeTypes = {
  imageNode: ImageNode,
  promptNode: PromptNode
};

let idCounter = 1;
const getId = () => `node_${idCounter++}`;

export default function CanvasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const connectingNodeId = useRef(null);
  const connectingPosition = useRef(null);
  const [showHint, setShowHint] = useState(false);
  const [showNodeTypeModal, setShowNodeTypeModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [canvasId, setCanvasId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [showCanvasList, setShowCanvasList] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const canvasIdFromUrl = urlParams.get('canvas');

    if (canvasIdFromUrl) {
      loadCanvasFromServer(canvasIdFromUrl);
    } else {
      setNodes([
        {
          id: 'node_1',
          type: 'imageNode',
          position: { x: 100, y: 100 },
          data: { image: null, prompt: '' }
        }
      ]);
      idCounter = 2;
    }
  }, []);

  const saveCanvasToServer = async () => {
    try {
      setSaveStatus('保存中...');
      // 这里将集成现有的API调用逻辑
      // 暂时使用模拟数据
      setTimeout(() => {
        const mockId = `canvas_${Date.now()}`;
        setCanvasId(mockId);
        window.history.replaceState({}, '', `?canvas=${mockId}`);
        setSaveStatus('已保存');
        setTimeout(() => setSaveStatus(''), 2000);
      }, 1000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('保存失败');
    }
  };

  const loadCanvasFromServer = async (id) => {
    try {
      // 这里将集成现有的API调用逻辑
      // 暂时使用模拟数据
      setTimeout(() => {
        setNodes([
          {
            id: 'node_1',
            type: 'imageNode',
            position: { x: 100, y: 100 },
            data: { image: null, prompt: '' }
          },
          {
            id: 'node_2',
            type: 'promptNode',
            position: { x: 300, y: 100 },
            data: { inheritImage: null, extractedPrompt: '', editedPrompt: '' }
          }
        ]);
        setEdges([
          {
            id: 'e1-2',
            source: 'node_1',
            target: 'node_2',
            animated: true
          }
        ]);
        setCanvasId(id);
        idCounter = 3;
        setSaveStatus('已加载');
        setTimeout(() => setSaveStatus(''), 2000);
      }, 1000);
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
    setShowHint(true);
  }, []);

  const onConnectEnd = useCallback(
    (event) => {
      setShowHint(false);
      if (!connectingNodeId.current) return;

      const targetIsPane = event.target?.classList?.contains('react-flow__pane');

      if (targetIsPane) {
        const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
        const flowPos = screenToFlowPosition({
          x: event.clientX - left,
          y: event.clientY - top
        });
        connectingPosition.current = flowPos;
        setMenuPosition({ x: event.clientX, y: event.clientY });
        setShowNodeTypeModal(true);
      }
    },
    [screenToFlowPosition]
  );

  const handleNodeTypeSelect = useCallback((type) => {
    setShowNodeTypeModal(false);
    if (!connectingNodeId.current || !connectingPosition.current) return;

    const parentNode = nodes.find(n => n.id === connectingNodeId.current);
    const parentImage = parentNode?.data?.image;
    const newNodeId = getId();

    let newNode;

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

    const newEdge = {
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
    const newNode = {
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

  const newCanvas = useCallback(() => {
    setCanvasId(null);
    setNodes([]);
    setEdges([]);
    idCounter = 1;
    window.history.replaceState({}, '', '/canvas');
    setSaveStatus('已新建');
    setTimeout(() => setSaveStatus(''), 2000);
  }, [setNodes, setEdges]);

  const handleLogout = async () => {
    // 这里将集成现有的登出逻辑
    router.push('/logout');
  };

  if (status === 'loading') {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: 'var(--dark-bg)' }}>
        <div className="cyber-grid" />
        <div className="relative z-10">
          <div className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm mt-4 text-center">加载中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="w-full h-screen overflow-hidden" style={{ background: 'var(--dark-bg)' }}>
      <div ref={reactFlowWrapper} className="w-full h-full">
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
          <Controls className="glass" />
          <MiniMap
            className="glass"
            nodeColor={(node) => {
              if (node.type === 'promptNode') return '#f59e0b';
              return node.data?.image ? '#00f5ff' : '#ff00ff';
            }}
            maskColor="rgba(10, 10, 15, 0.8)"
          />

          <Panel position="top-center">
            <Toolbar
              onAddNode={addNode}
              onClear={clearCanvas}
              onSave={saveCanvasToServer}
              onNew={newCanvas}
              saveStatus={saveStatus}
              onOpenProjects={() => setShowCanvasList(true)}
              user={session.user}
              onLogout={handleLogout}
            />
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
        <NodeTypeModal
          isOpen={showNodeTypeModal}
          position={menuPosition}
          onClose={() => {
            setShowNodeTypeModal(false);
            connectingNodeId.current = null;
            connectingPosition.current = null;
          }}
          onSelect={handleNodeTypeSelect}
        />

        <CanvasList
          isOpen={showCanvasList}
          onClose={() => setShowCanvasList(false)}
          onOpenCanvas={loadCanvasFromServer}
        />
      </div>
    </div>
  );
}
