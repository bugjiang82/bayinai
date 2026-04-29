"use client";

import { useState } from "react";
import { X, FolderOpen, Plus, MoreVertical, Calendar, Trash2 } from "lucide-react";

interface CanvasListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CanvasList({ isOpen, onClose }: CanvasListProps) {
  const [projects, setProjects] = useState([
    { id: 1, name: "赛博朋克城市", updatedAt: "2024-04-28", status: "active" },
    { id: 2, name: "二次元角色设计", updatedAt: "2024-04-27", status: "saved" },
    { id: 3, name: "风景照片处理", updatedAt: "2024-04-25", status: "saved" },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in">
      <div className="glass rounded-2xl w-full max-w-lg mx-4 border border-cyber-cyan/30 animate-in slide-in-from-bottom-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyber-cyan" />
            <h2 className="text-lg font-semibold text-zinc-100">项目列表</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-700 hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyber-cyan/20 to-cyber-magenta/20 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-cyber-cyan" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100">{project.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Calendar className="w-3 h-3" />
                    <span>{project.updatedAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-700">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-cyber-cyan border border-cyber-cyan/30 hover:bg-cyber-cyan/10 rounded-xl transition-colors">
            <Plus className="w-4 h-4" />
            新建项目
          </button>
        </div>
      </div>
    </div>
  );
}
