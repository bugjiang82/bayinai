import React, { useState, useEffect } from 'react';

interface CanvasListProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCanvas: (id: string) => void;
}

export const CanvasList: React.FC<CanvasListProps> = ({
  isOpen,
  onClose,
  onOpenCanvas
}) => {
  const [canvasList, setCanvasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // 这里将集成现有的API调用逻辑
      // 暂时使用模拟数据
      setTimeout(() => {
        setCanvasList([
          {
            id: 'canvas_1',
            name: '项目 1',
            createdAt: new Date().toISOString(),
            thumbnail: null
          },
          {
            id: 'canvas_2',
            name: '项目 2',
            createdAt: new Date().toISOString(),
            thumbnail: null
          },
          {
            id: 'canvas_3',
            name: '项目 3',
            createdAt: new Date().toISOString(),
            thumbnail: null
          }
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div className="glass absolute z-50 p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--cyber-cyan)' }}>
            我的画布
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
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
                className="glass p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onOpenCanvas(canvas.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-black/50 rounded-md flex items-center justify-center">
                    {canvas.thumbnail ? (
                      <img 
                        src={canvas.thumbnail} 
                        alt={canvas.name} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{canvas.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(canvas.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
