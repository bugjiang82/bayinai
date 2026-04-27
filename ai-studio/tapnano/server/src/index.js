import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

console.log('🔑 GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '已设置' : '未设置')

import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import { initDatabase } from './db/index.js'
import { requireAuth, requireAdmin } from './middleware/auth.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { geminiRouter } from './routes/gemini.js'
import { canvasRouter } from './routes/canvas.js'
import { settingsRouter } from './routes/settings.js'
import { ensureUploadsDir } from './utils/imageStore.js'

const app = express()
const PORT = process.env.PORT || 3001

// 速率限制
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: '请求过于频繁，请稍后再试' }
})

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// 初始化数据库
initDatabase()

// 确保 uploads 目录存在
ensureUploadsDir()

// 认证路由（无需验证）
app.use('/api/auth', authRouter)

// 管理员路由（需 admin 权限）
app.use('/api/admin', adminRouter)

// 受保护的路由（需登录）
app.use('/api/generate', requireAuth, geminiRouter)
app.use('/api/canvas', requireAuth, canvasRouter)
app.use('/api/settings', settingsRouter)

// 静态文件：前端（必须放在 API 路由之后）
app.use(express.static(join(__dirname, '../../client/dist')))

// 静态文件：后台管理页面
app.use('/admin', express.static(join(__dirname, '../public')))

// 静态文件：用户上传的图片
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// API 速率限制
app.use('/api', limiter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 后台管理页面路由
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, '../public/admin.html'))
})

// 前端路由 fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../../client/dist/index.html'))
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
  console.log(`🔧 Admin panel: http://0.0.0.0:${PORT}/admin`)
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`)
})
