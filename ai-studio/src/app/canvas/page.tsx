"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, FolderOpen, Trash2, Download, Upload, ZoomIn, ZoomOut, Move, Layers, ArrowLeft, X, Sparkles, ImageIcon, Pencil, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCanvasStore } from "@/stores/canvasStore";

// 使用 Konva 实现画布功能
import { Stage, Layer, Rect, Text, Circle, Line, Group } from 'react-konva';

const CanvasPage = () => {
  const router = useRouter();
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodeTypeModal, setShowNodeTypeModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [connectingNode, setConnectingNode] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState({ x: 0, y: 0 });
  const [connectionEnd, setConnectionEnd] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showCanvasList, setShowCanvasList] = useState(false);
  
  // 从 store 获取状态和方法
  const {
    currentProject,
    nodes,
    connections,
    isLoading,
    error,
    createNewProject,
    saveProject,
    loadProject,
    deleteProject,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
  } = useCanvasStore();

  useEffect(() => {
    // 初始化创建一个新的草稿项目
    if (!currentProject) {
      createNewProject();
    }
  }, [currentProject, createNewProject]);

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

  const handleAddNode = (type: string, position: { x: number; y: number }) => {
    addNode(type, position);
  };

  const handleZoomIn = () => {
    setZoom(zoom * 1.2);
  };

  const handleZoomOut = () => {
    setZoom(zoom * 0.8);
  };

  const handleFitView = () => {
    // 实现适应视图功能
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
  };

  const handleClearCanvas = () => {
    if (confirm("确定要清空画布吗？")) {
      // 清空所有节点和连接
      nodes.forEach(node => deleteNode(node.id));
      connections.forEach(conn => deleteConnection(conn.id));
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleNodeDragStart = (e: any, nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleNodeDragEnd = (e: any, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      updateNode(nodeId, {
        position: {
          x: e.target.x(),
          y: e.target.y()
        }
      });
    }
  };

  const handleConnectStart = (e: any, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setConnectingNode(nodeId);
      setConnectionStart({
        x: node.position.x + 100,
        y: node.position.y + 50
      });
      setIsConnecting(true);
    }
  };

  const handleConnectEnd = (e: any) => {
    if (isConnecting && connectingNode) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (pos) {
        setConnectionEnd(pos);
        // 检查是否连接到另一个节点
        const targetNode = nodes.find(node => {
          const nodeX = node.position.x;
          const nodeY = node.position.y;
          return pos.x >= nodeX && pos.x <= nodeX + 100 && pos.y >= nodeY && pos.y <= nodeY + 100;
        });
        if (targetNode && targetNode.id !== connectingNode) {
          addConnection(connectingNode, targetNode.id);
        }
      }
      setIsConnecting(false);
      setConnectingNode(null);
    }
  };

  const handleStageMouseDown = (e: any) => {
    if (e.evt.button === 0) { // 左键
      setIsDragging(true);
      setDragStart({
        x: e.evt.clientX - stagePos.x,
        y: e.evt.clientY - stagePos.y
      });
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (isDragging) {
      setStagePos({
        x: e.evt.clientX - dragStart.x,
        y: e.evt.clientY - dragStart.y
      });
    }
    if (isConnecting) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (pos) {
        setConnectionEnd(pos);
      }
    }
  };

  const handleStageMouseUp = () => {
    setIsDragging(false);
  };

  const handleStageMouseLeave = () => {
    setIsDragging(false);
  };

  const getNodeColor = (node: any) => {
    if (node.type === 'prompt') return '#f59e0b';
    return node.data?.image ? '#00f5ff' : '#ff00ff';
  };

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
                  // 这里需要更新项目名称，暂时直接修改 store 中的状态
                  // 实际应该通过 updateProject 方法
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

      {/* 主内容区 */}
      <div className="flex h-[calc(100vh-72px)] overflow-hidden">
        {/* 左侧节点库 */}
        <div className="w-48 border-r border-white/[0.06] p-4 bg-[#0a0a0a]">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
            节点库
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleAddNode('image', { x: 100, y: 100 })}
              className="w-full flex items-center gap-2 p-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>图像节点</span>
            </button>
            <button
              onClick={() => handleAddNode('prompt', { x: 100, y: 200 })}
              className="w-full flex items-center gap-2 p-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span>提示词节点</span>
            </button>
          </div>
        </div>

        {/* 中央画布区域 */}
        <div className="flex-1 relative overflow-hidden bg-[#0d0d0d]">
          {/* 画布控制 */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/[0.05] border border-white/[0.1] rounded p-2 z-10">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded hover:bg-white/[0.1] transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded hover:bg-white/[0.1] transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitView}
              className="p-2 rounded hover:bg-white/[0.1] transition-colors"
              title="适应视图"
            >
              <Move className="w-4 h-4" />
            </button>
            <div className="border-t border-white/[0.1] my-1"></div>
            <button
              className="p-2 rounded hover:bg-white/[0.1] transition-colors"
              title="层级"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Konva 画布 */}
          <Stage
            width={window.innerWidth - 48}
            height={window.innerHeight - 72}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onMouseLeave={handleStageMouseLeave}
            scale={{ x: zoom, y: zoom }}
            position={stagePos}
            draggable={false}
          >
            <Layer>
              {/* 网格背景 */}
              <Rect
                width={window.innerWidth * 10}
                height={window.innerHeight * 10}
                fillPatternImage={
                  new Image(50, 50)
                }
                fillPatternScale={{ x: 50, y: 50 }}
                fillPatternOffset={{ x: 0, y: 0 }}
                fillPatternRepeat="repeat"
              />
              
              {/* 连接线条 */}
              {connections.map(connection => {
                const sourceNode = nodes.find(n => n.id === connection.source);
                const targetNode = nodes.find(n => n.id === connection.target);
                if (sourceNode && targetNode) {
                  return (
                    <Line
                      key={connection.id}
                      points={[
                        sourceNode.position.x + 100,
                        sourceNode.position.y + 50,
                        targetNode.position.x,
                        targetNode.position.y + 50
                      ]}
                      stroke="#00f5ff"
                      strokeWidth={2}
                      tension={0.5}
                      dash={[5, 5]}
                      draggable={false}
                    />
                  );
                }
                return null;
              })}
              
              {/* 连接预览线 */}
              {isConnecting && (
                <Line
                  points={[connectionStart.x, connectionStart.y, connectionEnd.x, connectionEnd.y]}
                  stroke="#ff00ff"
                  strokeWidth={2}
                  tension={0.5}
                  dash={[5, 5]}
                  draggable={false}
                />
              )}
              
              {/* 节点 */}
              {nodes.map(node => (
                <Group
                  key={node.id}
                  x={node.position.x}
                  y={node.position.y}
                  draggable
                  onDragStart={(e) => handleNodeDragStart(e, node.id)}
                  onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                >
                  <Rect
                    width={100}
                    height={100}
                    fill={getNodeColor(node)}
                    stroke={selectedNode === node.id ? '#ffffff' : 'transparent'}
                    strokeWidth={selectedNode === node.id ? 2 : 0}
                    cornerRadius={8}
                  />
                  <Text
                    text={node.type === 'image' ? '图像' : '提示词'}
                    x={50}
                    y={45}
                    align="center"
                    verticalAlign="middle"
                    fill="#0a0a0a"
                    fontSize={14}
                    fontWeight="bold"
                  />
                  {/* 连接点 */}
                  <Circle
                    x={100}
                    y={50}
                    radius={6}
                    fill="#0a0a0a"
                    stroke="#00f5ff"
                    strokeWidth={2}
                    draggable={false}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      handleConnectStart(e, node.id);
                    }}
                  />
                </Group>
              ))}
            </Layer>
          </Stage>

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