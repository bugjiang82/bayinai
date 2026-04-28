import React from 'react';
import { Plus, Save, Trash2, FolderOpen, LogOut, User, Share2, Star, Info, Settings } from 'lucide-react';

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
    <div className="fixed top-16 left-16 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-gray-800 z-40 flex items-center px-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onAddNode}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span>Add Node</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNew}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
            <span>New</span>
          </button>
          <button
            onClick={onOpenProjects}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FolderOpen size={16} />
            <span>Projects</span>
          </button>
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={16} />
            <span>{saveStatus || 'Save'}</span>
          </button>
        </div>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Star size={16} />
          <span>Favorite</span>
        </button>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Info size={16} />
          <span>Help</span>
        </button>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-white text-sm">{user?.name || user?.email}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
