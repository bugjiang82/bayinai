import { useState, useEffect } from 'react'

interface CanvasListProps {
  isOpen: boolean
  onClose: () => void
  onOpenCanvas: (id: string) => void
}

export const CanvasList = ({
  isOpen,
  onClose,
  onOpenCanvas
}: CanvasListProps) => {
  const [canvasList, setCanvasList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setCanvasList([
          {
            id: 'canvas_1',
            name: '赛博朋克城市',
            createdAt: new Date().toISOString(),
            thumbnail: null
          },
          {
            id: 'canvas_2',
            name: '科幻场景设计',
            createdAt: new Date().toISOString(),
            thumbnail: null
          },
          {
            id: 'canvas_3',
            name: '数字艺术创作',
            createdAt: new Date().toISOString(),
            thumbnail: null
          }
        ])
        setLoading(false)
      }, 500)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="glass absolute z-50 p-6 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(0,245,255,0.2)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-cyber-cyan">我的画布</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {canvasList.map((canvas) => (
              <div
                key={canvas.id}
                className="glass p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-all group"
                onClick={() => onOpenCanvas(canvas.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-black/50 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-cyber-cyan/30 transition-colors">
                    {canvas.thumbnail ? (
                      <img 
                        src={canvas.thumbnail} 
                        alt={canvas.name} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/30 group-hover:text-cyber-cyan/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-cyber-cyan transition-colors">{canvas.name}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {new Date(canvas.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyber-cyan/10 transition-colors">
                    <svg className="w-4 h-4 text-white/30 group-hover:text-cyber-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
