import { create } from 'zustand'

export const useNodeStore = create((set, get) => ({
  // 画布状态
  canvasId: null,
  nodes: [],
  edges: [],

  // 加载画布
  loadCanvas: async (id) => {
    try {
      const response = await fetch(`/api/canvas/${id}`)
      if (response.ok) {
        const data = await response.json()
        set({
          canvasId: id,
          nodes: data.nodes || [],
          edges: data.edges || []
        })
        return data
      }
    } catch (error) {
      console.error('Failed to load canvas:', error)
    }
    return null
  },

  // 保存画布
  saveCanvas: async () => {
    const { canvasId, nodes, edges } = get()
    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: canvasId,
          nodes,
          edges,
          updatedAt: new Date().toISOString()
        })
      })
      if (response.ok) {
        const data = await response.json()
        if (!canvasId) {
          set({ canvasId: data.id })
        }
        return data
      }
    } catch (error) {
      console.error('Failed to save canvas:', error)
    }
    return null
  },

  // 设置节点和边
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // 清空
  clear: () => set({ canvasId: null, nodes: [], edges: [] })
}))
