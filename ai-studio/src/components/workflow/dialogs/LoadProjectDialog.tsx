'use client';

import React, { useEffect, useState } from 'react';
import { X, FolderOpen, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { projectService, type ProjectDTO } from '@/services/projectService';

interface LoadProjectDialogProps {
  open: boolean;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onClose: () => void;
}

export const LoadProjectDialog: React.FC<LoadProjectDialogProps> = ({
  open,
  onLoad,
  onDelete,
  onClose,
}) => {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      projectService.list().then((data) => {
        setProjects(data);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [open]);

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
        className="w-full max-w-lg rounded-2xl bg-[#1a1a2e] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FolderOpen size={20} />
            加载项目
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">加载中...</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-gray-400 py-8">暂无项目</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between bg-[#16213e] rounded-lg p-4 hover:bg-[#1a2744] transition-colors"
              >
                <button
                  onClick={() => {
                    onLoad(project.id);
                    onClose();
                  }}
                  className="flex-1 text-left"
                >
                  <div className="text-white font-medium">{project.name}</div>
                  <div className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};