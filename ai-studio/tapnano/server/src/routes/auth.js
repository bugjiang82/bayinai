/**
 * 认证路由 — 注册、登录、当前用户
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { findUserByUsername, createUser, findUserById, getPendingUsers, approveUser } from '../db/index.js'
import { generateToken, requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/auth/register
 * 用户注册，创建 pending 状态的用户
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    if (username.length < 2 || username.length > 30) {
      return res.status(400).json({ error: '用户名长度需在 2-30 个字符之间' })
    }

    if (password.length < 4) {
      return res.status(400).json({ error: '密码至少需要 4 个字符' })
    }

    // 检查用户名是否已存在
    const existing = findUserByUsername(username)
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' })
    }

    // bcrypt hash 密码
    const passwordHash = bcrypt.hashSync(password, 10)

    // 创建用户（pending 状态）
    const user = createUser(username, passwordHash, 'user', 'pending')

    res.status(201).json({
      success: true,
      message: '注册成功，请等待管理员审核',
      user: { username: user.username, status: user.status }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: '注册失败' })
  }
})

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const user = findUserByUsername(username)
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    // 比较密码
    const validPassword = bcrypt.compareSync(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    // 检查审核状态
    if (user.status === 'pending') {
      return res.status(403).json({ error: '账号尚未通过审核，请等待管理员审批', status: 'pending' })
    }

    // 生成 token
    const token = generateToken(user)

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.user.id)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  res.json({ user })
})

/**
 * GET /api/auth/status
 * 获取当前登录状态
 */
router.get('/status', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false })
  }

  const token = authHeader.slice(7)
  try {
    const jwt = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'cyber-node-secret-change-in-production'
    const decoded = jwt.default.verify(token, JWT_SECRET)
    const user = findUserById(decoded.id)
    if (!user) {
      return res.json({ authenticated: false })
    }
    res.json({
      authenticated: true,
      user: { id: user.id, username: user.username, role: user.role }
    })
  } catch (e) {
    res.json({ authenticated: false })
  }
})

/**
 * 获取待审核用户列表（admin 专用，但 admin 也通过 /me 确认身份）
 */
router.get('/pending', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  const pendingUsers = getPendingUsers()
  res.json({ users: pendingUsers })
})

/**
 * POST /api/auth/approve
 * 通过用户申请
 */
router.post('/approve', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: 'userId 不能为空' })
  }
  const user = approveUser(userId)
  res.json({ success: true, user })
})

/**
 * POST /api/auth/reject
 * 拒绝用户申请
 */
router.post('/reject', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: 'userId 不能为空' })
  }
  rejectUser(userId)
  res.json({ success: true })
})

export { router as authRouter }
