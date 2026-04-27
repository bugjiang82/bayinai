import React from 'react';
import { Plus, Save, Trash2, FolderOpen, LogOut, User, CheckCircle2 } from 'lucide-react';

interface ToolbarProps {
  onAddNode: () => void;
  onClear: () => void;
  onSave: () => void;
  onNew: () => void;
  onOpenProjects: () => void;
  onLogout: () => void;
  saveStatus: string;
  user: any;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onClear,
  onSave,
  onNew,
  onOpenProjects,
  onLogout,
  saveStatus,
  user
}) => {
  return (
    <div className="glass p-3 flex items-center gap-2">
      <button
        onClick={onAddNode}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        style={{ color: 'var(--cyber-cyan)' }}
      >
        <Plus className="w-4 h-4" />
        <span>添加节点</span>
      </button>
      
      <button
        onClick={onNew}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
      >
        <span>新建</span>
      </button>
      
      <button
        onClick={onSave}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
      >
        <Save className="w-4 h-4" />
        <span>保存</span>
        {saveStatus && (
          <span className="text-xs ml-2" style={{ color: 'var(--cyber-yellow)' }}>
            {saveStatus}
          </span>
        )}
      </button>
      
      <button
        onClick={onOpenProjects}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
      >
        <FolderOpen className="w-4 h-4" />
        <span>项目</span>
      </button>
      
      <button
        onClick={onClear}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        style={{ color: 'var(--cyber-magenta)' }}
      >
        <Trash2 className="w-4 h-4" />
        <span>清空</span>
      </button>
      
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="text-sm">{user?.name || user?.email}</span>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>退出</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
