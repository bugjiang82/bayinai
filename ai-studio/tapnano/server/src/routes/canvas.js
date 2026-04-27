import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { saveCanvas, loadCanvas, listCanvases, deleteCanvas, findUserById } from '../db/index.js'
import { saveImagesToDisk, deleteCanvasImages } from '../utils/imageStore.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const userId = req.user.id
    const username = req.user.username
    const { id, name, nodes, edges } = req.body
    const canvasId = id || uuidv4()

    // 将 base64 图片提取到磁盘，返回替换了文件路径的节点
    const processedNodes = saveImagesToDisk(nodes, canvasId, username)

    await saveCanvas(canvasId, name || 'Untitled', processedNodes, edges, userId)
    res.json({
      success: true,
      id: canvasId,
      message: '画布保存成功'
    })
  } catch (error) {
    console.error('Save canvas error:', error)
    res.status(500).json({ error: 'Failed to save canvas' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const canvas = await loadCanvas(req.params.id)
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' })
    }
    if (canvas.user_id && canvas.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权访问此画布' })
    }
    res.json(canvas)
  } catch (error) {
    console.error('Load canvas error:', error)
    res.status(500).json({ error: 'Failed to load canvas' })
  }
})

router.get('/', async (req, res) => {
  try {
    const canvases = await listCanvases(req.user.id)
    res.json(canvases)
  } catch (error) {
    console.error('List canvases error:', error)
    res.status(500).json({ error: 'Failed to list canvases' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const canvas = await loadCanvas(req.params.id)
    if (canvas) {
      const user = findUserById(canvas.user_id)
      if (user) {
        deleteCanvasImages(user.username, req.params.id)
      }
    }
    await deleteCanvas(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete canvas error:', error)
    res.status(500).json({ error: 'Failed to delete canvas' })
  }
})

export { router as canvasRouter }
