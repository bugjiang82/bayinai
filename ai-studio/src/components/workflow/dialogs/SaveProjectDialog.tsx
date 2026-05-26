'use client';

import React from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface SaveProjectDialogProps {
  open: boolean;
  currentName: string;
  description: string;
  isSaving: boolean;
  onSave: (name: string, description?: string) => void;
  onClose: () => void;
}

export const SaveProjectDialog: React.FC<SaveProjectDialogProps> = ({
  open,
  currentName,
  description,
  isSaving,
  onSave,
  onClose,
}) => {
  const [name, setName] = React.useState(currentName);
  const [desc, setDesc] = React.useState(description);

  React.useEffect(() => {
    setName(currentName);
    setDesc(description);
  }, [currentName, description, open]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-[#1a1a2e] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">保存项目</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">项目名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#16213e] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">描述（可选）</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full bg-[#16213e] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave(name, desc)}
            disabled={!name.trim() || isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Save size={16} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};