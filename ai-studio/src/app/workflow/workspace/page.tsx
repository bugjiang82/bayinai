'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import logger from '@/lib/logger';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Grid3X3,
  List,
  Plus,
  Search,
  FolderOpen,
  Clock,
  MoreVertical,
  Trash2,
  Edit3,
  X,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'grid' | 'list';

const menu_placeholder = "个人";

export default function WorkspacePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { toast, showToast } = useToast();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/workflow/projects');
      const result = await response.json();

      if (result.code === 0) {
        setProjects(result.data.projects || []);
      } else {
        setError(result.message || '获取项目列表失败');
      }
    } catch (err) {
      logger.error('Fetch projects error:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      showToast('error', '请输入项目名称');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/workflow/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          canvasData: { nodes: [], edges: [] },
          isDraft: false,
        }),
      });

      const result = await response.json();

      if (result.code === 0) {
        showToast('success', '项目创建成功');
        setShowCreateDialog(false);
        setNewProjectName('');
        setNewProjectDescription('');
        fetchProjects();
      } else {
        showToast('error', result.message || '创建失败');
      }
    } catch (err) {
      logger.error('Create project error:', err);
      showToast('error', '创建失败，请稍后重试');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？')) return;

    try {
      const response = await fetch(`/api/workflow/projects/${projectId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.code === 0) {
        showToast('success', '项目已删除');
        fetchProjects();
      } else {
        showToast('error', result.message || '删除失败');
      }
    } catch (err) {
      logger.error('Delete project error:', err);
      showToast('error', '删除失败');
    }
    setActiveMenu(null);
  };

  const handleDeleteSelectedProjects = async () => {
    if (selectedProjects.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedProjects.length} 个项目吗？`)) return;

    try {
      const deletePromises = selectedProjects.map(id => 
        fetch(`/api/workflow/projects/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      showToast('success', `已删除 ${selectedProjects.length} 个项目`);
      setSelectedProjects([]);
      fetchProjects();
    } catch (err) {
      logger.error('Delete projects error:', err);
      showToast('error', '删除失败');
    }
    setActiveMenu(null);
  };

  const toggleSelectProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/workflow?project=${projectId}`);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/generate/image"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回工作区
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">工作空间</h1>
            <p className="text-base text-zinc-400">管理您的创意项目</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-48 lg:w-64 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新建项目</span>
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold transition-all">
                <FolderOpen className="w-4 h-4" />
                个人项目
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">
                <Users className="w-4 h-4" />
                团队项目
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </button>
            </nav>

            <div className="mt-8 p-5 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">创作提示</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                点击右上角「新建项目」开始您的创意之旅，或者从历史记录中选择一个项目继续编辑。
              </p>
            </div>
          </aside>

          <main className="flex-1">
            {selectedProjects.length > 0 && (
              <div className="flex items-center justify-between mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white">
                    已选择 <span className="font-bold text-indigo-400">{selectedProjects.length}</span> 个项目
                  </span>
                  <button
                    onClick={() => setSelectedProjects([])}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    取消选择
                  </button>
                </div>
                <button
                  onClick={handleDeleteSelectedProjects}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  批量删除
                </button>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-sm text-zinc-500">加载中...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500/50" />
                  <p className="text-sm text-zinc-400">{error}</p>
                  <button
                    onClick={fetchProjects}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all"
                  >
                    重试
                  </button>
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">暂无项目</h3>
                <p className="text-sm text-zinc-500 mb-4">点击右上角「新建项目」开始创作</p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  新建项目
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "group relative bg-white/5 border rounded-2xl overflow-hidden transition-all",
                      selectedProjects.length > 0 ? "border-white/10 cursor-pointer" : "border-white/10 hover:border-indigo-500/30 cursor-pointer",
                      selectedProjects.includes(project.id) ? "border-indigo-500/50 ring-1 ring-indigo-500/30" : ""
                    )}
                    onClick={() => {
                      if (selectedProjects.length > 0) {
                        toggleSelectProject(project.id);
                      } else {
                        handleOpenProject(project.id);
                      }
                    }}
                  >
                    {selectedProjects.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectProject(project.id);
                        }}
                        className={cn(
                          "absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                          selectedProjects.includes(project.id)
                            ? "bg-indigo-600 border-indigo-600"
                            : "bg-black/40 border-white/30 hover:border-white/60"
                        )}
                      >
                        {selectedProjects.includes(project.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    )}
                      <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                        {project.thumbnail ? (
                          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                          <FolderOpen className="w-12 h-12 text-zinc-700" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-white truncate mb-1">{project.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          <span>编辑于 {formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === project.id ? null : project.id);
                          }}
                          className="w-8 h-8 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center text-white hover:bg-red-500/80 transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === project.id && (
                          <div className="absolute top-full right-0 mt-1 w-40 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectProject(project.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition-all"
                            >
                              {selectedProjects.includes(project.id) ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Edit3 className="w-4 h-4" />
                              )}
                              {selectedProjects.includes(project.id) ? '取消选择' : '选择'}
                            </button>
                            <div className="h-px bg-white/10" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                              删除此项目
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5">
                  <div className="col-span-1 flex items-center justify-center">缩略图</div>
                  <div className="col-span-3 flex items-center">项目名称</div>
                  <div className="col-span-3 flex items-center">描述</div>
                  <div className="col-span-2 flex items-center justify-center">创建时间</div>
                  <div className="col-span-2 flex items-center justify-center">更新时间</div>
                  <div className="col-span-1 flex items-center justify-center">操作</div>
                </div>
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group grid grid-cols-12 gap-4 px-4 py-3.5 bg-white/5 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg flex items-center justify-center">
                        {project.thumbnail ? (
                          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <FolderOpen className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <h3 className="text-base font-medium text-white truncate">{project.name}</h3>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <p className="text-sm text-zinc-400 truncate">{project.description || '暂无描述'}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-center text-sm text-zinc-500">
                      {formatDate(project.createdAt)}
                    </div>
                    <div className="col-span-2 flex items-center justify-center text-sm text-zinc-500">
                      {formatDate(project.updatedAt)}
                    </div>
                    <div className="col-span-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="w-8 h-8 bg-white/5 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateDialog(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-[#13141c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-white">新建项目</h2>
              </div>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  项目名称 *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  项目描述
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="输入项目描述（可选）..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    创建项目
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md",
            toast.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
          )}
        >
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </motion.div>
      )}
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}