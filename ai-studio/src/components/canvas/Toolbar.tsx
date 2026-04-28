interface ToolbarProps {
  onAddNode: () => void
  onClear: () => void
  onSave: () => void
  onNew: () => void
  onOpenProjects: () => void
  onLogout: () => void
  saveStatus: string
  user: any
}

const Toolbar = ({
  onAddNode,
  onClear,
  onSave,
  onNew,
  onOpenProjects,
  onLogout,
  saveStatus,
  user
}: ToolbarProps) => {
  return (
    <div className="glass px-6 py-3 rounded-xl flex gap-4 items-center">
      <button
        onClick={onNew}
        className="
          px-5 py-2.5 text-sm font-semibold rounded-xl
          bg-white/5 border-2 border-white/20 text-white
          hover:bg-cyber-yellow/20 hover:border-cyber-yellow/50 hover:text-cyber-yellow
          transition-all duration-300
          min-w-[80px]
        "
      >
        新建
      </button>
      <button
        onClick={onAddNode}
        className="
          px-6 py-3 text-base font-semibold rounded-xl
          bg-gradient-to-br from-cyber-cyan/20 to-cyber-cyan/5
          border-2 border-cyber-cyan/40 text-cyber-cyan
          hover:from-cyber-cyan/40 hover:to-cyber-cyan/10
          hover:border-cyber-cyan hover:shadow-[0_0_20px_rgba(0,245,255,0.4)]
          hover:scale-105
          transition-all duration-300
          min-w-[120px]
        "
      >
        + 添加节点
      </button>
      <button
        onClick={onSave}
        className="
          px-5 py-2.5 text-sm font-semibold rounded-xl
          bg-white/5 border-2 border-white/20 text-white
          hover:bg-cyber-cyan/20 hover:border-cyber-cyan/50
          transition-all duration-300
          min-w-[80px]
        "
      >
        保存
      </button>
      <button
        onClick={onClear}
        className="
          px-5 py-2.5 text-sm font-semibold rounded-xl
          bg-white/5 border-2 border-white/20 text-white
          hover:bg-cyber-magenta/20 hover:border-cyber-magenta/50
          transition-all duration-300
          min-w-[80px]
        "
      >
        清空
      </button>

      <button
        onClick={onOpenProjects}
        className="
          px-5 py-2.5 text-sm font-semibold rounded-xl
          bg-white/5 border-2 border-white/20 text-white
          hover:bg-cyber-yellow/20 hover:border-cyber-yellow/50 hover:text-cyber-yellow
          transition-all duration-300
          min-w-[90px]
        "
      >
        项目
      </button>

      {saveStatus && (
        <span className={`
          text-xs px-3 py-1 rounded-full ml-2
          ${saveStatus === '保存中...' ? 'text-cyber-yellow animate-pulse' : ''}
          ${saveStatus === '已保存' ? 'text-cyber-cyan' : ''}
          ${saveStatus === '保存失败' ? 'text-cyber-magenta' : ''}
          ${saveStatus === '已加载' ? 'text-cyber-cyan' : ''}
        `}>
          {saveStatus}
        </span>
      )}

      <div className="w-px h-8 bg-white/20 mx-2" />
      <span className="text-xs text-cyber-cyan font-medium">{user?.username || user?.name || user?.email}</span>
      <button
        onClick={onLogout}
        className="
          text-xs px-3 py-1.5 rounded-lg
          bg-white/5 border border-white/20 text-white/60
          hover:text-cyber-magenta hover:border-cyber-magenta/50 hover:bg-cyber-magenta/10
          transition-all duration-300
        "
      >
        退出
      </button>
    </div>
  )
}

export default Toolbar
