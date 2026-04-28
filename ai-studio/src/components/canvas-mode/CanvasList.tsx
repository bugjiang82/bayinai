'use client'

import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, Trash2, X, Clock } from 'lucide-react'

interface CanvasProject {
  id: string
  name: string
  updated_at: string
}

interface CanvasListProps {
  isOpen: boolean
  onClose: () => void
  onOpenCanvas: (id: string) => void
}

export function CanvasList({ isOpen, onClose, onOpenCanvas }: CanvasListProps) {
  const [canvases, setCanvases] = useState<CanvasProject[]>([])
  const [loading, setLoading] = useState(false)

  const loadCanvases = useCallback(async () => {
    if (!isOpen) return
    setLoading(true)
    try {
      const res = await fetch('/api/canvas/projects')
      if (res.ok) {
        const data = await res.json()
        setCanvases(data || [])
      }
    } catch (error) {
      console.error('Load canvases error:', error)
    }
    setLoading(false)
  }, [isOpen])

  useEffect(() => {
    loadCanvases()
  }, [loadCanvases])

  const handleOpen = (id: string) => {
    onOpenCanvas(id)
    onClose()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此项目吗？此操作不可恢复。')) return
    try {
      const res = await fetch(`/api/canvas/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCanvases(prev => prev.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Delete canvas error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass p-6 rounded-2xl max-w-xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-cyber-cyan flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            我的项目
          </h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : canvases.length === 0 ? (
          <p className="text-center text-white/30 py-8">暂无已保存的项目</p>
        ) : (
          <div className="space-y-3">
            {canvases.map(canvas => (
              <div
                key={canvas.id}
                className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-cyber-cyan/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{canvas.name}</p>
                  <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(canvas.updated_at + 'Z').toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleOpen(canvas.id)}
                    className="px-4 py-2 text-xs rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all"
                  >
                    打开
                  </button>
                  <button
                    onClick={() => handleDelete(canvas.id)}
                    className="px-4 py-2 text-xs rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
