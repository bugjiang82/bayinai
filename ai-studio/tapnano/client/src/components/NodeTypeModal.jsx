import { useEffect, useRef } from 'react'

export function NodeTypeModal({ isOpen, onClose, onSelect, position }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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

      {/* 选项1：提取提示词 */}
      <button
        onClick={() => onSelect('extract')}
        className="w-full px-3 py-2 rounded-lg flex items-center gap-3
          hover:bg-cyber-cyan/20 transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-full bg-cyber-cyan/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
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

      {/* 选项2：图生图编辑 */}
      <button
        onClick={() => onSelect('edit')}
        className="w-full px-3 py-2 rounded-lg flex items-center gap-3
          hover:bg-cyber-magenta/20 transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-full bg-cyber-magenta/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyber-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
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

      {/* 取消 */}
      <button
        onClick={onClose}
        className="w-full px-3 py-1.5 mt-1 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
      >
        取消
      </button>
    </div>
  )
}
