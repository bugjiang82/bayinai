'use client'

import { useEffect, useRef } from 'react'
import { FileText, Image, X } from 'lucide-react'

interface NodeTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: string) => void
  position: { x: number; y: number }
}

export function NodeTypeModal({ isOpen, onClose, onSelect, position }: NodeTypeModalProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || !position) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] glass rounded-xl p-2 min-w-[180px]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 10px)'
      }}
    >
      <div className="text-xs text-white/50 px-3 py-1 mb-1 border-b border-white/10">
        选择节点类型
      </div>

      <button
        onClick={() => onSelect('extract')}
        className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-cyber-cyan/20 transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-full bg-cyber-cyan/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-cyber-cyan" />
        </div>
        <div className="text-left">
          <span className="text-sm font-medium text-white group-hover:text-cyber-cyan transition-colors">
            提取提示词
          </span>
          <p className="text-[10px] text-white/40">
            分析并编辑父节点图像
          </p>
        </div>
      </button>

      <button
        onClick={() => onSelect('edit')}
        className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-cyber-magenta/20 transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-full bg-cyber-magenta/20 flex items-center justify-center">
          <Image className="w-4 h-4 text-cyber-magenta" />
        </div>
        <div className="text-left">
          <span className="text-sm font-medium text-white group-hover:text-cyber-magenta transition-colors">
            图生图编辑
          </span>
          <p className="text-[10px] text-white/40">
            基于父节点生成新图
          </p>
        </div>
      </button>

      <button
        onClick={onClose}
        className="w-full px-3 py-1.5 mt-1 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
      >
        取消
      </button>
    </div>
  )
}
