import React from 'react';

interface NodeTypeModalProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onSelect: (type: string) => void;
}

export const NodeTypeModal: React.FC<NodeTypeModalProps> = ({
  isOpen,
  position,
  onClose,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div 
        className="glass absolute z-50 p-2 rounded-lg"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <button
          onClick={() => onSelect('extract')}
          className="w-full px-4 py-3 rounded-md text-left hover:bg-white/10 transition-colors"
        >
          <div className="text-sm font-medium" style={{ color: 'var(--cyber-cyan)' }}>
            提取提示词
          </div>
          <div className="text-xs text-gray-400 mt-1">
            分析并编辑父节点图像
          </div>
        </button>
        <div className="h-px bg-white/10 my-1" />
        <button
          onClick={() => onSelect('generate')}
          className="w-full px-4 py-3 rounded-md text-left hover:bg-white/10 transition-colors"
        >
          <div className="text-sm font-medium" style={{ color: 'var(--cyber-magenta)' }}>
            图生图编辑
          </div>
          <div className="text-xs text-gray-400 mt-1">
            基于父节点生成新图
          </div>
        </button>
      </div>
    </div>
  );
};
