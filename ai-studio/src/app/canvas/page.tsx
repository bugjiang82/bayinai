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
    <div className="w-full h-screen overflow-hidden bg-gray-950">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-gray-800 z-50 flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <div className="text-white font-bold text-2xl flex items-center">
            <span className="text-blue-400 mr-1">Tap</span>Now
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Home</a>
            <a href="/" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Templates</a>
            <a href="/" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Community</a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={saveCanvasToServer} 
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={16} />
            <span>{saveStatus || 'Save'}</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-white text-sm">{session.user?.name || 'User'}</span>
          </div>
        </div>
      </div>

      {/* 左侧工具栏 */}
      <div className="fixed left-0 top-16 bottom-0 w-16 bg-black/80 backdrop-blur-md border-r border-gray-800 z-40 flex flex-col items-center space-y-6 pt-6">
        <button 
          onClick={addNode} 
          className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
          title="Add Image Node"
        >
          <Plus size={20} />
          <span className="text-xs">Image</span>
        </button>
        <button 
          onClick={() => {
            const newNode = {
              id: getId(),
              type: 'promptNode',
              position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
              data: { inheritImage: null, extractedPrompt: '', editedPrompt: '' }
            };
            setNodes((nds) => nds.concat(newNode));
          }} 
          className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
          title="Add Prompt Node"
        >
          <Edit size={20} />
          <span className="text-xs">Prompt</span>
        </button>
        <div className="border-t border-gray-800 w-8 my-2" />
        <button 
          onClick={newCanvas} 
          className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
          title="New Canvas"
        >
          <Trash2 size={20} />
          <span className="text-xs">New</span>
        </button>
        <button 
          onClick={() => setShowCanvasList(true)} 
          className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
          title="Open Projects"
        >
          <FolderOpen size={20} />
          <span className="text-xs">Open</span>
        </button>
      </div>

      {/* 主画布区域 */}
      <div ref={reactFlowWrapper} className="w-full h-full pt-32 pl-16">
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
          onPaneClick={(event) => {
            // 双击画布添加节点
            if (event.detail === 2) {
              const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
              const flowPos = screenToFlowPosition({
                x: event.clientX - left,
                y: event.clientY - top
              });
              const newNode = {
                id: getId(),
                type: 'imageNode',
                position: flowPos,
                data: { image: null, prompt: '' }
              };
              setNodes((nds) => nds.concat(newNode));
            }
          }}
        >
          <Background color="rgba(50, 50, 50, 0.1)" gap={20} size={1} />
          <Controls className="bg-black/30 border border-gray-800 rounded-lg" />
          <MiniMap
            className="bg-black/30 border border-gray-800 rounded-lg"
            nodeColor={(node) => {
              if (node.type === 'promptNode') return '#f59e0b';
              return node.data?.image ? '#3b82f6' : '#ec4899';
            }}
            maskColor="rgba(10, 10, 15, 0.8)"
          />

          {showHint && (
            <Panel position="center">
              <div className="bg-black/70 backdrop-blur-md border border-gray-800 px-6 py-3 rounded-lg text-white font-medium">
                Drag to create a new node
              </div>
            </Panel>
          )}
        </ReactFlow>
        <Toolbar
          onAddNode={addNode}
          onClear={newCanvas}
          onSave={saveCanvasToServer}
          onNew={newCanvas}
          onOpenProjects={() => setShowCanvasList(true)}
          onLogout={async () => {
            'use server';
            await signOut();
          }}
          saveStatus={saveStatus}
          user={session.user}
        />
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
