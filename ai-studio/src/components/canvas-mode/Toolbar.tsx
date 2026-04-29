"use client";

import { 
  Plus, 
  Save, 
  FolderOpen, 
  Trash2, 
  Play,
  FilePlus,
  X
} from "lucide-react";
import Link from "next/link";

interface ToolbarProps {
  onNew: () => void;
  onSave: () => void;
  onShowList: () => void;
  onAddNode: () => void;
}

export default function Toolbar({ onNew, onSave, onShowList, onAddNode }: ToolbarProps) {
  return (
    <div className="glass rounded-xl p-2 border border-cyber-cyan/30 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Link href="/">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </button>
        </Link>

        <div className="w-px h-6 bg-zinc-700" />

        <button
          onClick={onNew}
          className="flex items-center gap-2 px-3 py-2 text-sm text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg transition-colors border border-cyber-cyan/30"
        >
          <FilePlus className="w-4 h-4" />
          <span className="hidden sm:inline">新建</span>
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">保存</span>
        </button>

        <button
          onClick={onShowList}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">项目</span>
        </button>

        <div className="w-px h-6 bg-zinc-700" />

        <button
          onClick={onAddNode}
          className="flex items-center gap-2 px-3 py-2 text-sm text-cyber-magenta hover:bg-cyber-magenta/10 rounded-lg transition-colors border border-cyber-magenta/30"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">添加节点</span>
        </button>

        <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">清空</span>
        </button>

        <div className="w-px h-6 bg-zinc-700" />

        <button className="flex items-center gap-2 px-3 py-2 text-sm text-cyber-yellow hover:bg-cyber-yellow/10 rounded-lg transition-colors border border-cyber-yellow/30">
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">运行</span>
        </button>
      </div>
    </div>
  );
}
