"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  Flowbite,
  Handle,
  MiniMap,
  NodeToolbar,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus,
  Save,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  Layers,
  ArrowLeft,
  X,
  Sparkles,
  ImageIcon,
  Pencil,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
  PlayCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCanvasStore } from "@/stores/canvasStore";

// 自定义节点类型
const ImageNode = ({ id, data, selected }: any) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center w-40 h-40 rounded-lg border-2 ${selected ? 'border-white' : 'border-transparent'} transition-colors`}
      style={{ backgroundColor: '#00f5ff' }}
    >
      <div className="flex items-center justify-center w-full h-full">
        {data.image ? (
          <img 
            src={data.image} 
            alt="Node Image" 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-[#0a0a0a]" />
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-1 bg-[#0a0a0a]/70 text-xs text-white text-center">
        图像
      </div>
      <Handle
        type="source"
        position="right"
        id={`${id}-output`}
        style={{ background: '#00f5ff' }}
      />
      <Handle
        type="target"
        position="left"
        id={`${id}-input`}
        style={{ background: '#00f5ff' }}
      />
    </div>
  );
};

const PromptNode = ({ id, data, selected }: any) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center w-40 h-40 rounded-lg border-2 ${selected ? 'border-white' : 'border-transparent'} transition-colors`}
      style={{ backgroundColor: '#f59e0b' }}
    >
      <div className="flex items-center justify-center w-full h-full">
        <Pencil className="w-8 h-8 text-[#0a0a0a]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-1 bg-[#0a0a0a]/70 text-xs text-white text-center">
        提示词
      </div>
      <Handle
        type="source"
        position="right"
        id={`${id}-output`}
        style={{ background: '#f59e0b' }}
      />
      <Handle
        type="target"
        position="left"
        id={`${id}-input`}
        style={{ background: '#f59e0b' }}
      />
    </div>
  );
};

const CustomToolbar = () => {
  return (
    <div className="flex flex-col gap-2 p-2 bg-[#0a0a0a]/80 border border-white/[0.1] rounded-lg">
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/[0.1]"
      >
        <PlayCircle className="w-4 h-4 mr-2" />
        运行
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/[0.1]"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        刷新
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/[0.1]"
      >
        <Settings className="w-4 h-4 mr-2" />
        设置
      </Button>
    </div>
  );
};

const nodeTypes = {
  image: ImageNode,
  prompt: PromptNode,
};

const CanvasPage = () => {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showCanvasList, setShowCanvasList] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [prompt, setPrompt] = useState('');
  const [advancedSettings, setAdvancedSettings] = useState(false);
  const [imageSize, setImageSize] = useState('1024');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [strength, setStrength] = useState(75);
  
  // 从 store 获取状态和方法
  const {
    currentProject,
    isLoading,
    error,
    createNewProject,
    saveProject,
    loadProject,
    deleteProject,
  } = useCanvasStore();

  useEffect(() => {
    // 初始化创建一个新的草稿项目
    if (!currentProject) {
      createNewProject();
    }
  }, [currentProject, createNewProject]);

  useEffect(() => {
    // 监听节点选择
    const handleSelectionChange = (event: any) => {
      const { nodes: selectedNodes } = event;
      if (selectedNodes.length > 0) {
        setSelectedNode(selectedNodes[0].id);
      } else {
        setSelectedNode(null);
      }
    };

    // 模拟初始节点
    const initialNodes = [
      {
        id: '1',
        type: 'prompt',
        position: { x: 100, y: 100 },
        data: { label: '提示词 1' },
      },
      {
        id: '2',
        type: 'image',
        position: { x: 300, y: 100 },
        data: { label: '图像 1' },
      },
    ];

    const initialEdges = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        sourceHandle: '1-output',
        targetHandle: '2-input',
      },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);

    return () => {
      // 清理
    };
  }, []);

  const handleSaveProject = async () => {
    if (currentProject) {
      try {
        setSaveStatus('保存中...');
        await saveProject(currentProject.name);
        setSaveStatus('已保存');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (error) {
        setSaveStatus('保存失败');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      await loadProject(projectId);
      setShowCanvasList(false);
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (currentProject && confirm("确定要删除当前项目吗？")) {
      try {
        await deleteProject(currentProject.id);
        createNewProject();
      } catch (error) {
        console.error('删除项目失败:', error);
      }
    }
  };

  const handleNewProject = async () => {
    createNewProject();
    setSaveStatus('已新建');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleAddNode = (type: string) => {
    const newNode = {
      id: `${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      data: { label: `${type === 'prompt' ? '提示词' : '图像'} ${nodes.length + 1}` },
    };
    setNodes([...nodes, newNode]);
  };

  const handleClearCanvas = () => {
    if (confirm("确定要清空画布吗？")) {
      setNodes([]);
      setEdges([]);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleGenerate = () => {
    // 实现生成逻辑
    console.log('生成图像:', prompt);
  };

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currentProject?.name || "新建项目"}
              onChange={(e) => {
                if (currentProject) {
                  // 这里需要更新项目名称
                  console.log('更新项目名称:', e.target.value);
                }
              }}
              className="bg-white/[0.05] border border-white/[0.1] rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="项目名称"
            />
            <span className={cn(
              "text-xs px-2 py-1 rounded",
              currentProject?.isDraft ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
            )}>
              {currentProject?.isDraft ? "草稿" : "已保存"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            title="新建项目"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">新建</span>
          </button>
          <button
            onClick={handleSaveProject}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded text-sm hover:bg-indigo-500/30 transition-colors"
            title="保存项目"
          >
            <Save className="w-4 h-4" />
            <span className="hidden md:inline">保存</span>
            {saveStatus && (
              <span className="ml-2 text-xs text-indigo-400">
                {saveStatus}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCanvasList(true)}
            className="flex items-center gap-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            title="加载项目"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden md:inline">项目</span>
          </button>
          <button
            onClick={handleClearCanvas}
            className="flex items-center gap-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            title="清空画布"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">清空</span>
          </button>
        </div>
      </div>

      {/* 生成控制栏 */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#0a0a0a] z-10">
        <div className="flex items-center flex-1 gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="输入提示词生成新图像..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdvancedSettings(!advancedSettings)}
              className="flex items-center gap-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>高级设置</span>
              {advancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <span className="text-sm text-zinc-400">
              {imageSize} ({aspectRatio}) | 强度 {strength}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!prompt}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded text-sm hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            生成
          </Button>
          <Button
            disabled
            className="flex items-center gap-1 px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            下载
          </Button>
        </div>
      </div>

      {/* 高级设置面板 */}
      {advancedSettings && (
        <div className="p-4 border-b border-white/[0.06] bg-[#0a0a0a]">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">图像尺寸</label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="512">512</option>
                <option value="1024">1024</option>
                <option value="2048">2048</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">宽高比</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">强度: {strength}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.05] rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00f5ff 0%, #00f5ff ${strength}%, #ffffff10 ${strength}%, #ffffff10 100%)`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex h-[calc(100vh-160px)] overflow-hidden">
        {/* 左侧节点库 */}
        <div className="w-48 border-r border-white/[0.06] p-4 bg-[#0a0a0a]">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
            节点库
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleAddNode('image')}
              className="w-full flex items-center gap-2 p-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>图像节点</span>
            </button>
            <button
              onClick={() => handleAddNode('prompt')}
              className="w-full flex items-center gap-2 p-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span>提示词节点</span>
            </button>
          </div>
        </div>

        {/* 中央画布区域 */}
        <div className="flex-1 relative overflow-hidden bg-[#0d0d0d]">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              defaultZoom={1}
              defaultPosition={{ x: 0, y: 0 }}
            >
              <Background variant="dots" gap={16} size={1} color="#ffffff10" />
              <Controls className="bg-[#0a0a0a]/80 border border-white/[0.1] rounded-lg" />
              <MiniMap 
                nodeColor={(n) => {
                  if (n.type === 'prompt') return '#f59e0b';
                  return '#00f5ff';
                }}
                className="bg-[#0a0a0a]/80 border border-white/[0.1] rounded-lg"
              />
              <NodeToolbar>
                <CustomToolbar />
              </NodeToolbar>
            </ReactFlow>
          </ReactFlowProvider>

          {/* 操作指南 */}
          <div className="absolute bottom-4 left-4 bg-white/[0.05] border border-white/[0.1] rounded-xl p-4 max-w-xs z-10">
            <h4 className="text-sm font-semibold text-cyan-400 mb-2">💡 操作指南</h4>
            <div className="text-xs text-gray-300 space-y-1">
              <p>• 从左侧 <span className="text-cyan-400">节点库</span> 添加节点</p>
              <p>• 点击 <span className="text-cyan-400">节点</span> 查看属性</p>
              <p>• 拖拽节点右侧的 <span className="text-cyan-400">●</span> 连接节点</p>
              <p>• 拖拽画布 <span className="text-cyan-400">空白处</span> 移动视图</p>
              <p>• 使用右侧 <span className="text-cyan-400">控制按钮</span> 调整视图</p>
            </div>
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div className="w-80 border-l border-white/[0.06] p-4 bg-[#0a0a0a]">
          {selectedNode ? (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                节点属性
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">节点名称</label>
                  <Input
                    value={selectedNode}
                    onChange={(e) => {
                      // 这里需要更新节点名称
                      console.log('更新节点名称:', e.target.value);
                    }}
                    className="bg-white/[0.05] border border-white/[0.1] rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">提示词</label>
                  <Textarea
                    value=""
                    onChange={(e) => {
                      // 这里需要更新提示词
                      console.log('更新提示词:', e.target.value);
                    }}
                    className="bg-white/[0.05] border border-white/[0.1] rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 min-h-[100px]"
                    placeholder="输入生成提示词..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">状态</label>
                  <div className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-400">
                    就绪
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">操作</label>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded text-sm hover:bg-indigo-500/30 transition-colors"
                    >
                      生成
                    </Button>
                    <Button className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors">
                      上传
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-zinc-500">选择一个节点查看属性</p>
            </div>
          )}
        </div>
      </div>

      {/* 项目列表对话框 */}
      <Dialog open={showCanvasList} onOpenChange={(open) => !open && setShowCanvasList(false)}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/[0.08] rounded-xl p-6">
          <DialogTitle className="text-lg font-semibold text-white mb-4">项目列表</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400 mb-6">
            选择一个项目加载
          </DialogDescription>
          <div className="space-y-2">
            {/* 这里应该显示项目列表 */}
            <div className="p-3 border border-white/[0.06] rounded-lg hover:bg-white/[0.05] cursor-pointer">
              <div className="font-medium">示例项目 1</div>
              <div className="text-xs text-zinc-500">2026-04-27</div>
            </div>
            <div className="p-3 border border-white/[0.06] rounded-lg hover:bg-white/[0.05] cursor-pointer">
              <div className="font-medium">示例项目 2</div>
              <div className="text-xs text-zinc-500">2026-04-26</div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCanvasList(false)}
              className="text-zinc-300 hover:text-white"
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CanvasPage;