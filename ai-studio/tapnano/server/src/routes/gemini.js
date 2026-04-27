import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { generateImage, extractPromptFromImage } from '../services/gemini.js'

const router = Router()

// 任务队列（简化版，后续使用 bullmq）
const taskQueue = []
const taskResults = new Map()

router.post('/', async (req, res) => {
  try {
    const { prompt, baseImage, settings } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // 估算等待时间
    const queueLength = taskQueue.length
    const estimatedWait = queueLength * 12 // 每个任务约12秒

    // 创建任务
    const taskId = uuidv4()
    const task = {
      id: taskId,
      prompt,
      baseImage,
      settings,
      status: 'pending',
      createdAt: Date.now(),
      estimatedWait
    }

    taskQueue.push(task)

    // 如果队列空，立即处理
    if (taskQueue.length === 1) {
      processQueue()
    }

    // 对于演示，我们等待任务完成再返回
    // 实际生产环境应该使用轮询或 WebSocket
    const result = await waitForTask(taskId)

    res.json({
      success: true,
      taskId,
      imageUrl: result.imageUrl,
      queueInfo: {
        position: 0,
        estimatedWait: 0
      }
    })

  } catch (error) {
    console.error('Generate error:', error)
    res.status(500).json({
      error: 'Image generation failed',
      message: error.message
    })
  }
})

// 获取队列信息
router.get('/queue-info', (req, res) => {
  const queueLength = taskQueue.length
  const estimatedWait = queueLength * 12 // 每个任务约12秒

  res.json({
    queueLength,
    estimatedWait,
    isProcessing: taskQueue.some(t => t.status === 'processing')
  })
})

// 提取提示词
router.post('/extract-prompt', async (req, res) => {
  try {
    const { image, userPrompt } = req.body

    if (!image) {
      return res.status(400).json({ error: 'Image is required' })
    }

    const result = await extractPromptFromImage(image, userPrompt)

    res.json({
      success: true,
      prompt: result.prompt
    })

  } catch (error) {
    console.error('Extract prompt error:', error)
    res.status(500).json({
      error: 'Prompt extraction failed',
      message: error.message
    })
  }
})
router.get('/status/:taskId', (req, res) => {
  const { taskId } = req.params
  const task = taskQueue.find(t => t.id === taskId) || taskResults.get(taskId)

  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }

  res.json({
    taskId,
    status: task.status,
    estimatedWait: task.estimatedWait,
    progress: task.progress || 0
  })
})

// 处理队列
async function processQueue() {
  if (taskQueue.length === 0) return

  const task = taskQueue[0]
  task.status = 'processing'
  task.progress = 30

  try {
    const result = await generateImage(task.prompt, task.baseImage, task.settings)

    task.status = 'completed'
    task.progress = 100
    task.result = result

    taskResults.set(task.id, task)

    // 从队列移除
    taskQueue.shift()

    // 处理下一个任务
    setTimeout(processQueue, 1000)

  } catch (error) {
    task.status = 'failed'
    task.error = error.message
    taskResults.set(task.id, task)

    taskQueue.shift()
    setTimeout(processQueue, 1000)
  }
}

// 等待任务完成
async function waitForTask(taskId, timeout = 120000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const task = taskResults.get(taskId)

    if (task?.status === 'completed') {
      return task.result
    }

    if (task?.status === 'failed') {
      throw new Error(task.error || 'Task failed')
    }

    await new Promise(r => setTimeout(r, 500))
  }

  throw new Error('Task timeout')
}

export { router as geminiRouter }
