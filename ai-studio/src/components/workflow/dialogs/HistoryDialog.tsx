'use client';

import React from 'react';
import { X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { HistoryItem } from '../hooks/useHistoryManager';

interface HistoryDialogProps {
  open: boolean;
  historyTab: 'generations' | 'saved';
  historyItems: HistoryItem[];
  historyLoading: boolean;
  onTabChange: (tab: 'generations' | 'saved') => void;
  onClose: () => void;
}

export const HistoryDialog: React.FC<HistoryDialogProps> = ({
  open,
  historyTab,
  historyItems,
  historyLoading,
  onTabChange,
  onClose,
}) => {
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
            <Clock size={20} />
            历史记录
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onTabChange('generations')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              historyTab === 'generations'
                ? 'bg-blue-600 text-white'
                : 'bg-[#16213e] text-gray-400 hover:text-white'
            }`}
          >
            生成记录
          </button>
          <button
            onClick={() => onTabChange('saved')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              historyTab === 'saved'
                ? 'bg-blue-600 text-white'
                : 'bg-[#16213e] text-gray-400 hover:text-white'
            }`}
          >
            已保存
          </button>
        </div>

        {historyLoading ? (
          <div className="text-center text-gray-400 py-8">加载中...</div>
        ) : historyItems.length === 0 ? (
          <div className="text-center text-gray-400 py-8">暂无记录</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#16213e] rounded-lg p-4"
              >
                <div className="text-white text-sm">{item.content}</div>
                <div className="text-gray-500 text-xs mt-2">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};