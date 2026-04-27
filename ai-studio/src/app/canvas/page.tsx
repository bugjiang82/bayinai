"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, FolderOpen, Trash2, Download, Upload, ZoomIn, ZoomOut, Move, Layers, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvasStore";

// 安装 React Flow
// npm install reactflow

const CanvasPage = () => {
  const router = useRouter();
  const [zoom, setZoom] = useState(1);
  
  // 从 store 获取状态和方法
  const {
    currentProject,
    nodes,
    connections,
    selectedNode,
    isLoading,
    error,
    createNewProject,
    saveProject,
    loadProject,
    deleteProject,
    addNode,
    updateNode,
    selectNode,
  } = useCanvasStore();

  useEffect(() => {
    // 初始化创建一个新的草稿项目
    if (!currentProject) {
      createNewProject();
    }
  }, [currentProject, createNewProject]);

  const handleSaveProject = async () => {
    if (currentProject) {
      await saveProject(currentProject.name);
    }
  };

  const handleLoadProject = async () => {
    // 这里可以打开一个项目选择对话框
    // 暂时使用模拟数据
    await loadProject('project-1');
  };

  const handleDeleteProject = async () => {
    if (currentProject && confirm("确定要删除当前项目吗？")) {
      await deleteProject(currentProject.id);
    }
  };

  const handleAddNode = () => {
    addNode('image', { x: 100, y: 100 });
  };

  const handleZoomIn = () => {
    setZoom(zoom * 1.2);
  };

  const handleZoomOut = () => {
    setZoom(zoom * 0.8);
  };

  const handleBack = () => {
    router.back();
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
            onClick={createNewProject}
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
          </button>
          <button
            onClick={handleLoadProject}
            className="flex items-center gap-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            title="加载项目"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden md:inline">加载</span>
          </button>
          <button
            onClick={handleDeleteProject}
            className="flex items-center gap-1 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded text-sm hover:bg-red-500/30 transition-colors"
            title="删除项目"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">删除</span>
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
              onClick={handleAddNode}
              className="w-full flex items-center gap-2 p-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>图像节点</span>
            </button>
            <button
              className="w-full flex items-center gap-2 p-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>视频节点</span>
            </button>
            <button
              className="w-full flex items-center gap-2 p-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>文本节点</span>
            </button>
          </div>
        </div>

        {/* 中央画布区域 */}
        <div className="flex-1 relative overflow-hidden bg-[#0d0d0d]">
          {/* 画布控制 */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/[0.05] border border-white/[0.1] rounded p-2">
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
            <div className="border-t border-white/[0.1] my-1"></div>
            <button
              className="p-2 rounded hover:bg-white/[0.1] transition-colors"
              title="移动"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded hover:bg-white/[0.1] transition-colors"
              title="层级"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* 画布占位 */}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="text-center">
              <p className="text-zinc-500 mb-2">画布模式</p>
              <p className="text-zinc-600 text-sm">从左侧拖拽节点到画布</p>
              <p className="text-zinc-600 text-sm">或点击上方按钮添加节点</p>
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
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        data: {
                          ...selectedNode.data,
                          label: e.target.value,
                        },
                      });
                    }}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">提示词</label>
                  <textarea
                    value={selectedNode.data.prompt}
                    onChange={(e) => {
                      updateNode(selectedNode.id, {
                        data: {
                          ...selectedNode.data,
                          prompt: e.target.value,
                        },
                      });
                    }}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 min-h-[100px]"
                    placeholder="输入生成提示词..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">状态</label>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded",
                    selectedNode.data.status === 'idle' ? "bg-gray-500/20 text-gray-400" :
                    selectedNode.data.status === 'generating' ? "bg-blue-500/20 text-blue-400" :
                    selectedNode.data.status === 'completed' ? "bg-green-500/20 text-green-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {selectedNode.data.status === 'idle' ? "就绪" :
                     selectedNode.data.status === 'generating' ? "生成中" :
                     selectedNode.data.status === 'completed' ? "已完成" :
                     "失败"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">操作</label>
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded text-sm hover:bg-indigo-500/30 transition-colors"
                      disabled={selectedNode.data.status === 'generating'}
                    >
                      生成
                    </button>
                    <button className="flex-1 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded text-sm hover:bg-white/[0.1] transition-colors">
                      上传
                    </button>
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
    </div>
  );
};

export default CanvasPage;