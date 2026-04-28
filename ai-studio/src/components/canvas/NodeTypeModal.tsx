interface NodeTypeModalProps {
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  onSelect: (type: string) => void
}

export const NodeTypeModal = ({
  isOpen,
  position,
  onClose,
  onSelect
}: NodeTypeModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div 
        className="glass absolute z-50 p-3 rounded-xl shadow-[0_0_30px_rgba(0,245,255,0.2)]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          animation: 'scaleIn 0.15s ease-out'
        }}
      >
        <button
          onClick={() => { onSelect('extract'); onClose() }}
          className="w-full px-4 py-3 rounded-lg text-left hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-magenta/20 border border-cyber-magenta/30 flex items-center justify-center group-hover:shadow-[0_0_10px_rgba(255,0,255,0.3)] transition-shadow">
              <svg className="w-4 h-4 text-cyber-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-cyber-magenta">提取提示词</div>
              <div className="text-xs text-white/50 mt-0.5">分析并编辑父节点图像</div>
            </div>
          </div>
        </button>
        <div className="h-px bg-white/10 my-2" />
        <button
          onClick={() => { onSelect('generate'); onClose() }}
          className="w-full px-4 py-3 rounded-lg text-left hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/30 flex items-center justify-center group-hover:shadow-[0_0_10px_rgba(0,245,255,0.3)] transition-shadow">
              <svg className="w-4 h-4 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-cyber-cyan">图生图编辑</div>
              <div className="text-xs text-white/50 mt-0.5">基于父节点生成新图</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
